"use client"
import { Handle, Position } from "reactflow"
import { Play } from "lucide-react"

export interface TriggerNodeData {
  label: string
  triggerType?: "message" | "command" | "callback"
  triggerValue?: string
}

export function TriggerNode({ data, selected }: { data: TriggerNodeData; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-green-50 dark:bg-green-950 transition ${
        selected ? "border-green-600 dark:border-green-400 shadow-lg" : "border-green-200 dark:border-green-800"
      }`}
    >
      <Handle type="source" position={Position.Bottom} />

      <div className="flex items-center gap-2 mb-2">
        <Play size={18} className="text-green-600 fill-green-600" />
        <span className="font-semibold text-sm text-green-900 dark:text-green-100">Trigger</span>
      </div>

      <p className="text-xs text-green-700 dark:text-green-300">
        {data.triggerType === "command" ? `/${data.triggerValue}` : data.triggerValue || "Click to set trigger"}
      </p>
    </div>
  )
}
