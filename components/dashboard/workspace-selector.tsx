"use client"

import { useState } from "react"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { CreateWorkspaceModal } from "./create-workspace-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function WorkspaceSelector() {
  const { currentWorkspace, workspaces, setCurrentWorkspace, deleteWorkspace, loading } = useWorkspace()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [renameMode, setRenameMode] = useState<string | null>(null)
  const [renamingError, setRenamingError] = useState("")

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
    }
  }

  const handleDeleteWorkspace = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this workspace?")) {
      try {
        await deleteWorkspace(id)
      } catch (error) {
        console.error("[v0] Failed to delete workspace:", error)
      }
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>

  return (
    <>
      <div className="flex items-center gap-2">
        {workspaces.length > 0 ? (
          <>
            <Select value={currentWorkspace?.id || ""} onValueChange={handleWorkspaceChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Workspace actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRenameMode(currentWorkspace?.id || null)} className="gap-2">
                  <Edit2 size={16} />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteWorkspace(currentWorkspace?.id || "")}
                  className="gap-2 text-destructive"
                >
                  <Trash2 size={16} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No workspaces</span>
        )}

        {/* Create workspace button */}
        <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} />
          New Workspace
        </Button>
      </div>

      {/* Create workspace modal */}
      <CreateWorkspaceModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  )
}
