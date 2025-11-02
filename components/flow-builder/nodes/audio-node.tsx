"use client"
import { Handle, Position } from "reactflow"
import { Music } from "lucide-react"

export interface AudioNodeData {
  label: string
  audioUrl?: string
  caption?: string
}

export function AudioNode({ data, selected }: { data: AudioNodeData; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-amber-50 dark:bg-amber-950 transition ${
        selected ? "border-amber-600 dark:border-amber-400 shadow-lg" : "border-amber-200 dark:border-amber-800"
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-2">
        <Music size={18} className="text-amber-600" />
        <span className="font-semibold text-sm text-amber-900 dark:text-amber-100">Audio</span>
      </div>

      <p className="text-xs text-amber-700 dark:text-amber-300 truncate">{data.audioUrl || "Click to set audio URL"}</p>
      {data.caption && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 line-clamp-1">{data.caption}</p>}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
