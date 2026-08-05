"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import HoneycombProgress from "./HoneycombProgress";
import { STAGES, type Stage } from "@/lib/stages";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolActivity?: string[];
  choices?: string[];
};

const COLUMN_MAPPING_FIELDS = [
  "customer_name",
  "customer_contact",
  "order_date",
  "order_value",
  "order_status",
  "product_name",
];

export default function Chat() {
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("opening");
  const [isThinking, setIsThinking] = useState(false);
  const [toolActivity, setToolActivity] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mappedCount, setMappedCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasStarted = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, toolActivity, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isThinking) return;

      setError(null);
      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };

      const currentMessages = [...messages, userMsg];
      setMessages(currentMessages);
      setInput("");
      setIsThinking(true);
      setToolActivity([]);

      try {
        const apiMessages = currentMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, messages: apiMessages }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Failed to connect to the chat service.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantContent = "";
        const currentToolActivity: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const data = line.replace(/^data: /, "").trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "content") {
                assistantContent += parsed.content;
                setMessages((prev) => {
                  const existing = prev.find((m) => m.id === "streaming");
                  if (existing) {
                    return prev.map((m) =>
                      m.id === "streaming" ? { ...m, content: assistantContent } : m
                    );
                  }
                  return [
                    ...prev,
                    { id: "streaming", role: "assistant" as const, content: assistantContent },
                  ];
                });
              } else if (parsed.type === "tool_call") {
                const label = formatToolLabel(parsed.name, parsed.args);
                currentToolActivity.push(label);
                setToolActivity([...currentToolActivity]);
              } else if (parsed.type === "tool_result") {
                if (parsed.name === "map_column") {
                  try {
                    const result = JSON.parse(parsed.result);
                    if (result.totalMapped !== undefined) {
                      setMappedCount(result.totalMapped);
                    }
                  } catch {
                    // skip
                  }
                }
              } else if (parsed.type === "stage") {
                setStage(parsed.stage as Stage);
              } else if (parsed.type === "error") {
                setError(parsed.error);
              }
            } catch {
              // skip unparseable
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === "streaming"
              ? {
                  ...m,
                  id: `msg-${Date.now()}`,
                  toolActivity: currentToolActivity.length > 0 ? currentToolActivity : undefined,
                }
              : m
          )
        );
        setToolActivity([]);
        if (stage === "column_mapping" || stage === "complete") {
          try {
            const profileRes = await fetch(`/api/profile/${sessionId}`);
            if (profileRes.ok) {
              const profile = await profileRes.json();
              const mapped = (profile.columnMappings || []).filter(
                (m: { confidence: string }) => m.confidence !== "unmapped"
              ).length;
              setMappedCount(mapped);
            }
          } catch {
            // skip
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setIsThinking(false);
        inputRef.current?.focus();
      }
    },
    [messages, isThinking, sessionId]
  );

  useEffect(() => {
    if (!hasStarted.current && messages.length === 0) {
      hasStarted.current = true;
      sendMessage("Hi, I'm ready to get started.");
    }
  }, [messages.length, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isComplete = stage === "complete";
  const isColumnMapping = stage === "column_mapping";

  const handleChoice = (choice: string) => {
    sendMessage(choice);
  };

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-surface-2/50 bg-surface/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32">
                <polygon
                  points="16,2 29,9 29,23 16,30 3,23 3,9"
                  fill="none"
                  stroke="#F2A93B"
                  strokeWidth="2"
                />
                <polygon
                  points="16,8 23,12 23,20 16,24 9,20 9,12"
                  fill="#F2A93B"
                  opacity="0.3"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold text-text leading-none">
                Beesz
              </h1>
              <p className="text-[10px] font-mono text-muted mt-0.5">Founder Onboarding</p>
            </div>
          </div>
          <HoneycombProgress stage={stage} />
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isThinking && toolActivity.length > 0 && (
            <div className="flex items-center gap-2 pl-2 animate-fade-in">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-honey animate-pulse-honey"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <span className="text-xs font-mono text-muted">
                {toolActivity[toolActivity.length - 1]}
              </span>
            </div>
          )}

          {isThinking && toolActivity.length === 0 && (
            <div className="flex items-center gap-2 pl-2 animate-fade-in">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-honey animate-pulse-honey"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <span className="text-xs font-mono text-muted">thinking…</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-surface-2/50 border border-deep-honey/30 px-4 py-3 animate-fade-in">
              <p className="text-sm text-honey/80 font-mono">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-muted hover:text-text mt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {isColumnMapping && !isThinking && (
            <div className="flex items-center gap-2 pl-2 animate-fade-in">
              <span className="text-xs font-mono text-muted">
                {mappedCount} of {COLUMN_MAPPING_FIELDS.length} fields mapped
              </span>
              <div className="flex-1 h-1 bg-surface-2 rounded-full overflow-hidden max-w-[120px]">
                <div
                  className="h-full bg-honey rounded-full transition-all duration-500"
                  style={{ width: `${(mappedCount / COLUMN_MAPPING_FIELDS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {isColumnMapping && !isThinking && (
            <div className="flex flex-wrap gap-2 animate-fade-in">
              {['Auto-detect', 'Not sure'].map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  className="px-3 py-1.5 rounded-full text-xs font-mono bg-surface border border-honey/30 text-honey/80 hover:bg-honey/10 hover:border-honey/50 transition-colors"
                >
                  {choice}
                </button>
              ))}
            </div>
          )}

          {isComplete && (
            <div className="pt-4 animate-fade-in">
              <a
                href={`/debug/profile/${sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-mono text-growth hover:underline"
              >
                → View captured profile
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-surface-2/50 bg-surface/30 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking || isComplete}
              placeholder={isComplete ? "Onboarding complete!" : "Type your message…"}
              rows={1}
              className="flex-1 resize-none bg-surface border border-surface-2 rounded-xl px-4 py-3 text-text placeholder:text-muted/60 text-sm focus:outline-none focus:border-honey/50 transition-colors disabled:opacity-50 max-h-32"
              style={{ minHeight: "44px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isThinking || isComplete}
              className="flex-shrink-0 w-11 h-11 rounded-xl bg-honey text-bg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-honey/90 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2 12L22 2L18 12L22 22L2 12Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-rise-in`}>
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <polygon
                  points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5"
                  fill="#F2A93B"
                  opacity="0.4"
                />
              </svg>
            </div>
            <span className="text-[10px] font-mono text-muted">Beesz</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-honey/15 border border-honey/20 text-text rounded-br-md"
              : "bg-surface border border-surface-2 text-text rounded-bl-md"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.toolActivity && message.toolActivity.length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {message.toolActivity.map((activity, i) => (
              <div
                key={i}
                className="text-[10px] font-mono text-muted/70 flex items-center gap-1"
              >
                <span className="text-honey/50">⟡</span> {activity}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatToolLabel(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "search_web":
      return `searching: "${args.query}"`;
    case "classify_industry":
      return `classifying industry…`;
    case "save_founder_profile":
      return `saving profile data…`;
    case "advance_stage":
      return `advancing to ${args.stage}…`;
    case "map_column":
      return `mapping ${args.internal_field} → ${args.client_column_name || 'unmapped'}…`;
    default:
      return name;
  }
}
