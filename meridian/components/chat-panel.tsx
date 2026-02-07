"use client"

import { useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSharedItems, type SharedItem, type CardSnapshot, type ChatMessage } from "@/lib/shared-items-context"
import { useProfile } from "@/lib/profile-context"
import { getProfile, PROFILES } from "@/lib/profile-config"
import { api } from "@/lib/api"
import {
  MessageCircle,
  Send,
  AlertTriangle,
  TrendingUp,
  Paperclip,
  Sparkles,
  FileText,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function ChatPanel() {
  const { sharedItemsForPosition, getMessages, addMessage, markThreadRead, getUnreadCount } = useSharedItems()
  const { profileId } = useProfile()
  const profile = getProfile(profileId)
  const sharedItems = sharedItemsForPosition(profileId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [generatedBriefByThread, setGeneratedBriefByThread] = useState<Record<string, string>>({})
  const [briefLoadingThreadId, setBriefLoadingThreadId] = useState<string | null>(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  useEffect(() => {
    if (sharedItems.length > 0 && !selectedId) {
      setSelectedId(sharedItems[0].id)
    } else if (selectedId && !sharedItems.find((s) => s.id === selectedId)) {
      setSelectedId(sharedItems[0]?.id ?? null)
    }
  }, [sharedItems, selectedId])

  useEffect(() => {
    if (selectedId) markThreadRead(selectedId)
  }, [selectedId, markThreadRead])

  const selected = sharedItems.find((s) => s.id === selectedId)
  const messages = selectedId ? getMessages(selectedId) : []

  function handleSend() {
    if (!input.trim() || !selectedId) return
    addMessage(selectedId, profile.name, input.trim(), "user", profile.role)
    setInput("")
  }

  async function handleGenerateBrief() {
    if (!selectedId) return
    const threadMessages = getMessages(selectedId)
    setBriefLoadingThreadId(selectedId)
    try {
      const res = await fetch(api.summarizeThread(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: threadMessages.map((m) => ({ author: m.author, text: m.text })),
        }),
      })
      const data = await res.json()
      if (res.ok && data.summary != null) {
        setGeneratedBriefByThread((prev) => ({ ...prev, [selectedId]: data.summary }))
      }
    } catch {
      setGeneratedBriefByThread((prev) => ({ ...prev, [selectedId]: "Could not generate brief. Check backend." }))
    } finally {
      setBriefLoadingThreadId(null)
    }
  }

  function handleExportPdf() {
    if (!selected) return
    setIsExportingPdf(true)
    try {
      const messages = getMessages(selected.id)
      const brief = generatedBriefByThread[selected.id]
      const doc = new jsPDF({ format: "a4", unit: "mm" })
      const margin = 20
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const maxW = pageW - margin * 2
      let y = margin
      const lineHeight = 5
      const sectionGap = 8

      function checkPage() {
        if (y > pageH - margin - 20) {
          doc.addPage()
          y = margin
        }
      }

      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      const titleLines = doc.splitTextToSize(selected.title, maxW)
      titleLines.forEach((line: string) => {
        checkPage()
        doc.text(line, margin, y)
        y += lineHeight
      })
      y += sectionGap

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`${selected.signalType} · ${formatDate(selected.createdAt)}`, margin, y)
      y += lineHeight + sectionGap

      if (brief) {
        checkPage()
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text("Discussion brief — important points from this chat", margin, y)
        y += lineHeight + 2
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        const briefLines = doc.splitTextToSize(brief, maxW)
        briefLines.forEach((line: string) => {
          checkPage()
          doc.text(line, margin, y)
          y += lineHeight
        })
        y += sectionGap * 2
      }

      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Conversation", margin, y)
      y += lineHeight + sectionGap
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)

      for (const msg of messages) {
        checkPage()
        const typeLabel = msg.type && msg.type !== "user" ? `[${msg.type.replace("_", " ")}] ` : ""
        const header = `${typeLabel}${msg.author}${msg.role ? ` · ${msg.role}` : ""} · ${formatTime(msg.createdAt)}`
        doc.setTextColor(80, 80, 80)
        doc.text(header, margin, y)
        y += lineHeight
        doc.setTextColor(0, 0, 0)
        const textLines = doc.splitTextToSize(msg.text, maxW)
        textLines.forEach((line: string) => {
          checkPage()
          doc.text(line, margin, y)
          y += lineHeight
        })
        y += sectionGap
      }

      const slug = selected.title.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)
      const dateStr = new Date().toISOString().slice(0, 10)
      doc.save(`chat-${slug || selected.id}-${dateStr}.pdf`)
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <div className="flex h-full bg-[hsl(var(--background))]">
      {/* Left: Shared Intelligence Threads */}
      <aside className="w-80 shrink-0 flex flex-col border-r border-border bg-card/50 shadow-sm">
        <div className="p-4 border-b border-border bg-gradient-to-b from-card to-card/80">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[hsl(var(--accent))]" />
            Shared Intelligence
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Threads linked to intelligence signals
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1.5">
            {sharedItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground rounded-lg bg-muted/30 border border-dashed border-border mx-2">
                Share an intelligence card from the feed to start a discussion.
              </div>
            ) : (
              sharedItems.map((item) => (
                <ThreadCard
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  messageCount={getMessages(item.id).length}
                  lastActivity={getMessages(item.id).length > 0
                    ? getMessages(item.id).slice(-1)[0].createdAt
                    : item.createdAt}
                  unreadCount={getUnreadCount(item.id)}
                  onClick={() => setSelectedId(item.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Center: Conversation Timeline */}
      <section className="flex-1 flex flex-col min-w-0 bg-[hsl(var(--background))]">
        {selected ? (
          <>
            {/* Conversation: brief (when available) + messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Who can see this chat */}
                {selected.sharedWithPositionIds && selected.sharedWithPositionIds.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Only you and: {selected.sharedWithPositionIds.map((id) => PROFILES.find((p) => p.id === id)?.role ?? id).join(", ")} can see this chat.
                  </p>
                )}
                {/* Generated brief above the conversation */}
                {briefLoadingThreadId === selected.id ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="text-sm text-muted-foreground">Generating brief…</p>
                  </div>
                ) : generatedBriefByThread[selected.id] ? (
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Discussion brief — important points from this chat</p>
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {generatedBriefByThread[selected.id]}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      Click &quot;Generate Brief&quot; in the Signal Context panel to create a summary of the most important points discussed in this chat.
                    </p>
                  </div>
                )}
                {/* Messages: always visible so both people see the conversation */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Conversation</p>
                  {messages.length === 0 ? (
                    <div className="py-8 text-center rounded-lg border border-dashed border-border bg-muted/20">
                      <p className="text-sm text-muted-foreground">No messages yet. Send a message below to start the discussion.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {messages.map((msg) => (
                        <TimelineMessage key={msg.id} message={msg} currentUserName={profile.name} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Message Composer */}
            <div className="shrink-0 p-4 border-t border-border bg-card/50">
              <div className="max-w-2xl mx-auto rounded-xl border border-border bg-background shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[hsl(var(--ring))] focus-within:ring-offset-2">
                <div className="flex items-end gap-2 p-3">
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground" title="Attach intelligence">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground" title="AI Assist">
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Discuss strategic response…"
                    className="flex-1 min-h-10 border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="h-10 w-10 rounded-lg shrink-0 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Select a thread to view the conversation
            </p>
          </div>
        )}
      </section>

      {/* Right: Signal Context Panel (hidden on smaller screens for responsiveness) */}
      <aside className="hidden lg:flex w-80 shrink-0 flex-col border-l border-border bg-card/50 shadow-sm overflow-hidden">
        {selected ? (
          <>
            <div className="p-4 border-b border-border bg-gradient-to-b from-card to-card/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Signal Context
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <SignalContextCard
                item={selected}
                snapshot={selected.cardSnapshot}
                onGenerateBrief={handleGenerateBrief}
                isGenerating={briefLoadingThreadId === selected.id}
                onExportPdf={handleExportPdf}
                isExportingPdf={isExportingPdf}
              />
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Select a thread to see signal context
          </div>
        )}
      </aside>
    </div>
  )
}

function ThreadCard({
  item,
  isSelected,
  messageCount,
  lastActivity,
  unreadCount,
  onClick,
}: {
  item: SharedItem
  isSelected: boolean
  messageCount: number
  lastActivity: string
  unreadCount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl px-3 py-3 transition-all border",
        isSelected
          ? "bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))]/30 shadow-sm"
          : "border-transparent hover:bg-muted/50 hover:border-border/50"
      )}
    >
      <div className="flex items-start gap-2">
        <Badge
          className={cn(
            "shrink-0 rounded text-[10px] font-bold uppercase tracking-wider border-0",
            item.signalType === "Risk"
              ? "bg-destructive/15 text-destructive"
              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          )}
        >
          {item.signalType === "Risk" ? "Risk" : "Opportunity"}
        </Badge>
        {unreadCount > 0 && (
          <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-[hsl(var(--accent))] text-[10px] font-bold text-[hsl(var(--accent-foreground))] flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm font-medium text-foreground line-clamp-2 break-words">
        {item.title}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {formatLastActivity(lastActivity)} · {messageCount} message{messageCount !== 1 ? "s" : ""}
      </p>
    </button>
  )
}

function TimelineMessage({ message, currentUserName }: { message: ChatMessage; currentUserName: string }) {
  const type = message.type ?? "user"
  const isSender = type === "user" && message.author !== "System" && message.author === currentUserName

  if (type === "system") {
    return (
      <div className="flex justify-center">
        <div className="rounded-lg bg-muted/60 border border-border px-4 py-2 text-xs text-muted-foreground">
          {message.text}
        </div>
      </div>
    )
  }

  if (type === "ai_summary") {
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0 border border-border">
          <AvatarFallback className="bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] text-xs">AI</AvatarFallback>
        </Avatar>
        <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">AI Summary</p>
          <p className="text-sm text-foreground leading-relaxed">{message.text}</p>
          <p className="text-[10px] text-muted-foreground mt-2">{formatTime(message.createdAt)}</p>
        </div>
      </div>
    )
  }

  if (type === "decision") {
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0 border border-border">
          <AvatarFallback className="bg-primary/20 text-primary text-xs">{message.author.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Decision</p>
          <p className="text-sm text-foreground leading-relaxed">{message.text}</p>
          <p className="text-[10px] text-muted-foreground mt-2">{message.author}{message.role ? ` · ${message.role}` : ""} · {formatTime(message.createdAt)}</p>
        </div>
      </div>
    )
  }

  if (type === "action_item") {
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0 border border-border">
          <AvatarFallback className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">!</AvatarFallback>
        </Avatar>
        <div className="flex-1 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Action Item</p>
          <p className="text-sm text-foreground leading-relaxed">{message.text}</p>
          <p className="text-[10px] text-muted-foreground mt-2">{message.author} · {formatTime(message.createdAt)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-3", isSender && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0 border border-border">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          {message.author.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex-1 max-w-[85%]", isSender && "flex flex-col items-end")}>
        <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
          {message.author}{message.role ? ` · ${message.role}` : ""}
        </p>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm shadow-sm border",
            isSender
              ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--accent))]/20 rounded-tr-md"
              : "bg-card text-foreground border-border rounded-tl-md"
          )}
        >
          <p className="break-words leading-relaxed">{message.text}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{formatTime(message.createdAt)}</p>
      </div>
    </div>
  )
}

function SignalContextCard({
  item,
  snapshot,
  onGenerateBrief,
  isGenerating,
  onExportPdf,
  isExportingPdf,
}: {
  item: SharedItem
  snapshot?: CardSnapshot
  onGenerateBrief?: () => void
  isGenerating?: boolean
  onExportPdf?: () => void
  isExportingPdf?: boolean
}) {
  const sn = snapshot ?? {}
  const tags = (sn.tags ?? "").split(",").filter(Boolean)
  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground line-clamp-2">{item.title}</h4>
          <Badge
            className={cn(
              "mt-2 rounded text-[10px] font-bold uppercase border-0",
              item.signalType === "Risk" ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            )}
          >
            {item.signalType}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Impact</p>
            <p className="font-medium text-foreground mt-0.5">{sn.impact_analysis ? "High" : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Urgency</p>
            <p className="font-medium text-foreground mt-0.5">{sn.decision_urgency || "—"}</p>
          </div>
        </div>
        {tags.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 6).map((t) => (
                <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground">{t.trim()}</span>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Source</p>
          <p className="text-xs text-foreground mt-0.5">{sn.source || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last update</p>
          <p className="text-xs text-foreground mt-0.5">{sn.updated_at ? formatDate(sn.updated_at) : formatDate(item.createdAt)}</p>
        </div>
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 rounded-lg"
            type="button"
            onClick={onGenerateBrief}
            disabled={isGenerating}
          >
            <FileText className="h-3.5 w-3.5" />
            {isGenerating ? "Generating…" : "Generate Brief"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 rounded-lg"
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf}
          >
            <Download className="h-3.5 w-3.5" />
            {isExportingPdf ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return iso
  }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

function formatLastActivity(iso: string) {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return iso
  }
}
