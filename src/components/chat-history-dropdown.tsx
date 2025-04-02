"use client"

import { Button } from "@/components/ui/button"
import { Brain, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "thinking" | "system"
  timestamp: Date
  reasoningSteps?: any[]
  isLoading?: boolean
}

interface ChatHistoryDropdownProps {
  messages: Message[]
  onSelectMessage: (messageId: string) => void
  onShowReasoning: (messageId: string) => void
}

export function ChatHistoryDropdown({ messages, onSelectMessage, onShowReasoning }: ChatHistoryDropdownProps) {
  // Filter out system messages and thinking messages
  const userMessages = messages.filter((msg) => msg.role === "user")
  const assistantMessages = messages.filter((msg) => msg.role === "assistant" && !msg.isLoading)

  if (messages.length <= 1) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Lịch sử chat</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userMessages.map((msg, index) => {
          const assistantResponse = assistantMessages[index]
          if (!assistantResponse) return null

          return (
            <div key={msg.id}>
              <DropdownMenuItem onClick={() => onSelectMessage(msg.id)}>
                <span className="truncate max-w-[200px]">{msg.content}</span>
              </DropdownMenuItem>
              {assistantResponse.reasoningSteps && (
                <DropdownMenuItem onClick={() => onShowReasoning(assistantResponse.id)}>
                  <Brain className="h-4 w-4 mr-2" />
                  <span className="text-xs">Xem quá trình suy luận</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

