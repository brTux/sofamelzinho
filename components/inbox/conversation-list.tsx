"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  first_name: string
  telegram_user_name?: string
  created_at: string
  unread_count?: number
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string | null
  onSelectConversation?: (id: string) => void
}

export function ConversationList({ conversations, selectedId, onSelectConversation }: ConversationListProps) {
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    const loadLastMessages = async () => {
      const messages: Record<string, string> = {}

      for (const conv of conversations) {
        const { data } = await supabase
          .from("messages")
          .select("content")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data) {
          messages[conv.id] = data.content.substring(0, 50)
        }
      }

      setLastMessages(messages)
    }

    loadLastMessages()

    const messagesChannel = supabase
      .channel("messages_preview")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: any) => {
          console.log("[v0] Realtime message event for preview:", payload.new.conversation_id)
          const convId = payload.new.conversation_id
          setLastMessages((prev) => ({
            ...prev,
            [convId]: payload.new.content.substring(0, 50),
          }))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [conversations, supabase])

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelectConversation?.(conv.id)}
          className={cn(
            "w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3",
            selectedId === conv.id ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted",
          )}
        >
          {/* Avatar */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 mt-0.5">
            <User size={18} className="text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">{conv.first_name}</h3>
              {conv.unread_count && conv.unread_count > 0 && (
                <Badge variant="default" className="text-xs">
                  {conv.unread_count}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {conv.telegram_user_name ? `@${conv.telegram_user_name}` : "No username"}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-1">{lastMessages[conv.id] || "No messages yet"}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
