"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Message = {
  id: string;
  role: string;
  content: string;
};

type ChartResult = {
  type: "png" | "svg";
  data: string;
};

type ExecutionResult = {
  status: string;
  output: string;
  error?: string | null;
  charts?: ChartResult[];
  logs?: unknown[];
};

type ExperimentInfo = {
  id: string;
  name: string;
  description: string | null;
  problemType: string;
  createdAt: string;
};

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "");
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizeSvg(svg))}`;
}

type ColumnStats = {
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  [key: string]: number | undefined;
};

type ColumnInfo = {
  name: string;
  type: string;
  uniqueCount: number;
  nullCount: number;
  stats?: ColumnStats;
  topValues?: Record<string, number>;
};

type DatasetInfo = {
  id: string;
  name: string;
  fileUrl: string;
  rowCount: number | null;
  columnInfo: ColumnInfo[] | string | null;
};

type EdaAnalysis = {
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  missingValues: Record<string, number>;
  summary: string;
};

export default function WorkspacePage({ params }: { params: Promise<{ experimentId: string }> }) {
  const { experimentId } = use(params);

  const [experiment, setExperiment] = useState<ExperimentInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content: "Hello! I'm your ML assistant. I can help you explore your data, generate code, and understand your results. What would you like to do?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [edaAnalysis, setEdaAnalysis] = useState<EdaAnalysis | null>(null);
  const [showDataSummary, setShowDataSummary] = useState(false);
  const [showEdaReport, setShowEdaReport] = useState(false);
  const [loadingEda, setLoadingEda] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [isEditingCode, setIsEditingCode] = useState(false);

  const fetchExperiment = useCallback(async () => {
    try {
      const response = await fetch(`/api/experiments/${experimentId}`);
      if (response.ok) {
        const data = await response.json();
        setExperiment(data.experiment);

        if (data.dataset) {
          setDataset(data.dataset);
        }

        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => [
            prev[0],
            ...data.messages.reverse().map((m: { id?: string; role: string; content: string }) => ({
              ...m,
              id: m.id ?? crypto.randomUUID(),
            })),
          ]);
        }

        if (data.executions && data.executions.length > 0) {
          const latest = data.executions[0];
          if (latest.code) {
            setGeneratedCode(latest.code);
          }
          if (latest.status === "completed") {
            setExecutionResult({
              status: latest.status,
              output: latest.output || "",
              charts: Array.isArray(latest.visualizations) ? latest.visualizations : [],
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch experiment:", error);
    }
  }, [experimentId]);

  useEffect(() => {
    fetchExperiment();
  }, [fetchExperiment]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue;
    const historyForApi = [...messages, { id: crypto.randomUUID(), role: "user", content: userMessage }];

    setInputValue("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: userMessage }]);
    setLoading(true);

    // Add empty assistant message slot — id preserved throughout streaming so React doesn't remount
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
          problemType: experiment?.problemType,
          context: `Experiment: ${experiment?.name}`,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `Error: ${message}. Please try again.`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const datasetInfo = dataset
        ? {
            columns: dataset.columnInfo
              ? typeof dataset.columnInfo === "string"
                ? JSON.parse(dataset.columnInfo)
                : dataset.columnInfo
              : ["feature1", "target"],
            rowCount: dataset.rowCount || 100,
          }
        : {
            columns: ["feature1", "target"],
            rowCount: 100,
          };

      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemType: experiment?.problemType,
          task: "Generate code for this ML problem",
          datasetInfo,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate code");

      const data = await response.json();
      setGeneratedCode(data.code);
      setActiveTab("code");
    } catch (error: unknown) {
      console.error("Code generation error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to generate code: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!generatedCode.trim() || executing) return;

    setExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: generatedCode,
          datasetUrl: dataset?.fileUrl || null,
          experimentId,
        }),
      });

      if (!response.ok) throw new Error("Failed to execute code");

      const data = await response.json();
      setExecutionResult(data);
      setActiveTab("results");
    } catch (error: unknown) {
      console.error("Execution error:", error);
      const message = error instanceof Error ? error.message : "Execution failed";
      setExecutionResult({
        status: "error",
        output: "",
        error: message,
      });
      setActiveTab("results");
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Code copied to clipboard!");
  };

  const handleViewDataSummary = () => {
    if (!dataset) {
      toast.error("No dataset available. Please upload a dataset first.");
      return;
    }
    setShowDataSummary(true);
  };

  const handleGenerateEdaReport = async () => {
    if (!dataset || !dataset.fileUrl) {
      toast.error("No dataset available. Please upload a dataset first.");
      return;
    }

    setLoadingEda(true);
    try {
      const response = await fetch("/api/eda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: dataset.id,
          dataUrl: dataset.fileUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate EDA report");

      const data = await response.json();
      setEdaAnalysis(data.analysis);
      setShowEdaReport(true);
    } catch (error: unknown) {
      console.error("EDA error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to generate EDA report: ${message}`);
    } finally {
      setLoadingEda(false);
    }
  };

  const handleExportResults = () => {
    if (!executionResult) {
      toast.error("No results to export. Please run your code first.");
      return;
    }

    const exportData = {
      experiment: {
        id: experimentId,
        name: experiment?.name,
        problemType: experiment?.problemType,
      },
      code: generatedCode,
      result: executionResult,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${experiment?.name.replace(/\s+/g, "_")}_results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!experiment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading experiment...</p>
      </div>
    );
  }

  const parsedColumnInfo = dataset?.columnInfo
    ? typeof dataset.columnInfo === "string"
      ? JSON.parse(dataset.columnInfo)
      : dataset.columnInfo
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{experiment.name || "Experiment Workspace"}</h1>
        <p className="text-gray-600">{experiment.description || "Machine Learning Experiment"}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="chat">Chat & EDA</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI Assistant</CardTitle>
                  <CardDescription>Ask questions about your data or get help with your analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {loading && messages[messages.length - 1]?.content === "" && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                            <div className="flex gap-1">
                              <span className="animate-bounce">●</span>
                              <span className="animate-bounce delay-100">●</span>
                              <span className="animate-bounce delay-200">●</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask a question or request code generation..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        disabled={loading}
                      />
                      <Button onClick={handleSendMessage} disabled={loading}>
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Code</CardTitle>
                  <CardDescription>Python code for your ML experiment — edit before running</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedCode ? (
                    <>
                      {isEditingCode ? (
                        <textarea
                          className="w-full h-96 font-mono text-sm p-4 border rounded-lg bg-gray-950 text-gray-100 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={generatedCode}
                          onChange={(e) => setGeneratedCode(e.target.value)}
                          spellCheck={false}
                        />
                      ) : (
                        <div className="rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                          <SyntaxHighlighter
                            language="python"
                            style={vscDarkPlus}
                            customStyle={{
                              margin: 0,
                              padding: "1rem",
                              fontSize: "0.875rem",
                            }}
                            showLineNumbers
                          >
                            {generatedCode}
                          </SyntaxHighlighter>
                        </div>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button onClick={handleRunCode} disabled={executing}>
                          {executing ? "Running..." : "Run Code"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingCode((prev) => !prev)}
                        >
                          {isEditingCode ? "Preview" : "Edit Code"}
                        </Button>
                        <Button variant="outline" onClick={handleCopyCode}>
                          Copy
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">No code generated yet</p>
                      <Button onClick={handleGenerateCode} disabled={loading}>
                        {loading ? "Generating..." : "Generate Sample Code"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Execution Results</CardTitle>
                  <CardDescription>Output and visualizations from your code</CardDescription>
                </CardHeader>
                <CardContent>
                  {executionResult ? (
                    <div className="space-y-4">
                      {executionResult.status === "error" ? (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                          <p className="font-semibold mb-2">Error</p>
                          <pre className="text-sm whitespace-pre-wrap">
                            {executionResult.error || "An error occurred"}
                          </pre>
                        </div>
                      ) : (
                        <>
                          <div className="bg-green-50 text-green-700 p-3 rounded-lg">
                            <p className="font-semibold">Execution successful!</p>
                          </div>
                          {executionResult.output && (
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                              <pre className="text-sm whitespace-pre-wrap">
                                {executionResult.output}
                              </pre>
                            </div>
                          )}
                          {executionResult.charts && executionResult.charts.length > 0 && (
                            <div>
                              <p className="font-semibold mb-2">Visualizations:</p>
                              {executionResult.charts.map((chart, idx: number) => (
                                <div key={idx} className="mb-4">
                                  {chart.type === "png" && (
                                    <Image
                                      src={`data:image/png;base64,${chart.data}`}
                                      alt="Chart"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  )}
                                  {chart.type === "svg" && (
                                    <img
                                      src={svgToDataUrl(chart.data)}
                                      alt="Chart visualization"
                                      className="w-full h-auto"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>No results yet</p>
                      <p className="text-sm mt-2">Run your code to see results here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Problem Type:</span>
                <span className="font-medium">
                  {experiment.problemType?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {new Date(experiment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={handleGenerateCode} disabled={loading}>
                Generate Code
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={handleViewDataSummary} disabled={!dataset}>
                View Data Summary
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={handleGenerateEdaReport} disabled={!dataset || loadingEda}>
                {loadingEda ? "Generating..." : "Generate EDA Report"}
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={handleExportResults} disabled={!executionResult}>
                Export Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Summary Dialog */}
      <Dialog open={showDataSummary} onOpenChange={setShowDataSummary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dataset Summary</DialogTitle>
            <DialogDescription>Overview of your loaded dataset</DialogDescription>
          </DialogHeader>
          {dataset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Dataset Name</p>
                  <p className="text-lg font-semibold">{dataset.name}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-lg font-semibold">{dataset.rowCount?.toLocaleString() || "N/A"}</p>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Columns ({parsedColumnInfo.length})</p>
                <div className="grid grid-cols-2 gap-2">
                  {parsedColumnInfo.map((col: ColumnInfo | string, idx: number) => (
                    <div key={idx} className="text-sm bg-white p-2 rounded">
                      {typeof col === "string" ? col : col.name || `Column ${idx + 1}`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDA Report Dialog */}
      <Dialog open={showEdaReport} onOpenChange={setShowEdaReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exploratory Data Analysis Report</DialogTitle>
            <DialogDescription>Statistical summary and column-level insights</DialogDescription>
          </DialogHeader>
          {edaAnalysis && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-2xl font-bold">{edaAnalysis.rowCount.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Columns</p>
                  <p className="text-2xl font-bold">{edaAnalysis.columnCount}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Missing Values</p>
                  <p className="text-2xl font-bold">
                    {Object.values(edaAnalysis.missingValues).reduce((a: number, b: number) => a + b, 0)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Column Analysis</h3>
                <div className="space-y-4">
                  {edaAnalysis.columns.map((col, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{col.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${col.type === "numeric" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {col.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Unique:</span>
                          <span className="ml-1 font-medium">{col.uniqueCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Missing:</span>
                          <span className="ml-1 font-medium">{col.nullCount}</span>
                        </div>
                        {col.stats && (
                          <>
                            <div>
                              <span className="text-gray-600">Mean:</span>
                              <span className="ml-1 font-medium">{col.stats.mean?.toFixed(2) || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Std Dev:</span>
                              <span className="ml-1 font-medium">{col.stats.std?.toFixed(2) || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Min:</span>
                              <span className="ml-1 font-medium">{col.stats.min?.toFixed(2) || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Max:</span>
                              <span className="ml-1 font-medium">{col.stats.max?.toFixed(2) || "N/A"}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {col.topValues && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">Top Values:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(col.topValues).slice(0, 5).map(([value, count]: [string, number], i) => (
                              <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {value}: {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {edaAnalysis.summary && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-gray-700">{edaAnalysis.summary}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
