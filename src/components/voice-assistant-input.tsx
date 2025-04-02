"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface VoiceAssistantInputProps {
  onTranscription: (text: string) => void
  isProcessing: boolean
}

export function VoiceAssistantInput({ onTranscription, isProcessing }: VoiceAssistantInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Check if speech recognition is supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSpeechRecognitionSupported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window

      setIsSupported(isSpeechRecognitionSupported)

      if (isSpeechRecognitionSupported) {
        // @ts-ignore - WebkitSpeechRecognition may not be in types
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "vi-VN"

        recognitionRef.current.onresult = (event: any) => {
          const newTranscript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("")

          setTranscript(newTranscript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setError(`Lỗi nhận dạng giọng nói: ${event.error}`)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          if (isListening) {
            // If still in listening state, restart
            recognitionRef.current.start()
          }
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      cleanupAudio()
    }
  }, [])

  // Setup audio analyzer for visualizing audio levels
  const setupAudioAnalyzer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      analyserRef.current.fftSize = 256
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateAudioLevel = () => {
        if (!isListening || !analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength
        const normalizedLevel = Math.min(Math.max(average / 128, 0), 100)
        setAudioLevel(normalizedLevel)

        requestAnimationFrame(updateAudioLevel)
      }

      updateAudioLevel()
    } catch (err) {
      console.error("Error accessing microphone", err)
      setError("Không thể truy cập micrô. Vui lòng kiểm tra quyền truy cập.")
    }
  }

  // Cleanup audio resources
  const cleanupAudio = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    setAudioLevel(0)
  }

  // Toggle listening state
  const toggleListening = async () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Start listening
  const startListening = async () => {
    setError(null)
    setTranscript("")
    setIsListening(true)

    try {
      await setupAudioAnalyzer()
      recognitionRef.current.start()
    } catch (err) {
      console.error("Error starting speech recognition", err)
      setError("Không thể khởi động nhận dạng giọng nói")
      setIsListening(false)
    }
  }

  // Stop listening and process transcript
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    setIsListening(false)
    cleanupAudio()

    if (transcript.trim()) {
      onTranscription(transcript)
    }
  }

  if (!isSupported) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isListening ? "default" : "outline"}
            size="icon"
            onClick={toggleListening}
            disabled={isProcessing}
            className={isListening ? "bg-primary text-primary-foreground relative" : ""}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                {audioLevel > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"
                      style={{ transform: `scale(${0.5 + audioLevel / 200})` }}
                    ></span>
                  </span>
                )}
              </>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isListening ? "Dừng ghi âm" : "Nhập bằng giọng nói"}</p>
          {isListening && transcript && (
            <div className="mt-2 max-w-xs">
              <p className="text-xs font-medium">Đang nghe:</p>
              <p className="text-xs truncate">{transcript}</p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

