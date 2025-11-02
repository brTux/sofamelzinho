"use client"
import { Handle, Position } from "reactflow"
import { Clock } from "lucide-react"

export interface DelayNodeData {
  label: string
  delayMs?: number
  nextNodeIds?: string[]
}

export function DelayNode({ data, selected }: { data: DelayNodeData; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-orange-50 dark:bg-orange-950 transition ${
        selected ? "border-orange-600 dark:border-orange-400 shadow-lg" : "border-orange-200 dark:border-orange-800"
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-2">
        <Clock size={18} className="text-orange-600" />
        <span className="font-semibold text-sm text-orange-900 dark:text-orange-100">Delay</span>
      </div>

      <p className="text-xs text-orange-700 dark:text-orange-300">
        {data.delayMs ? `${data.delayMs}ms` : "Click to set delay"}
      </p>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
