import type React from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { WorkspaceSelector } from "@/components/dashboard/workspace-selector"
import { WorkspaceProvider } from "@/components/providers/workspace-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col bg-background">
          {/* Top bar with workspace selector */}
          <div className="border-b border-border bg-card p-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Workspace</h2>
              <WorkspaceSelector />
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </WorkspaceProvider>
  )
}
