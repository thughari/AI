
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { AgentResponse, Source } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

const API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;
let serviceInitializationError: string | null = null;

const SYSTEM_INSTRUCTION = `You are CodeMaster, an expert AI programming assistant. Your primary goal is to assist the user in solving complex coding problems across a wide range of programming languages (including but not limited to Python, JavaScript, Java, C++, C#, Go, Rust, TypeScript, and more).
- Provide clear, efficient, well-commented, and idiomatic code solutions.
- Explain algorithms, data structures, design patterns, and the logic behind your solutions.
- Assist with debugging code and identifying potential issues or improvements.
- When a specific library, API, or very recent language feature is mentioned, use your Google Search tool to fetch precise documentation or examples. Otherwise, rely on your extensive training data.
- Format ALL code snippets, commands, and technical terms using Markdown (e.g., \`\`\`python ... \`\`\` for code blocks, \`functionName()\` for inline code).
- If a problem is underspecified, ask clarifying questions before attempting a solution.
- If you provide multiple approaches, discuss the trade-offs of each.
- Maintain a helpful, encouraging, and professional tone.`;

if (!API_KEY) {
  serviceInitializationError = "API Key not found. Please ensure the API_KEY environment variable is set.";
  console.error(serviceInitializationError);
} else {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    // Initialize the chat session
    chatSession = ai.chats.create({
        model: GEMINI_MODEL_NAME,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }], // Enable Google Search grounding for the chat
        }
    });
  } catch (e: unknown) {
    console.error("Failed to initialize GoogleGenAI or Chat session:", e);
    if (e instanceof Error) {
        serviceInitializationError = `Failed to initialize AI service: ${e.message}`;
    } else {
        serviceInitializationError = `Failed to initialize AI service: Unknown error occurred.`;
    }
  }
}

export function getInitializationError(): string | null {
  return serviceInitializationError;
}

// Define a more specific type for the expected structure of web sources in grounding data
interface GroundingWebSource {
  uri: string;
  title?: string;
}

interface GroundingChunk {
 web?: GroundingWebSource;
 retrievedContext?: {
    uri: string;
    title?: string;
 };
}

function extractSources(response: GenerateContentResponse): Source[] {
  const sources: Source[] = [];
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

  if (!groundingMetadata) {
    return [];
  }

  const processChunk = (chunk: any) => { 
    let webSource: GroundingWebSource | undefined;
    if (chunk?.web && typeof chunk.web.uri === 'string') {
      webSource = chunk.web;
    } else if (chunk?.retrievedContext && typeof chunk.retrievedContext.uri === 'string') { 
      webSource = chunk.retrievedContext;
    }

    if (webSource) {
      sources.push({
        uri: webSource.uri,
        title: webSource.title || webSource.uri, 
      });
    }
  };
  
  if (groundingMetadata.groundingChunks && Array.isArray(groundingMetadata.groundingChunks)) {
    (groundingMetadata.groundingChunks as GroundingChunk[]).forEach(processChunk);
  } 

  const uniqueSourcesMap = new Map<string, Source>();
  sources.forEach(source => {
    if (!uniqueSourcesMap.has(source.uri)) {
      uniqueSourcesMap.set(source.uri, source);
    }
  });
  return Array.from(uniqueSourcesMap.values());
}


export async function processUserCommand(command: string): Promise<AgentResponse> {
  if (serviceInitializationError) {
    throw new Error(serviceInitializationError);
  }
  if (!ai) {
     throw new Error("AI Service not available. API key might be missing or invalid.");
  }
  if (!chatSession) {
    throw new Error("Chat Session not initialized. Cannot process command. Try restarting the chat.");
  }

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({ message: command });
    const text = response.text; 
    const sources = extractSources(response);
    return { text, sources };

  } catch (error: unknown) {
    console.error("Error processing command with Gemini API (Chat):", error);
    let errorMessage = "Sorry, I encountered an error trying to process your request.";
    if (error instanceof Error) {
        // Check for specific error content related to 500 errors or similar generic server issues
        if (error.message.includes("500") || error.message.toLowerCase().includes("internal error") || error.message.toLowerCase().includes("server error")) {
            errorMessage = "The AI service encountered an internal error. This is usually a temporary issue on the server side. Please try again in a few moments.";
        } else if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
            errorMessage = "Your API Key is invalid or has expired. Please check your configuration and refresh.";
        } else if (error.message.includes("quota") || (error as any).status === 429) { // Assuming 429 might come as a status property
             errorMessage = "The request quota has been reached or I'm too busy right now. Please try again later.";
        } else {
            errorMessage += ` Details: ${error.message}`;
        }
    }    
    throw new Error(errorMessage);
  }
}

export function restartChatSession(): void {
  if (!ai) {
    throw new Error("AI Service not initialized. Cannot restart chat session.");
  }

  try {
    console.log("Restarting chat session with CodeMaster persona...");
    chatSession = ai.chats.create({
        model: GEMINI_MODEL_NAME,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION, // Uses the updated CodeMaster system instruction
            tools: [{ googleSearch: {} }],
        }
    });
    console.log("Chat session restarted successfully.");
  } catch (e: unknown) {
    console.error("Failed to re-initialize chat session:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown error during chat session restart.";
    throw new Error(`Failed to restart chat session: ${errorMessage}`);
  }
}