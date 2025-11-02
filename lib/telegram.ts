/**
 * Telegram API integration utilities
 * Handles token validation, webhook setup, and message routing
 */

const TELEGRAM_API_BASE = "https://api.telegram.org/bot"

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
    }
    chat: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      type: string
    }
    date: number
    text?: string
    entities?: Array<{
      offset: number
      length: number
      type: string
    }>
  }
  callback_query?: {
    id: string
    from: {
      id: number
      first_name: string
      username?: string
    }
    chat_instance: string
    data?: string
    message?: {
      message_id: number
      text?: string
    }
  }
}

export interface TelegramBotInfo {
  ok: boolean
  result?: {
    id: number
    is_bot: boolean
    first_name: string
    username: string
    can_join_groups: boolean
    can_read_all_group_messages: boolean
    supports_inline_queries: boolean
    can_connect_to_business: boolean
  }
  error_code?: number
  description?: string
}

/**
 * Validate Telegram bot token by making a getMe API call
 */
export async function validateTelegramToken(token: string): Promise<TelegramBotInfo> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/getMe`)
    return await response.json()
  } catch (error) {
    return {
      ok: false,
      error_code: 500,
      description: "Failed to validate token",
    }
  }
}

/**
 * Set webhook for receiving Telegram updates
 */
export async function setTelegramWebhook(
  token: string,
  webhookUrl: string,
): Promise<{ ok: boolean; error_code?: number; description?: string }> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query", "channel_post"],
      }),
    })
    return await response.json()
  } catch (error) {
    return {
      ok: false,
      error_code: 500,
      description: "Failed to set webhook",
    }
  }
}

/**
 * Delete webhook
 */
export async function deleteTelegramWebhook(token: string): Promise<{ ok: boolean }> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/deleteWebhook`, {
      method: "POST",
    })
    return await response.json()
  } catch (error) {
    return { ok: false }
  }
}

/**
 * Send a message via Telegram API
 */
export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
  replyMarkup?: object,
): Promise<{ ok: boolean; result?: object; error_code?: number }> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
        parse_mode: "HTML",
      }),
    })
    return await response.json()
  } catch (error) {
    return {
      ok: false,
      error_code: 500,
    }
  }
}

/**
 * Answer callback query
 */
export async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string,
  showAlert?: boolean,
): Promise<{ ok: boolean }> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    })
    return await response.json()
  } catch (error) {
    return { ok: false }
  }
}
