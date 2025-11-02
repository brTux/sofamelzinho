"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, Play } from "lucide-react"
import Link from "next/link"

interface Flow {
  id: string
  name: string
  trigger_type: string
  trigger_value: string
  is_active: boolean
  created_at: string
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadFlows = async () => {
      const { data } = await supabase
        .from("bot_flows")
        .select("id, name, trigger_type, trigger_value, is_active, created_at")
        .order("created_at", { ascending: false })

      setFlows(data || [])
      setLoading(false)
    }

    loadFlows()
  }, [supabase])

  const handleDelete = async (flowId: string) => {
    if (!confirm("Are you sure you want to delete this flow?")) return

    const { error } = await supabase.from("bot_flows").delete().eq("id", flowId)

    if (!error) {
      setFlows(flows.filter((f) => f.id !== flowId))
    }
  }

  const handleToggleActive = async (flowId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("bot_flows").update({ is_active: !currentStatus }).eq("id", flowId)

    if (!error) {
      setFlows(flows.map((f) => (f.id === flowId ? { ...f, is_active: !currentStatus } : f)))
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Flows</h1>
          <p className="text-muted-foreground mt-1">Create and manage conversation flows</p>
        </div>
        <Link href="/dashboard/flows/new">
          <Button className="gap-2">
            <Plus size={18} />
            Create Flow
          </Button>
        </Link>
      </div>

      {/* Flows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Flows</CardTitle>
          <CardDescription>All automation flows for your bots</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : flows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No flows created yet</p>
              <Link href="/dashboard/flows/new">
                <Button>Create Your First Flow</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Trigger Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flows.map((flow) => (
                  <TableRow key={flow.id}>
                    <TableCell className="font-medium">{flow.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{flow.trigger_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{flow.trigger_value}</TableCell>
                    <TableCell>
                      <Badge variant={flow.is_active ? "default" : "outline"}>
                        {flow.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(flow.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/dashboard/flows/${flow.id}/edit`}>
                        <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                          <Edit2 size={14} />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 bg-transparent"
                        onClick={() => handleToggleActive(flow.id, flow.is_active)}
                      >
                        <Play size={14} />
                        {flow.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive hover:text-destructive bg-transparent"
                        onClick={() => handleDelete(flow.id)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
