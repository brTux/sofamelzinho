"use client"
import { Handle, Position } from "reactflow"
import { FormInput } from "lucide-react"

export interface DataCollectionNodeData {
  label: string
  question?: string
  inputType?: "text" | "number" | "email" | "phone"
  timeoutMinutes?: number
}

export function DataCollectionNode({ data, selected }: { data: DataCollectionNodeData; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-indigo-50 dark:bg-indigo-950 transition ${
        selected ? "border-indigo-600 dark:border-indigo-400 shadow-lg" : "border-indigo-200 dark:border-indigo-800"
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-2">
        <FormInput size={18} className="text-indigo-600" />
        <span className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">Data Collection</span>
      </div>

      <p className="text-xs text-indigo-700 dark:text-indigo-300 line-clamp-2">
        {data.question || "Click to set question"}
      </p>
      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Timeout: {data.timeoutMinutes || 5} min</p>

      {/* Multiple handles for timeout and response paths */}
      <Handle type="source" position={Position.Bottom} id="response" style={{ left: "30%" }} />
      <Handle type="source" position={Position.Bottom} id="timeout" style={{ left: "70%" }} />

      <div className="text-xs text-indigo-600 dark:text-indigo-400 flex justify-between mt-2 px-1">
        <span>Response</span>
        <span>Timeout</span>
      </div>
    </div>
  )
}
