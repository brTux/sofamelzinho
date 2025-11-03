import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch (error) {
              // Handle errors in cookies
            }
          },
        },
      },
    )

    const { conversationId, message } = await req.json()

    if (!conversationId || !message) {
      return Response.json({ success: false, error: "Missing conversationId or message" }, { status: 400 })
    }

    console.log("[v0] Send message request for conversation:", conversationId)

    // Get conversation details including bot and telegram user
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, telegram_user_id, bot_id")
      .eq("id", conversationId)
      .single()

    if (convError || !conversation) {
      console.error("[v0] Conversation not found:", convError)
      return Response.json({ success: false, error: "Conversation not found" }, { status: 404 })
    }

    console.log("[v0] Conversation found, fetching bot token")

    // Get bot token from telegram_bots table
    const { data: bot, error: botError } = await supabase
      .from("telegram_bots")
      .select("bot_token")
      .eq("id", conversation.bot_id)
      .single()

    if (botError || !bot) {
      console.error("[v0] Bot not found:", botError)
      return Response.json({ success: false, error: "Bot not found" }, { status: 404 })
    }

    console.log("[v0] Sending message to Telegram user:", conversation.telegram_user_id)

    // Send message via Telegram API
    const telegramResponse = await sendTelegramMessage(bot.bot_token, conversation.telegram_user_id, message)

    if (!telegramResponse.ok) {
      console.error("[v0] Telegram send failed:", telegramResponse.description)
      return Response.json(
        { success: false, error: telegramResponse.description || "Failed to send message" },
        { status: 400 },
      )
    }

    console.log("[v0] Message sent to Telegram successfully, storing in database")

    // Store message in database
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      message_type: "outgoing",
      content: message,
      media_type: "text",
      telegram_message_id: telegramResponse.result?.message_id || null,
    })

    if (insertError) {
      console.error("[v0] Failed to store message in database:", insertError)
      return Response.json({ success: false, error: "Failed to store message" }, { status: 500 })
    }

    console.log("[v0] Message stored successfully, sending 200 OK response")
    return Response.json({ success: true, messageId: telegramResponse.result?.message_id })
  } catch (error) {
    console.error("[v0] Send message error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
