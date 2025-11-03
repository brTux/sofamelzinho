import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { TelegramUpdate } from "@/lib/telegram"
import { executeFlow, findMatchingFlows, type FlowContext } from "@/lib/flow-executor"

/**
 * Telegram webhook endpoint
 * Receives incoming updates from Telegram and routes them to flows
 */
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()

    // Validate update structure
    if (!update.update_id) {
      console.log("[v0] Invalid update: missing update_id")
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    console.log("[v0] Received Telegram update:", update.update_id)

    const supabase = await createClient()

    // Handle incoming message
    if (update.message?.text) {
      const message = update.message
      const telegramUserId = message.from.id
      const telegramChatId = message.chat.id
      const messageText = message.text

      // Find the bot by checking active bots with webhooks
      const { data: bot, error: botError } = await supabase
        .from("telegram_bots")
        .select("id, bot_token")
        .limit(1)
        .maybeSingle()

      if (botError) {
        console.error("[v0] Bot query error:", botError)
        return NextResponse.json({ ok: false }, { status: 500 })
      }

      if (!bot) {
        console.error("[v0] No bot found")
        return NextResponse.json({ ok: false }, { status: 404 })
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
        return NextResponse.json({ ok: false }, { status: 500 })
      }

      if (!conversation) {
        // Create new conversation
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
          return NextResponse.json({ ok: false }, { status: 500 })
        }

        conversation = newConv
        console.log("[v0] Created new conversation:", conversation.id)
      }

      // Store incoming message
      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        message_type: "incoming",
        content: messageText,
        telegram_message_id: message.message_id,
      })

      if (msgError) {
        console.error("[v0] Failed to store message:", msgError)
      } else {
        console.log("[v0] Stored incoming message for conversation:", conversation.id)
      }

      // Find matching flows
      const matchingFlows = await findMatchingFlows(bot.id, messageText)
      console.log("[v0] Found matching flows:", matchingFlows.length)

      // Execute each matching flow
      for (const flow of matchingFlows) {
        try {
          // Create flow execution record
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

          // Execute the flow
          const context: FlowContext = {
            botId: bot.id,
            botToken: bot.bot_token,
            conversationId: conversation.id,
            telegramUserId,
            telegramChatId,
            message: messageText,
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

    // Handle callback query (button clicks)
    if (update.callback_query) {
      const query = update.callback_query
      console.log("[v0] Callback query received:", query.id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ ok: false, error: "Webhook processing failed" }, { status: 500 })
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
