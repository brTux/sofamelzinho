"use client"

import Link from "next/link"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export default function NewFlowPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [triggerType, setTriggerType] = useState("message")
  const [triggerValue, setTriggerValue] = useState("")
  const [botId, setBotId] = useState("")
  const [bots, setBots] = useState<Array<{ id: string; bot_name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [botsLoading, setBotsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadBots = async () => {
      const { data } = await supabase.from("telegram_bots").select("id, bot_name")
      setBots(data || [])
      if (data && data.length > 0) {
        setBotId(data[0].id)
      }
      setBotsLoading(false)
    }

    loadBots()
  }, [supabase])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!botId || !name || !triggerValue) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    try {
      const { data, error: createError } = await supabase
        .from("bot_flows")
        .insert({
          bot_id: botId,
          name,
          description,
          trigger_type: triggerType,
          trigger_value: triggerValue,
          flow_data: {}, // Empty initial flow data
          is_active: true,
        })
        .select()
        .single()

      if (createError || !data) {
        setError("Failed to create flow")
        return
      }

      router.push(`/dashboard/flows/${data.id}/edit`)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (botsLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (bots.length === 0) {
    return (
      <div className="p-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">You need to connect a bot first before creating flows.</p>
            <Link href="/dashboard/bots/new">
              <Button>Connect a Bot</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Flow</h1>
        <p className="text-muted-foreground mt-1">Set up a new automation flow</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flow Configuration</CardTitle>
          <CardDescription>Configure your automation flow settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium">Bot</label>
              <Select value={botId} onValueChange={setBotId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.bot_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Flow Name</label>
              <Input
                placeholder="e.g., Welcome Message"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Trigger Type</label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="message">Message Contains</SelectItem>
                    <SelectItem value="command">Command</SelectItem>
                    <SelectItem value="callback">Button Click</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Trigger Value {triggerType === "command" && "(without /)"}
                </label>
                <Input
                  placeholder={
                    triggerType === "command" ? "start" : triggerType === "message" ? "hello" : "callback_id"
                  }
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Creating..." : "Create Flow"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
