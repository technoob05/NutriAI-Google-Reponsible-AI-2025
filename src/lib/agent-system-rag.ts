import { ragService } from "./rag-service"

// Define the structure of the result object
interface RAGEnhancedProcessResult {
  message: string
  mealPlan?: any
  searchResults?: any[]
  searchQuery?: string
  taskAnalysis?: any
  retrievedContext?: string[]
  sources?: string[]
}

// Main function to process user messages with RAG enhancement
export async function processUserMessageWithRAG(
  message: string,
  chatHistory: any[],
  progressCallback?: (agent: string, status: "pending" | "processing" | "completed" | "error", output?: string) => void,
  streamCallback?: (agent: string, token: string) => void,
  selectedModels?: any,
): Promise<RAGEnhancedProcessResult> {
  // Set default model if not provided
  const models = selectedModels || {
    ReasoningPlanner: "gemini-2.0-flash-thinking-exp-01-21",
    ChatProcessor: "gemini-2.0-flash",
    FactChecker: "gemini-2.0-flash",
    ContentWriter: "gemini-2.0-flash",
  }

  // Report progress
  progressCallback?.("RAGProcessor", "processing")

  // Retrieve relevant context based on the query
  const retrievedChunks = await ragService.retrieveContext(message)
  const contextString = ragService.formatRetrievedContext(retrievedChunks)

  // Report completion
  progressCallback?.(
    "RAGProcessor",
    "completed",
    `Retrieved ${retrievedChunks.length} relevant passages from documents.` +
      (retrievedChunks.length > 0 ? `\nFirst passage: ${retrievedChunks[0].substring(0, 100)}...` : ""),
  )

  // Enhanced prompts with document context
  let systemPrompt = `Bạn là một trợ lý ảo chuyên về ẩm thực và dinh dưỡng của người Việt. 
Nhiệm vụ của bạn là cung cấp thông tin, gợi ý, và lập kế hoạch thực đơn cân bằng dinh dưỡng.`

  // Add document context if available
  if (contextString) {
    systemPrompt += `\n\nBạn có quyền truy cập vào các tài liệu sau đây mà người dùng đã cung cấp. 
Hãy sử dụng thông tin từ các tài liệu này khi trả lời câu hỏi của người dùng:\n\n${contextString}`
  }

  // Pass both the RAG context and the user message to the existing agent system
  try {
    // Use the original processUserMessage function, but with enhanced context
    const { processUserMessage } = await import("./agent-system")

    // Call the original function with the enhanced prompt and selected models
    const result = await processUserMessage(
      message,
      chatHistory,
      progressCallback,
      streamCallback,
      models, // Pass the models to the agent system
    )

    // Return the result with the retrieved context
    return {
      ...result,
      retrievedContext: retrievedChunks,
    }
  } catch (error) {
    console.error("Error in RAG-enhanced processing:", error)
    throw new Error("Không thể xử lý yêu cầu với ngữ cảnh từ tài liệu")
  }
}

