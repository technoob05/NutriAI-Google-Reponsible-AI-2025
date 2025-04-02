import { ChatInterfaceWithRAG } from "@/components/chat-interface-with-rag"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 w-full max-w-5xl">
        {/* <h1 className="text-4xl font-bold text-center mb-4">Hệ Thống Thực Đơn Sức Khỏe</h1>
        <p className="text-center mb-8 text-muted-foreground">
          Hệ thống recommendation chuyên về ẩm thực và sức khỏe cho người Việt với hỗ trợ RAG
        </p>
        <div className="bg-muted/30 p-4 rounded-lg mb-8 text-sm">

        </div> */}
        <ChatInterfaceWithRAG />
      </div>
    </main>
  )
}

