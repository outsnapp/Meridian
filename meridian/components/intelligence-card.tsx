"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AIRecommendation } from "@/components/ai-recommendation"
import { ShareDialog } from "@/components/share-dialog"
import { useDepartment } from "@/lib/department-context"
import { useProfile } from "@/lib/profile-context"
import { subDepartmentToLegacyDepartment } from "@/lib/profile-config"
import { getShareHint } from "@/lib/share-data"
import { ArrowRight, Clock, RefreshCw, Share2 } from "lucide-react"
import { useState } from "react"

const INSIGHT_FALLBACK = "Insight currently being validated."

interface IntelligenceCardProps {
  type: "critical-risk" | "opportunity"
  signalLabel: string
  title: string
  description: string
  impactHeadline: string
  impactBody: string
  primaryAction: string
  secondaryAction: string
  source: string
  date: string
  cardId: string
  apiEventInsight?: {
    impact: string
    suggested_action: string
    primary_outcome?: string
    what_is_changing?: string
    why_it_matters?: string
    what_to_do_now?: string
    decision_urgency?: string
    recommended_next_step?: string
    impact_analysis?: string
    confidence_level?: string
  }
}

export function IntelligenceCard({
  type,
  signalLabel,
  title,
  description,
  impactHeadline,
  impactBody,
  primaryAction,
  secondaryAction,
  source,
  date,
  cardId,
  apiEventInsight,
}: IntelligenceCardProps) {
  const isCritical = type === "critical-risk"
  const [shareOpen, setShareOpen] = useState(false)
  const { department } = useDepartment()
  const { profileId } = useProfile()
  const legacyDept = subDepartmentToLegacyDepartment(profileId, department)
  const shareHint = getShareHint(cardId as "biosimilar-entry" | "medicare-reimbursement", legacyDept)

  return (
    <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
      {/* Badges */}
      <div className="flex items-center justify-between">
        <Badge
          className={
            isCritical
              ? "rounded bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground border-0"
              : "rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#fff] border-0"
          }
        >
          {isCritical ? "Critical Risk" : "Opportunity"}
        </Badge>
        <Badge className="rounded bg-[hsl(var(--accent))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--accent-foreground))] border-0">
          {signalLabel}
        </Badge>
      </div>

      {/* Title & Description */}
      <h2 className="mt-4 text-xl font-bold text-card-foreground leading-tight text-balance">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {/* Impact Analysis */}
      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Impact Analysis
        </p>
        <div className="mt-2 border-l-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/[0.05] py-2.5 px-3.5 rounded-r-md">
          <p className="text-sm font-medium text-card-foreground">{impactHeadline}</p>
          {impactBody && (
            <p className="mt-1 text-sm text-muted-foreground">{impactBody}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3">
        <Button variant="default" size="sm" className="gap-1.5 rounded-md text-xs font-medium">
          {primaryAction}
          {isCritical ? <RefreshCw className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="outline" size="sm" className="text-xs font-medium">
          {secondaryAction}
        </Button>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto gap-1.5 text-xs font-medium text-muted-foreground hover:text-card-foreground"
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

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>Source: {source}</span>
        </div>
        <span>Updated: {date}</span>
      </div>

      {/* AI Recommendation or API Event Insight */}
      {apiEventInsight ? (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1.5">
            AI Insight
          </p>
          <div className="rounded-md border border-[hsl(var(--accent))]/15 bg-[hsl(var(--accent))]/[0.03] px-3 py-2.5 space-y-2">
            <p className="text-sm font-medium text-card-foreground">
              {apiEventInsight.impact || INSIGHT_FALLBACK}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Suggested action:</span>{" "}
              {apiEventInsight.suggested_action || INSIGHT_FALLBACK}
            </p>
            {(apiEventInsight.what_is_changing || apiEventInsight.why_it_matters) && (
              <div className="pt-2 space-y-1 border-t border-border/30">
                {apiEventInsight.what_is_changing && apiEventInsight.what_is_changing !== INSIGHT_FALLBACK && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">What&apos;s changing:</span> {apiEventInsight.what_is_changing}
                  </p>
                )}
                {apiEventInsight.why_it_matters && apiEventInsight.why_it_matters !== INSIGHT_FALLBACK && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Why it matters:</span> {apiEventInsight.why_it_matters}
                  </p>
                )}
                {apiEventInsight.recommended_next_step && apiEventInsight.recommended_next_step !== INSIGHT_FALLBACK && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Next step:</span> {apiEventInsight.recommended_next_step}
                  </p>
                )}
                {apiEventInsight.confidence_level && apiEventInsight.confidence_level !== INSIGHT_FALLBACK && (
                  <p className="text-[10px] text-muted-foreground/80">
                    Confidence: {apiEventInsight.confidence_level}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <AIRecommendation cardId={cardId as "biosimilar-entry" | "medicare-reimbursement"} />
      )}

      {/* Share Dialog */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        cardId={cardId}
        title={title}
        signalType={isCritical ? "Risk" : "Opportunity"}
      />
    </article>
  )
}
