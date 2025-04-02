"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Brain,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  AlertTriangle,
  CheckCircle,
  RotateCw,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface AgentReasoningProps {
  agentSteps: any[]
  isVisible: boolean
  onToggle: () => void
  messageId?: string | null
}

export function AgentReasoning({ agentSteps, isVisible, onToggle, messageId }: AgentReasoningProps) {
  const [expandedSteps, setExpandedSteps] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("steps")
  const [totalTime, setTotalTime] = useState<number>(0)
  const [agentDistribution, setAgentDistribution] = useState<{ agent: string; percentage: number }[]>([])

  // Calculate total processing time and agent distribution
  useEffect(() => {
    if (agentSteps.length > 0) {
      let total = 0
      const agentTimes: Record<string, number> = {}

      agentSteps.forEach((step) => {
        if (step.startTime && step.endTime) {
          const start = new Date(step.startTime)
          const end = new Date(step.endTime)
          const diffMs = end.getTime() - start.getTime()
          total += diffMs

          if (!agentTimes[step.agent]) {
            agentTimes[step.agent] = 0
          }
          agentTimes[step.agent] += diffMs
        }
      })

      setTotalTime(total)

      // Calculate percentages
      const distribution = Object.entries(agentTimes).map(([agent, time]) => ({
        agent,
        percentage: total > 0 ? (time / total) * 100 : 0,
      }))

      setAgentDistribution(distribution)
    }
  }, [agentSteps])

  const toggleStep = (agentName: string) => {
    setExpandedSteps((prev) =>
      prev.includes(agentName) ? prev.filter((step) => step !== agentName) : [...prev, agentName],
    )
  }

  const formatTime = (startTime?: Date, endTime?: Date) => {
    if (!startTime || !endTime) return ""

    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()

    if (diffMs < 1000) {
      return `${diffMs}ms`
    } else {
      return `${(diffMs / 1000).toFixed(1)}s`
    }
  }

  const getAgentDescription = (agent: string) => {
    switch (agent) {
      case "RAGProcessor":
        return "Retrieves and processes information from documents and knowledge base"
      case "FactChecker":
        return "Verifies information accuracy and reliability"
      case "ReasoningPlanner":
        return "Plans and structures the reasoning process"
      case "ContentWriter":
        return "Generates the final response content"
      case "ChatProcessor":
        return "Processes conversational context and user intent"
      case "ManagementAgent":
        return "Coordinates between different agents and tasks"
      case "SearchAgent":
        return "Searches for relevant information"
      case "UXUIDesigner":
        return "Formats the response for optimal user experience"
      default:
        return "Processes information and generates responses"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "processing":
        return <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Quá trình suy luận AI
              {messageId && (
                <Badge variant="outline" className="ml-2">
                  Tin nhắn #{messageId.slice(-4)}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onToggle}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription>
            Xem chi tiết quá trình suy luận của AI để hiểu cách hệ thống đưa ra phản hồi
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 border-b">
            <TabsList>
              <TabsTrigger value="steps">Các bước xử lý</TabsTrigger>
              <TabsTrigger value="timeline">Dòng thời gian</TabsTrigger>
              <TabsTrigger value="stats">Thống kê</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="flex-1 overflow-hidden p-0">
            <TabsContent value="steps" className="h-full m-0">
              <ScrollArea className="h-[calc(90vh-180px)]">
                <div className="p-4 space-y-4">
                  {agentSteps.map((step, index) => (
                    <div
                      key={index}
                      className={cn(
                        "border rounded-lg overflow-hidden",
                        step.status === "completed"
                          ? "border-green-200 dark:border-green-900"
                          : step.status === "error"
                            ? "border-red-200 dark:border-red-900"
                            : step.status === "processing"
                              ? "border-blue-200 dark:border-blue-900"
                              : "border-gray-200 dark:border-gray-800",
                      )}
                    >
                      <div
                        className={cn(
                          "p-3 flex items-center justify-between cursor-pointer",
                          step.status === "completed"
                            ? "bg-green-50 dark:bg-green-950"
                            : step.status === "error"
                              ? "bg-red-50 dark:bg-red-950"
                              : step.status === "processing"
                                ? "bg-blue-50 dark:bg-blue-950"
                                : "bg-gray-50 dark:bg-gray-950",
                        )}
                        onClick={() => toggleStep(step.agent)}
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(step.status)}
                          <span className="font-medium">{step.agent}</span>

                          {step.startTime && step.endTime && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(step.startTime, step.endTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground capitalize">{step.status}</span>
                          {expandedSteps.includes(step.agent) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {expandedSteps.includes(step.agent) && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                          <div className="mb-3 text-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-primary" />
                              <span className="font-medium">Mô tả</span>
                            </div>
                            <p className="text-muted-foreground">{getAgentDescription(step.agent)}</p>
                          </div>

                          {step.model && (
                            <div className="mb-3 text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <Brain className="h-4 w-4 text-primary" />
                                <span className="font-medium">Model sử dụng</span>
                              </div>
                              <Badge variant="outline" className="mt-1">
                                {step.model}
                              </Badge>
                            </div>
                          )}

                          {step.output && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">Kết quả xử lý</span>
                              </div>
                              <ScrollArea className="max-h-[300px]">
                                <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-2 rounded-md">
                                  {step.output}
                                </pre>
                              </ScrollArea>
                            </div>
                          )}

                          {step.sources && step.sources.length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">Nguồn tham khảo</span>
                              </div>
                              <div className="space-y-1">
                                {step.sources.map((source: string, i: number) => (
                                  <div key={i} className="flex items-center gap-1 text-xs text-primary">
                                    <ExternalLink className="h-3 w-3" />
                                    <a
                                      href={source}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      {source}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {agentSteps.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">
                      Không có dữ liệu suy luận cho tin nhắn này
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="timeline" className="h-full m-0">
              <ScrollArea className="h-[calc(90vh-180px)]">
                <div className="p-4">
                  <div className="relative pl-6 border-l-2 border-muted">
                    {agentSteps.map((step, index) => {
                      const startTime = step.startTime ? new Date(step.startTime) : null
                      const endTime = step.endTime ? new Date(step.endTime) : null
                      const duration = startTime && endTime ? endTime.getTime() - startTime.getTime() : 0

                      return (
                        <div
                          key={index}
                          className="mb-6 timeline-item"
                          style={{ "--index": index } as React.CSSProperties}
                        >
                          <div
                            className={cn(
                              "absolute -left-2.5 w-5 h-5 rounded-full flex items-center justify-center",
                              step.status === "completed"
                                ? "bg-green-100 text-green-600"
                                : step.status === "error"
                                  ? "bg-red-100 text-red-600"
                                  : step.status === "processing"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-100 text-gray-600",
                            )}
                          >
                            {getStatusIcon(step.status)}
                          </div>

                          <div className="ml-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{step.agent}</h3>
                              <Badge variant="outline" className="text-xs">
                                {step.status}
                              </Badge>
                            </div>

                            <div className="text-xs text-muted-foreground mt-1">
                              {startTime && <div>Bắt đầu: {startTime.toLocaleTimeString()}</div>}
                              {endTime && <div>Kết thúc: {endTime.toLocaleTimeString()}</div>}
                              {duration > 0 && (
                                <div className="font-medium mt-1">
                                  Thời gian xử lý:{" "}
                                  {duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`}
                                </div>
                              )}
                            </div>

                            <div className="mt-2 text-sm">{getAgentDescription(step.agent)}</div>

                            {step.model && (
                              <Badge variant="secondary" className="mt-2">
                                {step.model}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="h-full m-0">
              <ScrollArea className="h-[calc(90vh-180px)]">
                <div className="p-4 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Tổng quan</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Tổng số bước</div>
                          <div className="text-2xl font-bold">{agentSteps.length}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Thời gian xử lý</div>
                          <div className="text-2xl font-bold">
                            {totalTime < 1000 ? `${totalTime}ms` : `${(totalTime / 1000).toFixed(1)}s`}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Hoàn thành</div>
                          <div className="text-2xl font-bold">
                            {agentSteps.filter((step) => step.status === "completed").length}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Lỗi</div>
                          <div className="text-2xl font-bold">
                            {agentSteps.filter((step) => step.status === "error").length}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Phân bổ thời gian</h3>
                    <div className="space-y-3">
                      {agentDistribution.map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{item.agent}</span>
                            <span className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Models sử dụng</h3>
                    <div className="space-y-2">
                      {agentSteps
                        .filter((step) => step.model)
                        .map((step, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                            <div>
                              <div className="font-medium">{step.agent}</div>
                              <div className="text-xs text-muted-foreground">{getAgentDescription(step.agent)}</div>
                            </div>
                            <Badge>{step.model}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </CardContent>
        </Tabs>

        <CardFooter className="border-t p-4 flex justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị chi tiết quá trình suy luận giúp tăng tính minh bạch và đáng tin cậy của hệ thống AI
          </div>
          <Button variant="outline" onClick={onToggle}>
            Đóng
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

