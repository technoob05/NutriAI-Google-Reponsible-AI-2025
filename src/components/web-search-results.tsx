"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Loader2 } from "lucide-react"

interface WebSearchResultsProps {
  query: string
  isSearching: boolean
}

export function WebSearchResults({ query, isSearching }: WebSearchResultsProps) {
  const [dots, setDots] = useState(".")

  // Animate the loading dots
  useEffect(() => {
    if (!isSearching) return

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."))
    }, 500)

    return () => clearInterval(interval)
  }, [isSearching])

  if (!query || !isSearching) return null

  return (
    <Card className="mb-4 bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4 text-primary" />
          )}
          <span className="font-medium">
            {isSearching ? `Đang tìm kiếm thông tin về "${query}"${dots}` : `Kết quả tìm kiếm cho "${query}"`}
          </span>
        </div>

        {isSearching && (
          <div className="text-sm text-muted-foreground">
            Đang truy xuất thông tin từ cơ sở dữ liệu và tài liệu người dùng...
          </div>
        )}
      </CardContent>
    </Card>
  )
}

