"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"

interface Conversation {
  id: string
  first_name: string
  telegram_user_name?: string
  created_at: string
  unread_count?: number
}

interface ConversationListProps {
  conversations: Conversation[]
}

export function ConversationList({ conversations }: ConversationListProps) {
  const router = useRouter()

  return (
    <div className="space-y-2 p-4">
      {conversations.map((conv) => (
        <Link key={conv.id} href={`/dashboard/inbox/${conv.id}`}>
          <Card className="p-4 hover:bg-accent cursor-pointer transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
                  <User size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{conv.first_name}</h3>
                    {conv.unread_count && conv.unread_count > 0 && <Badge variant="default">{conv.unread_count}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.telegram_user_name ? `@${conv.telegram_user_name}` : "No username"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(conv.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
