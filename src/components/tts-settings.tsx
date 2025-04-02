"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Play, Pause } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { ttsService } from "@/lib/tts-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function TTSSettings() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [testText, setTestText] = useState("Xin chào, đây là giọng đọc tiếng Việt.")
  const [isTesting, setIsTesting] = useState(false)
  const [rate, setRate] = useState(1.0)
  const [pitch, setPitch] = useState(1.0)
  const [volume, setVolume] = useState(1.0)
  const [ttsAvailable, setTtsAvailable] = useState(true)

  // Load initial state
  useEffect(() => {
    setIsEnabled(ttsService.isEnabled())
    setRate(ttsService.getRate())
    setPitch(ttsService.getPitch())
    setVolume(ttsService.getVolume())
    setTtsAvailable(ttsService.isAvailable())

    // Handle voices which might load asynchronously
    const loadVoices = () => {
      const voices = ttsService.getVoices()
      setAvailableVoices(voices)

      // Get current voice preference
      const currentVoice = ttsService.getCurrentVoice()
      if (currentVoice) {
        setSelectedVoice(currentVoice.voiceURI)
      } else {
        // Try to find Vietnamese voices first
        const vietnameseVoices = ttsService.getVietnameseVoices()
        if (vietnameseVoices.length > 0) {
          setSelectedVoice(vietnameseVoices[0].voiceURI)
          ttsService.setVoice(vietnameseVoices[0].voiceURI)
        } else if (voices.length > 0) {
          setSelectedVoice(voices[0].voiceURI)
          ttsService.setVoice(voices[0].voiceURI)
        }
      }
    }

    loadVoices()

    // Set up callback for when voices change
    ttsService.setOnVoicesChanged(loadVoices)

    return () => {
      ttsService.setOnVoicesChanged(null)
    }
  }, [])

  // Handle toggle change
  const handleToggleChange = (checked: boolean) => {
    setIsEnabled(checked)
    ttsService.setEnabled(checked)
  }

  // Handle voice selection
  const handleVoiceChange = (voiceURI: string) => {
    setSelectedVoice(voiceURI)
    ttsService.setVoice(voiceURI)
  }

  // Handle rate change
  const handleRateChange = (value: number[]) => {
    const newRate = value[0]
    setRate(newRate)
    ttsService.setRate(newRate)
  }

  // Handle pitch change
  const handlePitchChange = (value: number[]) => {
    const newPitch = value[0]
    setPitch(newPitch)
    ttsService.setPitch(newPitch)
  }

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    ttsService.setVolume(newVolume)
  }

  // Test the selected voice
  const handleTestVoice = () => {
    setIsTesting(true)
    ttsService.speak(testText, () => {
      setIsTesting(false)
    })
  }

  // Stop test
  const handleStopTest = () => {
    ttsService.stop()
    setIsTesting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                {isEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cài đặt đọc văn bản</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cài đặt đọc văn bản</DialogTitle>
          <DialogDescription>Cấu hình tính năng đọc văn bản để hỗ trợ người dùng khiếm thị</DialogDescription>
        </DialogHeader>

        {!ttsAvailable && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản. Vui lòng sử dụng trình duyệt khác.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="tts-enabled" className="flex flex-col gap-1">
              <span>Bật đọc văn bản</span>
              <span className="font-normal text-xs text-muted-foreground">Tự động đọc phản hồi của trợ lý</span>
            </Label>
            <Switch
              id="tts-enabled"
              checked={isEnabled}
              onCheckedChange={handleToggleChange}
              disabled={!ttsAvailable}
            />
          </div>

          {isEnabled && ttsAvailable && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="voice-select" className="text-right">
                  Giọng đọc
                </Label>
                <div className="col-span-3">
                  <Select
                    value={selectedVoice}
                    onValueChange={handleVoiceChange}
                    disabled={availableVoices.length === 0}
                  >
                    <SelectTrigger id="voice-select">
                      <SelectValue placeholder="Chọn giọng đọc" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rate-slider" className="text-right">
                  Tốc độ
                </Label>
                <div className="col-span-3">
                  <Slider
                    id="rate-slider"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={[rate]}
                    onValueChange={handleRateChange}
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Chậm</span>
                    <span>{rate.toFixed(1)}x</span>
                    <span>Nhanh</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pitch-slider" className="text-right">
                  Cao độ
                </Label>
                <div className="col-span-3">
                  <Slider
                    id="pitch-slider"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={[pitch]}
                    onValueChange={handlePitchChange}
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Thấp</span>
                    <span>{pitch.toFixed(1)}</span>
                    <span>Cao</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="volume-slider" className="text-right">
                  Âm lượng
                </Label>
                <div className="col-span-3">
                  <Slider
                    id="volume-slider"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Nhỏ</span>
                    <span>{Math.round(volume * 100)}%</span>
                    <span>Lớn</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {isTesting ? (
                  <Button onClick={handleStopTest} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Dừng
                  </Button>
                ) : (
                  <Button onClick={handleTestVoice} disabled={!selectedVoice}>
                    <Play className="h-4 w-4 mr-2" />
                    Kiểm tra giọng đọc
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

