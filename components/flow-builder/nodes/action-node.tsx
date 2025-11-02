"use client"
import { Handle, Position } from "reactflow"
import { Zap } from "lucide-react"

export interface ActionNodeData {
  label: string
  actionType?: string
  nextNodeIds?: string[]
}

export function ActionNode({ data, selected }: { data: ActionNodeData; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-green-50 dark:bg-green-950 transition ${
        selected ? "border-green-600 dark:border-green-400 shadow-lg" : "border-green-200 dark:border-green-800"
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-2">
        <Zap size={18} className="text-green-600" />
        <span className="font-semibold text-sm text-green-900 dark:text-green-100">Action</span>
      </div>

      <p className="text-xs text-green-700 dark:text-green-300 line-clamp-2">
        {data.actionType || "Click to configure"}
      </p>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
