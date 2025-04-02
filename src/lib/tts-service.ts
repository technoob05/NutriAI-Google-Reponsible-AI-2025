export class TTSService {
  private isSpeaking = false
  private utterance: SpeechSynthesisUtterance | null = null
  private enabled = false
  private voicePreference: string | null = null
  private rate = 1.0
  private pitch = 1.0
  private volume = 1.0
  private onVoicesChanged: (() => void) | null = null
  private voicesLoaded = false
  private voiceLoadAttempts = 0
  private maxVoiceLoadAttempts = 10
  private voiceLoadInterval: NodeJS.Timeout | null = null

  constructor() {
    // Load user preferences from localStorage if available
    if (typeof window !== "undefined") {
      this.enabled = localStorage.getItem("tts-enabled") === "true"
      this.voicePreference = localStorage.getItem("tts-voice")
      this.rate = Number.parseFloat(localStorage.getItem("tts-rate") || "1.0")
      this.pitch = Number.parseFloat(localStorage.getItem("tts-pitch") || "1.0")
      this.volume = Number.parseFloat(localStorage.getItem("tts-volume") || "1.0")

      // Initialize voice loading
      this.initVoices()
    }
  }

  // Initialize voices with retry mechanism
  private initVoices(): void {
    if (typeof window === "undefined" || !window.speechSynthesis) return

    // Check if voices are already available
    const voices = window.speechSynthesis.getVoices()
    if (voices && voices.length > 0) {
      this.voicesLoaded = true
      return
    }

    // Set up retry mechanism for voice loading
    this.voiceLoadInterval = setInterval(() => {
      const voices = window.speechSynthesis.getVoices()
      if (voices && voices.length > 0) {
        this.voicesLoaded = true
        if (this.voiceLoadInterval) {
          clearInterval(this.voiceLoadInterval)
          this.voiceLoadInterval = null
        }
        if (this.onVoicesChanged) {
          this.onVoicesChanged()
        }
        return
      }

      this.voiceLoadAttempts++
      if (this.voiceLoadAttempts >= this.maxVoiceLoadAttempts) {
        if (this.voiceLoadInterval) {
          clearInterval(this.voiceLoadInterval)
          this.voiceLoadInterval = null
        }
        console.warn("Failed to load TTS voices after multiple attempts")
      }
    }, 500)

    // Also listen for the standard onvoiceschanged event
    window.speechSynthesis.onvoiceschanged = () => {
      this.voicesLoaded = true
      if (this.voiceLoadInterval) {
        clearInterval(this.voiceLoadInterval)
        this.voiceLoadInterval = null
      }
      if (this.onVoicesChanged) {
        this.onVoicesChanged()
      }
    }
  }

  // Set callback for when voices change
  public setOnVoicesChanged(callback: () => void): void {
    this.onVoicesChanged = callback
    if (this.voicesLoaded && callback) {
      callback()
    }
  }

  // Enable or disable TTS globally
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (typeof window !== "undefined") {
      localStorage.setItem("tts-enabled", enabled.toString())
    }

    // Stop any ongoing speech when disabled
    if (!enabled) {
      this.stop()
    }
  }

  // Check if TTS is enabled
  public isEnabled(): boolean {
    return this.enabled
  }

  // Set preferred voice
  public setVoice(voiceURI: string): void {
    this.voicePreference = voiceURI
    if (typeof window !== "undefined") {
      localStorage.setItem("tts-voice", voiceURI)
    }
  }

  // Set speech rate (0.1 to 10)
  public setRate(rate: number): void {
    this.rate = Math.max(0.1, Math.min(10, rate))
    if (typeof window !== "undefined") {
      localStorage.setItem("tts-rate", this.rate.toString())
    }
  }

  // Set speech pitch (0 to 2)
  public setPitch(pitch: number): void {
    this.pitch = Math.max(0, Math.min(2, pitch))
    if (typeof window !== "undefined") {
      localStorage.setItem("tts-pitch", this.pitch.toString())
    }
  }

  // Set speech volume (0 to 1)
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (typeof window !== "undefined") {
      localStorage.setItem("tts-volume", this.volume.toString())
    }
  }

  // Get current rate
  public getRate(): number {
    return this.rate
  }

  // Get current pitch
  public getPitch(): number {
    return this.pitch
  }

  // Get current volume
  public getVolume(): number {
    return this.volume
  }

  // Get available voices
  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return []
    }
    return window.speechSynthesis.getVoices()
  }

  // Get Vietnamese voices
  public getVietnameseVoices(): SpeechSynthesisVoice[] {
    return this.getVoices().filter(
      (voice) => voice.lang.includes("vi") || voice.name.toLowerCase().includes("vietnamese"),
    )
  }

  // Get current voice
  public getCurrentVoice(): SpeechSynthesisVoice | null {
    if (!this.voicePreference || typeof window === "undefined" || !window.speechSynthesis) {
      return null
    }

    const voices = this.getVoices()
    return voices.find((voice) => voice.voiceURI === this.voicePreference) || null
  }

  // Test if TTS is available
  public isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window
  }

  // Preprocess text for better pronunciation
  private preprocessText(text: string): string {
    // Remove markdown formatting
    let processedText = text.replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    processedText = processedText.replace(/\*(.*?)\*/g, "$1") // Italic
    processedText = processedText.replace(/\[(.*?)\]$$.*?$$/g, "$1") // Links
    processedText = processedText.replace(/```[\s\S]*?```/g, "") // Code blocks

    // Add pauses at punctuation
    processedText = processedText.replace(/\./g, ". ")
    processedText = processedText.replace(/,/g, ", ")
    processedText = processedText.replace(/;/g, "; ")
    processedText = processedText.replace(/:/g, ": ")

    // Clean up extra spaces
    processedText = processedText.replace(/\s+/g, " ").trim()

    return processedText
  }

  // Add method to check/request permissions
  private async checkPermissions(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check if notification permission is needed for audio on some browsers
    if ('Notification' in window && Notification.permission === 'denied') {
      console.warn('TTS may require notification permissions in some browsers');
      return false;
    }

    try {
      // Try to start and immediately cancel speech to check permissions
      const test = new SpeechSynthesisUtterance('');
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(test);
      window.speechSynthesis.cancel();
      return true;
    } catch (error) {
      console.warn('TTS permission check failed:', error);
      return false;
    }
  }

  // Speak text with chunking for long text
  public speak(text: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!this.enabled || typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }

      // Check permissions first
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.warn('TTS permissions not granted');
        resolve(); // Resolve instead of reject to avoid breaking the app
        return;
      }

      // Stop any ongoing speech
      this.stop();

      // Preprocess text
      const processedText = this.preprocessText(text);

      // Split long text into chunks
      const textChunks = this.splitTextIntoChunks(processedText);

      let currentChunkIndex = 0;
      const speakNextChunk = () => {
        if (currentChunkIndex >= textChunks.length) {
          this.isSpeaking = false;
          resolve();
          return;
        }

        try {
          const utterance = new SpeechSynthesisUtterance(textChunks[currentChunkIndex]);
          this.setupUtterance(utterance);

          utterance.onend = () => {
            currentChunkIndex++;
            speakNextChunk();
          };

          utterance.onerror = (event) => {
            const error = event instanceof SpeechSynthesisErrorEvent ? event.error : 'Unknown error';
            
            // Handle specific error types
            switch (error) {
              case 'not-allowed':
                console.warn('TTS not allowed. Check browser permissions.');
                break;
              case 'interrupted':
                console.log('TTS interrupted'); // This is normal when stopping
                break;
              case 'canceled':
                console.log('TTS canceled'); // This is normal when stopping
                break;
              default:
                console.error('TTS Error:', error);
            }

            // Only treat certain errors as fatal
            if (error === 'not-allowed') {
              this.enabled = false; // Disable TTS on permission errors
              resolve(); // Resolve instead of reject to avoid breaking the app
            } else {
              currentChunkIndex++;
              speakNextChunk(); // Try next chunk for non-fatal errors
            }
          };

          window.speechSynthesis.speak(utterance);
          this.utterance = utterance;
          this.isSpeaking = true;

        } catch (error) {
          console.error('TTS speak error:', error);
          currentChunkIndex++;
          speakNextChunk(); // Try next chunk on error
        }
      };

      speakNextChunk();
    });
  }

  private setupUtterance(utterance: SpeechSynthesisUtterance): void {
    // Set voice preference
    if (this.voicePreference) {
      const voices = this.getVoices();
      const preferredVoice = voices.find(voice => voice.voiceURI === this.voicePreference);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    } else {
      // Try to find a Vietnamese voice
      const vietnameseVoices = this.getVietnameseVoices();
      if (vietnameseVoices.length > 0) {
        utterance.voice = vietnameseVoices[0];
      }
    }

    // Set speech parameters
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;
  }

  private splitTextIntoChunks(text: string): string[] {
    const MAX_CHUNK_LENGTH = 200;
    const chunks: string[] = [];

    if (text.length <= MAX_CHUNK_LENGTH) {
      chunks.push(text);
      return chunks;
    }

    let startIndex = 0;
    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + MAX_CHUNK_LENGTH, text.length);

      // Try to end at a sentence boundary
      if (endIndex < text.length) {
        const nextPeriod = text.indexOf('.', endIndex - 50);
        if (nextPeriod > 0 && nextPeriod < endIndex + 50) {
          endIndex = nextPeriod + 1;
        }
      }

      chunks.push(text.substring(startIndex, endIndex));
      startIndex = endIndex;
    }

    return chunks;
  }

  // Stop speaking
  public stop(): void {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return
    }

    window.speechSynthesis.cancel()
    this.isSpeaking = false
    this.utterance = null
  }

  // Pause speaking
  public pause(): void {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return
    }

    window.speechSynthesis.pause()
  }

  // Resume speaking
  public resume(): void {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return
    }

    window.speechSynthesis.resume()
  }

  // Check if currently speaking
  public checkSpeaking(): boolean {
    return this.isSpeaking
  }

  // Test TTS functionality
  public testVoice(text = "Xin chào, đây là giọng đọc tiếng Việt."): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        resolve(false)
        return
      }

      try {
        const testUtterance = new SpeechSynthesisUtterance(text)
        testUtterance.onend = () => resolve(true)
        testUtterance.onerror = () => resolve(false)

        // Set a timeout in case the event handlers don't fire
        setTimeout(() => resolve(false), 3000)

        window.speechSynthesis.speak(testUtterance)
      } catch (error) {
        console.error("TTS test failed:", error)
        resolve(false)
      }
    })
  }
}

// Export a singleton instance
export const ttsService = new TTSService()

