"use client"

import { ChevronDown, Sparkles, Check, AlertTriangle, AlertCircle, Users } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDepartment } from "@/lib/department-context"
import { useProfile } from "@/lib/profile-context"
import { subDepartmentToLegacyDepartment } from "@/lib/profile-config"
import { getRecommendation } from "@/lib/recommendations"
import type { LegacyDepartment } from "@/lib/department-context"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type ConfidenceLevel = "high" | "moderate" | "low"

function parseConfidence(confidence: string): { level: ConfidenceLevel; label: string; justification: string | null } {
  const parts = confidence.split(/\s+--\s+/)
  const rawLevel = (parts[0] ?? "").trim()
  const levelStr = rawLevel.toLowerCase()
  const justification = parts[1]?.trim() ?? null

  if (levelStr.startsWith("high") && !levelStr.includes("moderate")) {
    return { level: "high", label: "High Confidence", justification }
  }
  if (levelStr.startsWith("low")) {
    return { level: "low", label: "Low Confidence", justification }
  }
  return {
    level: "moderate",
    label: rawLevel ? `${rawLevel} Confidence` : "Moderate Confidence",
    justification,
  }
}

const confidenceStyles: Record<ConfidenceLevel, { badge: string; icon: typeof Check }> = {
  high: {
    badge: "rounded-full border-0 bg-emerald-600/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
    icon: Check,
  },
  moderate: {
    badge: "rounded-full border-0 bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
    icon: AlertTriangle,
  },
  low: {
    badge: "rounded-full border-0 bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
    icon: AlertCircle,
  },
}

import type { CardId } from "@/lib/recommendations"

interface AIRecommendationProps {
  cardId: CardId
}

const departmentLabels: Record<string, string> = {
  executive: "Executive / Strategy",
  finance: "Finance",
  commercial: "Commercial / Sales",
  "market-access": "Market Access / Policy",
}

const LEGACY_DEPARTMENTS: LegacyDepartment[] = ["executive", "finance", "commercial", "market-access"]

const highlightLabels = new Set([
  "RECOMMENDED NEXT STEP",
  "DECISION URGENCY",
])

const muted = new Set(["ASSUMPTIONS & SIGNALS"])

function splitLeadSentence(content: string): [string, string | null] {
  const match = content.match(/^(.+?[.!?])\s+(.+)$/)
  if (match) return [match[1], match[2]]
  return [content, null]
}

export function AIRecommendation({ cardId }: AIRecommendationProps) {
  const { department } = useDepartment()
  const { profileId } = useProfile()
  const legacyDept = subDepartmentToLegacyDepartment(profileId, department)
  const [viewAsDept, setViewAsDept] = useState<LegacyDepartment>(legacyDept)
  const rec = getRecommendation(cardId, viewAsDept)
  const [isOpen, setIsOpen] = useState(true)

  // When user switches their department in the sidebar, default to their new view
  useEffect(() => {
    setViewAsDept(legacyDept)
  }, [legacyDept])

  return (
    <div className="mt-0">
      <Separator className="opacity-50" />
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="pt-4 pb-1">
        <CollapsibleTrigger className="flex w-full items-center justify-between group">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Recommendation
            </span>
            <span className="rounded-full bg-[hsl(var(--accent))]/10 px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--accent))]">
              {departmentLabels[viewAsDept]}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              View as
            </span>
            <Select
              value={viewAsDept}
              onValueChange={(v) => setViewAsDept(v as LegacyDepartment)}
            >
              <SelectTrigger className="h-7 w-[160px] border-border/60 text-xs">
                <SelectValue placeholder="Select perspective" />
              </SelectTrigger>
              <SelectContent>
                {LEGACY_DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {departmentLabels[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border border-[hsl(var(--accent))]/15 bg-[hsl(var(--accent))]/[0.03] px-4 py-4">
            <div className="flex flex-col gap-4">
              {rec.sections.map((section, idx) => {
                const isHighlight = highlightLabels.has(section.label)
                const isMuted = muted.has(section.label)
                const isNextStep = section.label === "RECOMMENDED NEXT STEP"
                const isPrimaryOutcome = section.label === "PRIMARY OUTCOME"
                const isWhatToDo = section.label === "WHAT TO DO NOW"

                if (isNextStep) {
                  return (
                    <div key={section.label}>
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--accent))]">
                        {section.label}
                      </p>
                      <div className="rounded border border-border bg-card px-3 py-2.5">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  )
                }

                if (isWhatToDo) {
                  const [lead, rest] = splitLeadSentence(section.content)
                  return (
                    <div key={section.label}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                        {section.label}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        <span className="font-medium text-card-foreground">
                          {lead}
                        </span>
                        {rest && (
                          <span className="text-muted-foreground/60">
                            {" "}{rest}
                          </span>
                        )}
                      </p>
                    </div>
                  )
                }

                return (
                  <div key={section.label}>
                    <p
                      className={cn(
                        "mb-1 text-[10px] font-bold uppercase tracking-widest",
                        isHighlight
                          ? "text-[hsl(var(--accent))]"
                          : isMuted
                            ? "text-muted-foreground/50"
                            : "text-muted-foreground/70"
                      )}
                    >
                      {section.label}
                    </p>
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        isPrimaryOutcome
                          ? "font-semibold text-card-foreground"
                          : isHighlight
                            ? "italic text-muted-foreground/80"
                            : isMuted
                              ? "text-[11px] text-muted-foreground/60"
                              : "text-muted-foreground"
                      )}
                    >
                      {section.content}
                    </p>

                    {/* Confidence indicator: color-coded badge below PRIMARY OUTCOME */}
                    {isPrimaryOutcome && (() => {
                      const { level, label, justification } = parseConfidence(rec.confidence)
                      const style = confidenceStyles[level]
                      const Icon = style.icon
                      return (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <Badge className={cn("gap-1.5", style.badge)}>
                            <Icon className="h-3 w-3 shrink-0" />
                            {label}
                          </Badge>
                          {justification && (
                            <span className="text-[11px] leading-relaxed text-muted-foreground/60">
                              {justification}
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
