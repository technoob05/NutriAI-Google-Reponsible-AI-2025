import type { GenerateContentRequest, Part } from "@google/generative-ai";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "thinking" | "system";
  timestamp: Date;
}

interface GenerativeModel {
  generateContent: (request: string | GenerateContentRequest | (string | Part)[]) => Promise<{
    response: {
      text: () => string;
    }
  }>;
  generateContentStream: (request: string | GenerateContentRequest | (string | Part)[]) => Promise<{
    stream: AsyncIterable<{text: () => string}>;
  }>;
}

interface GoogleGenerativeAIType {
  new(apiKey: string): {
    getGenerativeModel: (config: {
      model: string;
      generationConfig?: {
        temperature?: number;
        topP?: number;
        topK?: number;
      };
    }) => GenerativeModel;
  };
}

// Add StreamingCallback type
type StreamingCallback = (agent: string, token: string) => void;

// Update AgentContext to handle streaming properly
interface AgentContext {
  streamCallback?: StreamCallback;
  selectedModels?: Record<string, string>;
  webSearchEnabled?: boolean;
  realtimeReasoningEnabled?: boolean;
}

// Split models by API provider
const DEFAULT_GEMINI_MODELS = {
  reasoning: "gemini-2.0-flash-lite", // Use Gemini for core reasoning
  chat: "gemini-2.0-flash-lite", // Use Gemini for chat handling
}

const DEFAULT_HUGGINGFACE_MODELS = {
  search: "google/flan-t5-small", // Use HF for search
  factChecker: "google/flan-t5-small", // Use HF for fact checking
  contentWriter: "google/flan-t5-base", // Use HF for content
  vision: "google/flan-t5-base", // Use HF for vision
  embedding: "Qwen/Qwen1.5-0.5B", // Use HF for embeddings
}

// Update fallback models to be API-specific
const FALLBACK_MODELS = {
  gemini: [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-pro"
  ],
  huggingface: [
    "google/flan-t5-small",
    "Qwen/Qwen1.5-0.5B",
    "google/flan-t5-base",
    "facebook/bart-large-cnn",
  ]
}

// Import API keys from env files
const API_KEYS = {
  GEMINI: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
  HUGGINGFACE: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || process.env.HF_TOKEN,
  OPENAI: process.env.NEXT_PUBLIC_OPENAI_API_KEY
}

// Validate API keys
if (!API_KEYS.GEMINI) {
  console.error('Missing Gemini API key')
}

if (!API_KEYS.HUGGINGFACE) {
  console.error('Missing Hugging Face API key')
}

// Tạo mock class cho GoogleGenerativeAI
class MockGoogleGenerativeAI {
  constructor() {
    console.warn("Using mock GoogleGenerativeAI")
  }

  getGenerativeModel() {
    return {
      generateContent: async () => ({
        response: {
          text: () => "Không thể kết nối với Google Generative AI. Đang sử dụng phản hồi mặc định.",
        },
      }),
    }
  }
}

// Khởi tạo biến để lưu trữ GoogleGenerativeAI (thật hoặc giả)
let GoogleGenerativeAI: GoogleGenerativeAIType = MockGoogleGenerativeAI as unknown as GoogleGenerativeAIType

// Hàm để khởi tạo GoogleGenerativeAI một cách an toàn
async function initializeGoogleAI() {
  try {
    // Sử dụng dynamic import thay vì require
    const module = await import("@google/generative-ai")
    if (module && module.GoogleGenerativeAI) {
      GoogleGenerativeAI = module.GoogleGenerativeAI
      console.log("Successfully imported GoogleGenerativeAI")
      return true
    }
  } catch (error) {
    console.error("Error importing Google Generative AI:", error)
    // Tiếp tục sử dụng mock class đã khởi tạo
  }
  return false
}

// Gọi hàm khởi tạo
initializeGoogleAI().catch(console.error)

// Hugging Face integration
const Hf = require("@huggingface/inference").HfInference

const hf = new Hf(API_KEYS.HUGGINGFACE)

// Update model routing function
async function generateWithDeepSeek(
  prompt: string,
  options: {
    temperature?: number
    streamCallback?: (token: string) => void
    modelId?: string
  } = {},
) {
  const { temperature = 0.7, streamCallback, modelId } = options

  // Determine which API to use based on model ID
  const isGeminiModel = modelId?.includes("gemini") || false
  const isHuggingFaceModel = !isGeminiModel

  if (isHuggingFaceModel) {
    try {
      // Use Hugging Face API
      if (streamCallback) {
        // Stream response
        const stream = await hf.textGenerationStream({
          model: modelId,
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
        // Get full response
        const response = await hf.textGeneration({
          model: modelId || DEFAULT_HUGGINGFACE_MODELS.contentWriter,
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
      console.error(`Error with Hugging Face model ${modelId}:`, error)
      // Fall back to Gemini only as last resort
      return tryGeminiModels(prompt, temperature, streamCallback)
    }
  } else {
    // Use Gemini API
    return generateWithGemini(prompt, temperature, modelId || DEFAULT_GEMINI_MODELS.reasoning, streamCallback)
  }
}

// Helper function for Gemini fallbacks
async function tryGeminiModels(prompt: string, temperature: number, streamCallback?: (token: string) => void) {
  for (const fallbackModel of FALLBACK_MODELS.gemini) {
    try {
      return await generateWithGemini(prompt, temperature, fallbackModel, streamCallback)
    } catch (error) {
      console.error(`Error with fallback model ${fallbackModel}:`, error)
    }
  }
  throw new Error("All models failed")
}

// Mock sample meal data
const sampleMealData = [
  {
    name: "Phở",
    ingredients: ["bánh phở", "thịt bò", "nước dùng"],
    nutrition: {
      calories: 450,
      protein: 25,
      carbs: 65,
      fat: 10,
      sodium: 800,
    },
    preparation: "Nấu nước dùng gà với gừng và hành tây trong 2 giờ. Luộc thịt gà, xé nhỏ. Trụng bánh phở.",
    price: 45000,
  },
  {
    name: "Bún chả",
    ingredients: ["bún", "thịt nướng", "nước chấm"],
    nutrition: {
      calories: 550,
      protein: 30,
      carbs: 60,
      fat: 20,
      sodium: 900,
    },
    preparation: "Ướp thịt với hỗn hợp nước mắm, đường, tỏi, ớt trong 30 phút. Nướng thịt trên bếp than.",
    price: 50000,
  },
  {
    name: "Cơm tấm",
    ingredients: ["cơm", "sườn", "chả"],
    nutrition: {
      calories: 650,
      protein: 35,
      carbs: 70,
      fat: 25,
      sodium: 850,
    },
    preparation: "Ướp sườn với hỗn hợp nước mắm, đường, tỏi, ớt trong 1 giờ. Nướng sườn trên bếp than.",
    price: 55000,
  },
  {
    name: "Bánh mì",
    ingredients: ["bột mì", "thịt", "rau"],
    nutrition: {
      calories: 500,
      protein: 25,
      carbs: 55,
      fat: 20,
      sodium: 950,
    },
    preparation: "Ướp thịt với xả, tỏi, nước mắm, đường trong 30 phút. Nướng thịt.",
    price: 30000,
  },
  {
    name: "Gỏi cuốn",
    ingredients: ["bánh tráng", "tôm", "rau sống"],
    nutrition: {
      calories: 300,
      protein: 20,
      carbs: 35,
      fat: 8,
      sodium: 600,
    },
    preparation: "Luộc tôm và thịt chín. Cắt thịt thành lát mỏng. Nhúng bánh tráng vào nước.",
    price: 40000,
  },
  {
    name: "Cao lầu",
    ingredients: ["mì", "thịt xíu", "rau sống"],
    nutrition: {
      calories: 450,
      protein: 22,
      carbs: 60,
      fat: 15,
      sodium: 750,
    },
    preparation: "Xào thịt với nước mắm, đường, tỏi. Trụng mì. Bày thịt lên trên mì và thêm rau sống.",
    price: 45000,
  },
  {
    name: "Bún bò Huế",
    ingredients: ["bún", "thịt bò", "nước dùng"],
    nutrition: {
      calories: 550,
      protein: 30,
      carbs: 65,
      fat: 15,
      sodium: 950,
    },
    preparation: "Nấu nước dùng từ xương bò với sả, gừng. Luộc thịt bò và giò heo.",
    price: 55000,
  },
  {
    name: "Mì Quảng",
    ingredients: ["mì", "thịt gà", "rau sống"],
    nutrition: {
      calories: 500,
      protein: 28,
      carbs: 60,
      fat: 12,
      sodium: 800,
    },
    preparation: "Nấu nước dùng từ xương gà. Luộc thịt gà, xé nhỏ. Trụng mì.",
    price: 50000,
  },
]

// Khởi tạo API với xử lý lỗi
let genAI: any

// Hàm để khởi tạo Gemini API
async function initializeGeminiAPI() {
  try {
    // Đảm bảo GoogleGenerativeAI đã được khởi tạo
    const initialized = await initializeGoogleAI()
    if (!initialized) {
      throw new Error("Failed to initialize Google Generative AI")
    }

    if (!API_KEYS.GEMINI) {
      throw new Error("Missing Gemini API key") 
    }

    genAI = new GoogleGenerativeAI(API_KEYS.GEMINI)
    console.log("Successfully initialized Gemini API with key")
    return true
  } catch (error) {
    console.error("Error initializing Google Generative AI:", error)
    // Tạo một đối tượng giả để tránh lỗi runtime
    genAI = {
      getGenerativeModel: () => ({
        generateContent: async () => ({
          response: {
            text: () => "Không thể khởi tạo Google Generative AI. Đang sử dụng phản hồi mặc định.",
          },
        }),
      }),
    }
    return false
  }
}

// Khởi tạo Gemini API
initializeGeminiAPI().catch(console.error)

// Enhanced generateWithGemini function with streaming support
async function generateWithGemini(
  prompt: string,
  temperature = 0.7,
  modelOption = DEFAULT_GEMINI_MODELS.chat,
  streamCallback?: (token: string) => void,
) {
  try {
    // Đảm bảo API đã được khởi tạo
    if (!genAI) {
      await initializeGeminiAPI()
    }

    // Hỗ trợ nhiều model Gemini khác nhau
    const modelConfig = {
      model: modelOption,
      generationConfig: {
        temperature: temperature,
        topP: 0.95,
        topK: 40,
      },
    }

    console.log(`Using Gemini model: ${modelOption}`)
    const model = genAI.getGenerativeModel(modelConfig)

    // Handle streaming if callback is provided
    if (streamCallback) {
      try {
        const result = await model.generateContentStream(prompt)
        let fullText = ""

        for await (const chunk of result.stream) {
          const chunkText = chunk.text()
          fullText += chunkText
          streamCallback(chunkText)
        }

        return fullText
      } catch (streamError) {
        console.error("Error streaming from Gemini:", streamError)
        // Fall back to non-streaming approach
        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
      }
    } else {
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error)

    // Thử lại với model khác nếu có lỗi
    if (modelOption !== DEFAULT_GEMINI_MODELS.chat) {
      console.log("Falling back to default Gemini model")
      return generateWithGemini(prompt, temperature, DEFAULT_GEMINI_MODELS.chat, streamCallback)
    }

    // Thử lại với model khác nếu vẫn lỗi
    for (const fallbackModel of FALLBACK_MODELS.gemini) {
      if (fallbackModel !== modelOption) {
        try {
          console.log(`Trying with ${fallbackModel} as fallback`)
          if (streamCallback) streamCallback(`\nĐang thử với mô hình ${fallbackModel}...\n`)

          const modelConfig = {
            model: fallbackModel,
            generationConfig: {
              temperature: temperature,
              topP: 0.95,
              topK: 40,
            },
          }

          const model = genAI.getGenerativeModel(modelConfig)
          const result = await model.generateContent(prompt)
          const response = await result.response
          return response.text()
        } catch (fallbackError) {
          console.error(`Error with fallback model ${fallbackModel}:`, fallbackError)
        }
      }
    }

    // Trả về phản hồi dự phòng thay vì ném lỗi
    return "Không thể kết nối với Google Gemini API. Đang sử dụng phản hồi mặc định."
  }
}

// Define the agent system architecture
type Agent = {
  name: string
  role: string
  process: (
    input: AgentInputType,
    context: AgentContext
  ) => Promise<AgentResponse>;
}

// Add AgentInputType
interface AgentInputType extends Omit<AgentResponse, 'message'> {
  query: string;
  type: 'daily' | 'weekly';
  meals: Meal[];
  chatHistory: Message[];
  message: string;
}

// Thêm Management Agent vào đầu file, sau phần khai báo các agent khác
// Management Agent
const managementAgent: Agent = {
  name: "ManagementAgent",
  role: "Quản lý và phân phối nhiệm vụ giữa các agent",
  process: async (input, context) => {
    console.log("Management Agent processing...")

    const { query, chatHistory } = input
    const lowerQuery = query.toLowerCase()

    // Phân tích yêu cầu để xác định loại nhiệm vụ
    let taskType = "unknown"
    let foodType = ""

    // Kiểm tra yêu cầu thay đổi món ăn
    if (
      lowerQuery.includes("thay") ||
      lowerQuery.includes("đổi") ||
      lowerQuery.includes("không thích") ||
      lowerQuery.includes("món khác")
    ) {
      taskType = "replace_meal"

      // Xác định loại thực phẩm được đề cập
      if (lowerQuery.includes("cá")) foodType = "cá"
      else if (lowerQuery.includes("thịt")) foodType = "thịt"
      else if (lowerQuery.includes("rau")) foodType = "rau"
      else if (lowerQuery.includes("cơm")) foodType = "cơm"
      else if (lowerQuery.includes("bún")) foodType = "bún"
      else if (lowerQuery.includes("phở")) foodType = "phở"
    }
    // Kiểm tra yêu cầu tìm kiếm thông tin
    else if (
      lowerQuery.includes("tìm") ||
      lowerQuery.includes("thông tin") ||
      lowerQuery.includes("chi tiết") ||
      lowerQuery.includes("cách làm") ||
      lowerQuery.includes("dinh dưỡng của")
    ) {
      taskType = "search_info"
    }

    return {
      ...input,
      taskAnalysis: {
        taskType,
        foodType,
        requiresConfirmation: taskType === "replace_meal" && foodType !== "",
        suggestedResponse:
          taskType === "replace_meal" && foodType !== ""
            ? `Bạn có muốn thêm món ăn liên quan đến ${foodType} vào lịch không?`
            : null,
      },
    }
  },
}

// Thêm Search Agent
const searchAgent: Agent = {
  name: "SearchAgent",
  role: "Tìm kiếm thông tin chi tiết về món ăn",
  process: async (input, context) => {
    console.log("Search Agent processing...")

    const { query, meals } = input
    const lowerQuery = query.toLowerCase()

    // Xác định món ăn cần tìm kiếm
    let targetFood = ""
    let searchResults = []

    // Tìm món ăn được đề cập trong câu hỏi
    for (const meal of meals) {
      if (lowerQuery.includes(meal.name.toLowerCase())) {
        targetFood = meal.name
        searchResults.push({
          name: meal.name,
          details: {
            ...meal,
            additionalInfo: `Thông tin chi tiết về món ${meal.name}`,
            healthBenefits: [
              "Cung cấp protein chất lượng cao",
              "Giàu vitamin và khoáng chất",
              "Hỗ trợ sức khỏe tim mạch",
              "Tăng cường hệ miễn dịch",
            ],
            popularVariants: [
              `${meal.name} miền Bắc`,
              `${meal.name} miền Trung`,
              `${meal.name} miền Nam`,
              `${meal.name} chay`,
            ],
            cookingTips: [
              "Nên chọn nguyên liệu tươi ngon",
              "Gia vị vừa phải để giữ hương vị tự nhiên",
              "Thời gian nấu phù hợp để giữ dinh dưỡng",
              "Kết hợp với rau xanh để cân bằng bữa ăn",
            ],
          },
        })
        break
      }
    }

    // Nếu không tìm thấy món cụ thể, tìm kiếm theo từ khóa
    if (!targetFood) {
      const keywords = ["cá", "thịt", "rau", "cơm", "bún", "phở", "bánh"]
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          targetFood = keyword
          // Tìm các món liên quan đến từ khóa
          const relatedMeals = meals.filter(
            (meal) =>
              meal.name.toLowerCase().includes(keyword) ||
              meal.ingredients.some((ing) => ing.toLowerCase().includes(keyword)),
          )

          searchResults = relatedMeals.map((meal) => ({
            name: meal.name,
            details: {
              ...meal,
              relevance: `Món này có liên quan đến ${keyword}`,
              additionalInfo: `Thông tin chi tiết về món ${meal.name}`,
            },
          }))
          break
        }
      }
    }

    return {
      ...input,
      searchResults: searchResults.length > 0 ? searchResults : undefined,
      searchQuery: targetFood || query,
    }
  },
}

// Fact Checking Agent
const factCheckingAgent: Agent = {
  name: "FactChecker",
  role: "Xác thực thông tin về món ăn và dinh dưỡng",
  process: async (input, context) => {
    console.log("Fact Checking Agent processing...")

    try {
      // Generate cache key from meals data
      const mealsKey = JSON.stringify(input.meals.map(m => m.name));
      const cacheKey = cache.getKey(mealsKey, 'facts');
      const cachedResult = cache.get(cacheKey, 'facts');

      if (cachedResult) {
        console.log("Using cached fact check result");
        return {
          ...input,
          ...cachedResult,
          message: input.message
        };
      }

      // If no cache, perform fact checking
      const prompt = `Kiểm tra thông tin dinh dưỡng của các món ăn sau:
        ${JSON.stringify(input.meals, null, 2)}`;
      
      const factCheckingReasoning = await generateWithGemini(
        prompt, 
        0.3,
        context.selectedModels?.FactChecker || "google/flan-t5-large"
      );
      
      const result = {
        meals: input.meals.map(meal => ({
          ...meal,
          factChecked: true,
          source: "https://suckhoedoisong.vn/dinh-duong-169/"
        })),
        factCheckingReasoning,
        factCheckTimestamp: Date.now()
      };
      
      // Cache the result
      cache.set(cacheKey, result, 'facts');
      
      return {
        ...input,
        ...result,
        message: input.message
      };
    } catch (error) {
      console.error("Error in fact checking:", error);
      return {
        ...input,
        factCheckingReasoning: `Lỗi khi kiểm tra thông tin: ${error.message}`
      };
    }
  }
}

// RAG Agent
const ragAgent: Agent = {
  name: "RAGProcessor",
  role: "Kết hợp thông tin tra cứu với dữ liệu từ Recommendation System",
  process: async (input, context) => {
    console.log("RAG Agent processing...")

    try {
      const cacheKey = cache.getKey(input.query, 'rag');
      const cachedResult = cache.get(cacheKey, 'rag');
      if (cachedResult) {
        console.log("Using cached RAG result");
        return {
          ...input,
          ...cachedResult,
          message: input.message // Preserve the original message
        };
      }

      const prompt = `Truy xuất thông tin cho yêu cầu: ${input.query}`;
      const ragReasoning = await generateWithGemini(prompt, 0.3, context.selectedModels?.RAGProcessor || "gemini-2.0-flash-lite");
      
      const result = {
        ragReasoning,
        ragTimestamp: Date.now(),
        retrievedContext: ["Thông tin bổ sung về dinh dưỡng", "Thông tin về cách chế biến"],
        message: input.message // Preserve the original message
      };
      
      cache.set(cacheKey, result, 'rag');
      
      return {
        ...input,
        ...result
      };
    } catch (error) {
      console.error("Error in RAG processing:", error);
      return {
        ...input,
        ragReasoning: "Lỗi khi truy xuất thông tin: " + error.message
      };
    }
  }
}

// Reasoning and Planning Agent using DeepSeek
const reasoningAgent: Agent = {
  name: "ReasoningPlanner",
  role: "Suy luận và lập kế hoạch thực đơn",
  process: async (input, context) => {
    console.log("Reasoning Agent processing with AI model...")

    const { meals, query, type } = input
    const { streamCallback, selectedModels } = context || {}
    const modelId = selectedModels?.ReasoningPlanner || DEFAULT_GEMINI_MODELS.reasoning

    // Generate planning reasoning with DeepSeek
    let planningReasoning = ""
    try {
      const prompt = `Bạn là một chuyên gia dinh dưỡng đang lập kế hoạch thực đơn ${type === "daily" ? "ngày" : "tuần"} cho một người dùng.
      
Yêu cầu của người dùng: "${query}"

Hãy suy luận từng bước một cách chi tiết để tạo một thực đơn cân bằng:
1. Phân tích yêu cầu của người dùng: Họ muốn gì? Có yêu cầu đặc biệt không?
2. Xem xét các món ăn có sẵn và giá trị dinh dưỡng của chúng: Protein, carbs, chất béo
3. Cân nhắc sự đa dạng và cân bằng dinh dưỡng: Đảm bảo có đủ rau, protein, carbs
4. Phân bổ các món ăn vào các bữa trong ngày/tuần: Bữa sáng, trưa, tối
5. Đảm bảo tổng lượng calories, protein, carbs và chất béo phù hợp: Tính toán tổng lượng

Trả lời bằng tiếng Việt, chi tiết và có cấu trúc rõ ràng.`

      // Use DeepSeek with streaming if callback is provided
      planningReasoning = await generateWithDeepSeek(prompt, {
        temperature: 0.3,
        streamCallback: streamCallback,
        modelId: modelId,
      })
    } catch (error) {
      console.error("Error generating planning reasoning with AI model:", error)
      planningReasoning =
        "Không thể tạo phân tích chi tiết. Tuy nhiên, thực đơn đã được lập kế hoạch cẩn thận để đảm bảo cân bằng dinh dưỡng và phù hợp với nhu cầu của bạn."
    }

    try {
      // Create a meal plan
      const today = new Date()
      const days = []

      // Create a single day plan for daily type
      if (type === "daily") {
        days.push({
          date: "Hôm nay",
          meals: {
            breakfast: [meals[0], meals[6]],
            lunch: [meals[1], meals[4]],
            dinner: [meals[2], meals[5]],
          },
        })
      } else {
        // Create a week plan
        const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

        for (let i = 0; i < 7; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          const dayName = dayNames[date.getDay()]
          const dayOfMonth = date.getDate()
          const month = date.getMonth() + 1

          days.push({
            date: `${dayName}, ${dayOfMonth}/${month}`,
            meals: {
              breakfast: [meals[i % meals.length], meals[(i + 3) % meals.length]],
              lunch: [meals[(i + 1) % meals.length], meals[(i + 4) % meals.length]],
              dinner: [meals[(i + 2) % meals.length], meals[(i + 5) % meals.length]],
            },
          })
        }
      }

      return {
        ...input,
        mealPlan: {
          type,
          days,
        },
        planningReasoning,
      }
    } catch (error) {
      console.error("Error in reasoning process:", error)

      // Fallback to a simple meal plan if processing fails
      return {
        ...input,
        mealPlan: {
          type,
          days: [
            {
              date: "Hôm nay",
              meals: {
                breakfast: meals.slice(0, 2),
                lunch: meals.slice(2, 4),
                dinner: meals.slice(4, 6),
              },
            },
          ],
        },
        planningReasoning,
      }
    }
  },
}

// Content Writing Agent
const contentWritingAgent: Agent = {
  name: "ContentWriter",
  role: "Soạn nội dung thực đơn",
  process: async (input, context) => {
    console.log("Content Writing Agent processing...");

    const { mealPlan, query, type } = input;
    const { selectedModels } = context || {};
    
    const modelId = selectedModels?.ContentWriter || DEFAULT_HUGGINGFACE_MODELS.contentWriter;

    try {
      // Enhanced prompt for better conversational responses
      const prompt = `Với vai trò là một chuyên gia dinh dưỡng thân thiện, hãy tạo phản hồi cho yêu cầu thực đơn sau:

Yêu cầu: "${query}"
Loại thực đơn: ${type === "daily" ? "Thực đơn ngày" : "Thực đơn tuần"}

Yêu cầu về phong cách trả lời:
1. Giọng điệu thân thiện, gần gũi
2. Dùng câu mở đầu hấp dẫn và khác biệt
3. Nhấn mạnh điểm đặc biệt của thực đơn
4. Có thể thêm lời khuyên hữu ích
5. Kết thúc bằng lời mời góp ý hoặc câu hỏi tương tác

Một số mẫu câu mở đầu:
- "Tuyệt vời! Tôi đã thiết kế một thực đơn [đặc điểm] đặc biệt cho bạn..."
- "Dựa trên yêu cầu của bạn, tôi đề xuất một thực đơn [đặc điểm] như sau..."
- "Rất vui được giúp bạn! Hãy cùng khám phá thực đơn [đặc điểm] này nhé..."`;

      // Try with primary model first
      let response = "";
      try {
        response = await generateWithGemini(prompt, 0.7, modelId);
      } catch (primaryError) {
        console.warn("Primary model failed, falling back to flash-lite model");
        response = await generateWithGemini(prompt, 0.7, "gemini-2.0-flash-lite");
      }

      // If still no response, use template-based response
      if (!response) {
        response = createTemplatedResponse(type, mealPlan);
      }

      return {
        ...input,
        message: response,
        contentReasoning: "Generated with optimized prompt",
      };
    } catch (error) {
      console.error("Error in content writing:", error);
      return {
        ...input,
        message: createTemplatedResponse(type, mealPlan),
        contentReasoning: "Using fallback template response",
      };
    }
  }
};

// Add new helper function for template-based responses
function createTemplatedResponse(type: "daily" | "weekly", mealPlan: any): string {
  const mealCount = type === "daily" ? 3 : 21; // 3 meals/day * 7 days
  const totalCalories = calculateTotalCalories(mealPlan);
  const specialFeatures = identifySpecialFeatures(mealPlan);
  
  const templates = [
    `Tuyệt vời! Tôi đã chuẩn bị một thực đơn ${type === "daily" ? "ngày" : "tuần"} đặc biệt với ${mealCount} món ăn đa dạng và cân bằng dinh dưỡng. ${specialFeatures} Tổng calories trong ${type === "daily" ? "ngày" : "tuần"} là ${totalCalories}kcal, rất phù hợp cho chế độ ăn uống lành mạnh.

Bạn có thể xem chi tiết từng món bên dưới. Đừng ngần ngại cho tôi biết nếu bạn muốn điều chỉnh bất kỳ món nào nhé!`,

    `Rất vui được giúp bạn! Dưới đây là thực đơn ${type === "daily" ? "ngày" : "tuần"} được thiết kế riêng với ${mealCount} món ăn ngon và bổ dưỡng. ${specialFeatures} Mỗi món đều được tính toán cẩn thận về mặt dinh dưỡng, đảm bảo cung cấp đủ năng lượng và dưỡng chất cho cơ thể.

Hãy khám phá chi tiết từng món và cho tôi biết nếu bạn muốn thay đổi gì nhé!`,

    `Tuyệt! Dựa trên yêu cầu của bạn, tôi đã tạo một thực đơn ${type === "daily" ? "ngày" : "tuần"} với ${mealCount} món ăn hấp dẫn. ${specialFeatures} Mỗi bữa đều được cân đối về protein, carbs và chất béo, giúp bạn duy trì chế độ ăn khoa học và lành mạnh.

Bạn có thể tham khảo chi tiết bên dưới và đừng quên cho tôi biết nếu cần điều chỉnh món nào!`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function calculateTotalCalories(mealPlan: any): number {
  // Add calculation logic here
  return 2000; // Placeholder
}

function identifySpecialFeatures(mealPlan: any): string {
  // Add logic to identify special features
  return "Thực đơn được thiết kế đa dạng với các món Á - Âu, đảm bảo cả dinh dưỡng và khẩu vị.";
}

// Chat Processing Agent
const chatAgent: Agent = {
  name: "ChatProcessor",
  role: "Xử lý các câu hỏi và yêu cầu của người dùng",
  process: async (input, context) => {
    console.log("Chat Agent processing...")

    const { query, meals, mealPlan, chatHistory, taskAnalysis, searchResults } = input
    const { streamCallback, selectedModels } = context || {}
    const modelId = selectedModels?.ChatProcessor || DEFAULT_GEMINI_MODELS.chat

    // Xây dựng prompt dựa trên kết quả phân tích và tìm kiếm
    let additionalContext = ""

    if (taskAnalysis) {
      additionalContext += `\nPhân tích nhiệm vụ: ${JSON.stringify(taskAnalysis, null, 2)}`
    }

    if (searchResults) {
      additionalContext += `\nKết quả tìm kiếm: ${JSON.stringify(searchResults.slice(0, 1), null, 2)}`
    }

    // Check if this is a follow-up question or request
    if (chatHistory.length > 2) {
      try {
        // Generate chat reasoning with DeepSeek
        let chatReasoning = ""
        try {
          const prompt = `Bạn là một trợ lý ảo chuyên về dinh dưỡng và ẩm thực Việt Nam.
          
          Hãy phân tích yêu cầu của người dùng và mô tả quá trình suy nghĩ để trả lời:
          
          Yêu cầu của người dùng: "${query}"
          
          Hãy suy luận từng bước:
          1. Phân loại loại yêu cầu (câu hỏi thông tin, yêu cầu thay đổi món, phản hồi, v.v.)
          2. Xác định thông tin cần thiết để trả lời
          3. Tìm kiếm thông tin liên quan từ dữ liệu có sẵn
          4. Cấu trúc câu trả lời phù hợp
          
          Trả lời bằng tiếng Việt, chi tiết và có cấu trúc rõ ràng.`

          // Use DeepSeek with streaming if callback is provided
          chatReasoning = await generateWithDeepSeek(prompt, {
            temperature: 0.3,
            streamCallback: streamCallback,
            modelId: modelId,
          })
        } catch (error) {
          console.error("Error generating chat reasoning with DeepSeek:", error)
          chatReasoning = "Không thể tạo phân tích chi tiết. Tuy nhiên, yêu cầu của bạn đã được xử lý cẩn thận."
        }

        // Process the chat request with Gemini
        const prompt = `Bạn là một trợ lý ảo chuyên về dinh dưỡng và ẩm thực Việt Nam. Hãy trả lời yêu cầu của người dùng.

Thông tin về các món ăn có sẵn:
${JSON.stringify(meals.slice(0, 3), null, 2)}

Thực đơn hiện tại:
${JSON.stringify(mealPlan, null, 2)}

Lịch sử trò chuyện:
${chatHistory
  .slice(-3)
  .map((msg: any) => `${msg.role === "user" ? "Người dùng" : "Trợ lý"}: ${msg.content}`)
  .join("\n")}

Yêu cầu hiện tại của người dùng: "${query}"

Phân tích chi tiết về yêu cầu:
1. Xác định xem người dùng có đang yêu cầu thay đổi món ăn không
2. Nếu yêu cầu thay đổi, xác định họ muốn thay đổi gì cụ thể (ít calories, nhiều protein, món chay, ít cay...)
3. Xác định món ăn nào cần thay đổi

Sau đó, hãy trả lời yêu cầu của người dùng một cách đầy đủ. Nếu họ muốn thay đổi món ăn, hãy đề xuất món thay thế phù hợp.
Nếu họ hỏi về thông tin dinh dưỡng hoặc cách chế biến, hãy cung cấp thông tin chi tiết.
Nếu họ hỏi về lợi ích sức khỏe, hãy giải thích rõ ràng.

Giữ giọng điệu trò chuyện và thân thiện. Trả lời bằng tiếng Việt.`

        // Sử dụng model Gemini cho quá trình reasoning
        const response = await generateWithGemini(prompt, 0.7, DEFAULT_GEMINI_MODELS.reasoning)

        // Check if this is a request to change a meal
        const isChangeMealRequest =
          query.toLowerCase().includes("đổi") ||
          query.toLowerCase().includes("thay") ||
          query.toLowerCase().includes("không thích") ||
          query.toLowerCase().includes("món khác")

        // If it's a change meal request, modify the meal plan
        let updatedMealPlan = mealPlan
        if (isChangeMealRequest && mealPlan && mealPlan.days) {
          // Simple implementation: just swap some meals around
          updatedMealPlan = {
            ...mealPlan,
            days: mealPlan.days.map((day) => {
              // Randomly select different meals for each category
              return {
                ...day,
                meals: {
                  breakfast: [
                    meals[Math.floor(Math.random() * meals.length)],
                    meals[Math.floor(Math.random() * meals.length)],
                  ],
                  lunch: [
                    meals[Math.floor(Math.random() * meals.length)],
                    meals[Math.floor(Math.random() * meals.length)],
                  ],
                  dinner: [
                    meals[Math.floor(Math.random() * meals.length)],
                    meals[Math.floor(Math.random() * meals.length)],
                  ],
                },
              }
            }),
          }
        } else if (isChangeMealRequest) {
          // If mealPlan doesn't exist yet, create a new one
          const today = new Date()
          updatedMealPlan = {
            type: "daily",
            days: [
              {
                date: "Hôm nay",
                meals: {
                  breakfast: [meals[0], meals[1]],
                  lunch: [meals[2], meals[3]],
                  dinner: [meals[4], meals[5]],
                },
              },
            ],
          }
        }

        return {
          ...input,
          message: response,
          mealPlan: updatedMealPlan,
          chatReasoning,
        }
      } catch (error) {
        console.error("Error in chat processing:", error)
        return {
          ...input,
          message: "Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này. Bạn có thể thử lại với câu hỏi khác không?",
          chatReasoning: "Đã xảy ra lỗi khi xử lý yêu cầu chat.",
        }
      }
    }

    // If not a follow-up, just pass through the input
    return input
  },
}

// UX/UI Coding Agent (optimized)
const UI_TEMPLATE_CACHE = new Map<string, string>();

const uxUiAgent: Agent = {
  name: "UXUIDesigner",  
  role: "Thiết kế và tối ưu giao diện người dùng",
  process: async (input, context) => {
    console.log("UX/UI Agent processing...")

    const { selectedModels } = context || {}
    const modelId = selectedModels?.UXUIDesigner || DEFAULT_HUGGINGFACE_MODELS.search
    
    // Generate cache key from input
    const cacheKey = `ui-${JSON.stringify(input.mealPlan || {})}-${input.type}`
    
    // Check cache first
    const cached = UI_TEMPLATE_CACHE.get(cacheKey)
    if (cached) {
      return {
        ...input,
        uiSuggestions: cached
      }
    }

    try {
      // Use a simpler prompt for better reliability
      const prompt = `Tối ưu giao diện cho thực đơn sau:
      ${JSON.stringify(input.mealPlan || {}, null, 2)}
      
      Yêu cầu:
      1. Layout responsive và tối ưu cho mobile
      2. Animations cho user interactions
      3. Accessible và thân thiện với người dùng
      4. Dark mode support
      5. Loading states và error handling
      
      Format phản hồi:
      1. Layout suggestions
      2. Component structure
      3. Animation specs
      4. Accessibility guidelines
      5. Responsive breakpoints`

      // Try primary model
      let response
      try {
        response = await generateWithGemini(prompt, 0.7, modelId)
      } catch (error) {
        console.warn("Primary UX/UI model failed, using fallback")
        // Use flash-lite as fallback
        response = await generateWithGemini(prompt, 0.7, "gemini-2.0-flash-lite")
      }

      // If still no response, use cached template
      if (!response) {
        response = getFallbackTemplate(input.type)
      }
      
      // Cache the result
      UI_TEMPLATE_CACHE.set(cacheKey, response)
      
      return {
        ...input,
        uiSuggestions: response,
      }
    } catch (error) {
      console.error("Error in UX/UI processing:", error)
      // Return fallback template on error
      return {
        ...input,
        uiSuggestions: getFallbackTemplate(input.type)
      }
    }
  },
}

// Add fallback template function
function getFallbackTemplate(type: 'daily' | 'weekly'): string {
  return `# Default UI Template for ${type} meal plan

## Layout Structure
- Responsive grid layout
- Card-based meal display
- Collapsible sections
- Mobile-first approach

## Components
- MealCard with quick actions
- NutritionChart with animations
- Interactive calendar for weekly view
- Loading skeletons

## Animations
- Fade in on load
- Smooth transitions
- Loading states

## Responsive Design
- Mobile: Single column
- Tablet: Two columns
- Desktop: Three columns

## Accessibility
- ARIA labels
- Keyboard navigation
- High contrast mode`
}

// Memory System
const memorySystem = {
  conversations: new Map<string, any[]>(),

  saveInteraction: function (userId: string, interaction: any) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, [])
    }

    const userConversation = this.conversations.get(userId)
    if (userConversation) {
      userConversation.push(interaction)
    }
  },

  getHistory: function (userId: string) {
    return this.conversations.get(userId) || []
  },
}

// Main agent orchestrator
export async function processUserMessage(
  message: string,
  chatHistory: Message[],
  progressCallback?: (agent: string, status: "pending" | "processing" | "completed" | "error", output?: string) => void,
  streamCallback?: StreamingCallback,
  selectedModels?: Record<string, string>,
  options?: {
    webSearchEnabled?: boolean;
    realtimeReasoningEnabled?: boolean;
  }
): Promise<AgentResponse> {
  // Determine the type of request
  const isDailyPlan = message.toLowerCase().includes("theo ngày")
  const isWeeklyPlan = message.toLowerCase().includes("theo tuần")

  // If neither, try to infer from context
  const type = isDailyPlan ? "daily" : isWeeklyPlan ? "weekly" : "daily"

  // Get sample meal data (in a real system, this would come from a recommendation system)
  const meals = sampleMealData || []

  // Initial input
  let agentInput: AgentInputType = {
    query: message,
    type,
    meals,
    chatHistory,
    message: '',
  }

  // Create a context object to pass to agents
  const context: AgentContext = {
    streamCallback: wrapStreamCallback(streamCallback),
    selectedModels,
    webSearchEnabled: options?.webSearchEnabled,
    realtimeReasoningEnabled: options?.realtimeReasoningEnabled
  }

  // Only perform web search if enabled
  if (context.webSearchEnabled) {
    // Web search logic
  }

  // Only show reasoning steps if enabled
  if (context.realtimeReasoningEnabled) {
    // Reasoning steps logic
  }

  // Process through agent pipeline
  try {
    // Check if this is an initial request or a follow-up
    const isInitialRequest = chatHistory.length <= 2 || isDailyPlan || isWeeklyPlan

    if (isInitialRequest) {
      // Initial request flow - generate a meal plan

      // 1. Fact Checking - Run in parallel with RAG for optimization
      const factCheckingPromise = (async () => {
        progressCallback?.("FactChecker", "processing")
        try {
          const result = await factCheckingAgent.process(agentInput, context)
          progressCallback?.("FactChecker", "completed", result.factCheckingReasoning)
          return result
        } catch (error) {
          progressCallback?.("FactChecker", "error", String(error))
          throw error
        }
      })()

      // 2. RAG Processing - Run in parallel with Fact Checking for optimization
      const ragPromise = (async () => {
        progressCallback?.("RAGProcessor", "processing")
        try {
          const result = await ragAgent.process(agentInput, context)
          progressCallback?.("RAGProcessor", "completed", result.ragReasoning)
          return result
        } catch (error) {
          progressCallback?.("RAGProcessor", "error", String(error))
          throw error
        }
      })()

      // Wait for both to complete
      const [factCheckingResult, ragResult] = await Promise.all([factCheckingPromise, ragPromise])

      // Merge results
      agentInput = {
        ...agentInput,
        ...factCheckingResult,
        ragReasoning: ragResult.ragReasoning,
      }

      // 3. Reasoning and Planning with DeepSeek
      progressCallback?.("ReasoningPlanner", "processing")
      try {
        // Create a token stream handler for DeepSeek
        const handleDeepSeekToken = (token: string) => {
          streamCallback?.("ReasoningPlanner", token)
        }

        agentInput = await reasoningAgent.process(agentInput, {
          streamCallback: handleDeepSeekToken,
          selectedModels,
        })
        progressCallback?.("ReasoningPlanner", "completed", agentInput.planningReasoning)
      } catch (error) {
        progressCallback?.("ReasoningPlanner", "error", String(error))
        throw error
      }

      // 4. Content Writing
      progressCallback?.("ContentWriter", "processing")
      try {
        agentInput = await contentWritingAgent.process(agentInput, context)
        progressCallback?.("ContentWriter", "completed", agentInput.contentReasoning)
      } catch (error) {
        progressCallback?.("ContentWriter", "error", String(error))
        throw error
      }
    } else {
      // Follow-up request flow - first analyze with Management Agent
      progressCallback?.("ManagementAgent", "processing")
      try {
        agentInput = await managementAgent.process(agentInput, context)
        progressCallback?.("ManagementAgent", "completed")

        // Dựa vào phân tích của Management Agent để quyết định tiếp theo
        const { taskAnalysis } = agentInput

        if (taskAnalysis?.taskType === "search_info") {
          // Nếu là yêu cầu tìm kiếm, gọi Search Agent
          progressCallback?.("SearchAgent", "processing")
          try {
            agentInput = await searchAgent.process(agentInput, context)
            progressCallback?.("SearchAgent", "completed", JSON.stringify(agentInput.searchResults, null, 2))
          } catch (error) {
            progressCallback?.("SearchAgent", "error", String(error))
            throw error
          }
        } else if (taskAnalysis?.taskType === "replace_meal") {
          // Nếu là yêu cầu thay đổi món ăn, gọi Recommendation Agent (sử dụng ChatProcessor)
          progressCallback?.("RecommendationAgent", "processing")
          try {
            // Thêm thông tin về loại thực phẩm cần thay thế vào context
            const recommendationContext = {
              ...context,
              foodType: taskAnalysis.foodType,
              isRecommendation: true,
              streamCallback: (token: string) => {
                streamCallback?.("RecommendationAgent", token)
              },
            }

            // Sử dụng ChatProcessor làm RecommendationAgent
            agentInput = await chatAgent.process(agentInput, recommendationContext)
            progressCallback?.("RecommendationAgent", "completed", "Đã đề xuất các món thay thế phù hợp.")
          } catch (error) {
            progressCallback?.("RecommendationAgent", "error", String(error))
            throw error
          }
        }

        // Sau đó gọi Chat Processor để xử lý phản hồi
        progressCallback?.("ChatProcessor", "processing")
        try {
          // Create a token stream handler for DeepSeek
          const handleDeepSeekToken = (token: string) => {
            streamCallback?.("ChatProcessor", token)
          }

          agentInput = await chatAgent.process(agentInput, {
            streamCallback: handleDeepSeekToken,
            selectedModels,
          })
          progressCallback?.("ChatProcessor", "completed", agentInput.chatReasoning)
        } catch (error) {
          progressCallback?.("ChatProcessor", "error", String(error))
          throw error
        }
      } catch (error) {
        progressCallback?.("ManagementAgent", "error", String(error))
        throw error
      }
    }

    // 5. UX/UI Design (optimized)
    progressCallback?.("UXUIDesigner", "processing")
    try {
      agentInput = await uxUiAgent.process(agentInput, context)
      progressCallback?.("UXUIDesigner", "completed")
    } catch (error) {
      progressCallback?.("UXUIDesigner", "error", String(error))
      throw error
    }

    // Save to memory
    memorySystem.saveInteraction("user1", {
      timestamp: new Date(),
      query: message,
      response: agentInput.message,
      mealPlan: agentInput.mealPlan,
    })

    return {
      message: agentInput.message,
      mealPlan: agentInput.mealPlan,
      query: agentInput.query,
      type: agentInput.type,
      meals: agentInput.meals,
      chatHistory: agentInput.chatHistory,
      searchResults: agentInput.searchResults,
      searchQuery: agentInput.searchQuery,
      taskAnalysis: agentInput.taskAnalysis,
    }
  } catch (error) {
    console.error("Error in agent pipeline:", error)
    throw error
  }
}

// Add this default export
export default {
  processUserMessage,
}

// Add proper interfaces
interface AgentResponse {
  message: string;
  mealPlan?: MealPlan;
  searchResults?: SearchResult[] | undefined; // Change null to undefined
  searchQuery?: string;
  taskAnalysis?: TaskAnalysis; // Use TaskAnalysis interface
  query: string;
  type: 'daily' | 'weekly';
  meals: Meal[];
  chatHistory: Message[];
  factCheckingReasoning?: string;
  ragReasoning?: string;
  chatReasoning?: string;
  planningReasoning?: string;
  contentReasoning?: string;
}

interface MealPlan {
  type: 'daily' | 'weekly';
  days: Day[];
}

interface Day {
  date: string;
  meals: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
  };
}

interface Meal {
  name: string;
  ingredients: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
  };
  preparation: string;
  price: number;
}

interface SearchResult {
  name: string;
  details: {
    relevance?: string;
    additionalInfo?: string;
    healthBenefits?: string[];
    cookingTips?: string[];
  };
}

interface TaskAnalysis {
  taskType: string;  // Remove the union type to match implementation
  foodType: string;
  requiresConfirmation: boolean;
  suggestedResponse: string | null;
}

// Update streaming callback types
type StreamCallback = (token: string) => void;

// Add wrapper for stream callbacks
const wrapStreamCallback = (agentCallback?: StreamingCallback): StreamCallback | undefined => {
  if (!agentCallback) return undefined;
  return (token: string) => agentCallback("agent", token);
};

// Add cache system at the top of file
const cache: CacheSystem = {
  storage: {
    rag: new Map<string, CacheEntry>(),
    facts: new Map<string, CacheEntry>(),
  },
  getKey: (input: string, type: CacheType) => `${type}-${input.toLowerCase().trim()}`,
  MAX_SIZE: 100,
  
  set(key: string, value: any, type: CacheType) {
    const targetCache = this.storage[type];
    if (targetCache.size >= this.MAX_SIZE) {
      const firstKey = targetCache.keys().next().value;
      targetCache.delete(firstKey);
    }
    targetCache.set(key, {
      value,
      timestamp: Date.now()
    });
  },

  get(key: string, type: CacheType, maxAge = 3600000) {
    const targetCache = this.storage[type];
    const entry = targetCache.get(key);
    if (entry && (Date.now() - entry.timestamp) < maxAge) {
      return entry.value;
    }
    return null;
  }
};

