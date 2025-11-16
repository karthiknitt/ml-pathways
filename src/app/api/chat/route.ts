import { NextRequest, NextResponse } from "next/server";
import { chat, type ChatMessage } from "@/lib/ai/providers";
import { SYSTEM_PROMPTS, getMLProblemContext } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, problemType, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Build system prompt with context
    let systemPrompt = SYSTEM_PROMPTS.general;

    if (problemType) {
      systemPrompt += "\n\n" + getMLProblemContext(problemType);
    }

    if (context) {
      systemPrompt += "\n\nAdditional Context:\n" + context;
    }

    // Prepend system message
    const messagesWithSystem: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Get AI provider from env or default to Claude
    const provider = (process.env.AI_PROVIDER as any) || "claude";

    const response = await chat(messagesWithSystem, provider);

    return NextResponse.json({
      message: response.content,
      provider: response.provider,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat request" },
      { status: 500 }
    );
  }
}
