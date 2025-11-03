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

    let appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      const protocol = request.headers.get("x-forwarded-proto") || "https"
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host")

      if (host) {
        appUrl = `${protocol}://${host}`
        console.log("[v0] Auto-detected app URL from request:", appUrl)
      } else {
        console.error("[v0] Could not determine app URL from request headers or environment")
        return NextResponse.json(
          {
            error:
              "Server configuration error: Could not determine app URL. Please set NEXT_PUBLIC_APP_URL environment variable.",
          },
          { status: 500 },
        )
      }
    }

    console.log("[v0] ===== CONNECTING BOT =====")
    console.log("[v0] Bot token:", botToken.substring(0, 10) + "***")
    console.log("[v0] Workspace ID:", workspaceId)
    console.log("[v0] App URL:", appUrl)

    // Validate token
    console.log("[v0] Validating bot token...")
    const botInfo = await validateTelegramToken(botToken)

    if (!botInfo.ok || !botInfo.result) {
      console.error("[v0] Invalid bot token:", botInfo.description)
      return NextResponse.json({ error: "Invalid bot token" }, { status: 400 })
    }

    console.log("[v0] Bot validated:", botInfo.result.username)

    const supabase = await createClient()

    const { data: existingBot } = await supabase
      .from("telegram_bots")
      .select("id")
      .eq("bot_token", botToken)
      .maybeSingle()

    if (existingBot) {
      console.warn("[v0] Bot already connected")
      return NextResponse.json({ error: "Bot already connected" }, { status: 400 })
    }

    // Save bot to database
    console.log("[v0] Saving bot to database...")
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

    console.log("[v0] Bot saved to database with ID:", newBot.id)

    const webhookUrl = `${appUrl}/api/flows/webhook`
    console.log("[v0] Setting webhook URL:", webhookUrl)

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

    console.log("[v0] Verifying webhook setup with Telegram...")
    const webhookInfo = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const webhookInfoData = await webhookInfo.json()

    console.log("[v0] Webhook info:", {
      url: webhookInfoData.result?.url,
      pending_update_count: webhookInfoData.result?.pending_update_count,
      last_error_message: webhookInfoData.result?.last_error_message,
      last_error_date: webhookInfoData.result?.last_error_date,
    })

    if (webhookInfoData.result?.last_error_message) {
      console.warn("[v0] Webhook has errors:", webhookInfoData.result.last_error_message)
    }

    console.log("[v0] ===== BOT CONNECTED SUCCESSFULLY =====")

    return NextResponse.json({
      ok: true,
      bot: {
        id: newBot.id,
        name: newBot.bot_name,
        username: newBot.bot_username,
      },
      webhookInfo: webhookInfoData.result,
    })
  } catch (error) {
    console.error("[v0] ===== CONNECT BOT ERROR =====")
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
