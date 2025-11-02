"use client"
import { Handle, Position } from "reactflow"
import { MessageCircle } from "lucide-react"

export interface MessageNodeData {
  label: string
  text?: string
  nextNodeIds?: string[]
}

export function MessageNode({ data, selected }: { data: MessageNodeData; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-blue-50 dark:bg-blue-950 transition ${
        selected ? "border-blue-600 dark:border-blue-400 shadow-lg" : "border-blue-200 dark:border-blue-800"
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-2">
        <MessageCircle size={18} className="text-blue-600" />
        <span className="font-semibold text-sm text-blue-900 dark:text-blue-100">Message</span>
      </div>

      <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">{data.text || "Click to edit message"}</p>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
