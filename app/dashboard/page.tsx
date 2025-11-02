"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Bot, Zap, MessageSquare } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  bots: number
  flows: number
  conversations: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ bots: 0, flows: 0, conversations: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadStats = async () => {
      const [botsRes, flowsRes, convsRes] = await Promise.all([
        supabase.from("telegram_bots").select("count", { count: "exact" }),
        supabase.from("bot_flows").select("count", { count: "exact" }),
        supabase.from("conversations").select("count", { count: "exact" }),
      ])

      setStats({
        bots: botsRes.count || 0,
        flows: flowsRes.count || 0,
        conversations: convsRes.count || 0,
      })
      setLoading(false)
    }

    loadStats()
  }, [supabase])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your Telegram bots and automation flows</p>
        </div>
        <Link href="/dashboard/bots/new">
          <Button className="gap-2">
            <Plus size={18} />
            Connect Bot
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Bots</CardTitle>
            <Bot size={18} className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bots}</div>
            <p className="text-xs text-muted-foreground">Active bots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Flows</CardTitle>
            <Zap size={18} className="text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flows}</div>
            <p className="text-xs text-muted-foreground">Active flows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare size={18} className="text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations}</div>
            <p className="text-xs text-muted-foreground">Total conversations</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Set up your first bot and automation flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-sm font-medium mt-1">1.</div>
              <div>
                <p className="font-medium text-sm">Connect a Bot</p>
                <p className="text-xs text-muted-foreground">Go to Bots section and add your Telegram bot token</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-sm font-medium mt-1">2.</div>
              <div>
                <p className="font-medium text-sm">Create a Flow</p>
                <p className="text-xs text-muted-foreground">Design automated conversation flows with our builder</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-sm font-medium mt-1">3.</div>
              <div>
                <p className="font-medium text-sm">Test and Deploy</p>
                <p className="text-xs text-muted-foreground">Test your flows and deploy them to your bot</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>Learn more about TeleFlow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-sm bg-transparent">
              Documentation
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm bg-transparent">
              API Reference
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm bg-transparent">
              Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
