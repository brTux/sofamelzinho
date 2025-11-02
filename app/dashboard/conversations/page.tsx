"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye } from "lucide-react"
import Link from "next/link"

interface ConversationRow {
  id: string
  first_name: string
  telegram_user_name?: string
  created_at: string
  message_count?: number
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const loadConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, first_name, telegram_user_name, created_at")
        .order("created_at", { ascending: false })
        .limit(100)

      setConversations(data || [])
      setLoading(false)
    }

    loadConversations()

    // Subscribe to new conversations
    const channel = supabase
      .channel("new_conversations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        (payload: any) => {
          setConversations((prev) => [payload.new as ConversationRow, ...prev])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.telegram_user_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-muted-foreground mt-1">View and manage all conversations with your bot users</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Conversations</CardTitle>
          <CardDescription>
            {filteredConversations.length} conversation{filteredConversations.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading conversations...</p>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              {conversations.length === 0 ? (
                <p className="text-muted-foreground">No conversations yet</p>
              ) : (
                <p className="text-muted-foreground">No conversations match your search</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">{conv.first_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {conv.telegram_user_name ? `@${conv.telegram_user_name}` : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/conversations/${conv.id}`}>
                          <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                            <Eye size={14} />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
