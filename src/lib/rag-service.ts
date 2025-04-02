import type { ProcessedDocument } from "@/components/document-uploader"

// Basic implementation of a vector-like similarity search
// In a real app, you'd use a vector database or embedding service

export class RAGService {
  private documents: ProcessedDocument[] = []
  private activeDocumentId: string | null = null

  constructor() {}

  // Add a document to the system
  addDocument(document: ProcessedDocument): void {
    this.documents.push(document)
  }

  // Remove a document from the system
  removeDocument(documentId: string): void {
    this.documents = this.documents.filter((doc) => doc.id !== documentId)

    // If the active document was removed, set activeDocumentId to null
    if (this.activeDocumentId === documentId) {
      this.activeDocumentId = null
    }
  }

  // Set the active document(s)
  setActiveDocument(documentId: string): void {
    this.activeDocumentId = documentId
  }

  // Get all documents
  getDocuments(): ProcessedDocument[] {
    return [...this.documents]
  }

  // Get the active document ID
  getActiveDocumentId(): string | null {
    return this.activeDocumentId
  }

  // Retrieve relevant passages from the documents based on a query
  async retrieveContext(query: string, maxResults = 3): Promise<string[]> {
    if (this.documents.length === 0 || !this.activeDocumentId) {
      return []
    }

    // Simple text-based retrieval (in a real app, this would use embeddings)
    const relevantChunks: { text: string; score: number }[] = []

    const processDocuments =
      this.activeDocumentId === "all"
        ? this.documents
        : this.documents.filter((doc) => doc.id === this.activeDocumentId)

    // Simple keyword matching (a proper implementation would use embeddings)
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 3)

    for (const doc of processDocuments) {
      for (const chunk of doc.chunks) {
        const chunkLower = chunk.toLowerCase()

        // Calculate a simple relevance score based on term frequency
        let score = 0
        for (const term of queryTerms) {
          // Count occurrences of the term in the chunk
          const regex = new RegExp(term, "g")
          const occurrences = (chunkLower.match(regex) || []).length
          score += occurrences
        }

        // If the chunk contains at least one query term
        if (score > 0) {
          relevantChunks.push({ text: chunk, score })
        }
      }
    }

    // Sort by relevance score
    relevantChunks.sort((a, b) => b.score - a.score)

    // Return top results
    return relevantChunks.slice(0, maxResults).map((chunk) => chunk.text)
  }

  // Generate a context string for the LLM based on the retrieved passages
  formatRetrievedContext(passages: string[]): string {
    if (passages.length === 0) {
      return ""
    }

    let context = "### Thông tin từ tài liệu tham khảo:\n\n"

    passages.forEach((passage, index) => {
      context += `[Đoạn ${index + 1}]:\n${passage}\n\n`
    })

    return context
  }
}

// Export a singleton instance
export const ragService = new RAGService()

