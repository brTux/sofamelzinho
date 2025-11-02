"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { FlowCanvas } from "@/components/flow-builder/flow-canvas"
import type { Node, Edge } from "reactflow"
import { Loader2 } from "lucide-react"

interface Flow {
  id: string
  name: string
  flow_data?: { nodes?: Node[]; edges?: Edge[] }
}

export default function EditFlowPage() {
  const params = useParams()
  const flowId = params.flowId as string
  const [flow, setFlow] = useState<Flow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadFlow = async () => {
      const { data } = await supabase.from("bot_flows").select("id, name, flow_data").eq("id", flowId).single()

      setFlow(data || null)
      setLoading(false)
    }

    loadFlow()
  }, [flowId, supabase])

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    setSaving(true)

    try {
      const { error } = await supabase.from("bot_flows").update({ flow_data: { nodes, edges } }).eq("id", flowId)

      if (!error) {
        console.log("[v0] Flow saved successfully")
      }
    } catch (err) {
      console.error("[v0] Error saving flow:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Flow not found</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-border bg-card p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{flow.name}</h1>
          <p className="text-sm text-muted-foreground">Flow ID: {flowId}</p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          Close Editor
        </Button>
      </div>

      <div className="flex-1">
        <FlowCanvas
          flowId={flowId}
          initialNodes={flow.flow_data?.nodes || []}
          initialEdges={flow.flow_data?.edges || []}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
