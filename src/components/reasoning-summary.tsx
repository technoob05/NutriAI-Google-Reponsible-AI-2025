"use client"

import { useState } from "react"
import { Brain, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ReasoningSummaryProps {
  steps: any[]
  onShowFullReasoning: () => void
}

export function ReasoningSummary({ steps, onShowFullReasoning }: ReasoningSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate total processing time
  const totalTime = steps.reduce((total, step) => {
    if (step.startTime && step.endTime) {
      const start = new Date(step.startTime)
      const end = new Date(step.endTime)
      return total + (end.getTime() - start.getTime())
    }
    return total
  }, 0)

  // Format time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Get status counts
  const completedCount = steps.filter((step) => step.status === "completed").length
  const errorCount = steps.filter((step) => step.status === "error").length
  const pendingCount = steps.filter((step) => step.status === "pending" || step.status === "processing").length

  return (
    <div className="mt-3 pt-3 border-t border-muted">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Quá trình suy luận</span>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(totalTime)}
          </Badge>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2 text-sm">
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
              {completedCount} hoàn thành
            </Badge>
            {errorCount > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300">
                {errorCount} lỗi
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                {pendingCount} đang xử lý
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "text-xs p-1 rounded flex items-center justify-between",
                  step.status === "completed"
                    ? "bg-green-50 dark:bg-green-950"
                    : step.status === "error"
                      ? "bg-red-50 dark:bg-red-950"
                      : "bg-gray-50 dark:bg-gray-950",
                )}
              >
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      step.status === "completed"
                        ? "bg-green-500"
                        : step.status === "error"
                          ? "bg-red-500"
                          : "bg-gray-400",
                    )}
                  />
                  <span>{step.agent}</span>
                </div>
                {step.startTime && step.endTime && (
                  <span className="text-muted-foreground">
                    {formatTime(new Date(step.endTime).getTime() - new Date(step.startTime).getTime())}
                  </span>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation()
              onShowFullReasoning()
            }}
          >
            <Brain className="h-3 w-3 mr-1" />
            Xem chi tiết quá trình suy luận
          </Button>
        </div>
      )}
    </div>
  )
}

