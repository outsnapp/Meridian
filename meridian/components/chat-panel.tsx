"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSharedItems, type SharedItem } from "@/lib/shared-items-context"
import { MessageCircle, Send, AlertTriangle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function ChatPanel() {
  const { sharedItems, getMessages, addMessage } = useSharedItems()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [input, setInput] = useState("")

  useEffect(() => {
    if (sharedItems.length > 0 && !selectedId) {
      setSelectedId(sharedItems[0].id)
    } else if (selectedId && !sharedItems.find((s) => s.id === selectedId)) {
      setSelectedId(sharedItems[0]?.id ?? null)
    }
  }, [sharedItems, selectedId])

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
