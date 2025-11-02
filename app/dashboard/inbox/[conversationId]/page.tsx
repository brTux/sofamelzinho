"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChatPanel } from "@/components/inbox/chat-panel"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Conversation {
  id: string
  first_name: string
  telegram_user_name?: string
  last_name?: string
}

export default function ConversationDetailPage() {
  const params = useParams()
  const conversationId = params.conversationId as string
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!conversationId) return

    const loadConversation = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, first_name, telegram_user_name, last_name")
        .eq("id", conversationId)
        .single()

      setConversation(data)
      setLoading(false)
    }

    loadConversation()
  }, [conversationId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Conversation not found</p>
            <Link href="/dashboard/inbox" className="text-primary hover:underline mt-4 block">
              Back to Inbox
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inbox">
            <ArrowLeft size={20} className="text-muted-foreground hover:text-foreground cursor-pointer" />
          </Link>
          <div>
            <h2 className="text-xl font-semibold">
              {conversation.first_name} {conversation.last_name || ""}
            </h2>
            <p className="text-sm text-muted-foreground">
              {conversation.telegram_user_name ? `@${conversation.telegram_user_name}` : "No username"}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel conversationId={conversationId} />
    </div>
  )
}
