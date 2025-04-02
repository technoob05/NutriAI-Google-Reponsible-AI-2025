"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Info, Brain, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

// Available models for each agent
const availableModels = {
  SearchAgent: [
    {
      id: "google/flan-t5-small",
      name: "Flan T5 Small",
      description: "Siêu nhẹ, cực nhanh cho tìm kiếm (Mặc định)",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "Qwen/Qwen1.5-0.5B",
      name: "Qwen 0.5B",
      description: "Model nhẹ, tối ưu cho tìm kiếm",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini Flash Lite",
      description: "Cân bằng tốc độ và chất lượng",
      speed: "fast",
      quality: "high",
    },
    {
      id: "gemini-2.0-pro",
      name: "Gemini Pro",
      description: "Chất lượng cao nhất cho tìm kiếm",
      speed: "medium",
      quality: "high",
    },
  ],
  ReasoningPlanner: [
    {
      id: "google/flan-t5-base",
      name: "Flan T5 Base",
      description: "Mô hình nhẹ cho suy luận (Mặc định)", 
      speed: "fast",
      quality: "medium",
    },
    {
      id: "gemini-2.0-flash-thinking-exp-01-21",
      name: "Gemini 2.0 Thinking",
      description: "Tối ưu cho suy luận phức tạp",
      speed: "medium",
      quality: "high",
    },
    {
      id: "gemini-2.5-pro-exp-03-25",
      name: "Gemini 2.5 Pro",
      description: "Mạnh mẽ nhất cho reasoning",
      speed: "medium",
      quality: "high",
    },
    {
      id: "ehristoforu/Falcon3-MoE-2x7B-Insruct",
      name: "Falcon3 MoE",
      description: "Tối ưu cho reasoning và planning",
      speed: "fast",
      quality: "high",
    },
    {
      id: "meta-llama/Meta-Llama-3-8B-Instruct",
      name: "Llama 3 (8B)",
      description: "Mô hình cân bằng giữa tốc độ và chất lượng",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "google/flan-t5-xxl",
      name: "Flan-T5 XXL",
      description: "Mô hình đáng tin cậy, ổn định",
      speed: "fast",
      quality: "medium",
    },
  ],
  ChatProcessor: [
    {
      id: "Qwen/Qwen1.5-1.8B",
      name: "Qwen 1.8B",
      description: "Nhẹ và nhanh cho chat (Mặc định)",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "google/flan-t5-base",
      name: "Flan T5 Base",
      description: "Model nhẹ, đáng tin cậy",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "Qwen/Qwen2.5-7B",
      name: "Qwen 2.5 (7B)",
      description: "Xử lý chat hiệu năng cao",
      speed: "medium",
      quality: "high",
    },
    {
      id: "Qwen/Qwen2.5-3B",
      name: "Qwen 2.5 (3B)",
      description: "Tối ưu cho kịch bản chat nhẹ",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "gemini-2.0-flash-thinking-exp-01-21",
      name: "Gemini 2.0 Thinking",
      description: "Mô hình chuyên dụng cho quá trình suy luận",
      speed: "medium",
      quality: "high",
    },
    {
      id: "meta-llama/Meta-Llama-3-8B-Instruct",
      name: "Llama 3 (8B)",
      description: "Mô hình cân bằng giữa tốc độ và chất lượng",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "google/flan-t5-xxl",
      name: "Flan-T5 XXL",
      description: "Mô hình đáng tin cậy, ổn định",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "gemini-2.0-pro",
      name: "Gemini Pro",
      description: "Chất lượng cao cho chat",
      speed: "medium",
      quality: "high",
    },
  ],
  FactChecker: [
    {
      id: "google/flan-t5-small",
      name: "Flan T5 Small",
      description: "Kiểm tra nhanh và nhẹ (Mặc định)", 
      speed: "fast",
      quality: "medium",
    },
    {
      id: "Qwen/Qwen1.5-0.5B",
      name: "Qwen 0.5B",
      description: "Kiểm tra thông tin cơ bản",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "gemini-2.5-pro-exp-03-25",
      name: "Gemini 2.5 Pro",
      description: "Mạnh mẽ về xử lý logic và phân tích",
      speed: "medium",
      quality: "high",
    },
    {
      id: "google/flan-t5-large",
      name: "Flan-T5 Large",
      description: "Ưu tiên cho kiểm tra thông tin",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "gemini-2.0-flash-thinking-exp-01-21",
      name: "Gemini 2.0 Thinking",
      description: "Mô hình chuyên dụng cho quá trình suy luận",
      speed: "medium",
      quality: "high",
    },
    {
      id: "gemini",
      name: "Google Gemini",
      description: "Mô hình mạnh mẽ cho kiểm tra thông tin",
      speed: "slow",
      quality: "high",
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      description: "Mô hình nhanh và chính xác",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "gemini-2.0-pro",
      name: "Gemini Pro",
      description: "Kiểm tra chính xác cao",
      speed: "medium",
      quality: "high",
    },
  ],
  ContentWriter: [
    {
      id: "google/flan-t5-base",
      name: "Flan T5 Base",
      description: "Soạn nội dung nhanh (Mặc định)",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "Qwen/Qwen1.5-1.8B",
      name: "Qwen 1.8B",
      description: "Cân bằng tốc độ và chất lượng",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "gemini-2.0-flash-thinking-exp-01-21",
      name: "Gemini 2.0 Thinking",
      description: "Mô hình chuyên dụng cho quá trình suy luận",
      speed: "medium",
      quality: "high",
    },
    {
      id: "gemini",
      name: "Google Gemini",
      description: "Mô hình tạo nội dung chất lượng cao",
      speed: "slow",
      quality: "high",
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      description: "Mô hình nhanh và chính xác",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "gemini-2.0-pro",
      name: "Gemini Pro",
      description: "Chất lượng cao nhất",
      speed: "medium",
      quality: "high",
    },
  ],
  UXUIDesigner: [
    {
      id: "google/flan-t5-base",
      name: "Flan T5 Base",
      description: "Nhẹ và nhanh cho thiết kế đơn giản (Mặc định)",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "Qwen/Qwen1.5-1.8B",
      name: "Qwen 1.8B",
      description: "Cân bằng tốc độ và chất lượng UI/UX",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini Flash Lite",
      description: "Nhanh và hiệu quả cho thiết kế linh hoạt",
      speed: "fast",
      quality: "medium",
    },
    {
      id: "stabilityai/stable-code-3b",
      name: "Stable Code 3B",
      description: "Chuyên về code và thiết kế giao diện",
      speed: "medium",
      quality: "high",
    },
    {
      id: "Gemma-3-27b-it",
      name: "Gemma 3 (27B)",
      description: "Tối ưu cho coding và UX/UI phức tạp",
      speed: "medium",
      quality: "high",
    },
    {
      id: "meta-llama/Llama-2-7b-code",
      name: "Llama 2 Code",
      description: "Chuyên sâu về code và thiết kế UI",
      speed: "medium",
      quality: "high",
    },
    {
      id: "gemini-2.0-pro",
      name: "Gemini Pro",
      description: "Chất lượng cao nhất cho UX/UI phức tạp",
      speed: "medium",
      quality: "high",
    },
  ],
}

// Presets for different optimization goals
const modelPresets = {
  ultrafast: {
    name: "Siêu tốc (Mặc định)",
    description: "Tối ưu tốc độ với các model nhẹ",
    models: {
      SearchAgent: "google/flan-t5-small",
      ReasoningPlanner: "google/flan-t5-base",
      ChatProcessor: "Qwen/Qwen1.5-1.8B", 
      FactChecker: "google/flan-t5-small",
      ContentWriter: "google/flan-t5-base",
      UXUIDesigner: "google/flan-t5-base",
    },
  },
  balanced: {
    name: "Cân bằng",
    description: "Cân bằng giữa tốc độ và chất lượng",
    models: {
      SearchAgent: "gemini-2.0-flash-lite",
      ReasoningPlanner: "gemini-2.0-flash-thinking-exp-01-21",
      ChatProcessor: "Qwen/Qwen2.5-7B",
      FactChecker: "gemini-2.0-flash-lite",
      ContentWriter: "gemini-2.0-flash-lite",
    },
  },
  quality: {
    name: "Chất lượng cao",
    description: "Ưu tiên độ chính xác cao nhất",
    models: {
      SearchAgent: "gemini-2.0-pro",
      ReasoningPlanner: "gemini-2.5-pro-exp-03-25",
      ChatProcessor: "gemini-2.0-pro",
      FactChecker: "gemini-2.0-pro",
      ContentWriter: "gemini-2.0-pro",
    },
  },
}

interface ModelSettingsProps {
  selectedModels: Record<string, string>
  onModelChange: (agent: string, modelId: string) => void
  autoScrollEnabled: boolean
  onAutoScrollChange: (enabled: boolean) => void
  isDarkMode: boolean
  onDarkModeChange: (enabled: boolean) => void
  showRealtimeReasoning: boolean
  onRealtimeReasoningChange: (enabled: boolean) => void
}

export function ModelSettings({
  selectedModels,
  onModelChange,
  autoScrollEnabled,
  onAutoScrollChange,
  isDarkMode,
  onDarkModeChange,
  showRealtimeReasoning,
  onRealtimeReasoningChange,
}: ModelSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("presets") // Changed default tab
  const [activePreset, setActivePreset] = useState<string | null>("ultrafast") // Set ultrafast as default

  // Check if current selection matches a preset
  useEffect(() => {
    const matchPreset = Object.entries(modelPresets).find(([_, preset]) => {
      return Object.entries(preset.models).every(([agent, modelId]) => 
        selectedModels[agent as keyof typeof selectedModels] === modelId
      )
    })

    setActivePreset(matchPreset ? matchPreset[0] : null)
  }, [selectedModels])

  // Apply a preset
  const applyPreset = (presetKey: string) => {
    const preset = modelPresets[presetKey as keyof typeof modelPresets]
    if (preset) {
      Object.entries(preset.models).forEach(([agent, modelId]) => {
        onModelChange(agent, modelId)
      })
      setActivePreset(presetKey)
    }
  }

  // Apply default preset on first load
  useEffect(() => {
    if (!activePreset) {
      applyPreset('ultrafast')
    }
  }, [])

  // Get model details by ID
  const getModelDetails = (agent: string, modelId: string) => {
    const models = availableModels[agent as keyof typeof availableModels] || []
    return models.find((model) => model.id === modelId)
  }

  // Get speed badge color
  const getSpeedBadgeColor = (speed: string) => {
    switch (speed) {
      case "fast":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "slow":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  // Get quality badge color
  const getQualityBadgeColor = (quality: string) => {
    switch (quality) {
      case "high":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "medium":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "low":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>Cài đặt model</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Cài đặt model AI</DialogTitle>
          <DialogDescription>
            Tùy chỉnh các model AI và cài đặt khác để tối ưu hóa trải nghiệm của bạn
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="presets">Cấu hình nhanh</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt khác</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="models" className="h-full overflow-hidden">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-6 p-2">
                  {Object.entries(availableModels).map(([agent, models]) => {
                    const selectedModel = selectedModels[agent]
                    const modelDetails = getModelDetails(agent, selectedModel)

                    return (
                      <div key={agent} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">{agent}</Label>
                          {modelDetails && (
                            <div className="flex gap-1">
                              <Badge className={getSpeedBadgeColor(modelDetails.speed)}>
                                <Clock className="h-3 w-3 mr-1" />
                                {modelDetails.speed === "fast"
                                  ? "Nhanh"
                                  : modelDetails.speed === "medium"
                                    ? "Trung bình"
                                    : "Chậm"}
                              </Badge>
                              <Badge className={getQualityBadgeColor(modelDetails.quality)}>
                                <Brain className="h-3 w-3 mr-1" />
                                {modelDetails.quality === "high"
                                  ? "Chất lượng cao"
                                  : modelDetails.quality === "medium"
                                    ? "Chất lượng khá"
                                    : "Chất lượng thấp"}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <Select value={selectedModel} onValueChange={(value) => onModelChange(agent, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn model" />
                          </SelectTrigger>
                          <SelectContent>
                            {models.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                <div className="flex flex-col">
                                  <span>{model.name}</span>
                                  <span className="text-xs text-muted-foreground">{model.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <p className="text-xs text-muted-foreground">
                          {agent === "ReasoningPlanner" && "Sử dụng cho quá trình lập kế hoạch và suy luận"}
                          {agent === "ChatProcessor" && "Sử dụng cho xử lý hội thoại và phản hồi"}
                          {agent === "FactChecker" && "Sử dụng cho kiểm tra thông tin và độ tin cậy"}
                          {agent === "ContentWriter" && "Sử dụng cho tạo nội dung phản hồi cuối cùng"}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="presets" className="h-full overflow-hidden">
              <ScrollArea className="h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                  {Object.entries(modelPresets).map(([key, preset]) => (
                    <Card
                      key={key}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        activePreset === key && "border-primary bg-primary/5",
                        key === "ultrafast" && "md:col-span-2" // Make ultrafast preset span full width
                      )}
                      onClick={() => applyPreset(key)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {preset.name}
                          {activePreset === key && (
                            <Badge variant="outline" className="ml-auto">
                              Đang dùng
                            </Badge>
                          )}
                          {key === "ultrafast" && (
                            <Badge className="bg-green-500 text-white ml-2">Khuyến nghị</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{preset.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-xs">
                        <div className="space-y-1">
                          {Object.entries(preset.models).map(([agent, modelId]) => {
                            const model = getModelDetails(agent, modelId)
                            return (
                              <div key={agent} className="flex justify-between">
                                <span>{agent}:</span>
                                <span className="font-medium">{model?.name || modelId}</span>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="h-full overflow-hidden">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-6 p-4">
                  <div className="space-y-2">
                    <Label className="text-base">Hiển thị quá trình suy luận</Label>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Hiển thị quá trình suy luận theo thời gian thực</p>
                        <p className="text-xs text-muted-foreground">
                          Xem quá trình AI suy luận trong khi đang xử lý yêu cầu của bạn
                        </p>
                      </div>
                      <Switch checked={showRealtimeReasoning} onCheckedChange={onRealtimeReasoningChange} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base">Tự động cuộn</Label>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Tự động cuộn đến tin nhắn mới nhất</p>
                        <p className="text-xs text-muted-foreground">Tự động cuộn xuống khi có tin nhắn mới</p>
                      </div>
                      <Switch checked={autoScrollEnabled} onCheckedChange={onAutoScrollChange} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base">Chế độ tối</Label>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Bật chế độ tối</p>
                        <p className="text-xs text-muted-foreground">
                          Chuyển giao diện sang chế độ tối để giảm mỏi mắt
                        </p>
                      </div>
                      <Switch checked={isDarkMode} onCheckedChange={onDarkModeChange} />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex items-center justify-between pt-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Info className="h-4 w-4 mr-1" />
            <span>Thay đổi model có thể ảnh hưởng đến tốc độ và chất lượng phản hồi</span>
          </div>
          <Button onClick={() => setIsOpen(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

