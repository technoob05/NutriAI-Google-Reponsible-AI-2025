export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "thinking" | "system";
  timestamp: Date;
  reasoningSteps?: any[];
  isLoading?: boolean;
  mealPlan?: MealPlan;
  searchResults?: SearchResult[];
  searchQuery?: string;
  taskAnalysis?: TaskAnalysis;
  retrievedContext?: string[];
  streamingTokens?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastUpdatedAt: Date;
}

export interface OutputVersion {
  id: string;
  content: string;
  timestamp: Date;
  model: string;
  mealPlan?: MealPlan;
}

export interface MealPlan {
  type: "daily" | "weekly";
  days: Day[];
  isPersonalized?: boolean;
  personalizationReason?: string;
}

export interface Day {
  date: string;
  meals: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
  };
}

export interface Meal {
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
  factChecked?: boolean;
  source?: string;
}

export interface SearchResult {
  name: string;
  details: {
    relevance?: string;
    additionalInfo?: string;
    healthBenefits?: string[];
    cookingTips?: string[];
    [key: string]: any;
  };
}

export interface TaskAnalysis {
  taskType: "replace_meal" | "search_info" | "unknown";
  foodType: string;
  requiresConfirmation: boolean;
  suggestedResponse: string | null;
}

export interface AgentResponse {
  message: string;
  mealPlan?: MealPlan;
  searchResults?: SearchResult[];
  searchQuery?: string;
  taskAnalysis?: TaskAnalysis;
  retrievedContext?: string[];
  query: string;
  type: "daily" | "weekly";
  meals: Meal[];
  chatHistory: Message[];
  factCheckingReasoning?: string;
  ragReasoning?: string;
  chatReasoning?: string;
  planningReasoning?: string;
  contentReasoning?: string;
}

// Add serialization helpers
export const serializeDate = (date: Date) => date.toISOString();

export const deserializeDate = (dateStr: string) => new Date(dateStr);

// Add chat session serialization helpers
export const serializeChatSession = (session: ChatSession): string => {
  return JSON.stringify({
    ...session,
    createdAt: serializeDate(session.createdAt),
    lastUpdatedAt: serializeDate(session.lastUpdatedAt),
    messages: session.messages.map(msg => ({
      ...msg,
      timestamp: serializeDate(msg.timestamp)
    }))
  });
};

export const deserializeChatSession = (serialized: string): ChatSession => {
  const parsed = JSON.parse(serialized);
  return {
    ...parsed,
    createdAt: deserializeDate(parsed.createdAt),
    lastUpdatedAt: deserializeDate(parsed.lastUpdatedAt),
    messages: parsed.messages.map((msg: any) => ({
      ...msg,
      timestamp: deserializeDate(msg.timestamp)
    }))
  };
};
