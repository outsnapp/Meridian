"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, ChevronRight, Send, AlertTriangle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDepartment } from "@/lib/department-context"
import { useProfile } from "@/lib/profile-context"
import { subDepartmentToLegacyDepartment } from "@/lib/profile-config"
import { api } from "@/lib/api"
import {
  getSuggestedQuestions,
  getCardTitle,
  getCardSignalType,
  type SuggestedQuestion,
} from "@/lib/chatbot-data"
import { cn } from "@/lib/utils"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ContextChatbotProps {
  activeCardId: string | null
  activeCardTitle?: string
  activeCardSignalType?: "Risk" | "Opportunity"
  /** Event ID (number) for API chat - required to answer questions */
  activeEventId?: number | null
}

const GENERIC_QUESTIONS = [
  "What's the main impact of this development?",
  "What should we do next?",
  "What are the key risks or opportunities?",
]

const departmentLabels: Record<string, string> = {
  executive: "Executive / Strategy",
  finance: "Finance",
  commercial: "Commercial / Sales",
  "market-access": "Market Access / Policy",
}

export function ContextChatbot({ activeCardId, activeCardTitle, activeCardSignalType, activeEventId }: ContextChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { department } = useDepartment()
  const { profileId } = useProfile()
  const legacyDept = subDepartmentToLegacyDepartment(profileId, department)

  const canChat = Boolean(activeEventId)
  const suggestedQuestionsRaw = getSuggestedQuestions(activeCardId, legacyDept)
  const suggestedQuestions =
    suggestedQuestionsRaw.length > 0
      ? suggestedQuestionsRaw
      : canChat
        ? GENERIC_QUESTIONS.map((q) => ({ question: q, answer: "" }))
        : []
  const cardTitle = activeCardTitle || getCardTitle(activeCardId)
  const signalType = activeCardSignalType ?? getCardSignalType(activeCardId)

  // Reset chat when context changes
  useEffect(() => {
    setMessages([])
  }, [activeCardId, legacyDept])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function askAI(question: string): Promise<string> {
    if (!activeEventId) return "Select a signal to ask questions."
    const res = await fetch(api.chat(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: activeEventId,
        question,
        department: legacyDept,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
    const data = await res.json()
    if (!res.ok) return data.detail || "Could not get an answer."
    return data.answer || "No response received."
  }

  async function handleSuggestedQuestion(sq: SuggestedQuestion) {
    setMessages((prev) => [...prev, { role: "user", content: sq.question }])
    setIsLoading(true)
    try {
      const answer = await askAI(sq.question)
      setMessages((prev) => [...prev, { role: "assistant", content: answer }])
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't reach the AI. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendMessage() {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setInputValue("")
    setIsLoading(true)

    try {
      const answer = await askAI(trimmed)
      setMessages((prev) => [...prev, { role: "assistant", content: answer }])
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't reach the AI. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  // Collapsed state -- floating button
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] focus:ring-offset-2"
        aria-label="Open AI assistant"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    )
  }

  const unusedQuestions = suggestedQuestions.filter(
    (sq) => !messages.some((m) => m.content === sq.question),
  )

  return (
    <div className="fixed right-6 top-6 bottom-6 z-50 flex w-[380px] flex-col rounded-lg border border-border bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[hsl(var(--accent))]" />
          <span className="text-sm font-semibold text-card-foreground">
            AI Assistant
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
          aria-label="Close AI assistant"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Context Bar */}
      {activeCardId && (
        <div className="border-b border-border bg-muted/50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            {signalType === "Risk" ? (
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span className="text-[11px] font-medium text-card-foreground truncate">
              {cardTitle}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                signalType === "Risk"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-emerald-600/10 text-emerald-600",
              )}
            >
              {signalType ?? "Signal"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {departmentLabels[legacyDept]}
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeCardId
                ? "Questions below are tailored to this signal and your department."
                : "Scroll to a card for context-aware assistance."}
            </p>
          </div>
        )}

        {/* Chat messages */}
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={`msg-${activeCardId}-${legacyDept}-${i}`}
              className={cn(
                "rounded-md px-3 py-2.5",
                msg.role === "user"
                  ? "ml-6 bg-[hsl(var(--accent))]/10 text-card-foreground"
                  : "mr-2 bg-muted text-card-foreground",
              )}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="mr-2 rounded-md bg-muted px-3 py-2.5">
              <p className="text-sm text-muted-foreground animate-pulse">Thinking...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {unusedQuestions.length > 0 && (
          <div className={cn("flex flex-col gap-1.5", messages.length > 0 && "mt-4")}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">
              Suggested follow-ups
            </p>
            {unusedQuestions.map((sq) => (
              <button
                key={sq.question}
                type="button"
                onClick={() => handleSuggestedQuestion(sq)}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm text-card-foreground transition-colors hover:bg-muted group disabled:opacity-60 disabled:pointer-events-none"
              >
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                <span className="leading-snug">{sq.question}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guided Chat Prompts — above input, hide when typing */}
      {activeCardId && !inputValue.trim() && suggestedQuestions.length > 0 && (
        <div className="border-t border-border px-4 py-2.5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Quick prompts
          </p>
          <div className="flex flex-col gap-1.5">
            {suggestedQuestions.slice(0, 3).map((sq) => (
              <button
                key={sq.question}
                type="button"
                onClick={() => handleSuggestedQuestion(sq)}
                disabled={isLoading}
                className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-left text-[11px] leading-snug text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground disabled:opacity-60 disabled:pointer-events-none"
              >
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60" />
                <span>{sq.question}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              canChat
                ? "Ask about this signal..."
                : "Select a signal first..."
            }
            disabled={!canChat}
            className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent))] disabled:opacity-50"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!canChat || !inputValue.trim() || isLoading}
            className="h-9 w-9 shrink-0 bg-[hsl(var(--accent))] p-0 text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
