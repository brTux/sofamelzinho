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
    case "trigger":
      return { success: true, nextNodeIds: config.nextNodeIds || [] }

    case "textMessage":
      if (config.text) {
        const result = await sendTelegramMessage(
          context.botToken,
          context.telegramChatId,
          config.text,
          config.reply_markup,
        )

        if (result.ok) {
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

    case "image":
      if (config.imageUrl) {
        const result = await sendTelegramMessage(
          context.botToken,
          context.telegramChatId,
          config.caption || "",
          undefined,
          { type: "photo", media: config.imageUrl },
        )

        if (result.ok) {
          await supabase.from("messages").insert({
            conversation_id: context.conversationId,
            flow_execution_id: context.executionId,
            message_type: "outgoing",
            content: `[Image] ${config.caption || config.imageUrl}`,
            telegram_message_id: result.result?.message_id,
          })
        }
      }
      return { success: config.imageUrl ? true : false, nextNodeIds: config.nextNodeIds || [] }

    case "audio":
      if (config.audioUrl) {
        const result = await sendTelegramMessage(
          context.botToken,
          context.telegramChatId,
          config.caption || "",
          undefined,
          { type: "audio", media: config.audioUrl },
        )

        if (result.ok) {
          await supabase.from("messages").insert({
            conversation_id: context.conversationId,
            flow_execution_id: context.executionId,
            message_type: "outgoing",
            content: `[Audio] ${config.caption || config.audioUrl}`,
            telegram_message_id: result.result?.message_id,
          })
        }
      }
      return { success: config.audioUrl ? true : false, nextNodeIds: config.nextNodeIds || [] }

    case "video":
      if (config.videoUrl) {
        const result = await sendTelegramMessage(
          context.botToken,
          context.telegramChatId,
          config.caption || "",
          undefined,
          { type: "video", media: config.videoUrl },
        )

        if (result.ok) {
          await supabase.from("messages").insert({
            conversation_id: context.conversationId,
            flow_execution_id: context.executionId,
            message_type: "outgoing",
            content: `[Video] ${config.caption || config.videoUrl}`,
            telegram_message_id: result.result?.message_id,
          })
        }
      }
      return { success: config.videoUrl ? true : false, nextNodeIds: config.nextNodeIds || [] }

    case "dataCollection":
      // Send the question
      if (config.question) {
        const result = await sendTelegramMessage(context.botToken, context.telegramChatId, config.question)

        if (result.ok) {
          await supabase.from("messages").insert({
            conversation_id: context.conversationId,
            flow_execution_id: context.executionId,
            message_type: "outgoing",
            content: config.question,
            telegram_message_id: result.result?.message_id,
          })
        }
      }

      // Set timeout
      const timeoutMs = (config.timeoutMinutes || 5) * 60 * 1000
      const timeoutAt = new Date(Date.now() + timeoutMs).toISOString()

      await supabase
        .from("flow_executions")
        .update({
          current_node_id: nodeId,
          timeout_at: timeoutAt,
        })
        .eq("id", context.executionId)

      // Wait for response or timeout
      const responseReceived = await waitForResponse(context.conversationId, timeoutMs)

      if (responseReceived) {
        return { success: true, nextNodeIds: config.responseNodeIds || [] }
      } else {
        return { success: true, nextNodeIds: config.timeoutNodeIds || [] }
      }

    case "message":
      if (config.text) {
        const result = await sendTelegramMessage(
          context.botToken,
          context.telegramChatId,
          config.text,
          config.reply_markup,
        )

        if (result.ok) {
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
      const conditionMet = evaluateCondition(config, context)
      const nextIds = conditionMet ? config.trueNodeIds : config.falseNodeIds
      return { success: true, nextNodeIds: nextIds || [] }

    case "action":
      return { success: true, nextNodeIds: config.nextNodeIds || [] }

    case "delay":
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

/**
 * Wait for user response with timeout
 */
async function waitForResponse(conversationId: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now()

    const checkInterval = setInterval(async () => {
      const supabase = await createClient()

      const { data: recentMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("message_type", "incoming")
        .order("created_at", { ascending: false })
        .limit(1)

      if (recentMessages && recentMessages.length > 0) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, 1000)

    setTimeout(() => {
      clearInterval(checkInterval)
      resolve(false)
    }, timeoutMs + 1000)
  })
}
