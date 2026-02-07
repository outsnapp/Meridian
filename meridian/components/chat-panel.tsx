"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useSharedItems, type SharedItem, type CardSnapshot } from "@/lib/shared-items-context"
import { MessageCircle, Send, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, MessageSquare, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

export function ChatPanel() {
  const { sharedItems, getMessages, addMessage } = useSharedItems()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [cardOpen, setCardOpen] = useState(true) // Collapsible card: open by default

  useEffect(() => {
    if (sharedItems.length > 0 && !selectedId) {
      setSelectedId(sharedItems[0].id)
    } else if (selectedId && !sharedItems.find((s) => s.id === selectedId)) {
      setSelectedId(sharedItems[0]?.id ?? null)
    }
  }, [sharedItems, selectedId])

  // Open card by default when switching to a new item
  useEffect(() => {
    setCardOpen(true)
  }, [selectedId])

  const selected = sharedItems.find((s) => s.id === selectedId)
  const messages = selectedId ? getMessages(selectedId) : []

  function handleSend() {
    if (!input.trim() || !selectedId) return
    addMessage(selectedId, "Anna Chen", input.trim())
    setInput("")
  }

  return (
    <div className="flex h-full">
      {/* Left: list of shared items */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Shared Intelligence
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click a shared item to view and chat
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sharedItems.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No shared items yet. Share an intelligence card to start a conversation.
              </div>
            ) : (
              sharedItems.map((item) => (
                <SharedItemRow
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  messageCount={getMessages(item.id).length}
                  onClick={() => setSelectedId(item.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: chat thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            <div className="p-4 border-b border-border shrink-0">
              <Badge
                className={cn(
                  "rounded text-[10px] font-bold uppercase tracking-wider border-0",
                  selected.signalType === "Risk"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-emerald-600 text-white"
                )}
              >
                {selected.signalType}
              </Badge>
              <h3 className="mt-2 text-sm font-semibold text-foreground line-clamp-2 break-words">
                {selected.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Shared with {selected.recipients} · {formatDate(selected.createdAt)}
              </p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selected.cardSnapshot && (
                  <Collapsible open={cardOpen} onOpenChange={setCardOpen} className="rounded-lg border border-border bg-card">
                    <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-t-lg">
                      <span className="text-sm font-semibold text-foreground">
                        Intelligence card details
                      </span>
                      {cardOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SharedCardContent snapshot={selected.cardSnapshot} />
                    </CollapsibleContent>
                  </Collapsible>
                )}
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.author === "Anna Chen" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          msg.author === "Anna Chen"
                            ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                            : "bg-muted text-foreground"
                        )}
                      >
                        <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                          {msg.author}
                        </p>
                        <p className="break-words">{msg.text}</p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1">
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a shared item to view and chat
          </div>
        )}
      </div>
    </div>
  )
}

function SharedCardContent({ snapshot }: { snapshot: CardSnapshot }) {
  return (
    <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
      <p className="text-sm leading-relaxed text-muted-foreground pt-3">
        {snapshot.summary}
      </p>
      {snapshot.article_url && (
        <a
          href={snapshot.article_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View source article →
        </a>
      )}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
          Impact Analysis
        </p>
        <div className="border-l-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 py-2.5 px-3.5 rounded-r-md">
          <p className="text-sm font-medium text-card-foreground leading-relaxed">
            {snapshot.impact_analysis}
          </p>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
          What&apos;s Changing
        </p>
        <p className="text-sm leading-relaxed text-card-foreground">
          {snapshot.whats_changing}
        </p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
          Why It Matters
        </p>
        <p className="text-sm leading-relaxed text-card-foreground">
          {snapshot.why_it_matters}
        </p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
          What To Do Now
        </p>
        <div className="rounded-md bg-primary px-4 py-3 text-primary-foreground">
          <p className="text-sm font-medium leading-relaxed">
            {snapshot.what_to_do_now}
          </p>
        </div>
      </div>
      {snapshot.decision_urgency && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-1.5">
            Decision Urgency
          </p>
          <div className="rounded-md border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 px-4 py-3">
            <p className="text-sm font-semibold leading-relaxed text-card-foreground">
              {snapshot.decision_urgency}
            </p>
          </div>
        </div>
      )}
      {snapshot.recommended_next_step && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-1.5">
            Recommended Next Step
          </p>
          <div className="rounded-md border border-border bg-muted/30 dark:bg-muted/20 px-3 py-2.5">
            <p className="text-sm leading-relaxed text-card-foreground">
              {snapshot.recommended_next_step}
            </p>
          </div>
        </div>
      )}
      {(snapshot.messaging_instructions || snapshot.positioning_before || snapshot.positioning_after) && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Messaging & Marketing Brief
          </p>
          <div className="space-y-3 rounded-md border border-border bg-emerald-50/30 dark:bg-emerald-950/20 px-4 py-3">
            {snapshot.messaging_instructions && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Field-team guidance
                </p>
                <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-line">
                  {snapshot.messaging_instructions}
                </p>
              </div>
            )}
            {(snapshot.positioning_before || snapshot.positioning_after) && (
              <div className="grid gap-2 sm:grid-cols-2">
                {snapshot.positioning_before && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Before
                    </p>
                    <p className="text-sm leading-relaxed text-card-foreground">
                      {snapshot.positioning_before}
                    </p>
                  </div>
                )}
                {snapshot.positioning_after && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      After
                    </p>
                    <p className="text-sm leading-relaxed text-card-foreground">
                      {snapshot.positioning_after}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SharedItemRow({
  item,
  isSelected,
  messageCount,
  onClick,
}: {
  item: SharedItem
  isSelected: boolean
  messageCount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md px-3 py-2.5 transition-colors",
        isSelected
          ? "bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/30"
          : "hover:bg-muted/50 border border-transparent"
      )}
    >
      <div className="flex items-center gap-2">
        {item.signalType === "Risk" ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
        ) : (
          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        )}
        <span className="text-xs font-medium text-foreground line-clamp-2 break-words flex-1 min-w-0">
          {item.title}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        {messageCount} message{messageCount !== 1 ? "s" : ""}
      </p>
    </button>
  )
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}
