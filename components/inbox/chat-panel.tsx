"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  message_type: "incoming" | "outgoing"
  created_at: string
  media_type?: string
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
      console.log("[v0] Loading messages for conversation:", conversationId)

      const { data, error } = await supabase
        .from("messages")
        .select("id, content, message_type, created_at, media_type")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) {
        console.error("[v0] Error loading messages:", error)
      } else {
        console.log("[v0] Loaded messages:", data?.length || 0)
        setMessages(data || [])
      }
      setLoading(false)
    }

    loadMessages()

    console.log("[v0] Subscribing to realtime messages for conversation:", conversationId)

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
          console.log("[v0] Realtime message received:", payload.new)
          setMessages((prev) => [...prev, payload.new as Message])
        },
      )
      .subscribe((status) => {
        console.log("[v0] Subscription status:", status)
      })

    return () => {
      console.log("[v0] Unsubscribing from messages channel")
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
        media_type: "text",
      })

      setNewMessage("")
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.message_type === "outgoing" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words",
                  msg.message_type === "outgoing"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground border border-border",
                )}
              >
                <p className="text-sm">{msg.content}</p>
                <p
                  className={cn(
                    "text-xs mt-1 opacity-70",
                    msg.message_type === "outgoing" ? "text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Paperclip size={18} />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            disabled={sending}
            className="text-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="flex-shrink-0"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
