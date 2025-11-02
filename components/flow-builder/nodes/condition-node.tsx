"use client"
import { Handle, Position } from "reactflow"
import { GitBranch } from "lucide-react"

export interface ConditionNodeData {
  label: string
  condition?: {
    type: "contains" | "equals" | "startsWith"
    value: string
  }
  trueNodeIds?: string[]
  falseNodeIds?: string[]
}

export function ConditionNode({ data, selected }: { data: ConditionNodeData; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-purple-50 dark:bg-purple-950 transition ${
        selected ? "border-purple-600 dark:border-purple-400 shadow-lg" : "border-purple-200 dark:border-purple-800"
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-2">
        <GitBranch size={18} className="text-purple-600" />
        <span className="font-semibold text-sm text-purple-900 dark:text-purple-100">Condition</span>
      </div>

      <p className="text-xs text-purple-700 dark:text-purple-300 line-clamp-2">
        {data.condition?.type || "Choose condition"}
      </p>

      <div className="flex gap-2 mt-2 text-xs">
        <Handle type="source" position={Position.Bottom} id="true" />
        <Handle type="source" position={Position.Bottom} id="false" />
      </div>
    </div>
  )
}
