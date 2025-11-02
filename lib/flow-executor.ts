/**
 * Flow execution engine
 * Handles triggering and executing flows based on incoming Telegram messages
 */

import { createClient } from "@/lib/supabase/server"
import { sendTelegramMessage } from "@/lib/telegram"

export interface FlowContext {
  botId: string
  botToken: string
  conversationId: string
  telegramUserId: number
  telegramChatId: number
  message: string
  flowId: string
  executionId: string
}

/**
 * Execute a flow node
 */
async function executeNode(
  context: FlowContext,
  nodeId: string,
  nodeType: string,
  config: any,
): Promise<{ success: boolean; nextNodeIds: string[] }> {
  const supabase = await createClient()

  switch (nodeType) {
    case "message":
      // Send a message to the user
      if (config.text) {
        const result = await sendTelegramMessage(
          context.botToken,
          context.telegramChatId,
          config.text,
          config.reply_markup,
        )

        if (result.ok) {
          // Store the outgoing message
          await supabase.from("messages").insert({
            conversation_id: context.conversationId,
            flow_execution_id: context.executionId,
            message_type: "outgoing",
            content: config.text,
            telegram_message_id: result.result?.message_id,
          })
        }
      }
      return { success: config.text ? true : false, nextNodeIds: config.nextNodeIds || [] }

    case "condition":
      // Evaluate condition
      const conditionMet = evaluateCondition(config, context)
      const nextIds = conditionMet ? config.trueNodeIds : config.falseNodeIds
      return { success: true, nextNodeIds: nextIds || [] }

    case "action":
      // Execute custom action (e.g., create user, update data)
      // This is extensible - add more action types as needed
      return { success: true, nextNodeIds: config.nextNodeIds || [] }

    case "delay":
      // Add delay before proceeding
      await new Promise((resolve) => setTimeout(resolve, config.delayMs || 1000))
      return { success: true, nextNodeIds: config.nextNodeIds || [] }

    default:
      console.error("[v0] Unknown node type:", nodeType)
      return { success: false, nextNodeIds: [] }
  }
}

/**
 * Evaluate conditional logic
 */
function evaluateCondition(config: any, context: FlowContext): boolean {
  if (!config.condition) return true

  switch (config.condition.type) {
    case "contains":
      return context.message.toLowerCase().includes(config.condition.value.toLowerCase())
    case "equals":
      return context.message.toLowerCase() === config.condition.value.toLowerCase()
    case "startsWith":
      return context.message.toLowerCase().startsWith(config.condition.value.toLowerCase())
    default:
      return true
  }
}

/**
 * Execute an entire flow
 */
export async function executeFlow(context: FlowContext): Promise<boolean> {
  const supabase = await createClient()

  try {
    // Get flow and nodes
    const { data: flowNodes, error: nodesError } = await supabase
      .from("flow_nodes")
      .select("*")
      .eq("flow_id", context.flowId)
      .order("created_at", { ascending: true })

    if (nodesError || !flowNodes) {
      throw new Error("Failed to fetch flow nodes")
    }

    // Get flow connections
    const { data: connections, error: connError } = await supabase
      .from("flow_connections")
      .select("*")
      .eq("flow_id", context.flowId)

    if (connError) {
      throw new Error("Failed to fetch flow connections")
    }

    // Start from trigger nodes (those without incoming connections)
    const triggerNodes = flowNodes.filter((node) => !connections?.some((conn) => conn.target_node_id === node.node_id))

    // BFS execution
    const queue: string[] = triggerNodes.map((n) => n.node_id)
    const visited = new Set<string>()

    while (queue.length > 0) {
      const nodeId = queue.shift()!

      if (visited.has(nodeId)) continue
      visited.add(nodeId)

      const node = flowNodes.find((n) => n.node_id === nodeId)
      if (!node) continue

      const result = await executeNode(context, node.node_id, node.node_type, node.config)

      if (result.success && result.nextNodeIds.length > 0) {
        queue.push(...result.nextNodeIds)
      } else if (!result.success) {
        // Handle failure - update execution status
        await supabase
          .from("flow_executions")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: `Node execution failed: ${nodeId}`,
          })
          .eq("id", context.executionId)

        return false
      }
    }

    // Mark execution as completed
    await supabase
      .from("flow_executions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", context.executionId)

    return true
  } catch (error) {
    console.error("[v0] Flow execution error:", error)

    // Update execution with error
    const supabase = await createClient()
    await supabase
      .from("flow_executions")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", context.executionId)

    return false
  }
}

/**
 * Find matching flows for a message trigger
 */
export async function findMatchingFlows(
  botId: string,
  message: string,
  triggerType: "message" | "command" = "message",
): Promise<Array<{ id: string; trigger_value: string }>> {
  const supabase = await createClient()

  const { data: flows, error } = await supabase
    .from("bot_flows")
    .select("id, trigger_value")
    .eq("bot_id", botId)
    .eq("trigger_type", triggerType)
    .eq("is_active", true)

  if (error) {
    console.error("[v0] Error finding flows:", error)
    return []
  }

  return (
    flows?.filter((flow) => {
      if (triggerType === "command") {
        return message.startsWith("/" + flow.trigger_value)
      } else {
        return message.toLowerCase().includes(flow.trigger_value.toLowerCase())
      }
    }) || []
  )
}
