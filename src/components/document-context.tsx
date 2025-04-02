"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Link, Trash, Eye, Files, Database, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProcessedDocument } from "./document-uploader"

type DocumentContextProps = {
  documents: ProcessedDocument[]
  activeDocumentId: string | null
  onSelectDocument: (documentId: string) => void
  onRemoveDocument: (documentId: string) => void
}

export function DocumentContext({
  documents,
  activeDocumentId,
  onSelectDocument,
  onRemoveDocument,
}: DocumentContextProps) {
  const [previewDocument, setPreviewDocument] = useState<ProcessedDocument | null>(null)

  const activeDocument = documents.find((doc) => doc.id === activeDocumentId) || null

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄"
    if (type.includes("word")) return "📝"
    if (type.includes("text/plain")) return "📃"
    if (type.includes("text/html")) return "🌐"
    return "📄"
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  const getDocumentSummary = (doc: ProcessedDocument) => {
    const content = doc.content
    if (!content) return "Không có nội dung"

    return content.length > 300 ? content.substring(0, 300) + "..." : content
  }

  if (documents.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Files className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>Chưa có tài liệu nào được tải lên</p>
          <p className="text-sm mt-2">Tải lên tài liệu hoặc thêm URL để bắt đầu</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Ngữ cảnh tài liệu
          </CardTitle>
          <CardDescription>{documents.length} tài liệu có sẵn để tham chiếu</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[250px]">
            <div className="p-4 space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    "p-3 rounded-md border transition-colors cursor-pointer group hover:bg-accent hover:text-accent-foreground",
                    activeDocumentId === doc.id && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => onSelectDocument(doc.id)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xl flex-shrink-0">{getFileIcon(doc.type)}</span>
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatBytes(doc.size)} • {formatTimestamp(doc.processedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewDocument(doc)
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveDocument(doc.id)
                        }}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs mt-1 text-muted-foreground line-clamp-2">
                    {doc.source === "url" ? (
                      <span className="flex items-center gap-1">
                        <Link className="h-3 w-3" />
                        {doc.url}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {doc.chunks.length} đoạn văn bản
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="border-t p-3">
          <div className="w-full flex items-center justify-between">
            <Badge variant="outline">
              {activeDocument ? (
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>Đang sử dụng: {activeDocument.name}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>Chưa chọn tài liệu</span>
                </span>
              )}
            </Badge>
            <Button variant="ghost" size="sm" className="h-7" onClick={() => onSelectDocument("all")}>
              Sử dụng tất cả
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getFileIcon(previewDocument.type)}</span>
                <div>
                  <h3 className="font-medium">{previewDocument.name}</h3>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(previewDocument.size)} • {formatTimestamp(previewDocument.processedAt)}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPreviewDocument(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="content" className="flex-1 flex flex-col">
              <div className="px-4 pt-2 border-b">
                <TabsList>
                  <TabsTrigger value="content">Nội dung</TabsTrigger>
                  <TabsTrigger value="chunks">Đoạn ({previewDocument.chunks.length})</TabsTrigger>
                  <TabsTrigger value="info">Thông tin</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="content" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 whitespace-pre-wrap text-sm">{previewDocument.content}</div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="chunks" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {previewDocument.chunks.map((chunk, index) => (
                      <div key={index} className="border p-3 rounded-md text-sm">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Đoạn {index + 1}</div>
                        <div className="whitespace-pre-wrap">{chunk}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="info" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Thông tin cơ bản</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Tên file:</div>
                        <div>{previewDocument.name}</div>

                        <div className="text-muted-foreground">Kích thước:</div>
                        <div>{formatBytes(previewDocument.size)}</div>

                        <div className="text-muted-foreground">Loại:</div>
                        <div>{previewDocument.type}</div>

                        <div className="text-muted-foreground">Thời gian xử lý:</div>
                        <div>{formatTimestamp(previewDocument.processedAt)}</div>

                        <div className="text-muted-foreground">Nguồn:</div>
                        <div>{previewDocument.source === "file" ? "File tải lên" : "URL"}</div>

                        {previewDocument.url && (
                          <>
                            <div className="text-muted-foreground">URL:</div>
                            <div className="truncate">{previewDocument.url}</div>
                          </>
                        )}

                        <div className="text-muted-foreground">Số đoạn:</div>
                        <div>{previewDocument.chunks.length}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Thống kê</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Tổng số ký tự:</div>
                        <div>{previewDocument.content.length}</div>

                        <div className="text-muted-foreground">Tổng số từ:</div>
                        <div>{previewDocument.content.split(/\s+/).length}</div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewDocument(null)}>
                Đóng
              </Button>
              <Button
                variant={activeDocumentId === previewDocument.id ? "outline" : "default"}
                onClick={() => {
                  if (activeDocumentId !== previewDocument.id) {
                    onSelectDocument(previewDocument.id)
                  }
                  setPreviewDocument(null)
                }}
              >
                {activeDocumentId === previewDocument.id ? "Đang được sử dụng" : "Sử dụng tài liệu này"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

