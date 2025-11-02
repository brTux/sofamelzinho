"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send } from "lucide-react"

interface Message {
  id: string
  content: string
  message_type: "incoming" | "outgoing"
  created_at: string
}

interface ChatPanelProps {
  conversationId: string
}

export function ChatPanel({ conversationId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!conversationId) return

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, content, message_type, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100)

      setMessages(data || [])
      setLoading(false)
    }

    loadMessages()

    const channel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new as Message])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        message_type: "outgoing",
        content: newMessage,
      })

      setNewMessage("")
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.message_type === "outgoing" ? "justify-end" : "justify-start"}`}>
              <Card
                className={`max-w-xs lg:max-w-md px-4 py-2 ${
                  msg.message_type === "outgoing" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
              </Card>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={sending}
          />
          <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="gap-2">
            <Send size={16} />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
