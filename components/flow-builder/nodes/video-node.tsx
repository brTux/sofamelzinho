"use client"
import { Handle, Position } from "reactflow"
import { Video } from "lucide-react"

export interface VideoNodeData {
  label: string
  videoUrl?: string
  caption?: string
}

export function VideoNode({ data, selected }: { data: VideoNodeData; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-red-50 dark:bg-red-950 transition ${
        selected ? "border-red-600 dark:border-red-400 shadow-lg" : "border-red-200 dark:border-red-800"
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-2">
        <Video size={18} className="text-red-600" />
        <span className="font-semibold text-sm text-red-900 dark:text-red-100">Video</span>
      </div>

      <p className="text-xs text-red-700 dark:text-red-300 truncate">{data.videoUrl || "Click to set video URL"}</p>
      {data.caption && <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-1">{data.caption}</p>}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
