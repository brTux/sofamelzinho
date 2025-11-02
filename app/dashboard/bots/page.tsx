"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2 } from "lucide-react"
import Link from "next/link"

interface Bot {
  id: string
  bot_name: string
  bot_username: string
  created_at: string
}

export default function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadBots = async () => {
      const { data } = await supabase
        .from("telegram_bots")
        .select("id, bot_name, bot_username, created_at")
        .order("created_at", { ascending: false })

      setBots(data || [])
      setLoading(false)
    }

    loadBots()
  }, [supabase])

  const handleDelete = async (botId: string) => {
    if (!confirm("Are you sure you want to delete this bot?")) return

    const { error } = await supabase.from("telegram_bots").delete().eq("id", botId)

    if (!error) {
      setBots(bots.filter((b) => b.id !== botId))
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Connected Bots</h1>
          <p className="text-muted-foreground mt-1">Manage your Telegram bots</p>
        </div>
        <Link href="/dashboard/bots/new">
          <Button className="gap-2">
            <Plus size={18} />
            Connect Bot
          </Button>
        </Link>
      </div>

      {/* Bots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Bots</CardTitle>
          <CardDescription>All connected Telegram bots</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : bots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No bots connected yet</p>
              <Link href="/dashboard/bots/new">
                <Button>Connect Your First Bot</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bot Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell className="font-medium">{bot.bot_name}</TableCell>
                    <TableCell>@{bot.bot_username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(bot.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/dashboard/bots/${bot.id}/edit`}>
                        <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                          <Edit2 size={14} />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive hover:text-destructive bg-transparent"
                        onClick={() => handleDelete(bot.id)}
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
