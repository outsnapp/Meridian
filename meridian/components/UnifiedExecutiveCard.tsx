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
import { AIRecommendation } from "@/components/ai-recommendation"
import { useDepartment } from "@/lib/department-context"
import { useProfile } from "@/lib/profile-context"
import { subDepartmentToLegacyDepartment } from "@/lib/profile-config"
import { getShareHint } from "@/lib/share-data"
import { eventToCardId } from "@/lib/recommendations"
import { api } from "@/lib/api"
import { ArrowRight, ChevronUp, Clock, History, Loader2, MessageSquare, RefreshCw, Share2 } from "lucide-react"

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
import { useRef, useState, useEffect } from "react"
import type { EventSchema } from "@/lib/event-schema"

interface CalculationBreakdown {
  original_revenue?: string
  conversion?: string
  formula?: string
  final_units?: string
  validation_passed?: boolean
  validation_message?: string | null
}

interface RiskAnalysis {
  status: string
  probability?: number
  loss_min?: number
  loss_max?: number
  loss_display_min?: string
  loss_display_max?: string
  loss_unit?: string
  expected_days_min?: number
  expected_days_max?: number
  confidence_score?: number
  confidence_band?: string
  methodology?: {
    financial_basis: string
    risk_basis: string
    timeline_basis: string
    confidence_basis: string
    calculation_breakdown?: CalculationBreakdown
  }
  calculation_breakdown?: CalculationBreakdown
  scenarios?: {
    scenario_a: { label: string; loss_min: number; loss_max: number }
    scenario_b: { label: string; loss_min: number; loss_max: number }
    scenario_c: { label: string; loss_min: number; loss_max: number }
  }
  scenario_displays?: {
    scenario_a: { label: string; display_min: string; display_max: string }
    scenario_b: { label: string; display_min: string; display_max: string }
    scenario_c: { label: string; display_min: string; display_max: string }
  }
  validation_passed?: boolean
  validation_message?: string | null
  message?: string
}

interface UnifiedExecutiveCardProps {
  event: EventSchema
  /** When true, add data-tutorial attributes for the in-report tutorial steps */
  isFirstForTutorial?: boolean
}

export function UnifiedExecutiveCard({ event, isFirstForTutorial }: UnifiedExecutiveCardProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const [analysisExpanded, setAnalysisExpanded] = useState(false)
  const [precedents, setPrecedents] = useState<Array<{ title: string; year: string; what_happened: string; outcome: string; source: string; url?: string }>>([])
  const [precedentsLoading, setPrecedentsLoading] = useState(false)
  const [precedentsFetched, setPrecedentsFetched] = useState(false)
  const [precedentsMessage, setPrecedentsMessage] = useState<string | null>(null)
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null)
  const [riskAnalysisLoading, setRiskAnalysisLoading] = useState(false)
  const [methodologyExpanded, setMethodologyExpanded] = useState(false)
  const analysisRef = useRef<HTMLDivElement>(null)
  const { department } = useDepartment()
  const { profileId } = useProfile()
  const legacyDept = subDepartmentToLegacyDepartment(profileId, department)

  useEffect(() => {
    async function fetchRiskAnalysis() {
      setRiskAnalysisLoading(true)
      try {
        const res = await fetch(api.signalAnalysis(parseInt(event.id, 10)))
        const data = await res.json()
        setRiskAnalysis(data)
      } catch {
        setRiskAnalysis({ status: "error", message: "Failed to load risk analysis" })
      } finally {
        setRiskAnalysisLoading(false)
      }
    }
    fetchRiskAnalysis()
  }, [event.id])

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
  const ctx = event.company_context

  return (
    <article className="rounded-xl border border-border bg-white p-6 shadow-sm dark:bg-card">
      {/* 1. Header: Title + Summary */}
      <h2 className="text-xl font-bold text-card-foreground leading-tight text-balance">
        {event.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {event.summary}
      </p>

      {/* Company context (when demo mode) */}
      {ctx && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground border-b border-border/50 pb-4">
          {ctx.company_name && (
            <span><strong className="text-foreground">Company:</strong> {ctx.company_name}</span>
          )}
          {ctx.exposure && (
            <span><strong className="text-foreground">Exposure:</strong> {ctx.exposure}</span>
          )}
          {ctx.product_line && (
            <span><strong className="text-foreground">Product Line:</strong> {ctx.product_line}</span>
          )}
        </div>
      )}

      {/* 2. Impact Analysis (highlight box) */}
      <div className="mt-5" {...(isFirstForTutorial ? { "data-tutorial": "report-impact-analysis" } : {})}>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Impact Analysis
        </p>
        <div className="mt-2 border-l-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 py-2.5 px-3.5 rounded-r-md">
          <p className="text-sm font-medium text-card-foreground leading-relaxed">
            {event.impact_analysis}
          </p>
        </div>
      </div>

      {/* Risk Engine Analysis */}
      {riskAnalysisLoading ? (
        <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Loading risk analysis...</p>
        </div>
      ) : riskAnalysis?.status === "insufficient_data" ? (
        <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            {riskAnalysis.message || "More historical data required for impact and risk estimates"}
          </p>
        </div>
      ) : riskAnalysis?.status === "ok" ? (
        <div className="mt-5 space-y-4" {...(isFirstForTutorial ? { "data-tutorial": "report-financial-risk-timeline" } : {})}>
          {/* Impact Estimation — always show currency + scale, never raw numbers */}
          {riskAnalysis.loss_min != null && riskAnalysis.loss_max != null && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                📊 Financial Impact Estimation
              </p>
              <p className="text-lg font-semibold text-card-foreground">
                {riskAnalysis.loss_display_min && riskAnalysis.loss_display_max
                  ? `${riskAnalysis.loss_display_min} – ${riskAnalysis.loss_display_max}`
                  : `$${(riskAnalysis.loss_min / 1).toLocaleString()}M – $${(riskAnalysis.loss_max / 1).toLocaleString()}M`}
              </p>
              {riskAnalysis.loss_unit && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  All values in {riskAnalysis.loss_unit} (converted for display)
                </p>
              )}
              {riskAnalysis.confidence_band && (
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {riskAnalysis.confidence_band}
                </p>
              )}
              {riskAnalysis.validation_passed === false && riskAnalysis.validation_message && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                  ⚠ {riskAnalysis.validation_message}
                </p>
              )}
            </div>
          )}

          {/* Risk Probability */}
          {riskAnalysis.probability != null && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                ⚠️ Regulatory Action Probability
              </p>
              <p className="text-lg font-semibold text-card-foreground">
                {riskAnalysis.probability.toFixed(1)}%
              </p>
            </div>
          )}

          {/* Expected Timeline */}
          {riskAnalysis.expected_days_min != null && riskAnalysis.expected_days_max != null && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                ⏱ Expected Timeline
              </p>
              <p className="text-lg font-semibold text-card-foreground">
                {riskAnalysis.expected_days_min}–{riskAnalysis.expected_days_max} days
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Expected time to regulatory action
              </p>
            </div>
          )}

          {/* Counterfactual: Scenario A (100%) / B (70%) / C (50%) — unit-aware display */}
          {riskAnalysis.scenarios && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 p-4" {...(isFirstForTutorial ? { "data-tutorial": "report-counterfactual" } : {})}>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                If company does nothing vs acts early (Scenario A / B / C)
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-card-foreground">
                  <strong>Scenario A — {riskAnalysis.scenarios.scenario_a.label}:</strong>{" "}
                  Loss{" "}
                  {riskAnalysis.scenario_displays?.scenario_a
                    ? `${riskAnalysis.scenario_displays.scenario_a.display_min} – ${riskAnalysis.scenario_displays.scenario_a.display_max}`
                    : `$${riskAnalysis.scenarios.scenario_a.loss_min.toLocaleString()}M – $${riskAnalysis.scenarios.scenario_a.loss_max.toLocaleString()}M`}
                </p>
                <p className="text-card-foreground">
                  <strong>Scenario B — {riskAnalysis.scenarios.scenario_b.label}:</strong>{" "}
                  Loss{" "}
                  {riskAnalysis.scenario_displays?.scenario_b
                    ? `${riskAnalysis.scenario_displays.scenario_b.display_min} – ${riskAnalysis.scenario_displays.scenario_b.display_max}`
                    : `$${riskAnalysis.scenarios.scenario_b.loss_min.toLocaleString()}M – $${riskAnalysis.scenarios.scenario_b.loss_max.toLocaleString()}M`}
                </p>
                <p className="text-card-foreground">
                  <strong>Scenario C — {riskAnalysis.scenarios.scenario_c.label}:</strong>{" "}
                  Loss{" "}
                  {riskAnalysis.scenario_displays?.scenario_c
                    ? `${riskAnalysis.scenario_displays.scenario_c.display_min} – ${riskAnalysis.scenario_displays.scenario_c.display_max}`
                    : `$${riskAnalysis.scenarios.scenario_c.loss_min.toLocaleString()}M – $${riskAnalysis.scenarios.scenario_c.loss_max.toLocaleString()}M`}
                </p>
              </div>
            </div>
          )}

          {/* Methodology (expandable) — includes Original revenue, Conversion, Formula, Final units */}
          {riskAnalysis.methodology && (
            <div className="rounded-lg border border-border bg-muted/10 p-4" {...(isFirstForTutorial ? { "data-tutorial": "report-how-calculated" } : {})}>
              <button
                type="button"
                onClick={() => setMethodologyExpanded(!methodologyExpanded)}
                className="w-full flex items-center justify-between text-left"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  📖 How This Was Calculated
                </p>
                <ChevronUp className={`h-4 w-4 transition-transform ${methodologyExpanded ? "" : "rotate-180"}`} />
              </button>
              {methodologyExpanded && (
                <div className="mt-3 space-y-3 text-sm text-card-foreground leading-relaxed">
                  {(riskAnalysis.calculation_breakdown ?? riskAnalysis.methodology.calculation_breakdown) && (
                    <div className="rounded-md border border-border bg-background p-3 space-y-2 mb-3">
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Calculation breakdown
                      </p>
                      {(() => {
                        const b = riskAnalysis.calculation_breakdown ?? riskAnalysis.methodology.calculation_breakdown
                        if (!b) return null
                        return (
                          <>
                            {b.original_revenue && (
                              <p><strong>Original revenue:</strong> {b.original_revenue}</p>
                            )}
                            {b.conversion && (
                              <p><strong>Conversion:</strong> {b.conversion}</p>
                            )}
                            {b.formula && (
                              <p><strong>Formula:</strong> {b.formula}</p>
                            )}
                            {b.final_units && (
                              <p><strong>Final units:</strong> {b.final_units}</p>
                            )}
                            {b.validation_passed === false && b.validation_message && (
                              <p className="text-amber-600 dark:text-amber-400 text-xs">⚠ {b.validation_message}</p>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Financial Basis
                    </p>
                    <p>{riskAnalysis.methodology.financial_basis}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Risk Basis
                    </p>
                    <p>{riskAnalysis.methodology.risk_basis}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Timeline Basis
                    </p>
                    <p>{riskAnalysis.methodology.timeline_basis}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Confidence Basis
                    </p>
                    <p>{riskAnalysis.methodology.confidence_basis}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Recommended Action - full-width box (full text visible) */}
      <div className="mt-5" {...(isFirstForTutorial ? { "data-tutorial": "report-recommended-action" } : {})}>
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
        {/* Share */}
        <div className="mt-3 flex justify-end items-center" {...(isFirstForTutorial ? { "data-tutorial": "report-share-button" } : {})}>
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

      {/* Source (only real sources), Fetched & Updated */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {event.source &&
            event.source !== "Simulation" &&
            event.source !== "Demo" && (
              <>
                <Clock className="h-3 w-3 shrink-0" />
                <span>Source: {event.source}</span>
              </>
            )}
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

      {/* 3. AI Recommendation - collapsible with View as */}
      <div ref={analysisRef} className="mt-6 border-t border-border/50 scroll-mt-4">
        {analysisExpanded ? (
          <>
            <div className="pt-6 flex items-center justify-between gap-2 mb-2">
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
            <AIRecommendation
              cardId={eventToCardId(event.title, event.summary, event.tags)}
            />

        {/* 10b. Messaging & Marketing Brief - event-specific, keep below AI Recommendation */}
        {(event.messaging_instructions || event.positioning_before || event.positioning_after) && (
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-2 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Messaging & Marketing Brief
            </p>
            <div className="space-y-3 rounded-md border border-border bg-emerald-50/30 dark:bg-emerald-950/20 px-4 py-3">
              {event.messaging_instructions && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Field-team guidance
                  </p>
                  <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-line">
                    {event.messaging_instructions}
                  </p>
                </div>
              )}
              {(event.positioning_before || event.positioning_after) && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Before
                    </p>
                    <p className="text-xs leading-relaxed text-card-foreground">
                      {event.positioning_before || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                      After
                    </p>
                    <p className="text-xs leading-relaxed text-card-foreground font-medium">
                      {event.positioning_after || "—"}
                    </p>
                  </div>
                </div>
              )}
              {event.agent_action_log && event.agent_action_log !== "[]" && String(event.agent_action_log).trim() !== "" && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Agent action log
                  </p>
                  <ul className="space-y-1">
                    {(() => {
                      try {
                        const log = JSON.parse(event.agent_action_log || "[]")
                        if (!Array.isArray(log) || log.length === 0) return null
                        return log.map((item: { action?: string; role?: string }, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-card-foreground">
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                              {item.role || "—"}
                            </span>
                            <span>{item.action || ""}</span>
                          </li>
                        ))
                      } catch {
                        return null
                      }
                    })()}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 11. Supporting Evidence — 3 similar FDA cases with links and outcomes */}
        <div className="mb-5" {...(isFirstForTutorial ? { "data-tutorial": "report-supporting-evidence" } : {})}>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
            Supporting Evidence
          </p>
          <p className="text-[11px] text-muted-foreground mb-2">
            3 similar FDA cases — dates, outcomes, links
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
              {precedentsLoading ? "Loading..." : "Load supporting evidence"}
            </Button>
          ) : precedentsMessage ? (
            <p className="text-sm text-muted-foreground">{precedentsMessage}</p>
          ) : precedents.length > 0 ? (
            <div className="space-y-3">
              {precedents.slice(0, 3).map((p, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border bg-muted/20 dark:bg-muted/10 px-4 py-3"
                >
                  {p.year && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      {p.year}
                    </p>
                  )}
                  <p className="text-sm font-medium text-card-foreground">
                    {p.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {p.what_happened}
                  </p>
                  {p.outcome && (
                    <p className="mt-1 text-xs font-medium text-card-foreground">
                      Outcome: {p.outcome}
                    </p>
                  )}
                  {p.source &&
                    p.source !== "Simulation" &&
                    p.source !== "Demo" && (
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
                    )}
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
          <div className="pt-4" {...(isFirstForTutorial ? { "data-tutorial": "report-view-full-ai-analysis" } : {})}>
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
        cardSnapshot={{
          title: event.title,
          summary: event.summary,
          impact_analysis: event.impact_analysis,
          whats_changing: event.whats_changing,
          why_it_matters: event.why_it_matters,
          what_to_do_now: event.what_to_do_now,
          decision_urgency: event.decision_urgency,
          recommended_next_step: event.recommended_next_step,
          messaging_instructions: event.messaging_instructions,
          positioning_before: event.positioning_before,
          positioning_after: event.positioning_after,
          article_url: event.article_url,
          tags: event.tags,
          source: event.source,
          updated_at: event.updated_at,
        }}
      />
    </article>
  )
}
