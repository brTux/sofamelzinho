"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ConversationList } from "@/components/inbox/conversation-list"
import { ChatPanel } from "@/components/inbox/chat-panel"
import { MessageSquare } from "lucide-react"

interface ConversationItem {
  id: string
  first_name: string
  telegram_user_name?: string
  telegram_user_id: number
  created_at: string
  updated_at: string
  unread_count?: number
}

export default function InboxPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const loadConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, first_name, telegram_user_name, telegram_user_id, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(100)

      setConversations(data || [])
      if (data && data.length > 0) {
        setSelectedConversation(data[0].id)
      }
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
          setConversations((prev) =>
            prev
              .map((c) => (c.id === payload.new.id ? (payload.new as ConversationItem) : c))
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
          )
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
      {/* Main layout: list + chat side by side */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left sidebar: Conversations list */}
        <div className="w-80 flex flex-col border border-border rounded-lg overflow-hidden bg-card">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={20} className="text-primary" />
              <h2 className="font-semibold">Conversations</h2>
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
            />
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">Loading...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">
                  {conversations.length === 0 ? "No conversations yet" : "No matches"}
                </p>
              </div>
            ) : (
              <ConversationList
                conversations={filteredConversations}
                selectedId={selectedConversation}
                onSelectConversation={setSelectedConversation}
              />
            )}
          </div>
        </div>

        {/* Right side: Chat panel */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col border border-border rounded-lg overflow-hidden bg-card">
            <ChatPanel conversationId={selectedConversation} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center border border-border rounded-lg bg-card">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
