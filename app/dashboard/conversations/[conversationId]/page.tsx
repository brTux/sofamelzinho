"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConversationDetail } from "@/components/conversations/conversation-detail"
import { Badge } from "@/components/ui/badge"
import { User, Clock, MessageSquare } from "lucide-react"

interface ConversationInfo {
  id: string
  first_name: string
  telegram_user_name?: string
  telegram_user_id: number
  created_at: string
}

interface FlowExecution {
  id: string
  flow_id: string
  status: string
  started_at: string
  completed_at?: string
}

export default function ConversationDetailPage() {
  const params = useParams()
  const conversationId = params.conversationId as string
  const router = useRouter()
  const [conversation, setConversation] = useState<ConversationInfo | null>(null)
  const [flowExecutions, setFlowExecutions] = useState<FlowExecution[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const [convRes, execRes] = await Promise.all([
        supabase
          .from("conversations")
          .select("id, first_name, telegram_user_name, telegram_user_id, created_at")
          .eq("id", conversationId)
          .single(),
        supabase
          .from("flow_executions")
          .select("id, flow_id, status, started_at, completed_at")
          .eq("conversation_id", conversationId)
          .order("started_at", { ascending: false }),
      ])

      setConversation(convRes.data)
      setFlowExecutions(execRes.data || [])
      setLoading(false)
    }

    loadData()
  }, [conversationId, supabase])

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground mb-4">Conversation not found</p>
        <Button onClick={() => router.back()} variant="outline">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{conversation.first_name}</h1>
          <p className="text-muted-foreground mt-1">
            {conversation.telegram_user_name && `@${conversation.telegram_user_name}`}
          </p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          Back to Conversations
        </Button>
      </div>

      {/* Conversation Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User size={16} />
              Telegram ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversation.telegram_user_id}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock size={16} />
              Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{new Date(conversation.created_at).toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground">{new Date(conversation.created_at).toLocaleTimeString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare size={16} />
              Flows Executed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{flowExecutions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Message History */}
      <ConversationDetail conversationId={conversationId} />

      {/* Flow Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Executions</CardTitle>
          <CardDescription>All automation flows triggered in this conversation</CardDescription>
        </CardHeader>
        <CardContent>
          {flowExecutions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No flows executed yet</p>
          ) : (
            <div className="space-y-3">
              {flowExecutions.map((exec) => (
                <div key={exec.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Flow ID: {exec.flow_id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(exec.started_at).toLocaleString()}</p>
                  </div>
                  <Badge
                    variant={
                      exec.status === "completed" ? "default" : exec.status === "failed" ? "destructive" : "secondary"
                    }
                  >
                    {exec.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
