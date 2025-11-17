"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

type Message = {
  role: string;
  content: string;
};

type ExecutionResult = {
  status: string;
  output: string;
  error?: string | null;
  charts?: any[];
  logs?: any[];
};

export default function WorkspacePage({ params }: { params: Promise<{ experimentId: string }> }) {
  const { experimentId } = use(params);

  const [experiment, setExperiment] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your ML assistant. I can help you explore your data, generate code, and understand your results. What would you like to do?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchExperiment();
  }, [experimentId]);

  const fetchExperiment = async () => {
    try {
      const response = await fetch(`/api/experiments/${experimentId}`);
      if (response.ok) {
        const data = await response.json();
        setExperiment(data.experiment);

        // Load previous messages if any
        if (data.messages && data.messages.length > 0) {
          setMessages([messages[0], ...data.messages.reverse()]);
        }

        // Load latest execution if any
        if (data.executions && data.executions.length > 0) {
          const latest = data.executions[0];
          if (latest.code) {
            setGeneratedCode(latest.code);
          }
          if (latest.status === "completed") {
            setExecutionResult({
              status: latest.status,
              output: latest.output || "",
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch experiment:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue;
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          problemType: experiment?.problemType,
          context: `Experiment: ${experiment?.name}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}. Please try again.` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemType: experiment?.problemType,
          task: "Generate code for this ML problem",
          datasetInfo: {
            columns: ["feature1", "target"],
            rowCount: 100,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate code");

      const data = await response.json();
      setGeneratedCode(data.code);
    } catch (error: any) {
      console.error("Code generation error:", error);
      alert(`Failed to generate code: ${error.message}`);
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
          datasetUrl: null, // Can be added later with actual dataset
        }),
      });

      if (!response.ok) throw new Error("Failed to execute code");

      const data = await response.json();
      setExecutionResult(data);
    } catch (error: any) {
      console.error("Execution error:", error);
      setExecutionResult({
        status: "error",
        output: "",
        error: error.message,
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    alert("Code copied to clipboard!");
  };

  if (!experiment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading experiment...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{experiment.name || "Experiment Workspace"}</h1>
        <p className="text-gray-600">{experiment.description || "Machine Learning Experiment"}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="chat">
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
                      {messages.map((msg, idx) => (
                        <div
                          key={idx}
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
                      {loading && (
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
                  <CardDescription>Python code for your ML experiment</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedCode ? (
                    <>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                        <pre>{generatedCode}</pre>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button onClick={handleRunCode} disabled={executing}>
                          {executing ? "Running..." : "Run Code"}
                        </Button>
                        <Button variant="outline" onClick={handleCopyCode}>
                          Copy Code
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
                              {executionResult.charts.map((chart: any, idx: number) => (
                                <div key={idx} className="mb-4">
                                  {chart.type === "png" && (
                                    <img src={`data:image/png;base64,${chart.data}`} alt="Chart" />
                                  )}
                                  {chart.type === "svg" && (
                                    <div dangerouslySetInnerHTML={{ __html: chart.data }} />
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
              <Button variant="outline" className="w-full justify-start" size="sm" disabled>
                View Data Summary
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" disabled>
                Generate EDA Report
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" disabled>
                Export Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
