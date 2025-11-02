/**
 * Conversation utilities for data management
 */

import { createClient } from "@/lib/supabase/server"

export interface ConversationStats {
  totalConversations: number
  activeConversations: number
  totalMessages: number
  averageMessagesPerConversation: number
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(): Promise<ConversationStats> {
  const supabase = await createClient()

  const [conversations, messages] = await Promise.all([
    supabase.from("conversations").select("count", { count: "exact" }),
    supabase.from("messages").select("count", { count: "exact" }),
  ])

  const totalConversations = conversations.count || 0
  const totalMessages = messages.count || 0
  const averageMessagesPerConversation = totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0

  // Active conversations (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: activeCount } = await supabase
    .from("conversations")
    .select("count", { count: "exact" })
    .gte("updated_at", oneDayAgo)

  return {
    totalConversations,
    activeConversations: activeCount || 0,
    totalMessages,
    averageMessagesPerConversation,
  }
}

/**
 * Archive a conversation
 */
export async function archiveConversation(conversationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)

  return !error
}

/**
 * Export conversation messages
 */
export async function exportConversationMessages(
  conversationId: string,
  format: "json" | "csv" = "json",
): Promise<string | null> {
  const supabase = await createClient()

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error || !messages) return null

  if (format === "json") {
    return JSON.stringify(messages, null, 2)
  }

  // CSV format
  const headers = ["ID", "Type", "Content", "Created At"]
  const rows = messages.map((msg) => [msg.id, msg.message_type, `"${msg.content.replace(/"/g, '""')}"`, msg.created_at])

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
  return csv
}
