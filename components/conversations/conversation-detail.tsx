"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle } from "lucide-react"

interface Message {
  id: string
  content: string
  message_type: "incoming" | "outgoing"
  created_at: string
}

interface ConversationDetailProps {
  conversationId: string
}

export function ConversationDetail({ conversationId }: ConversationDetailProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, content, message_type, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      setMessages(data || [])
      setLoading(false)
    }

    loadMessages()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          setMessages((msgs) => [...msgs, payload.new as Message])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  if (loading) {
    return <p className="text-muted-foreground">Loading messages...</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={20} />
          Message History
        </CardTitle>
        <CardDescription>{messages.length} messages in this conversation</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 rounded-md border border-border p-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.message_type === "incoming" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                      msg.message_type === "incoming"
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.message_type === "incoming" ? "text-muted-foreground" : "text-primary-foreground/70"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
