import { GoogleGenerativeAI } from "@google/generative-ai";

interface ImageGenResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

class ImageGenerationService {
  private genAI: any;

  constructor() {
    // Initialize with API key and proper configuration
    if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
      console.error('Missing Google API key');
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
  }

  async generateMealImage(mealName: string, description?: string): Promise<ImageGenResponse> {
    try {
      if (!this.genAI) {
        throw new Error('GoogleGenerativeAI not initialized');
      }

      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp-image-generation",
        generationConfig: {
          temperature: 0.4,
          topP: 1,
          topK: 32
        }
      });

      const prompt = {
        contents: [{
          parts: [{
            text: `Create a professional, appetizing photo of ${mealName}. 
              ${description ? `The dish should show: ${description}` : ''}
              Style: Professional food photography, top-down view, natural lighting, on a clean white plate`
          }]
        }],
        generationConfig: {
          responseModalities: ["Text", "Image"]
        }
      };

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // Extract image from parts
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return {
            success: true,
            imageUrl: `data:image/png;base64,${part.inlineData.data}`
          };
        }
      }

      throw new Error('No image generated in response');
      
    } catch (error) {
      console.error('Error generating image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image'
      };
    }
  }
}

export const imageGenerationService = new ImageGenerationService();
