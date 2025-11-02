"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ConversationList } from "@/components/inbox/conversation-list"
import { MessageSquare } from "lucide-react"

interface ConversationItem {
  id: string
  first_name: string
  telegram_user_name?: string
  telegram_user_id: number
  created_at: string
  unread_count?: number
  last_message?: string
  last_message_time?: string
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const loadConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, first_name, telegram_user_name, telegram_user_id, created_at, is_archived")
        .eq("is_archived", false)
        .order("updated_at", { ascending: false })
        .limit(100)

      setConversations(data || [])
      setLoading(false)
    }

    loadConversations()

    const channel = supabase
      .channel("inbox_conversations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        (payload: any) => {
          setConversations((prev) => [payload.new as ConversationItem, ...prev])
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        (payload: any) => {
          setConversations((prev) => prev.map((c) => (c.id === payload.new.id ? (payload.new as ConversationItem) : c)))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.telegram_user_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={24} className="text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Live Chat</h1>
            <p className="text-muted-foreground">Manage conversations with bot users</p>
          </div>
        </div>

        {/* Search */}
        <Input
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md mx-auto">
              <CardContent className="text-center py-12">
                <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {conversations.length === 0 ? "No conversations yet" : "No conversations match your search"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ConversationList conversations={filteredConversations} />
        )}
      </div>
    </div>
  )
}
