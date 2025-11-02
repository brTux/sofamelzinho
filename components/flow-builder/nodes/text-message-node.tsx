"use client"
import { Handle, Position } from "reactflow"
import { MessageCircle } from "lucide-react"

export interface TextMessageNodeData {
  label: string
  text?: string
  hasButtons?: boolean
  buttons?: Array<{ label: string; nextNodeId: string }>
}

export function TextMessageNode({ data, selected }: { data: TextMessageNodeData; selected?: boolean }) {
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
      {data.hasButtons && data.buttons && data.buttons.length > 0 && (
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">+ {data.buttons.length} button(s)</div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
