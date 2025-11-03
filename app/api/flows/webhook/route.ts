import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { TelegramUpdate } from "@/lib/telegram"
import { executeFlow, findMatchingFlows, type FlowContext } from "@/lib/flow-executor"

/**
 * Telegram webhook endpoint - receives updates and routes to flows
 * Always returns 200 OK to prevent Telegram retries
 */
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()

    if (!update.update_id) {
      console.log("[v0] Invalid update: missing update_id")
      return NextResponse.json({ ok: true })
    }

    console.log("[v0] Received Telegram update:", update.update_id)

    const supabase = await createClient()

    // Helper function to extract message content
    const extractMessageContent = (data: any) => {
      let content = ""
      let mediaType = "text"

      if (data.text) {
        content = data.text
        mediaType = "text"
      } else if (data.photo) {
        content = `[Photo: ${data.photo[data.photo.length - 1].file_id}]`
        if (data.caption) content += `\n${data.caption}`
        mediaType = "photo"
      } else if (data.audio) {
        content = `[Audio: ${data.audio.file_id}]`
        if (data.caption) content += `\n${data.caption}`
        mediaType = "audio"
      } else if (data.video) {
        content = `[Video: ${data.video.file_id}]`
        if (data.caption) content += `\n${data.caption}`
        mediaType = "video"
      } else if (data.document) {
        content = `[Document: ${data.document.file_name}]`
        if (data.caption) content += `\n${data.caption}`
        mediaType = "document"
      } else if (data.sticker) {
        content = `[Sticker: ${data.sticker.file_id}]`
        mediaType = "sticker"
      }

      return { content, mediaType }
    }

    // Handle incoming message
    if (update.message) {
      const message = update.message
      const telegramUserId = message.from.id
      const telegramChatId = message.chat.id
      const { content, mediaType } = extractMessageContent(message)

      if (!content) {
        console.log("[v0] Message has no extractable content")
        return NextResponse.json({ ok: true })
      }

      const { data: bot, error: botError } = await supabase
        .from("telegram_bots")
        .select("id, bot_token")
        .limit(1)
        .maybeSingle()

      if (botError) {
        console.error("[v0] Bot query error:", botError)
        return NextResponse.json({ ok: true })
      }

      if (!bot) {
        console.error("[v0] No bot found")
        return NextResponse.json({ ok: true })
      }

      // Get or create conversation
      let { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("bot_id", bot.id)
        .eq("telegram_user_id", telegramUserId)
        .maybeSingle()

      if (convError) {
        console.error("[v0] Conversation query error:", convError)
        return NextResponse.json({ ok: true })
      }

      if (!conversation) {
        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({
            bot_id: bot.id,
            telegram_user_id: telegramUserId,
            telegram_user_name: message.from.username || null,
            first_name: message.from.first_name || null,
            last_name: message.from.last_name || null,
          })
          .select()
          .single()

        if (createError || !newConv) {
          console.error("[v0] Failed to create conversation:", createError)
          return NextResponse.json({ ok: true })
        }

        conversation = newConv
        console.log("[v0] Created new conversation:", conversation.id)
      }

      // Store incoming message
      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        message_type: "incoming",
        content,
        telegram_message_id: message.message_id,
        media_type: mediaType,
      })

      if (msgError) {
        console.error("[v0] Failed to store message:", msgError)
      } else {
        console.log("[v0] Stored incoming message for conversation:", conversation.id)
      }

      // Find matching flows
      const matchingFlows = await findMatchingFlows(bot.id, content)
      console.log("[v0] Found matching flows:", matchingFlows.length)

      // Execute each matching flow
      for (const flow of matchingFlows) {
        try {
          const { data: execution, error: execError } = await supabase
            .from("flow_executions")
            .insert({
              flow_id: flow.id,
              conversation_id: conversation.id,
              status: "in_progress",
            })
            .select()
            .single()

          if (execError || !execution) {
            console.error("[v0] Failed to create execution:", execError)
            continue
          }

          const context: FlowContext = {
            botId: bot.id,
            botToken: bot.bot_token,
            conversationId: conversation.id,
            telegramUserId,
            telegramChatId,
            message: content,
            flowId: flow.id,
            executionId: execution.id,
          }

          console.log("[v0] Executing flow:", flow.id)
          await executeFlow(context)
        } catch (flowError) {
          console.error("[v0] Error executing flow:", flowError)
        }
      }

      return NextResponse.json({ ok: true })
    }

    if (update.callback_query) {
      const query = update.callback_query
      console.log("[v0] Callback query received:", query.id)

      // Log callback for debugging - in production you might trigger flows based on callback data
      console.log("[v0] Callback data:", query.data, "From user:", query.from.id)

      return NextResponse.json({ ok: true })
    }

    if (update.channel_post) {
      const post = update.channel_post
      const { content } = extractMessageContent(post)

      if (content) {
        console.log("[v0] Channel post received:", post.message_id, "Content:", content)
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    // Always return 200 OK to prevent Telegram retries
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}
