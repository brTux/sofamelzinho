/**
 * API endpoint to connect a Telegram bot
 * Validates token and sets up webhook
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateTelegramToken, setTelegramWebhook } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, botToken } = await request.json()

    if (!workspaceId || !botToken) {
      return NextResponse.json({ error: "Missing workspaceId or botToken" }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error("[v0] NEXT_PUBLIC_APP_URL environment variable is not set")
      return NextResponse.json(
        {
          error:
            "Server configuration error: NEXT_PUBLIC_APP_URL not set. Please configure the environment variable in your Vercel project settings.",
        },
        { status: 500 },
      )
    }

    // Validate token
    const botInfo = await validateTelegramToken(botToken)

    if (!botInfo.ok || !botInfo.result) {
      return NextResponse.json({ error: "Invalid bot token" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: existingBot } = await supabase
      .from("telegram_bots")
      .select("id")
      .eq("bot_token", botToken)
      .maybeSingle()

    if (existingBot) {
      return NextResponse.json({ error: "Bot already connected" }, { status: 400 })
    }

    // Save bot to database
    const { data: newBot, error: dbError } = await supabase
      .from("telegram_bots")
      .insert({
        workspace_id: workspaceId,
        bot_token: botToken,
        bot_name: botInfo.result.first_name,
        bot_username: botInfo.result.username,
      })
      .select()
      .single()

    if (dbError || !newBot) {
      console.error("[v0] Database error:", dbError)
      return NextResponse.json({ error: "Failed to save bot" }, { status: 500 })
    }

    const webhookUrl = `${appUrl}/api/telegram/webhook`
    console.log("[v0] Setting webhook for bot:", botInfo.result.username, "URL:", webhookUrl)

    const webhookResult = await setTelegramWebhook(botToken, webhookUrl)

    if (!webhookResult.ok) {
      console.error("[v0] Webhook setup failed:", webhookResult.description)

      // Delete the bot if webhook setup fails
      await supabase.from("telegram_bots").delete().eq("id", newBot.id)

      return NextResponse.json(
        {
          error: `Failed to set webhook: ${webhookResult.description}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      bot: {
        id: newBot.id,
        name: newBot.bot_name,
        username: newBot.bot_username,
      },
    })
  } catch (error) {
    console.error("[v0] Connect bot error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
