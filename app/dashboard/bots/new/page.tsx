"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useWorkspace } from "@/components/providers/workspace-provider"

export default function ConnectBotPage() {
  const [botToken, setBotToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { currentWorkspace, loading: workspaceLoading, workspaces, setCurrentWorkspace } = useWorkspace()

  // ✅ Garante que haja um workspace selecionado por padrão
  useEffect(() => {
    if (!workspaceLoading && !currentWorkspace && workspaces?.length > 0) {
      setCurrentWorkspace(workspaces[0])
    }
  }, [workspaceLoading, currentWorkspace, workspaces, setCurrentWorkspace])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentWorkspace) {
      setError("No workspace selected")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/flows/connect-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          botToken: botToken.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to connect bot")
        return
      }

      router.push("/dashboard/bots")
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (workspaceLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Connect a Bot</h1>
        <p className="text-muted-foreground mt-1">Add your Telegram bot token to get started</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Telegram Bot Token</CardTitle>
          <CardDescription>
            Get your bot token from{" "}
            <a
              href="https://t.me/botfather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              BotFather
            </a>{" "}
            on Telegram
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleConnect} className="space-y-4">
            {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium">Bot Token</label>
              <Input
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                disabled={loading || workspaceLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Keep your token secret and do not share it with anyone
              </p>
            </div>

            {!currentWorkspace && (
              <p className="text-sm text-destructive">
                ⚠️ No workspace selected. Please create or select one first.
              </p>
            )}

            <Button type="submit" disabled={loading || !botToken || workspaceLoading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Connecting..." : "Connect Bot"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
