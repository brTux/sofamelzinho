"use client"

import type React from "react"
import { useCallback, useState } from "react"
import ReactFlow, {
  type Node,
  type Edge,
  addEdge,
  type Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from "reactflow"
import "reactflow/dist/style.css"
import { MessageNode } from "./nodes/message-node"
import { ConditionNode } from "./nodes/condition-node"
import { ActionNode } from "./nodes/action-node"
import { DelayNode } from "./nodes/delay-node"

const nodeTypes = {
  message: MessageNode,
  condition: ConditionNode,
  action: ActionNode,
  delay: DelayNode,
}

export interface FlowCanvasProps {
  flowId: string
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>
}

export function FlowCanvas({ flowId, initialNodes = [], initialEdges = [], onSave }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds))
    },
    [setEdges],
  )

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation()
    setSelectedNode(node)
  }, [])

  const handleNodeDelete = useCallback(() => {
    if (!selectedNode) return
    setNodes((ns) => ns.filter((n) => n.id !== selectedNode.id))
    setEdges((es) => es.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
    setSelectedNode(null)
  }, [selectedNode, setNodes, setEdges])

  const handleSave = async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      await onSave(nodes, edges)
      console.log("[v0] Flow saved successfully")
    } catch (error) {
      console.error("[v0] Error saving flow:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddNode = useCallback(
    (type: "message" | "condition" | "action" | "delay") => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: Math.random() * 500, y: Math.random() * 500 },
        data: { label: `${type} node` },
      }
      setNodes((ns) => [...ns, newNode])
    },
    [setNodes],
  )

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex gap-2">
          <button
            onClick={() => handleAddNode("message")}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Message
          </button>
          <button
            onClick={() => handleAddNode("condition")}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            Condition
          </button>
          <button
            onClick={() => handleAddNode("action")}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition"
          >
            Action
          </button>
          <button
            onClick={() => handleAddNode("delay")}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 transition"
          >
            Delay
          </button>
        </div>

        <div className="flex gap-2">
          {selectedNode && (
            <button
              onClick={handleNodeDelete}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-red-700 transition"
            >
              Delete Node
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Flow"}
          </button>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-64 border-l border-border bg-card p-4 max-h-screen overflow-y-auto">
          <h3 className="font-semibold mb-4">Node Properties</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Node ID</label>
              <input
                type="text"
                value={selectedNode.id}
                disabled
                className="w-full mt-1 px-2 py-1 bg-muted text-foreground border border-input rounded text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Type</label>
              <input
                type="text"
                value={selectedNode.type}
                disabled
                className="w-full mt-1 px-2 py-1 bg-muted text-foreground border border-input rounded text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Position: ({selectedNode.position.x.toFixed(0)}, {selectedNode.position.y.toFixed(0)})
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
