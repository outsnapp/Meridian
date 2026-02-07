"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ShareDialog } from "@/components/share-dialog"
import { useDepartment } from "@/lib/department-context"
import { useProfile } from "@/lib/profile-context"
import { subDepartmentToLegacyDepartment } from "@/lib/profile-config"
import { getShareHint } from "@/lib/share-data"
import { api } from "@/lib/api"
import { ArrowRight, Check, ChevronUp, Clock, History, Loader2, RefreshCw, Share2 } from "lucide-react"

function formatFetchedAgo(iso: string): string {
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return iso.slice(0, 16)
    const now = new Date()
    const sec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (sec < 60) return "Just now"
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
    if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return iso.slice(0, 16)
  }
}
import { useRef, useState } from "react"
import type { EventSchema } from "@/lib/event-schema"

interface UnifiedExecutiveCardProps {
  event: EventSchema
}

export function UnifiedExecutiveCard({ event }: UnifiedExecutiveCardProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const [analysisExpanded, setAnalysisExpanded] = useState(false)
  const [precedents, setPrecedents] = useState<Array<{ title: string; year: string; what_happened: string; outcome: string; source: string; url?: string }>>([])
  const [precedentsLoading, setPrecedentsLoading] = useState(false)
  const [precedentsFetched, setPrecedentsFetched] = useState(false)
  const [precedentsMessage, setPrecedentsMessage] = useState<string | null>(null)
  const analysisRef = useRef<HTMLDivElement>(null)
  const { department } = useDepartment()
  const { profileId } = useProfile()
  const legacyDept = subDepartmentToLegacyDepartment(profileId, department)

  async function fetchPrecedents() {
    if (precedentsFetched || precedentsLoading) return
    setPrecedentsLoading(true)
    try {
      const res = await fetch(api.precedents(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: parseInt(event.id, 10) }),
      })
      const data = await res.json()
      if (res.ok) {
        setPrecedents(data.precedents ?? [])
        setPrecedentsMessage(data.message ?? null)
      }
    } catch {
      setPrecedentsMessage("Could not load historical precedents.")
    } finally {
      setPrecedentsLoading(false)
      setPrecedentsFetched(true)
    }
  }

  function openAnalysis() {
    setAnalysisExpanded(true)
    setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }
  const shareHint = getShareHint(
    `event-${event.id}` as "biosimilar-entry" | "medicare-reimbursement",
    legacyDept
  )

  const isRisk = event.event_type === "Risk"
  const roleLabel =
    event.matched_role === "Strategy"
      ? "Executive / Strategy"
      : event.matched_role === "Medical"
        ? "Market Access / Policy"
        : event.matched_role === "Commercial"
          ? "Commercial / Sales"
          : event.matched_role === "Finance"
            ? "Finance"
            : "Executive / Strategy"

  return (
    <article className="rounded-xl border border-border bg-white p-6 shadow-sm dark:bg-card">
      {/* 1. Header: Badges + Title + Summary */}
      <div className="flex items-center justify-between">
        <Badge
          className={
            isRisk
              ? "rounded bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground border-0"
              : "rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#fff] border-0"
          }
        >
          {isRisk ? "Critical Risk" : "Opportunity"}
        </Badge>
        <Badge className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border-0">
          Signal
        </Badge>
      </div>

      <h2 className="mt-4 text-xl font-bold text-card-foreground leading-tight text-balance">
        {event.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {event.summary}
      </p>

      {/* 2. Impact Analysis (highlight box) */}
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Impact Analysis
        </p>
        <div className="mt-2 border-l-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 py-2.5 px-3.5 rounded-r-md">
          <p className="text-sm font-medium text-card-foreground leading-relaxed">
            {event.impact_analysis}
          </p>
        </div>
      </div>

      {/* Recommended Action - full-width box (full text visible) */}
      <div className="mt-5">
        <div className="flex w-full items-start gap-3 rounded-md bg-primary px-4 py-3 text-primary-foreground">
          <span className="min-w-0 flex-1 whitespace-normal text-left text-sm font-medium leading-relaxed">
            {event.what_to_do_now}
          </span>
          {isRisk ? (
            <RefreshCw className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
          )}
        </div>
        {/* Share button */}
        <div className="mt-3 flex justify-end">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-md border-border/80 px-4 py-2 text-xs font-medium text-card-foreground hover:bg-muted/50 hover:border-[hsl(var(--accent))]/40"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-xs text-muted-foreground">
                {shareHint}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Source, Fetched & Updated */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Source: {event.source}</span>
        </div>
        <div className="flex items-center gap-3">
          {event.fetched_at && (
            <span title={event.fetched_at}>
              Fetched: {formatFetchedAgo(event.fetched_at)}
            </span>
          )}
          <span>Updated: {event.updated_at}</span>
        </div>
      </div>

      {/* 3. AI Recommendation - collapsible */}
      <div ref={analysisRef} className="mt-6 border-t border-border/50 scroll-mt-4">
        {analysisExpanded ? (
          <>
            <div className="pt-6 flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  AI Recommendation
                </p>
                <Badge className="rounded-full bg-blue-100 dark:bg-blue-950/40 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400 border-0">
                  {roleLabel}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-medium text-muted-foreground hover:text-card-foreground shrink-0 gap-1.5"
                onClick={() => setAnalysisExpanded(false)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
                Close
              </Button>
            </div>

        {/* 4. Primary Outcome (large bold block) */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            Primary Outcome
          </p>
          <p className="text-base font-bold text-card-foreground leading-relaxed">
            {event.primary_outcome}
          </p>
        </div>

        {/* 5. Confidence (subtle row) */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground leading-relaxed">
            Confidence: {event.confidence}
          </span>
        </div>

        {/* 6. What's Changing */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            What&apos;s Changing
          </p>
          <p className="text-sm leading-relaxed text-card-foreground">
            {event.whats_changing}
          </p>
        </div>

        {/* 7. Why It Matters */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            Why It Matters
          </p>
          <p className="text-sm leading-relaxed text-card-foreground">
            {event.why_it_matters}
          </p>
        </div>

        {/* 8. What To Do Now */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            What To Do Now
          </p>
          <p className="text-sm leading-relaxed text-card-foreground">
            {event.what_to_do_now}
          </p>
        </div>

        {/* 9. Decision Urgency - prominent for visibility */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-2">
            Decision Urgency
          </p>
          <div className="rounded-md border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 px-4 py-3">
            <p className="text-base font-semibold leading-relaxed text-card-foreground">
              {event.decision_urgency}
            </p>
          </div>
        </div>

        {/* 10. Recommended Next Step (boxed) */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-1.5">
            Recommended Next Step
          </p>
          <div className="rounded-md border border-border bg-muted/30 dark:bg-muted/20 px-3 py-2.5">
            <p className="text-sm leading-relaxed text-card-foreground">
              {event.recommended_next_step}
            </p>
          </div>
        </div>

        {/* 11. Similar Past Events (historical precedent) */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
            Similar Past Events
          </p>
          {!precedentsFetched ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={fetchPrecedents}
              disabled={precedentsLoading}
            >
              {precedentsLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <History className="h-3.5 w-3.5" />
              )}
              {precedentsLoading ? "Searching..." : "See similar past events"}
            </Button>
          ) : precedentsMessage ? (
            <p className="text-sm text-muted-foreground">{precedentsMessage}</p>
          ) : precedents.length > 0 ? (
            <div className="space-y-3">
              {precedents.map((p, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border bg-muted/20 dark:bg-muted/10 px-4 py-3"
                >
                  <p className="text-sm font-medium text-card-foreground">
                    {p.year ? `${p.year} – ` : ""}{p.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {p.what_happened}
                  </p>
                  {p.outcome && (
                    <p className="mt-1 text-xs font-medium text-card-foreground">
                      Outcome: {p.outcome}
                    </p>
                  )}
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Source: {p.source}
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-accent hover:underline"
                      >
                        View source
                      </a>
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* 12. Assumptions & Signals (muted) */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70 mb-1.5">
            Assumptions & Signals
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {event.assumptions}
          </p>
        </div>
          </>
        ) : (
          <div className="pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-medium text-muted-foreground hover:text-card-foreground -ml-2"
              onClick={openAnalysis}
            >
              View full AI analysis →
            </Button>
          </div>
        )}
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        cardId={`event-${event.id}`}
        title={event.title}
        signalType={isRisk ? "Risk" : "Opportunity"}
      />
    </article>
  )
}
