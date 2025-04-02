import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Get the last user message
    const lastUserMessage = messages.filter((msg: any) => msg.role === "user").pop()

    if (!lastUserMessage) {
      return NextResponse.json({ error: "No user message found" }, { status: 400 })
    }

    // Process the message with AI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `You are a Vietnamese nutrition and meal planning assistant. 
      Respond to the following user message in Vietnamese:
      
      ${lastUserMessage.content}
      
      Keep your response friendly, helpful, and focused on healthy Vietnamese cuisine.`,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

