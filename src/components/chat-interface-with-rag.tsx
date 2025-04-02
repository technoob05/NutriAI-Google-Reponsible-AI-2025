"use client"

// Add proper imports at the top
import type { Message, ChatSession, TaskAnalysis, OutputVersion, MealPlan } from "@/types/chat"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Send,
  User,
  Bot,
  Calendar,
  CalendarDays,
  Brain,
  PlusCircle,
  RefreshCw,
  ChevronDown,
  Clock,
  Trash,
  Download,
  Search,
  X,
  Menu,
  ThumbsDown,
  FileText,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MealPlan as MealPlanComponent } from "./meal-plan"
import { processUserMessageWithRAG } from "@/lib/agent-system-rag"
import { AgentReasoning } from "./agent-reasoning"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatHistoryDropdown } from "./chat-history-dropdown"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { WebSearchResults } from "@/components/web-search-results"
import { VoiceAssistantInput } from "@/components/voice-assistant-input"
import { UserPreferences } from "@/components/user-preferences"
import { DocumentUploader, type ProcessedDocument } from "@/components/document-uploader"
import { DocumentContext } from "@/components/document-context"
import { ragService } from "@/lib/rag-service"
import { TTSSettings } from "@/components/tts-settings"
import { ttsService } from "@/lib/tts-service"
import { ModelSettings } from "./model-settings"
import { ReasoningSummary } from "./reasoning-summary"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Logo } from './logo'
import { Switch } from "@/components/ui/switch"

const initialMessage: Message = {
  id: "1",
  content:
    "Xin chào! Tôi là trợ lý thực đơn sức khỏe. Bạn có thể tải lên tài liệu hoặc cung cấp URL để tôi có thêm thông tin, hoặc hỏi trực tiếp về thực đơn theo ngày hay tuần.",
  role: "assistant",
  timestamp: new Date(),
}

// Available models for each agent
const availableModels = {
  ReasoningPlanner: [
    {
      id: "google/flan-t5-base",
      name: "Flan T5 Base",
      description: "Mô hình nhẹ cho suy luận (Mặc định)",
      speed: "fast",
      quality: "medium"
    },
    {
      id: "Qwen/Qwen1.5-1.8B",
      name: "Qwen 1.8B",
      description: "Cân bằng tốc độ và chất lượng",
      speed: "fast",
      quality: "medium"
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini Flash Lite",
      description: "Nhanh và hiệu quả",
      speed: "fast",
      quality: "medium"
    },
    // For advanced reasoning if needed
    {
      id: "gemini-2.0-flash-thinking-exp-01-21", 
      name: "Gemini 2.0 Thinking",
      description: "Mạnh mẽ cho suy luận phức tạp",
      speed: "medium",
      quality: "high"
    }
  ],
  ChatProcessor: [
    {
      id: "Qwen/Qwen1.5-1.8B",
      name: "Qwen 1.8B", 
      description: "Nhẹ và nhanh cho chat (Mặc định)",
      speed: "fast",
      quality: "medium"
    },
    {
      id: "google/flan-t5-base",
      name: "Flan T5 Base",
      description: "Model nhẹ, đáng tin cậy",
      speed: "fast", 
      quality: "medium"
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini Flash Lite",
      description: "Cân bằng hiệu năng",
      speed: "fast",
      quality: "medium" 
    }
  ],
  FactChecker: [
    {
      id: "google/flan-t5-small",
      name: "Flan T5 Small",
      description: "Kiểm tra nhanh và nhẹ (Mặc định)",
      speed: "fast",
      quality: "medium"
    },
    {
      id: "Qwen/Qwen1.5-0.5B",
      name: "Qwen 0.5B",
      description: "Siêu nhẹ cho kiểm tra cơ bản",
      speed: "fast",
      quality: "medium"
    },
    {
      id: "google/flan-t5-base",
      name: "Flan T5 Base", 
      description: "Cân bằng tốc độ và độ chính xác",
      speed: "fast",
      quality: "medium"
    }
  ],
  ContentWriter: [
    {
      id: "google/flan-t5-base",
      name: "Flan T5 Base",
      description: "Soạn nội dung nhanh (Mặc định)",
      speed: "fast", 
      quality: "medium"
    },
    {
      id: "Qwen/Qwen1.5-1.8B",
      name: "Qwen 1.8B",
      description: "Cân bằng tốc độ và chất lượng",
      speed: "fast",
      quality: "medium"
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini Flash Lite",
      description: "Hiệu quả cho nội dung",
      speed: "fast",
      quality: "medium"
    }
  ]
}

export function ChatInterfaceWithRAG() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    if (typeof window === 'undefined') return []; // Return empty array during SSR
    
    // Load from localStorage only on client side
    try {
      const saved = localStorage.getItem("chatSessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastUpdatedAt: new Date(session.lastUpdatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      }
    } catch (e) {
      console.error("Failed to parse saved chat sessions:", e);
    }
    return [];
  })

  // RAG state
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [showDocumentsPanel, setShowDocumentsPanel] = useState(false)

  // Initialize documents from RAG service
  useEffect(() => {
    setDocuments(ragService.getDocuments())
    setActiveDocumentId(ragService.getActiveDocumentId())
  }, [])

  // Update RAG service when documents change
  const handleDocumentProcessed = (document: ProcessedDocument) => {
    ragService.addDocument(document)
    setDocuments(ragService.getDocuments())
  }

  // Handle selecting a document
  const handleSelectDocument = (documentId: string) => {
    ragService.setActiveDocument(documentId)
    setActiveDocumentId(documentId)
  }

  // Handle removing a document
  const handleRemoveDocument = (documentId: string) => {
    ragService.removeDocument(documentId)
    setDocuments(ragService.getDocuments())
    setActiveDocumentId(ragService.getActiveDocumentId())
  }

  const [activeChatId, setActiveChatId] = useState<string>(() => {
    if (typeof window === 'undefined') return ''; // Return empty string during SSR
    return chatSessions[0]?.id || Date.now().toString();
  })

  // Initialize with a new chat if none exists
  useEffect(() => {
    if (chatSessions.length === 0) {
      const newChat = createNewChat()
      setChatSessions([newChat])
      setActiveChatId(newChat.id)
    }

    // Check for dark mode preference
    if (typeof window !== "undefined") {
      const darkModePreference = localStorage.getItem("darkMode") === "true"
      setIsDarkMode(darkModePreference)
      if (darkModePreference) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [])

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem("chatSessions", JSON.stringify(chatSessions))
    }
  }, [chatSessions])

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("darkMode", "false")
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("darkMode", "true")
    }
  }

  // Get the active chat session
  const activeChat = chatSessions.find((chat) => chat.id === activeChatId) || chatSessions[0]

  // Messages from the active chat
  const messages = activeChat?.messages || [initialMessage]

  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [agentSteps, setAgentSteps] = useState<any[]>([])
  const [currentMealPlan, setCurrentMealPlan] = useState<any>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [currentThinking, setCurrentThinking] = useState<string>("")
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingTime, setThinkingTime] = useState(0)
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [streamingTokens, setStreamingTokens] = useState<{ agent: string; tokens: string[] }>({
    agent: "",
    tokens: [],
  })

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ChatSession[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Output versions for "Try Again" feature
  const [outputVersions, setOutputVersions] = useState<OutputVersion[]>([])
  const [showVersions, setShowVersions] = useState(false)

  // Save confirmation dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [chatToSave, setChatToSave] = useState<string | null>(null)

  // Selected models for each agent
  const [selectedModels, setSelectedModels] = useState({
    ReasoningPlanner: "gemini-2.0-flash-thinking-exp-01-21",
    ChatProcessor: "gemini-2.0-flash-thinking-exp-01-21",
    FactChecker: "gemini-2.0-flash-thinking-exp-01-21",
    ContentWriter: "gemini-2.0-flash-thinking-exp-01-21",
  })

  // Last user message for retry functionality
  const [lastUserMessage, setLastUserMessage] = useState<string>("")
  const [lastUserMessageId, setLastUserMessageId] = useState<string>("")

  // Set auto-scroll to off by default
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(false)

  // Thêm biến state để theo dõi tab hiện tại
  const [activeTab, setActiveTab] = useState<string>("chat")

  // Thêm vào sau phần khai báo state
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [currentAgent, setCurrentAgent] = useState<string>("")

  // Thêm state để lưu trữ lịch sử reasoning cho mỗi tin nhắn:
  const [messageReasoningHistory, setMessageReasoningHistory] = useState<Map<string, any[]>>(new Map())

  // Thêm state để theo dõi tin nhắn đang được xem reasoning:
  const [selectedMessageForReasoning, setSelectedMessageForReasoning] = useState<string | null>(null)

  // Thêm state để theo dõi trạng thái sidebar trên mobile:
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Add state for menu regeneration
  const [showMenuRegenerationPrompt, setShowMenuRegenerationPrompt] = useState(false)
  const [menuRegenerationReason, setMenuRegenerationReason] = useState("")

  // Thêm state cho user preferences
  const [userPreferences, setUserPreferences] = useState<any>(null)

  // First, add a new state to track if we should show the reasoning process in real-time
  const [showRealtimeReasoning, setShowRealtimeReasoning] = useState<boolean>(false)

  // Add this after the existing state declarations
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Add new state for toggles
  const [webSearchEnabled, setWebSearchEnabled] = useState(true)
  const [reasoningEnabled, setReasoningEnabled] = useState(true)

  // Function to create a new chat session
  const createNewChat = useCallback(() => {
    const timestamp = Date.now();
    return {
      id: timestamp.toString(),
      title: `Chat ${chatSessions.length + 1}`,
      messages: [{
        id: `init-${timestamp}`,
        content: initialMessage.content,
        role: "assistant",
        timestamp: new Date(timestamp)
      }],
      createdAt: new Date(timestamp),
      lastUpdatedAt: new Date(timestamp)
    };
  }, [chatSessions.length]);

  // Handle creating a new chat
  const handleNewChat = () => {
    // Check if current chat has messages and prompt to save
    if (messages.length > 1 && !chatSessions.some((chat) => chat.id === activeChatId)) {
      setChatToSave(activeChatId)
      setShowSaveDialog(true)
      return
    }

    createAndSwitchToNewChat()
  }

  // Create and switch to a new chat
  const createAndSwitchToNewChat = () => {
    const newChat = createNewChat()
    setChatSessions((prev) => [...prev, newChat])
    setActiveChatId(newChat.id)
    resetChatState()
  }

  // Reset chat state when switching chats
  const resetChatState = () => {
    setAgentSteps([])
    setCurrentMealPlan(null)
    setShowReasoning(false)
    setCurrentThinking("")
    setIsThinking(false)
    setThinkingTime(0)
    setStreamingTokens({ agent: "", tokens: [] })
    setInput("")
    setOutputVersions([])
    setShowVersions(false)
    setShowMenuRegenerationPrompt(false)
  }

  // Handle switching to a different chat
  const switchToChat = (chatId: string) => {
    setActiveChatId(chatId)
    resetChatState()
  }

  // Handle deleting a chat
  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent click event

    setChatSessions((prev) => prev.filter((chat) => chat.id !== chatId))

    // If we're deleting the active chat, switch to another one
    if (chatId === activeChatId) {
      const remainingChats = chatSessions.filter((chat) => chat.id !== chatId)
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[0].id)
      } else {
        // Create a new chat if we deleted the last one
        const newChat = createNewChat()
        setChatSessions([newChat])
        setActiveChatId(newChat.id)
      }
    }
  }

  // Update chat title based on first user message
  const updateChatTitle = (chatId: string, userMessage: string) => {
    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              // Use first 20 chars of user message as title, or keep existing title if it's not the default
              title:
                chat.title === `Chat ${chatSessions.findIndex((c) => c.id === chatId) + 1}`
                  ? userMessage.slice(0, 20) + (userMessage.length > 20 ? "..." : "")
                  : chat.title,
              lastUpdatedAt: new Date(),
            }
          : chat,
      ),
    )
  }

  // Update messages in a chat session
  const updateChatMessages = (chatId: string, newMessages: Message[]) => {
    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: newMessages,
              lastUpdatedAt: new Date(),
            }
          : chat,
      ),
    )
  }

  // Search through chat history
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const query = searchQuery.toLowerCase()

    const results = chatSessions.filter((chat) => {
      // Search in title
      if (chat.title.toLowerCase().includes(query)) return true

      // Search in messages
      return chat.messages.some((msg) => msg.content.toLowerCase().includes(query))
    })

    setSearchResults(results)
  }

  // Export chat history as JSON
  const exportChatHistory = (chatId: string) => {
    const chat = chatSessions.find((c) => c.id === chatId)
    if (!chat) return

    const dataStr = JSON.stringify(chat, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `chat-${chat.title.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Thay đổi hàm scrollToBottom để kiểm tra trạng thái autoScrollEnabled
  const scrollToBottom = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isThinking) {
      thinkingTimerRef.current = setInterval(() => {
        setThinkingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current)
        setThinkingTime(0)
      }
    }

    return () => {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current)
      }
    }
  }, [isThinking])

  // Thêm hàm để lưu lịch sử reasoning sau phần khai báo state:
  const saveReasoningHistory = (messageId: string, agentSteps: any[]) => {
    setMessageReasoningHistory((prev) => {
      const newMap = new Map(prev)
      newMap.set(messageId, [...agentSteps])
      return newMap
    })
  }

  // Thêm hàm để hiển thị reasoning cho một tin nhắn cụ thể:
  const showReasoningForMessage = (messageId: string) => {
    setSelectedMessageForReasoning(messageId)
    setShowReasoning(true)
  }

  // Handle meal regeneration
  const handleRegenerateMeal = (mealType: string, dayIndex: number, mealIndex: number) => {
    setMenuRegenerationReason(
      `Tôi muốn đổi món ${mealType === "breakfast" ? "sáng" : mealType === "lunch" ? "trưa" : "tối"} ${dayIndex > 0 ? `ngày ${dayIndex + 1}` : ""}`,
    )
    setShowMenuRegenerationPrompt(true)
  }

  // Handle meal like/dislike
  const handleMealFeedback = (
    isLike: boolean,
    mealType: string,
    dayIndex: number, 
    mealIndex: number,
    reason?: string,
  ) => {
    const meal = currentMealPlan?.days[dayIndex]?.meals[mealType][mealIndex]
    if (!meal) return

    let feedbackMessage = isLike ? `Tôi thích món ${meal.name}` : `Tôi không thích món ${meal.name}`

    if (reason) {
      switch (reason) {
        case "calories":
          feedbackMessage += ", tôi muốn món có ít calories hơn"
          break
        case "protein":
          feedbackMessage += ", tôi muốn món có nhiều protein hơn"
          break
        case "vegetarian":
          feedbackMessage += ", tôi muốn món chay thay thế"
          break
        case "spicy":
          feedbackMessage += ", tôi muốn món ít cay hơn"
          break
        default:
          feedbackMessage += ", có thể đổi món khác không?"
      }
    } else if (!isLike) {
      feedbackMessage += ", có thể đổi món khác không?"
    }

    setInput(feedbackMessage)
    if (!isLike) {
      setMenuRegenerationReason(feedbackMessage)
      setShowMenuRegenerationPrompt(true)
    } else {
      handleSend()
    }
  }

  // Function to speak assistant messages
  const speakMessage = (message: Message) => {
    if (message.role !== "assistant" || !ttsService.isEnabled()) return

    // Extract text content from the message
    let textToSpeak = message.content

    // Remove any markdown or special formatting
    textToSpeak = textToSpeak.replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    textToSpeak = textToSpeak.replace(/\*(.*?)\*/g, "$1") // Italic
    textToSpeak = textToSpeak.replace(/\[(.*?)\]$$.*?$$/g, "$1") // Links
    textToSpeak = textToSpeak.replace(/```[\s\S]*?```/g, "") // Code blocks

    // Speak the message
    ttsService.speak(textToSpeak)
  }

  // Handle TTS for new messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === "assistant" && !lastMessage.isLoading) {
      speakMessage(lastMessage)
    }
  }, [messages])

  // Thay đổi hàm handleSend để hiển thị trạng thái xử lý
  const handleSend = async () => {
    if (input.trim() === "") return

    // Lưu lại tab hiện tại trước khi xử lý
    const currentActiveTab = activeTab

    // Sửa đổi phần handleSend để tạm thời tắt tự động cuộn khi đang generate
    const prevAutoScrollState = autoScrollEnabled
    if (isThinking) {
      setAutoScrollEnabled(false)
    }

    // Đặt trạng thái đang xử lý
    setIsProcessing(true)
    setProcessingStatus("Đang chuẩn bị xử lý yêu cầu...")

    const userMessageId = Date.now().toString()
    const userMessage: Message = {
      id: userMessageId,
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    // Save the user message for retry functionality
    setLastUserMessage(input)
    setLastUserMessageId(userMessageId)

    // IMMEDIATELY display the user message in the UI
    const updatedMessages = [...messages, userMessage]
    updateChatMessages(activeChatId, updatedMessages)

    // Add a loading message to indicate processing
    const loadingMessageId = `loading-${Date.now()}`
    const loadingMessage: Message = {
      id: loadingMessageId,
      content: "Đang xử lý...",
      role: "assistant",
      timestamp: new Date(),
      isLoading: true,
    }

    // Update messages with the loading indicator
    updateChatMessages(activeChatId, [...updatedMessages, loadingMessage])

    // Update chat title if this is the first user message
    if (messages.length === 1) {
      updateChatTitle(activeChatId, input)
    }

    setInput("")
    setIsLoading(true)
    setIsThinking(true)
    setStreamingTokens({ agent: "", tokens: [] })
    setOutputVersions([]) // Reset output versions for new message
    setShowMenuRegenerationPrompt(false)

    // Determine if this is an initial request or a follow-up
    const isInitialRequest =
      messages.length <= 2 || input.toLowerCase().includes("theo ngày") || input.toLowerCase().includes("theo tuần")

    // Reset agent steps based on request type
    if (isInitialRequest) {
      setAgentSteps([
        { agent: "RAGProcessor", status: "pending" },
        { agent: "FactChecker", status: "pending" },
        { agent: "ReasoningPlanner", status: "pending" },
        { agent: "ContentWriter", status: "pending" },
        { agent: "UXUIDesigner", status: "pending" },
      ])
    } else {
      setAgentSteps([
        { agent: "RAGProcessor", status: "pending" },
        { agent: "ManagementAgent", status: "pending" },
        { agent: "ChatProcessor", status: "pending" },
        { agent: "UXUIDesigner", status: "pending" },
      ])
    }

    // Add initial thinking message
    const initialThinking = isInitialRequest
      ? `Đang phân tích yêu cầu "${input}"...

Tôi sẽ xác định xem đây là yêu cầu về thực đơn theo ngày hay theo tuần.
Sau đó tôi sẽ kiểm tra thông tin từ tài liệu người dùng, thông tin về các món ăn, và lập kế hoạch thực đơn phù hợp.`
      : `Đang phân tích tin nhắn "${input}"...

Tôi sẽ xác định loại yêu cầu này: câu hỏi về thông tin, yêu cầu thay đổi món, hay phản hồi khác.
Dựa vào đó, tôi sẽ cung cấp thông tin phù hợp hoặc điều chỉnh thực đơn theo yêu cầu.
Tôi sẽ tham khảo thông tin từ các tài liệu người dùng đã cung cấp nếu có.`

    setCurrentThinking(initialThinking)

    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      content: initialThinking,
      role: "thinking",
      timestamp: new Date(),
      streamingTokens: [],
    }

    // Add thinking message to the current chat session
    const messagesWithThinking = [...updatedMessages.filter((m) => m.id !== loadingMessageId), thinkingMessage]
    updateChatMessages(activeChatId, messagesWithThinking)

    // Add this to the handleSend function before the API call
    if (
      input.toLowerCase().includes("tìm") ||
      input.toLowerCase().includes("thông tin") ||
      input.toLowerCase().includes("chi tiết")
    ) {
      setIsSearching(true)
      setSearchQuery(input)

      // Simulate search ending after response
      setTimeout(() => {
        setIsSearching(false)
      }, 8000)
    }

    // Check if this is a menu adjustment request
    const isMenuAdjustment =
      input.toLowerCase().includes("không thích") ||
      input.toLowerCase().includes("đổi món") ||
      input.toLowerCase().includes("thay thế")

    try {
      // Handle streaming tokens from AI models
      const handleStreamToken = (agent: string, token: string) => {
        setCurrentAgent(agent)
        setProcessingStatus(`Đang xử lý với ${getModelDisplayName(agent)}...`)

        setStreamingTokens((prev) => {
          const newTokens = [...prev.tokens, token]

          // Update the thinking message with streaming tokens
          updateChatMessages(
            activeChatId,
            messagesWithThinking.map((msg) => (msg.role === "thinking" ? { ...msg, streamingTokens: newTokens } : msg)),
          )

          return {
            agent,
            tokens: newTokens,
          }
        })
      }

      // Process with agent pipeline and track progress using the RAG-enhanced system
      const response = await processUserMessageWithRAG(
        input,
        messages.filter((m) => m.role !== "thinking"),
        (agent, status, output) => {
          // Only show reasoning if enabled
          if (!reasoningEnabled && status === "processing") return;
          setCurrentAgent(agent)

          if (status === "processing") {
            setProcessingStatus(`${agent} đang xử lý...`)
          } else if (status === "completed") {
            setProcessingStatus(`${agent} đã hoàn thành xử lý`)
          } else if (status === "error") {
            setProcessingStatus(`${agent} gặp lỗi, đang thử lại với mô hình khác...`)
          }

          setAgentSteps((prev) =>
            prev.map((step) =>
              step.agent === agent
                ? {
                    ...step,
                    status,
                    output,
                    ...(status === "processing" ? { startTime: new Date() } : {}),
                    ...(status === "completed" || status === "error" ? { endTime: new Date() } : {}),
                  }
                : step,
            ),
          )

          // Update thinking message based on agent progress
          if (status === "processing") {
            let newThinking = ""

            if (agent === "RAGProcessor") {
              newThinking = `Đang truy xuất ngữ cảnh từ tài liệu...
          
Tôi đang tìm kiếm thông tin liên quan từ các tài liệu người dùng đã cung cấp.
Điều này giúp tôi đưa ra câu trả lời chính xác và phù hợp hơn với ngữ cảnh.`
            } else if (agent === "FactChecker") {
              newThinking = `Đang kiểm tra thông tin về các món ăn...
          
Tôi đang xác minh thông tin dinh dưỡng và nguyên liệu của các món ăn để đảm bảo tính chính xác.
Điều này giúp đảm bảo thực đơn của bạn có thông tin đáng tin cậy.`
            } else if (agent === "ReasoningPlanner") {
              newThinking = `Đang lập kế hoạch thực đơn với ${getModelDisplayName("ReasoningPlanner")}...
          
Tôi đang phân tích các món ăn để tạo một thực đơn cân bằng dinh dưỡng.
Tôi cân nhắc sự đa dạng của các món, giá trị dinh dưỡng, và sự phù hợp với yêu cầu của bạn.`
            } else if (agent === "ContentWriter") {
              newThinking = `Đang soạn thảo phản hồi...
          
Tôi đang tổng hợp thông tin và chuẩn bị phản hồi cho bạn.
Tôi sẽ giải thích về thực đơn và cung cấp thông tin hữu ích về các món ăn.`
            } else if (agent === "ChatProcessor") {
              newThinking = `Đang xử lý yêu cầu chat với ${getModelDisplayName("ChatProcessor")}...
          
Tôi đang phân tích yêu cầu của bạn để đưa ra phản hồi phù hợp.
${
  input.toLowerCase().includes("đổi") ||
  input.toLowerCase().includes("thay") ||
  input.toLowerCase().includes("không thích")
    ? "Tôi nhận thấy bạn muốn thay đổi món ăn. Tôi sẽ đề xuất các món thay thế phù hợp."
    : "Tôi sẽ cung cấp thông tin chi tiết về các món ăn hoặc trả lời câu hỏi của bạn."
}`
            } else if (agent === "ManagementAgent") {
              newThinking = `Đang phân tích yêu cầu và phân công nhiệm vụ...
            
Tôi đang xác định loại yêu cầu của bạn để chuyển đến agent phù hợp.
Điều này giúp tôi đưa ra phản hồi chính xác và hiệu quả nhất.`
            } else if (agent === "SearchAgent") {
              newThinking = `Đang tìm kiếm thông tin về món ăn...
            
Tôi đang tìm kiếm thông tin chi tiết về món ăn theo yêu cầu của bạn.
Điều này giúp tôi cung cấp thông tin đầy đủ và chính xác nhất.`
            }

            if (newThinking) {
              setCurrentThinking(newThinking)
              updateChatMessages(activeChatId, [
                ...updatedMessages.filter((m) => m.id !== loadingMessageId),
                { ...thinkingMessage, content: newThinking },
              ])
            }
          }

          // Add output to thinking when completed
          if (status === "completed" && output) {
            const currentContent = currentThinking
            const newContent = `${currentContent}\n\n${
              agent === "RAGProcessor"
                ? "Kết quả từ tài liệu:"
                : agent === "FactChecker"
                  ? "Kết quả kiểm tra:"
                  : agent === "ReasoningPlanner"
                    ? "Kế hoạch thực đơn:"
                    : agent === "ContentWriter"
                      ? "Nội dung phản hồi:"
                      : agent === "ChatProcessor"
                        ? "Phân tích yêu cầu:"
                        : agent === "ManagementAgent"
                          ? "Phân tích nhiệm vụ:"
                          : agent === "SearchAgent"
                            ? "Kết quả tìm kiếm:"
                            : ""
            }
                                            
${output.slice(0, 300)}${output.length > 300 ? "..." : ""}`

            setCurrentThinking(newContent)
            updateChatMessages(activeChatId, [
              ...updatedMessages.filter((m) => m.id !== loadingMessageId),
              { ...thinkingMessage, content: newContent },
            ])
          }
        },
        (agent, token) => {
          // Only show reasoning tokens if enabled
          if (!reasoningEnabled) return;
          handleStreamToken(agent, token);
        },
        selectedModels, // Pass selected models to the agent system
        {
          webSearchEnabled,
          realtimeReasoningEnabled: reasoningEnabled
        }
      )

      // Remove thinking message
      const messagesWithoutThinking = messages.filter((msg) => msg.role !== "thinking")

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        role: "assistant",
        timestamp: new Date(),
        mealPlan: response.mealPlan,
        searchResults: response.searchResults,
        searchQuery: response.searchQuery,
        taskAnalysis: response.taskAnalysis,
        reasoningSteps: agentSteps,
        retrievedContext: response.retrievedContext,
      }

      // If this was a menu adjustment request and we have a meal plan, update the UI to show it's personalized
      if (isMenuAdjustment && response.mealPlan && response.mealPlan.days) {
        // Add personalization flag to the meal plan
        response.mealPlan.isPersonalized = true
        response.mealPlan.personalizationReason = input

        // Update the assistant message to highlight the personalization
        const personalizedMessage = `${response.message}\n\n*Thực đơn đã được điều chỉnh theo yêu cầu của bạn.*`

        // Update the assistant message
        assistantMessage.content = personalizedMessage
      }

      // Update messages in the current chat session
      updateChatMessages(activeChatId, [...messagesWithoutThinking, userMessage, assistantMessage])

      // Add to output versions
      const newVersion: OutputVersion = {
        id: Date.now().toString(),
        content: response.message,
        timestamp: new Date(),
        model: isInitialRequest ? selectedModels.ReasoningPlanner : selectedModels.ChatProcessor,
        mealPlan: response.mealPlan,
      }

      setOutputVersions([newVersion])

      // Update current meal plan if provided
      if (response.mealPlan && response.mealPlan.days) {
        setCurrentMealPlan(response.mealPlan)
      }

      // Khôi phục tab hiện tại
      setActiveTab(currentActiveTab)
    } catch (error) {
      console.error("Error processing message:", error)

      // Remove thinking message and add error message
      const messagesWithoutThinking = messages.filter((msg) => msg.role !== "thinking" && msg.id !== loadingMessageId)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.",
        role: "assistant",
        timestamp: new Date(),
      }

      // Update messages in the current chat session
      updateChatMessages(activeChatId, [...messagesWithoutThinking, userMessage, errorMessage])

      // Khôi phục tab hiện tại
      setActiveTab(currentActiveTab)
    } finally {
      // Lưu lịch sử reasoning cho tin nhắn hiện tại
      const assistantMessageId = (Date.now() + 1).toString()
      saveReasoningHistory(assistantMessageId, agentSteps)

      setIsLoading(false)
      setIsThinking(false)
      setStreamingTokens({ agent: "", tokens: [] })
      // Khôi phục trạng thái tự động cuộn
      setAutoScrollEnabled(prevAutoScrollState)
      // Đặt lại trạng thái xử lý
      setIsProcessing(false)
      setProcessingStatus("")
      setCurrentAgent("")
    }
  }

  // Function to retry the last message
  const handleRetry = async () => {
    if (!lastUserMessage) return

    // Remove the last assistant message
    const messagesWithoutLastAssistant = [...messages]
    if (messagesWithoutLastAssistant[messagesWithoutLastAssistant.length - 1].role === "assistant") {
      messagesWithoutLastAssistant.pop()
    }

    updateChatMessages(activeChatId, messagesWithoutLastAssistant)

    // Set the input to the last user message and send it
    setInput(lastUserMessage)
    setTimeout(() => {
      handleSend()
    }, 100)
  }

  // Function to try again with a different model
  const handleTryAgainWithModel = async (modelType: string, modelId: string) => {
    if (!lastUserMessage) return

    // Temporarily change the model
    const originalModel = selectedModels[modelType as keyof typeof selectedModels]
    setSelectedModels((prev) => ({
      ...prev,
      [modelType]: modelId,
    }))

    // Remove the last assistant message
    const messagesWithoutLastAssistant = [...messages]
    if (messagesWithoutLastAssistant[messagesWithoutLastAssistant.length - 1].role === "assistant") {
      messagesWithoutLastAssistant.pop()
    }

    updateChatMessages(activeChatId, messagesWithoutLastAssistant)

    // Set the input to the last user message and send it
    setInput(lastUserMessage)

    // Process the message
    setTimeout(async () => {
      await handleSend()

      // Restore the original model
      setSelectedModels((prev) => ({
        ...prev,
        [modelType]: originalModel,
      }))
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleOptionClick = (option: string) => {
    setInput(option)
    handleSend()
  }

  // Helper function to get display name for a model
  const getModelDisplayName = (agent: string) => {
    const modelId = selectedModels[agent as keyof typeof selectedModels]
    const agentModels = availableModels[agent as keyof typeof availableModels]
    const model = agentModels?.find((m) => m.id === modelId)
    return model?.name || modelId
  }

  // Handle model selection change
  const handleModelChange = (agent: string, modelId: string) => {
    setSelectedModels((prev) => ({
      ...prev,
      [agent]: modelId,
    }))
  }

  // Handle chat title edit
  const handleChatTitleEdit = (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return

    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title: newTitle,
              lastUpdatedAt: new Date(),
            }
          : chat,
      ),
    )
  }

  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth" })
      // Highlight message briefly
      messageElement.classList.add("bg-primary/10")
      setTimeout(() => {
        messageElement.classList.remove("bg-primary/10")
      }, 2000)
    }
  }

  // Thêm useEffect để kiểm tra kích thước màn hình:
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Add this helper function after the imports
  const groupChatsByDate = useCallback((chats: ChatSession[]) => {
    const groups: { [key: string]: ChatSession[] } = {};
    
    chats.forEach(chat => {
      // Use ISO string for consistent date formatting
      const date = new Date(chat.lastUpdatedAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(chat);
    });

    return groups;
  }, []);

  return (
    <div
      className={cn(
        "flex h-[650px] border rounded-lg overflow-hidden bg-background chat-container",
        isDarkMode ? "dark" : "",
      )}
    >
      {/* Sidebar with chat history */}
      <div className={cn("w-64 border-r flex flex-col bg-muted/30 h-full chat-sidebar", 
        isSidebarOpen ? "open" : "",
        sidebarCollapsed ? "collapsed" : ""
      )}>
        {/* Add sidebar toggle button for desktop */}
        <button 
          className="sidebar-toggle desktop"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", 
            sidebarCollapsed ? "rotate-180" : ""
          )} />
        </button>

        <div className="sticky top-0 z-10 p-3 border-b bg-background">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <Logo size="sm" className="flex-shrink-0" />
              <Button onClick={handleNewChat} variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Chat mới
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm chat..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <TTSSettings />
              <UserPreferences onPreferencesChange={setUserPreferences} />
              <ChatHistoryDropdown
                messages={messages}
                onSelectMessage={scrollToMessage}
                onShowReasoning={showReasoningForMessage}
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 chat-history-scroll overflow-y-auto">
          <div className="p-2 text-sm font-medium text-muted-foreground sticky top-0 bg-background z-20 border-b">
            Lịch sử chat
          </div>
          
          {Object.entries(groupChatsByDate(isSearching ? searchResults : chatSessions))
            .sort(([dateA], [dateB]) => 
              new Date(dateB).getTime() - new Date(dateA).getTime()
            )
            .map(([date, chats]) => (
              <div key={date} className="chat-history-group">
                <div className="chat-history-date">
                  {date}
                </div>
                <div className="space-y-1 px-1">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "chat-history-item flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-muted/50 text-sm group",
                        chat.id === activeChatId && "bg-muted"
                      )}
                      onClick={() => switchToChat(chat.id)}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{chat.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(chat.lastUpdatedAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  exportChatHistory(chat.id)
                                }}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Tải xuống</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={(e) => deleteChat(chat.id, e)}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Xóa</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {isSearching && searchResults.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              Không tìm thấy kết quả
            </div>
          )}
        </ScrollArea>

        {/* Document button */}
        <div className="p-3 border-t">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={() => setShowDocumentsPanel(!showDocumentsPanel)}
          >
            <FileText className="h-4 w-4" />
            <span>Quản lý tài liệu</span>
          </Button>
        </div>

        {/* Model settings */}
        <div className="p-3 border-t">
          <ModelSettings
            selectedModels={selectedModels}
            onModelChange={handleModelChange}
            autoScrollEnabled={autoScrollEnabled}
            onAutoScrollChange={setAutoScrollEnabled}
            isDarkMode={isDarkMode}
            onDarkModeChange={toggleDarkMode}
            showRealtimeReasoning={showRealtimeReasoning}
            onRealtimeReasoningChange={setShowRealtimeReasoning}
          />
        </div>
      </div>

      {/* Toggle sidebar button for mobile */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 left-4 z-50 md:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      )}

      {/* Main chat area */}
      <div className={cn("flex-1 flex flex-col relative overflow-hidden",
        sidebarCollapsed ? "expanded" : ""
      )}>
        {/* Document panel - shown when showDocumentsPanel is true */}
        {showDocumentsPanel && (
          <div className="bg-background/80 backdrop-blur-md border-b p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Quản lý tài liệu</h3>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowDocumentsPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <DocumentUploader onDocumentProcessed={handleDocumentProcessed} />

            <div className="mt-4">
              <DocumentContext
                documents={documents}
                activeDocumentId={activeDocumentId}
                onSelectDocument={handleSelectDocument}
                onRemoveDocument={handleRemoveDocument}
              />
            </div>
          </div>
        )}

        <Tabs defaultValue="chat" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 sticky top-0 z-30">
            <TabsTrigger value="chat" onClick={() => setActiveTab("chat")}>
              Chat
            </TabsTrigger>
            <TabsTrigger value="history" onClick={() => setActiveTab("history")}>
              Chi tiết
            </TabsTrigger>
          </TabsList>

          <div className="sticky top-12 right-4 z-30 flex justify-end p-2">
            <Button
              variant={showRealtimeReasoning ? "default" : "outline"}
              size="sm"
              className="gap-1 bg-primary/10 border-primary/20 hover:bg-primary/20"
              onClick={() => setShowRealtimeReasoning(!showRealtimeReasoning)}
            >
              <Brain className="h-4 w-4" />
              {showRealtimeReasoning ? "Ẩn quá trình suy luận" : "Xem quá trình suy luận"}
            </Button>
          </div>

          <TabsContent value="chat" className="flex flex-col h-full overflow-hidden">
            {isProcessing && (
              <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm p-2 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span className="text-sm font-medium">{processingStatus}</span>
                </div>
                {currentAgent && (
                  <span className="text-xs text-muted-foreground">
                    Đang sử dụng: {getModelDisplayName(currentAgent)}
                  </span>
                )}
              </div>
            )}

            {/* Menu regeneration prompt */}
            {showMenuRegenerationPrompt && (
              <Alert className="m-4 bg-primary/10 border-primary">
                <ThumbsDown className="h-4 w-4 text-primary" />
                <AlertTitle>Bạn muốn thay đổi món ăn?</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p>{menuRegenerationReason}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setInput(menuRegenerationReason)
                        handleSend()
                      }}
                    >
                      Tạo lại thực đơn
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowMenuRegenerationPrompt(false)}>
                      Hủy
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Add this before the messages mapping in the chat area */}
            {isSearching && <WebSearchResults query={searchQuery} isSearching={isSearching} />}

            {showRealtimeReasoning && isThinking && (
              <Card className="mb-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      Quá trình suy luận (thời gian: {thinkingTime}s)
                    </span>
                  </div>
                  <div className="space-y-3">
                    {agentSteps.map((step, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-2 rounded-md text-sm",
                          step.status === "completed"
                            ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900"
                            : step.status === "error"
                              ? "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900"
                              : step.status === "processing"
                                ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 animate-pulse"
                                : "bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full",
                                step.status === "completed"
                                  ? "bg-green-500"
                                  : step.status === "error"
                                    ? "bg-red-500"
                                    : step.status === "processing"
                                      ? "bg-blue-500 animate-pulse"
                                      : "bg-gray-400",
                              )}
                            />
                            <span className="font-medium">{step.agent}</span>
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">{step.status || "pending"}</span>
                        </div>
                        {step.output && (
                          <div className="mt-2 text-xs whitespace-pre-wrap">
                            {step.output.length > 150 ? `${step.output.substring(0, 150)}...` : step.output}
                          </div>
                        )}
                      </div>
                    ))}
                    {streamingTokens.tokens.length > 0 && (
                      <div className="p-2 rounded-md text-sm bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="font-medium">{streamingTokens.agent || "AI"}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Đang xử lý...</span>
                        </div>
                        <div className="mt-2 text-xs whitespace-pre-wrap">{streamingTokens.tokens.join("")}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
              {/* Tin nhắn */}
              {messages.map((message: Message, index: number) => (
                <div
                  key={message.id}
                  id={`message-${message.id}`}
                  className={cn(
                    "flex items-start gap-3 transition-all duration-300",
                    message.role === "user"
                      ? "ml-auto max-w-[80%]"
                      : message.role === "thinking"
                        ? "max-w-[90%]"
                        : "max-w-[80%]",
                    message.id === lastUserMessageId || message.id === (Date.now() + 1).toString()
                      ? "animate-in fade-in-50 slide-in-from-bottom-5"
                      : "",
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8">
                      <Bot className="h-5 w-5" />
                    </Avatar>
                  )}

                  {message.role === "thinking" && (
                    <Avatar className="h-8 w-8 bg-blue-100">
                      <Brain className="h-5 w-5 text-blue-500" />
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "rounded-lg p-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.role === "thinking"
                          ? "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
                          : message.isLoading
                            ? "bg-muted/70 animate-pulse"
                            : "bg-muted",
                    )}
                  >
                    {message.role === "thinking" && (
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-blue-600 dark:text-blue-300">
                        <Brain className="h-4 w-4" />
                        <span>AI đang suy nghĩ trong {thinkingTime} giây</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">
                      {message.content}
                      {message.role === "thinking" && message.streamingTokens && message.streamingTokens.length > 0 && (
                        <div className="mt-4 border-t border-blue-200 dark:border-blue-800 pt-3">
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                            AI đang suy luận:
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{message.streamingTokens.join("")}</div>
                        </div>
                      )}
                    </div>

                    {/* Show retrieved context if available */}
                    {message.retrievedContext && message.retrievedContext.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
                          <FileText className="h-3 w-3" />
                          <span>Thông tin từ tài liệu:</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-2">
                          {message.retrievedContext.map((context: string, idx: number) => (
                            <div key={idx} className="border-l-2 border-primary/20 pl-2">
                              {context.length > 200 ? context.substring(0, 200) + "..." : context}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.mealPlan && (
                      <div className="mt-4">
                        <MealPlanComponent
                          plan={message.mealPlan}
                          onRegenerateMeal={handleRegenerateMeal}
                          onLikeMeal={(mealType: string, dayIndex: number, mealIndex: number) =>
                            handleMealFeedback(true, mealType, dayIndex, mealIndex)
                          }
                          onDislikeMeal={(mealType: string, dayIndex: number, mealIndex: number) =>
                            handleMealFeedback(false, mealType, dayIndex, mealIndex)
                          }
                          isPersonalized={message.mealPlan.isPersonalized}
                          personalizationReason={message.mealPlan.personalizationReason}
                        />
                      </div>
                    )}

                    {message.searchResults && (
                      <div className="mt-4 border-t pt-3">
                        <h3 className="text-sm font-medium mb-2">Kết quả tìm kiếm cho "{message.searchQuery}"</h3>
                        <div className="space-y-3">
                          {message.searchResults.map((result: any, index: number) => (
                            <div key={index} className="border rounded-md p-3 bg-muted/30">
                              <h4 className="font-medium">{result.name}</h4>
                              <div className="mt-2 space-y-2 text-sm">
                                {result.details.additionalInfo && <p>{result.details.additionalInfo}</p>}
                                {result.details.healthBenefits && (
                                  <div>
                                    <p className="font-medium">Lợi ích sức khỏe:</p>
                                    <ul className="list-disc pl-5">
                                      {result.details.healthBenefits.map((benefit: string, i: number) => (
                                        <li key={i}>{benefit}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {result.details.cookingTips && (
                                  <div>
                                    <p className="font-medium">Mẹo nấu ăn:</p>
                                    <ul className="list-disc pl-5">
                                      {result.details.cookingTips.map((tip: string, i: number) => (
                                        <li key={i}>{tip}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.taskAnalysis?.requiresConfirmation && (
                      <div className="mt-3 border-t pt-3">
                        <p className="text-sm font-medium">{message.taskAnalysis.suggestedResponse}</p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleOptionClick(`Có, tôi muốn thêm món liên quan đến ${message.taskAnalysis?.foodType || ""}`)
                            }
                          >
                            Có
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleOptionClick("Không, cảm ơn")}>
                            Không
                          </Button>
                        </div>
                      </div>
                    )}

                    {message.role === "assistant" && messages.length === 1 && (
                      <div className="mt-4 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => handleOptionClick("Thực đơn theo ngày")}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Thực đơn theo ngày
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => handleOptionClick("Thực đơn theo tuần")}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Thực đơn theo tuần
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => setShowDocumentsPanel(true)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Quản lý tài liệu
                        </Button>
                      </div>
                    )}

                    {message.role === "assistant" && message.id !== "1" && !message.isLoading && (
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => showReasoningForMessage(message.id)}
                        >
                          <Brain className="h-3 w-3 mr-1" />
                          Xem quá trình suy luận
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setShowVersions(!showVersions)}
                        >
                          {showVersions ? "Ẩn phiên bản" : "Xem phiên bản"}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Thử lại
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thử lại với model khác</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {availableModels.ReasoningPlanner.map((model) => (
                              <DropdownMenuItem
                                key={model.id}
                                onClick={() => handleTryAgainWithModel("ReasoningPlanner", model.id)}
                              >
                                {model.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  {message.role === "assistant" && message.reasoningSteps && message.reasoningSteps.length > 0 && (
                    <ReasoningSummary
                      steps={message.reasoningSteps}
                      onShowFullReasoning={() => showReasoningForMessage(message.id)}
                    />
                  )}

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8">
                      <User className="h-5 w-5" />
                    </Avatar>
                  )}
                </div>
              ))}

              {/* Output versions */}
              {showVersions && outputVersions.length > 0 && (
                <div className="border rounded-lg p-3 bg-muted/30">
                  <h3 className="text-sm font-medium mb-2">Phiên bản trả lời ({outputVersions.length})</h3>
                  <div className="space-y-3">
                    {outputVersions.map((version, index) => (
                      <div key={version.id} className="border rounded-lg p-2 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Phiên bản {index + 1}</span>
                          <span className="text-xs text-muted-foreground">Model: {version.model}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{version.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
            <div className="sticky bottom-4 right-4 flex justify-end">
              {!autoScrollEnabled && messages.length > 3 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full shadow-md"
                  onClick={() => {
                    setAutoScrollEnabled(true)
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
                  }}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Cuộn xuống
                </Button>
              )}
            </div>
            <AgentReasoning
              agentSteps={
                selectedMessageForReasoning && messageReasoningHistory.has(selectedMessageForReasoning)
                  ? messageReasoningHistory.get(selectedMessageForReasoning) || []
                  : agentSteps
              }
              isVisible={showReasoning}
              onToggle={() => {
                setShowReasoning(!showReasoning)
                setSelectedMessageForReasoning(null)
              }}
              messageId={selectedMessageForReasoning}
            />
            <Card className="sticky bottom-0 p-4 border-t rounded-none bg-background z-10">
              <div className="flex gap-2 items-center">
                {/* Add Feature Toggles */}
                <div className="flex items-center gap-3 px-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Switch
                            checked={webSearchEnabled}
                            onCheckedChange={setWebSearchEnabled}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Tìm kiếm web {webSearchEnabled ? 'bật' : 'tắt'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-muted-foreground" />
                          <Switch
                            checked={reasoningEnabled}
                            onCheckedChange={setReasoningEnabled}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Quá trình suy luận {reasoningEnabled ? 'bật' : 'tắt'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Input
                  ref={inputRef}
                  placeholder="Nhập tin nhắn hoặc đặt câu hỏi về thực đơn..."
                  defaultValue=""
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const value = inputRef.current?.value || '';
                      setInput(value);
                      handleSend();
                      if (inputRef.current) {
                        inputRef.current.value = '';
                      }
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1"
                />

                <VoiceAssistantInput
                  onTranscription={(text) => {
                    setInput(text)
                    setTimeout(() => handleSend(), 500)
                  }}
                  isProcessing={isProcessing}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" disabled={isLoading}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowDocumentsPanel(true)} disabled={isLoading}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Quản lý tài liệu</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRetry} disabled={!lastUserMessage || isLoading}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      <span>Thử lại</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNewChat} disabled={isLoading}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>Chat mới</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={handleSend} disabled={isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {messages.length > 2 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Gợi ý: Bạn có thể hỏi thông tin về món ăn, tải lên tài liệu, hoặc yêu cầu "Tôi không thích món này,
                  đổi món khác được không?"
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="history" className="h-full overflow-y-auto p-4">
            <h3 className="text-lg font-medium mb-4">Chi tiết cuộc trò chuyện</h3>
            <div className="space-y-4">
              {messages.length > 1 ? (
                messages
                  .filter((msg) => msg.role !== "thinking" && !msg.isLoading)
                  .map((message, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </Avatar>
                        <span className="text-sm font-medium">{message.role === "user" ? "Bạn" : "Trợ lý"}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      {message.reasoningSteps && message.reasoningSteps.length > 0 && message.role === "assistant" && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => showReasoningForMessage(message.id)}
                          >
                            <Brain className="h-3 w-3 mr-1" />
                            Xem quá trình suy luận
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))
              ) : (
                <p className="text-muted-foreground text-center">Chưa có lịch sử tương tác</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lưu cuộc trò chuyện?</DialogTitle>
            <DialogDescription>
              Bạn có muốn lưu cuộc trò chuyện hiện tại trước khi tạo chat mới không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false)
                createAndSwitchToNewChat()
              }}
            >
              Không lưu
            </Button>
            <Button
              onClick={() => {
                // Save current chat to history
                if (chatToSave) {
                  setChatSessions((prev) => [...prev, activeChat])
                }
                setShowSaveDialog(false)
                createAndSwitchToNewChat()
              }}
            >
              Lưu và tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

