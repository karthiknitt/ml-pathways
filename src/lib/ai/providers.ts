import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIProvider = "openai" | "claude" | "gemini";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
}

// OpenAI Provider
export async function chatWithOpenAI(messages: ChatMessage[]): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    temperature: 0.7,
    max_tokens: 2000,
  });

  return {
    content: response.choices[0].message.content || "",
    provider: "openai",
  };
}

// Claude Provider
export async function chatWithClaude(messages: ChatMessage[]): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }

  const anthropic = new Anthropic({ apiKey });

  // Separate system messages from conversation
  const systemMessage = messages.find(m => m.role === "system")?.content || "";
  const conversationMessages = messages.filter(m => m.role !== "system");

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    system: systemMessage,
    messages: conversationMessages.map(msg => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })),
  });

  const content = response.content[0];
  return {
    content: content.type === "text" ? content.text : "",
    provider: "claude",
  };
}

// Gemini Provider
export async function chatWithGemini(messages: ChatMessage[]): Promise<AIResponse> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Google API key not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  const response = result.response;

  return {
    content: response.text(),
    provider: "gemini",
  };
}

// Main chat function that uses the configured provider
export async function chat(
  messages: ChatMessage[],
  provider: AIProvider = "claude"
): Promise<AIResponse> {
  switch (provider) {
    case "openai":
      return chatWithOpenAI(messages);
    case "claude":
      return chatWithClaude(messages);
    case "gemini":
      return chatWithGemini(messages);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
