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

IMPORTANT - Data Loading:
- The dataset file is available as 'data.csv' in the current working directory
- Load it using: data = pd.read_csv('data.csv')
- Use the variable name 'data' for the DataFrame throughout the code

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

    // FAILSAFE: Ensure data loading code is present
    // Check if the code contains data loading from 'data.csv'
    const hasDataLoading = /pd\.read_csv\s*\(\s*['"]data\.csv['"]\s*\)/i.test(code);

    if (!hasDataLoading) {
      console.log("⚠️ Generated code missing data loading - injecting it automatically");

      // Check if pandas is imported
      const hasPandasImport = /import\s+pandas\s+as\s+pd/i.test(code);

      // Prepare the data loading snippet
      const dataLoadingSnippet = `# Load the dataset
data = pd.read_csv('data.csv')
print(f"Dataset loaded: {data.shape[0]} rows, {data.shape[1]} columns")
print(f"Columns: {list(data.columns)}")
print()

`;

      if (hasPandasImport) {
        // If pandas is already imported, inject data loading after imports
        // Find the last import statement
        const importLines = code.split('\n');
        let lastImportIndex = -1;

        for (let i = 0; i < importLines.length; i++) {
          if (/^\s*(import|from)\s+/.test(importLines[i])) {
            lastImportIndex = i;
          }
        }

        if (lastImportIndex >= 0) {
          // Inject after the last import
          importLines.splice(lastImportIndex + 1, 0, '', dataLoadingSnippet.trim());
          code = importLines.join('\n');
        } else {
          // Just prepend if we can't find imports (shouldn't happen)
          code = dataLoadingSnippet + code;
        }
      } else {
        // If pandas is not imported, add both import and data loading at the top
        const fullSnippet = `import pandas as pd

${dataLoadingSnippet}`;
        code = fullSnippet + code;
      }
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
