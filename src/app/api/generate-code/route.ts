import { NextRequest, NextResponse } from "next/server";
import { chat, type ChatMessage } from "@/lib/ai/providers";
import { SYSTEM_PROMPTS, getMLProblemContext } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problemType, task, datasetInfo } = body;

    if (!problemType || !task) {
      return NextResponse.json(
        { error: "problemType and task are required" },
        { status: 400 }
      );
    }

    // Build context
    let context = getMLProblemContext(problemType);

    if (datasetInfo) {
      context += `\n\nDataset Information:\n${JSON.stringify(datasetInfo, null, 2)}`;
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPTS.codeGeneration + "\n\n" + context,
      },
      {
        role: "user",
        content: `Generate Python code for the following task: ${task}

Requirements:
- Use scikit-learn, pandas, numpy, and matplotlib
- Include proper error handling
- Add comments explaining each step
- Make it educational and easy to understand
- Include data loading, preprocessing, model training, and evaluation

Provide only the Python code, well-formatted and ready to execute.`,
      },
    ];

    const provider = (process.env.AI_PROVIDER as any) || "claude";
    const response = await chat(messages, provider);

    // Extract code from markdown if present
    let code = response.content;
    const codeBlockMatch = code.match(/```python\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      code = codeBlockMatch[1];
    }

    return NextResponse.json({
      code,
      explanation: "Generated code for " + task,
      provider: response.provider,
    });
  } catch (error: any) {
    console.error("Code generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate code" },
      { status: 500 }
    );
  }
}
