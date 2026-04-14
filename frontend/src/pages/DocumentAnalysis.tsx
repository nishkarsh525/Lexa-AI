import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, FileText, GitCompare, MessageSquare } from "lucide-react";

import { Contract, RiskAnalysis, api, extractApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "risk", label: "Risk Report", icon: BarChart3 },
  { id: "compare", label: "Clause Comparison", icon: GitCompare },
  { id: "ask", label: "Ask AI", icon: MessageSquare },
] as const;

type SearchResponse = {
  answer: string;
  confidence: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  confidence?: number;
};

const DocumentAnalysis = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [summary, setSummary] = useState("");
  const [risk, setRisk] = useState<RiskAnalysis | null>(null);
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("summary");
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");

  const selectedId = searchParams.get("contractId");
  const selectedContract = useMemo(
    () => contracts.find((contract) => String(contract.id) === selectedId) || null,
    [contracts, selectedId],
  );

  useEffect(() => {
    api.get<Contract[]>("/contracts").then((response) => {
      setContracts(response.data);
      if (!selectedId && response.data[0]) {
        setSearchParams({ contractId: String(response.data[0].id) });
      }
    });
  }, [selectedId, setSearchParams]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    setLoading(true);
    Promise.all([
      api.get<{ summary: string }>(`/contracts/${selectedId}/summary`),
      api.get<RiskAnalysis>(`/contracts/${selectedId}/risk-analysis`),
    ])
      .then(([summaryResponse, riskResponse]) => {
        setSummary(summaryResponse.data.summary);
        setRisk(riskResponse.data);
        setQuestion("");
        setAskError("");
        setChatMessages([]);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const handleAsk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !question.trim()) {
      return;
    }

    const userQuestion = question.trim();
    setAskError("");
    setAsking(true);
    setQuestion("");
    setChatMessages((prev) => [...prev, { role: "user", content: userQuestion }]);

    try {
      const response = await api.get<SearchResponse>(`/contracts/${selectedId}/search`, {
        params: { question: userQuestion },
      });
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.answer || "I could not generate an answer for that question.",
          confidence: response.data.confidence,
        },
      ]);
      setActiveTab("ask");
    } catch (error: unknown) {
      setAskError(extractApiErrorMessage(error, "Ask AI failed. Please try again."));
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedContract ? selectedContract.filename : "Select a contract to review"}
        </p>
      </div>

      <div className="grid xl:grid-cols-[320px_1fr] gap-6 min-h-[600px]">
        <motion.div className="glass rounded-2xl p-5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h3 className="font-semibold mb-4">Your Contracts</h3>
          <div className="space-y-3">
            {contracts.map((contract) => (
              <button
                key={contract.id}
                onClick={() => setSearchParams({ contractId: String(contract.id) })}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
                  String(contract.id) === selectedId
                    ? "border-primary bg-primary/10"
                    : "border-border/40 bg-secondary/20 hover:bg-secondary/40"
                }`}
              >
                <div className="font-medium text-sm">{contract.filename}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(contract.created_at).toLocaleString()}
                </div>
              </button>
            ))}
            {contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No uploaded contracts yet.</p>
            ) : null}
          </div>
        </motion.div>

        <motion.div className="glass rounded-2xl overflow-hidden flex flex-col" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex border-b border-border/40">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm transition-colors border-b-2 ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading analysis...</p>
            ) : !selectedContract ? (
              <p className="text-sm text-muted-foreground">Choose a contract to begin.</p>
            ) : null}

            {!loading && selectedContract && activeTab === "summary" ? (
              <div className="space-y-4 text-sm">
                <h3 className="font-semibold text-lg">Executive Summary</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{summary}</p>
              </div>
            ) : null}

            {!loading && selectedContract && activeTab === "risk" && risk ? (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="8"
                        strokeDasharray={`${risk.risk_score * 2.51} ${100 * 2.51}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">{risk.risk_score}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Risk Score</div>
                    <div className="text-sm text-muted-foreground">{risk.overall_risk_level} risk</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {risk.total_risks} findings, confidence {(risk.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {risk.risks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No material risks were detected.</p>
                  ) : (
                    risk.risks.map((item, index) => (
                      <div key={`${item.type}-${index}`} className="glass rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2 gap-3">
                          <span className="font-medium text-sm">{item.type}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              item.severity === "High"
                                ? "bg-destructive/20 text-destructive"
                                : item.severity === "Medium"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-primary/20 text-primary"
                            }`}
                          >
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{item.explanation}</p>
                        <p className="text-xs whitespace-pre-line bg-secondary/20 rounded-lg p-3">{item.clause_excerpt}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {!loading && selectedContract && activeTab === "compare" ? (
              <div className="space-y-4 text-sm">
                <h3 className="font-semibold text-lg">Clause Comparison</h3>
                <p className="text-muted-foreground">
                  This view uses the identified risk categories to highlight where the contract deviates from safer drafting patterns.
                </p>
                <div className="space-y-3">
                  {(risk?.risks || []).slice(0, 5).map((item, index) => (
                    <div key={`${item.type}-compare-${index}`} className="glass rounded-xl p-4">
                      <div className="font-medium text-sm mb-2">{item.type}</div>
                      <div className="grid md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-muted-foreground mb-1">Detected Clause</div>
                          <div>{item.clause_excerpt}</div>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                          <div className="text-primary mb-1">Recommended Review</div>
                          <div>{item.explanation}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {!loading && selectedContract && activeTab === "ask" ? (
              <div className="flex flex-col h-full gap-4">
                <div className="glass rounded-xl p-4 min-h-[280px] max-h-[420px] overflow-auto space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Ask a question about this contract to start a conversation.
                    </p>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`rounded-xl p-3 text-sm whitespace-pre-line ${
                          message.role === "user"
                            ? "bg-primary/10 border border-primary/20 ml-6"
                            : "bg-secondary/30 border border-border/40 mr-6"
                        }`}
                      >
                        <div className="text-xs uppercase tracking-wide mb-1 text-muted-foreground">
                          {message.role === "user" ? "You" : "AI Assistant"}
                        </div>
                        <div>{message.content}</div>
                        {message.role === "assistant" && typeof message.confidence === "number" ? (
                          <div className="mt-2 text-[11px] text-muted-foreground">
                            Relevance confidence: {(message.confidence * 100).toFixed(0)}%
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
                <form className="flex gap-2" onSubmit={handleAsk}>
                  <input
                    type="text"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask about this contract..."
                    className="flex-1 bg-secondary/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                    disabled={asking}
                  />
                  <Button type="submit" disabled={asking || !question.trim()}>
                    {asking ? "Thinking..." : "Send"}
                  </Button>
                </form>
                {askError ? <p className="text-sm text-destructive">{askError}</p> : null}
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DocumentAnalysis;
