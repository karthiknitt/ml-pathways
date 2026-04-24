import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SYSTEM_PROMPTS, getMLProblemContext } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, problemType, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let systemPrompt = SYSTEM_PROMPTS.general;
    if (problemType) systemPrompt += "\n\n" + getMLProblemContext(problemType);
    if (context) systemPrompt += "\n\nAdditional Context:\n" + context;

    const provider = process.env.AI_PROVIDER || "claude";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (provider === "claude") {
            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) throw new Error("Anthropic API key not configured");

            const anthropic = new Anthropic({ apiKey });
            const conversationMessages = messages.filter(
              (m: { role: string }) => m.role !== "system"
            );

            const anthropicStream = anthropic.messages.stream({
              model: "claude-opus-4-6",
              max_tokens: 2000,
              system: systemPrompt,
              messages: conversationMessages.map((m: { role: string; content: string }) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content,
              })),
            });

            for await (const chunk of anthropicStream) {
              if (
                chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta"
              ) {
                controller.enqueue(
                  new TextEncoder().encode(chunk.delta.text)
                );
              }
            }
          } else if (provider === "openai") {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error("OpenAI API key not configured");

            const openai = new OpenAI({ apiKey });
            const openaiStream = await openai.chat.completions.create({
              model: "gpt-4-turbo-preview",
              messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m: { role: string; content: string }) => ({
                  role: m.role as "user" | "assistant" | "system",
                  content: m.content,
                })),
              ],
              stream: true,
            });

            for await (const chunk of openaiStream) {
              const text = chunk.choices[0]?.delta?.content ?? "";
              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            }
          } else if (provider === "gemini") {
            const apiKey = process.env.GOOGLE_API_KEY;
            if (!apiKey) throw new Error("Google API key not configured");

            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
              model: "gemini-1.5-pro",
              systemInstruction: systemPrompt,
            });

            const conversationMessages = messages.filter(
              (m: { role: string }) => m.role !== "system"
            );
            const history = conversationMessages.slice(0, -1).map(
              (m: { role: string; content: string }) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }],
              })
            );
            const lastMessage = conversationMessages[conversationMessages.length - 1];

            const geminiChat = model.startChat({ history });
            const result = await geminiChat.sendMessageStream(lastMessage.content);

            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            }
          }
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(
            new TextEncoder().encode(`\n\n[Error: ${message}]`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process request";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
