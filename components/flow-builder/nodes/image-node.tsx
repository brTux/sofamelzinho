"use client"
import { Handle, Position } from "reactflow"
import { ImageIcon } from "lucide-react"

export interface ImageNodeData {
  label: string
  imageUrl?: string
  caption?: string
}

export function ImageNode({ data, selected }: { data: ImageNodeData; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-purple-50 dark:bg-purple-950 transition ${
        selected ? "border-purple-600 dark:border-purple-400 shadow-lg" : "border-purple-200 dark:border-purple-800"
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-2">
        <ImageIcon size={18} className="text-purple-600" />
        <span className="font-semibold text-sm text-purple-900 dark:text-purple-100">Image</span>
      </div>

      <p className="text-xs text-purple-700 dark:text-purple-300 truncate">
        {data.imageUrl || "Click to set image URL"}
      </p>
      {data.caption && <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 line-clamp-1">{data.caption}</p>}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
