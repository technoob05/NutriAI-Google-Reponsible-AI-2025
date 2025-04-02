# Vietnamese Food System

Welcome to the **Vietnamese Food System**, a sophisticated Next.js application engineered to revolutionize the exploration and interaction with Vietnamese cuisine. This project leverages a cutting-edge **Multiple Agents system** architecture and advanced AI capabilities, positioning itself as potentially the **first dedicated Vietnamese food recommendation system in Vietnam**. Our goal is to provide an unparalleled, intelligent, and immersive culinary discovery experience.

## Demo Video
[![Watch the video](https://img.youtube.com/vi/sl0zUNKbPOM/maxresdefault.jpg)](https://youtu.be/sl0zUNKbPOM)

## ✨ Features

This application is packed with features designed for an interactive and intelligent exploration of Vietnamese cuisine:

*   **Modern Web Interface:** Built using the latest Next.js 14 framework and React 18, ensuring a fast, efficient, and modern user experience.
*   **Stylish and Responsive UI:** Leverages Tailwind CSS for utility-first styling and Shadcn UI components for a set of accessible and reusable UI elements, resulting in a clean, consistent, and responsive design across different devices.
*   **Multi-Agent AI Chat Interface:** Engage in dynamic conversations about Vietnamese food with an intelligent system powered by multiple specialized AI agents. This feature utilizes Retrieval-Augmented Generation (RAG) to provide informed, context-aware responses, drawing from a comprehensive knowledge base of Vietnamese cuisine.
*   **AI-Generated Food Illustrations:** Visualize Vietnamese dishes with stunning images generated on-the-fly using the Google API, enhancing the browsing and learning experience.
*   **Document Interaction:** Upload and interact with documents related to Vietnamese recipes or culinary information, enabling AI-powered analysis and question answering on specific content.
*   **Voice Input:** Hands-free interaction with the application using voice commands, making it easier to search for recipes or ask questions while cooking.
*   **Web Search Integration:** Seamlessly integrates web search capabilities to fetch real-time information, images, and details about Vietnamese dishes, ingredients, and cooking techniques directly within the application.
*   **Intelligent Meal Planning:** Assists users in planning Vietnamese meals, offering recipe suggestions based on dietary preferences, available ingredients, or nutritional goals.
*   **Text-to-Speech (TTS):** Provides audio output for recipes, instructions, or chat responses, enhancing accessibility and allowing users to follow along without needing to constantly look at the screen.
*   **TypeScript for Enhanced Development:** Written in TypeScript, adding static typing to JavaScript, which improves code maintainability, reduces errors, and enhances the developer experience.

## 🏗️ Project Structure

The project is structured to clearly separate concerns and improve maintainability:

*   **`public/`**: Contains static assets such as images, icons, and other files served directly to the browser.
*   **`src/app/`**: The core application directory in Next.js 14, using the App Router.
    *   **`src/app/api/`**: API routes for backend functionality, such as data fetching or AI integrations (including the chat and image generation endpoints).
    *   **`src/app/page.tsx`**: The main homepage of the application.
    *   **`src/app/layout.tsx`**: Defines the root layout for the application, including global styles and structure.
*   **`src/components/`**: React components used throughout the application. This directory is further organized:
    *   **`src/components/ui/`**: Reusable UI components built with Shadcn UI, ensuring consistency and a polished look.
    *   Contains components specific to features like `agent-reasoning.tsx`, `chat-interface-with-rag.tsx`, `meal-plan.tsx`, `voice-assistant-input.tsx`, etc.
*   **`src/lib/`**: Utility libraries and helper functions, including services for the multi-agent system (`agent-system.ts`, `agent-system-rag.ts`), AI integrations (`image-generation-service.ts`, `huggingface-client.ts`), RAG (`rag-service.ts`), TTS (`tts-service.ts`), data handling, and theming.
*   **`src/types/`**: TypeScript type definitions for data structures and interfaces used in the project.
*   **`src/workers/`**: Web workers for offloading heavy tasks from the main thread, improving performance and responsiveness.
*   **Configuration Files**: Root files like `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `package.json` manage the project's build, styling, TypeScript settings, and dependencies.

## 💻 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **UI Library:** [React](https://reactjs.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **AI Libraries:**
    *   [@google/generative-ai](https://github.com/google/generative-ai-js) (Used for chat and image generation)
    *   [@huggingface/inference](https://github.com/huggingface/huggingface.js/tree/main/packages/inference)
    *   [Vercel AI SDK](https://sdk.vercel.ai/)
*   **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (Version 20.x or later recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)
*   API Keys: You will need API keys for Google AI services (Generative AI for chat/image generation). Set these up as environment variables (refer to `.env.example` if available, or create a `.env.local` file).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone "https://github.com/technoob05/NutriAI-Google-Reponsible-AI-2025"
    cd version5
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add your API keys:
    ```
    GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
    # Add other necessary environment variables
    
   NEXT_PUBLIC_OPENAI_API_KEY
   
   NEXT_PUBLIC_GOOGLE_API_KEY
   
   NEXT_PUBLIC_HUGGINGFACE_API_KEY
   
   HF_TOKEN
   
   GEMINI_API_KEY

    ```

### Running the Development Server

To start the application in development mode:

```bash
npm run dev
