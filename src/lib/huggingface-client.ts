import { HfInference } from "@huggingface/inference"

// Initialize the Hugging Face client with the token
const hfToken = process.env.HUGGING_FACE_TOKEN 
const hf = new HfInference(hfToken)

// Use a smaller model that's already loaded on Hugging Face
// const DEEPSEEK_MODEL_ID = "deepseek-ai/deepseek-coder-33b-instruct" // Too large (66GB)
const DEFAULT_MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct" // Smaller model that's available

// Function to generate text with reasoning model
export async function generateWithDeepSeek(
  prompt: string,
  options: {
    temperature?: number
    streamCallback?: (token: string) => void
    modelId?: string
  } = {},
) {
  try {
    const { temperature = 0.7, streamCallback, modelId = DEFAULT_MODEL_ID } = options

    // Use the specified model or default
    const modelToUse = modelId || DEFAULT_MODEL_ID

    if (streamCallback) {
      // Stream the response
      const stream = await hf.textGenerationStream({
        model: modelToUse,
        inputs: prompt,
        parameters: {
          temperature: temperature,
          max_new_tokens: 1024,
          return_full_text: false,
        },
      })

      let fullText = ""

      for await (const response of stream) {
        const token = response.token.text
        fullText += token
        streamCallback(token)
      }

      return fullText
    } else {
      // Get the full response at once
      const response = await hf.textGeneration({
        model: modelToUse,
        inputs: prompt,
        parameters: {
          temperature: temperature,
          max_new_tokens: 1024,
          return_full_text: false,
        },
      })

      return response.generated_text
    }
  } catch (error) {
    console.error(`Error calling model ${options.modelId || DEFAULT_MODEL_ID}:`, error)

    // Fallback to a more reliable model if the first one fails
    try {
      console.log("Trying fallback model...")
      const fallbackModel = "google/flan-t5-xxl" // Very reliable model

      if (options.streamCallback) {
        let fullText = ""
        const stream = await hf.textGenerationStream({
          model: fallbackModel,
          inputs: prompt,
          parameters: {
            temperature: options.temperature || 0.7,
            max_new_tokens: 512,
            return_full_text: false,
          },
        })

        for await (const response of stream) {
          const token = response.token.text
          fullText += token
          options.streamCallback(token)
        }

        return fullText
      } else {
        const response = await hf.textGeneration({
          model: fallbackModel,
          inputs: prompt,
          parameters: {
            temperature: options.temperature || 0.7,
            max_new_tokens: 512,
            return_full_text: false,
          },
        })

        return response.generated_text
      }
    } catch (fallbackError) {
      console.error("Fallback model also failed:", fallbackError)
      throw error // Throw the original error
    }
  }
}

export default {
  generateWithDeepSeek,
}

