"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Send,
  Check,
  Users,
  User,
  AlertTriangle,
  TrendingUp,
  Link2,
} from "lucide-react"
import { useDepartment } from "@/lib/department-context"
import {
  colleagues,
  teams,
  contentScopeLabels,
  getSmartDefaultMessage,
  getCardContext,
  type ContentScope,
  type Colleague,
  type Team,
} from "@/lib/share-data"
import { useSharedItems } from "@/lib/shared-items-context"
import { cn } from "@/lib/utils"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardId: string
  title: string
  signalType?: "Risk" | "Opportunity"
}

type Recipient =
  | { type: "colleague"; data: Colleague }
  | { type: "team"; data: Team }

export function ShareDialog({
  open,
  onOpenChange,
  cardId,
  title,
  signalType,
}: ShareDialogProps) {
  const { department } = useDepartment()
  const { addSharedItem } = useSharedItems()
  const cardContext = getCardContext(cardId as "biosimilar-entry" | "medicare-reimbursement")

  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([])
  const [message, setMessage] = useState("")
  const [scope, setScope] = useState<ContentScope>("impact")
  const [sent, setSent] = useState(false)

  // Reset and set smart defaults when opened
  useEffect(() => {
    if (open) {
      setSelectedRecipients([])
      setScope("impact")
      setSent(false)
      const defaultMsg = getSmartDefaultMessage(cardId, department)
      setMessage(defaultMsg || `Sharing: ${title}`)
    }
  }, [open, cardId, department, title])

  function toggleColleague(c: Colleague) {
    setSelectedRecipients((prev) => {
      const exists = prev.find(
        (r) => r.type === "colleague" && r.data.id === c.id,
      )
      if (exists) return prev.filter((r) => !(r.type === "colleague" && r.data.id === c.id))
      return [...prev, { type: "colleague", data: c }]
    })
  }

  function toggleTeam(t: Team) {
    setSelectedRecipients((prev) => {
      const exists = prev.find(
        (r) => r.type === "team" && r.data.id === t.id,
      )
      if (exists) return prev.filter((r) => !(r.type === "team" && r.data.id === t.id))
      return [...prev, { type: "team", data: t }]
    })
  }

  function isColleagueSelected(id: string) {
    return selectedRecipients.some(
      (r) => r.type === "colleague" && r.data.id === id,
    )
  }

  function isTeamSelected(id: string) {
    return selectedRecipients.some(
      (r) => r.type === "team" && r.data.id === id,
    )
  }

  const isRisk = signalType === "Risk" || cardContext?.signalType === "Risk"

  function handleSend() {
    const recipients = selectedRecipients
      .map((r) => (r.type === "team" ? r.data.name : r.data.name))
      .join(", ")
    addSharedItem({
      cardId,
      title,
      signalType: isRisk ? "Risk" : "Opportunity",
      message,
      recipients: recipients || "—",
    })
    setSent(true)
  }

  // ── Sent confirmation ──────────────────────────────────────────
  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-card">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/10">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-card-foreground">
                Shared successfully
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedRecipients.length} recipient{selectedRecipients.length !== 1 && "s"} will receive this intelligence update.
              </p>
            </div>

            {/* Rich Preview Card */}
            <div className="w-full rounded-md border border-border bg-muted/50 p-4 text-left min-w-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border-0",
                    isRisk
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-emerald-600 text-[#fff]",
                  )}
                >
                  {isRisk ? "Critical Risk" : "Opportunity"}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-semibold text-card-foreground line-clamp-2 break-words">
                {title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 break-words">
                {cardContext?.quantifiedImpact || title}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[hsl(var(--accent))]">
                <Link2 className="h-3 w-3" />
                <span>View full intelligence card</span>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="mt-2 text-sm text-muted-foreground hover:text-card-foreground"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Share form ─────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-card-foreground">
            Share Intelligence
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Send this update to colleagues or teams for alignment.
          </DialogDescription>
        </DialogHeader>

        {/* Signal being shared */}
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5 min-w-0 overflow-hidden">
          {isRisk ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          )}
          <span className="text-sm font-medium text-card-foreground truncate min-w-0">
            {title}
          </span>
        </div>

        {/* Recipients */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Recipients
          </p>

          {/* Teams */}
          <div className="mb-2">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Users className="h-3 w-3" />
              Teams
            </p>
            <div className="flex flex-wrap gap-1.5">
              {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTeam(t)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                    isTeamSelected(t.id)
                      ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-card-foreground",
                  )}
                >
                  <Users className="h-3 w-3" />
                  {t.name}
                  <span className="text-[10px] opacity-60">
                    ({t.memberCount})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Colleagues */}
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <User className="h-3 w-3" />
              Colleagues
            </p>
            <div className="flex flex-wrap gap-1.5">
              {colleagues.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleColleague(c)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                    isColleagueSelected(c.id)
                      ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-card-foreground",
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold">
                    {c.initials}
                  </span>
                  {c.name}
                  <span className="text-[10px] opacity-60">{c.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator className="opacity-50" />

        {/* Content Scope */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Include
          </p>
          <div className="flex flex-col gap-2">
            {(
              Object.entries(contentScopeLabels) as [ContentScope, string][]
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2.5"
              >
                <Checkbox
                  checked={scope === key}
                  onCheckedChange={() => setScope(key)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs text-card-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator className="opacity-50" />

        {/* Message */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Message
            </p>
            <span className="text-[10px] text-muted-foreground/60">
              Optional
            </span>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note for context..."
            className="min-h-[72px] resize-none border-border bg-card text-sm text-card-foreground placeholder:text-muted-foreground/50 focus-visible:ring-[hsl(var(--accent))] break-words"
          />
          <p className="mt-1 text-[10px] text-muted-foreground/50">
            Auto-generated based on signal type and department context
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            {selectedRecipients.length === 0
              ? "Select at least one recipient"
              : `${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? "s" : ""} selected`}
          </span>
          <Button
            size="sm"
            disabled={selectedRecipients.length === 0}
            onClick={handleSend}
            className="gap-1.5 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
