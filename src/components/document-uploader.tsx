"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Upload, AlertCircle, Link } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type DocumentUploaderProps = {
  onDocumentProcessed: (documentInfo: ProcessedDocument) => void
}

export type ProcessedDocument = {
  id: string
  name: string
  type: string
  size: number
  url?: string
  content: string
  chunks: string[]
  processedAt: Date
  source: "file" | "url"
}

export function DocumentUploader({ onDocumentProcessed }: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUrlDialog, setShowUrlDialog] = useState(false)
  const [url, setUrl] = useState("")
  const [isProcessingUrl, setIsProcessingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedFileTypes = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
  ]

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!allowedFileTypes.includes(file.type)) {
      setUploadError(`Loại file không được hỗ trợ. Vui lòng sử dụng các file .txt, .pdf, hoặc .docx.`)
      return
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`File vượt quá kích thước tối đa (10MB).`)
      return
    }

    setUploadError(null)
    setIsUploading(true)
    setUploadProgress(0)
    setProcessingStatus("Đang tải lên...")

    try {
      // Simulate upload progress
      const simulateProgress = () => {
        setUploadProgress((prev) => {
          if (prev < 90) {
            return prev + 10
          }
          return prev
        })
      }

      const progressInterval = setInterval(simulateProgress, 300)

      // Process file content based on file type
      const fileContent = await processFile(file)

      // Simulate document processing
      setProcessingStatus("Đang xử lý nội dung...")
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setUploadProgress(95)

      setProcessingStatus("Đang chuẩn bị dữ liệu...")
      await new Promise((resolve) => setTimeout(resolve, 500))
      setUploadProgress(100)

      clearInterval(progressInterval)

      // Split content into chunks (simple implementation - will be more sophisticated in production)
      const chunks = splitIntoChunks(fileContent, 1000) // ~1000 chars per chunk

      // Create processed document object
      const processedDocument: ProcessedDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        content: fileContent,
        chunks,
        processedAt: new Date(),
        source: "file",
      }

      // Notify parent component
      onDocumentProcessed(processedDocument)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error processing file:", error)
      setUploadError(`Lỗi khi xử lý file: ${error instanceof Error ? error.message : "Lỗi không xác định"}`)
    } finally {
      setIsUploading(false)
      setProcessingStatus("")
    }
  }

  const handleUrlSubmit = async () => {
    if (!url.trim()) return

    // Basic URL validation
    try {
      new URL(url)
    } catch (e) {
      setUrlError("URL không hợp lệ. Vui lòng kiểm tra lại.")
      return
    }

    setUrlError(null)
    setIsProcessingUrl(true)
    setProcessingStatus("Đang tải nội dung từ URL...")

    try {
      // Process URL content
      const content = await fetchUrlContent(url)

      // Split content into chunks
      const chunks = splitIntoChunks(content, 1000)

      // Create processed document object
      const processedDocument: ProcessedDocument = {
        id: Date.now().toString(),
        name: new URL(url).hostname,
        type: "text/html",
        size: content.length,
        url,
        content,
        chunks,
        processedAt: new Date(),
        source: "url",
      }

      // Notify parent component
      onDocumentProcessed(processedDocument)

      // Close dialog and reset
      setShowUrlDialog(false)
      setUrl("")
    } catch (error) {
      console.error("Error processing URL:", error)
      setUrlError(`Lỗi khi xử lý URL: ${error instanceof Error ? error.message : "Lỗi không xác định"}`)
    } finally {
      setIsProcessingUrl(false)
      setProcessingStatus("")
    }
  }

  // Helper function to process file content
  const processFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // For demo purposes, we're only handling text files directly
      // In a real app, you'd use libraries like pdf.js for PDFs and
      // other specialized libraries for different file formats

      if (file.type === "text/plain") {
        const reader = new FileReader()
        reader.onload = (e) => resolve((e.target?.result as string) || "")
        reader.onerror = (e) => reject(new Error("Failed to read file"))
        reader.readAsText(file)
      } else {
        // Simulate processing for other file types
        // This would be replaced with actual processing logic
        setTimeout(() => {
          const mockContent = `This is simulated content for ${file.name}. In a real application, proper parsing libraries would be used to extract text from PDFs, DOCXs, etc.
          
For demonstration purposes, we're generating this placeholder content. The actual implementation would use libraries like pdf.js, mammoth.js, etc.
          
The file type is: ${file.type}
The file size is: ${(file.size / 1024).toFixed(2)} KB`

          resolve(mockContent)
        }, 1500)
      }
    })
  }

  // Helper function to fetch URL content
  const fetchUrlContent = async (url: string): Promise<string> => {
    // In a real app, this would be a server-side function to avoid CORS issues
    // For demo purposes, we'll simulate it

    await new Promise((resolve) => setTimeout(resolve, 1500))

    return `This is simulated content from ${url}. In a real application, a server-side endpoint would fetch and parse the page content.
    
For demonstration purposes, we're generating this placeholder content. The actual implementation would use a backend service to fetch the page, bypass CORS restrictions, and extract relevant text.

URL: ${url}
Fetched at: ${new Date().toLocaleString()}`
  }

  // Helper function to split content into chunks
  const splitIntoChunks = (text: string, chunkSize: number): string[] => {
    const chunks: string[] = []
    let i = 0
    while (i < text.length) {
      chunks.push(text.slice(i, i + chunkSize))
      i += chunkSize
    }
    return chunks
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Tải tài liệu lên
          </CardTitle>
          <CardDescription>Tải lên tài liệu hoặc cung cấp URL để tăng cường ngữ cảnh cho hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Chọn file
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx,.doc"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUrlDialog(true)}
                disabled={isUploading}
              >
                <Link className="h-4 w-4 mr-2" />
                Thêm URL
              </Button>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{processingStatus}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          Hỗ trợ định dạng: .txt, .pdf, .docx (tối đa 10MB)
        </CardFooter>
      </Card>

      {/* URL Dialog */}
      <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm URL</DialogTitle>
            <DialogDescription>Nhập URL của trang web có chứa thông tin bạn muốn sử dụng</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Input
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isProcessingUrl}
            />

            {isProcessingUrl && <div className="text-sm text-muted-foreground animate-pulse">{processingStatus}</div>}

            {urlError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{urlError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUrlDialog(false)} disabled={isProcessingUrl}>
              Hủy
            </Button>
            <Button onClick={handleUrlSubmit} disabled={isProcessingUrl || !url.trim()}>
              {isProcessingUrl ? (
                <>
                  <span className="mr-2">Đang xử lý</span>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                </>
              ) : (
                "Xử lý URL"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

