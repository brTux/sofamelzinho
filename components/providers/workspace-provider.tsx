"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface Workspace {
  id: string
  name: string
  user_id: string
  created_at: string
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  setCurrentWorkspace: (workspace: Workspace) => void
  createWorkspace: (name: string) => Promise<Workspace>
  renameWorkspace: (id: string, newName: string) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  refreshWorkspaces: () => Promise<void>
  loading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  const loadWorkspaces = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (error) throw error

      setWorkspaces(data || [])

      // Auto-select first workspace or saved one
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId")
      const defaultWorkspace = data?.find((w) => w.id === savedWorkspaceId) || data?.[0] || null

      if (defaultWorkspace) {
        setCurrentWorkspaceState(defaultWorkspace)
      }
    } catch (error) {
      console.error("[v0] Failed to load workspaces:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const handleSetCurrentWorkspace = (workspace: Workspace) => {
    setCurrentWorkspaceState(workspace)
    localStorage.setItem("currentWorkspaceId", workspace.id)
  }

  const createWorkspace = async (name: string): Promise<Workspace> => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("No authenticated user")

      const { data, error } = await supabase
        .from("workspaces")
        .insert([
          {
            user_id: user.id,
            name,
          },
        ])
        .select()
        .single()

      if (error) throw error

      await loadWorkspaces()
      if (data) {
        handleSetCurrentWorkspace(data)
      }

      return data
    } catch (error) {
      console.error("[v0] Failed to create workspace:", error)
      throw error
    }
  }

  const renameWorkspace = async (id: string, newName: string): Promise<void> => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("workspaces").update({ name: newName }).eq("id", id)

      if (error) throw error

      // Update local state
      setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name: newName } : w)))

      if (currentWorkspace?.id === id) {
        setCurrentWorkspaceState({ ...currentWorkspace, name: newName })
      }
    } catch (error) {
      console.error("[v0] Failed to rename workspace:", error)
      throw error
    }
  }

  const deleteWorkspace = async (id: string): Promise<void> => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("workspaces").delete().eq("id", id)

      if (error) throw error

      // Update local state
      setWorkspaces((prev) => prev.filter((w) => w.id !== id))

      // Switch to another workspace if current one is deleted
      if (currentWorkspace?.id === id) {
        const remainingWorkspaces = workspaces.filter((w) => w.id !== id)
        if (remainingWorkspaces.length > 0) {
          handleSetCurrentWorkspace(remainingWorkspaces[0])
        } else {
          setCurrentWorkspaceState(null)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to delete workspace:", error)
      throw error
    }
  }

  const refreshWorkspaces = async (): Promise<void> => {
    await loadWorkspaces()
  }

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        setCurrentWorkspace: handleSetCurrentWorkspace,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
        refreshWorkspaces,
        loading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error("useWorkspace must be used within WorkspaceProvider")
  }
  return context
}
