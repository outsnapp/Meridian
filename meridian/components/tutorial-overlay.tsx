"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useTutorial } from "@/lib/tutorial-context"
import { Rss, MessageCircle, BarChart3, Map, Zap, Building2, TrendingUp, Filter, FileText } from "lucide-react"

const CARD_GAP = 12
const ARROW_WIDTH = 10

const TUTORIAL_STEPS: Record<
  number,
  { selector: string; title: string; description: string; Icon: typeof Rss }
> = {
  1: {
    selector: '[data-tutorial="intelligence-feed"]',
    title: "Intelligence Feed",
    description: "Your hub for market strategy signals: Prediction Tracker, urgency-filtered reports, and executive cards with impact and recommendations.",
    Icon: Rss,
  },
  2: {
    selector: '[data-tutorial="chat"]',
    title: "Chat",
    description: "Discuss signals, share cards to start threads, invite by role, get AI briefs, and export to PDF.",
    Icon: MessageCircle,
  },
  3: {
    selector: '[data-tutorial="analytics"]',
    title: "Analytics",
    description: "Signal trends by type and urgency, plus impact distribution for planning and reporting.",
    Icon: BarChart3,
  },
  4: {
    selector: '[data-tutorial="risk-heatmap"]',
    title: "Risk Heatmap",
    description: "Plant-level risk at a glance: risk level, revenue exposure, and timeline.",
    Icon: Map,
  },
  5: {
    selector: '[data-tutorial="fetch-live-data"]',
    title: "Fetch Live Data",
    description: "Pull latest intelligence from OpenFDA, Serper, CDSCO and refresh your feed.",
    Icon: Zap,
  },
  6: {
    selector: '[data-tutorial="feed-department-selector"]',
    title: "Department / Role",
    description: "Switch by role (Executive, Medical, Commercial). Reports are tailored to your function.",
    Icon: Building2,
  },
  7: {
    selector: '[data-tutorial="feed-prediction-tracker"]',
    title: "Prediction Tracker",
    description: "Past predictions vs actual outcomes. Expand to review historical performance.",
    Icon: TrendingUp,
  },
  8: {
    selector: '[data-tutorial="feed-urgency-filter"]',
    title: "Decision urgency",
    description: "Filter by High, Medium, or Low to prioritize which reports to act on first.",
    Icon: Filter,
  },
  9: {
    selector: '[data-tutorial="report-impact-analysis"]',
    title: "Impact Analysis",
    description: "Summary of how the signal affects your strategy: risks, opportunities, and what to watch.",
    Icon: FileText,
  },
  10: {
    selector: '[data-tutorial="report-financial-risk-timeline"]',
    title: "Financial impact & timeline",
    description: "Loss range (your currency), regulatory probability, and expected timeline.",
    Icon: FileText,
  },
  11: {
    selector: '[data-tutorial="report-counterfactual"]',
    title: "Counterfactual scenarios",
    description: "Best / base / conservative cases (e.g. 100%, 70%, 50%) for scenario planning.",
    Icon: FileText,
  },
  12: {
    selector: '[data-tutorial="report-how-calculated"]',
    title: "How this was calculated",
    description: "Expand for original revenue, conversion, formula, and final loss range.",
    Icon: FileText,
  },
  13: {
    selector: '[data-tutorial="report-recommended-action"]',
    title: "Recommended action & share",
    description: "AI-recommended next step. Use Share to send to Chat or export for leadership.",
    Icon: FileText,
  },
  14: {
    selector: '[data-tutorial="report-view-full-ai-analysis"]',
    title: "View full AI analysis",
    description: "Expand for full AI analysis: assumptions, positioning, and messaging.",
    Icon: FileText,
  },
  15: {
    selector: '[data-tutorial="report-share-button"]',
    title: "Share",
    description: "Share to Chat to start a thread, invite colleagues, or export to PDF.",
    Icon: FileText,
  },
}

export function TutorialOverlay() {
  const { tutorialStep, nextStep, endTutorial } = useTutorial()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const stepConfig = tutorialStep != null ? TUTORIAL_STEPS[tutorialStep] : null

  // Lock scrolling while tutorial is active so the highlight stays aligned
  useEffect(() => {
    if (tutorialStep == null) return
    const prevBody = document.body.style.overflow
    const main = document.querySelector("main")
    const prevMain = main ? (main as HTMLElement).style.overflow : ""
    document.body.style.overflow = "hidden"
    if (main) (main as HTMLElement).style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevBody
      if (main) (main as HTMLElement).style.overflow = prevMain
    }
  }, [tutorialStep])

  // Find target, scroll it into view, then track its position
  useEffect(() => {
    if (stepConfig == null) return
    const el = document.querySelector(stepConfig.selector) as HTMLElement | null
    const updateRect = (target: HTMLElement) => setTargetRect(target.getBoundingClientRect())
    let afterScrollId: ReturnType<typeof setTimeout> | null = null
    if (!el) {
      const t = setTimeout(() => {
        const retry = document.querySelector(stepConfig.selector) as HTMLElement | null
        if (retry) {
          retry.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
          afterScrollId = setTimeout(() => updateRect(retry), 450)
        }
      }, 400)
      return () => {
        clearTimeout(t)
        if (afterScrollId != null) clearTimeout(afterScrollId)
      }
    }
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
    afterScrollId = setTimeout(() => updateRect(el), 450)
    const ro = new ResizeObserver(() => updateRect(el))
    ro.observe(el)
    return () => {
      if (afterScrollId != null) clearTimeout(afterScrollId)
      ro.disconnect()
    }
  }, [tutorialStep, stepConfig?.selector])

  if (tutorialStep == null || stepConfig == null) return null

  const cardWidth = 320
  const cardHeight = 180
  const winW = typeof window !== "undefined" ? window.innerWidth : 1024
  const winH = typeof window !== "undefined" ? window.innerHeight : 768

  // Step 6 (Department/Role): place card below the dropdown so the dropdown stays visible
  const isDepartmentStep = tutorialStep === 6
  // Step 14 (View full AI analysis): place card above target so the Next button stays on screen
  const isViewFullAnalysisStep = tutorialStep === 14
  const cardLeft = targetRect
    ? isDepartmentStep
      ? Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - cardWidth / 2, winW - cardWidth - 16))
      : Math.min(targetRect.right + CARD_GAP + ARROW_WIDTH, winW - cardWidth - 16)
    : 224 + CARD_GAP + ARROW_WIDTH
  const cardTop = targetRect
    ? isDepartmentStep
      ? Math.min(targetRect.bottom + 14, winH - cardHeight - 16)
      : isViewFullAnalysisStep
        ? Math.max(16, targetRect.top - cardHeight - 14)
        : Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - cardHeight / 2, winH - cardHeight - 16))
    : 120

  const targetCenterY = targetRect ? targetRect.top + targetRect.height / 2 : cardTop + cardHeight / 2
  const arrowHeightPx = 16
  const arrowTopInCard = targetRect ? targetCenterY - cardTop - arrowHeightPx / 2 : cardHeight / 2 - arrowHeightPx / 2

  const TOTAL_STEPS = 15
  const isLastStep = tutorialStep === TOTAL_STEPS
  const handleGotIt = () => (isLastStep ? endTutorial() : nextStep())

  const { Icon } = stepConfig

  // Spotlight: dark overlay with a "hole" so the target stays bright and easy to see
  const dimOpacity = 0.58
  const holePadding = 4
  const clipPath =
    targetRect &&
    `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0,
      ${targetRect.left - holePadding}px ${targetRect.bottom + holePadding}px,
      ${targetRect.left - holePadding}px ${targetRect.top - holePadding}px,
      ${targetRect.right + holePadding}px ${targetRect.top - holePadding}px,
      ${targetRect.right + holePadding}px ${targetRect.bottom + holePadding}px,
      ${targetRect.left - holePadding}px ${targetRect.bottom + holePadding}px)`

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" aria-hidden>
      {/* Dark overlay with cutout: rest of screen is dimmed, target area stays bright */}
      <div
        className="absolute inset-0 pointer-events-auto transition-opacity duration-200"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${dimOpacity})`,
          clipPath: clipPath ?? "none",
        }}
        onClick={endTutorial}
        aria-label="Click to skip tutorial"
      />

      {/* Highlight ring around the target — thick, bright, and glowing so it's clearly visible */}
      {targetRect && (
        <div
          className="absolute pointer-events-none rounded-lg animate-[pulse_2s_ease-in-out_infinite]"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            border: "3px solid white",
            boxShadow:
              "0 0 0 1px hsl(var(--primary)), 0 0 0 4px rgba(255,255,255,0.9), 0 0 24px 4px hsl(var(--primary) / 0.5)",
          }}
        />
      )}

      <div
        className="absolute w-[320px] pointer-events-auto rounded-lg border-2 border-primary bg-card shadow-xl p-4"
        style={{
          left: cardLeft,
          top: cardTop,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isDepartmentStep ? (
          <div
            className="absolute w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-primary"
            style={{
              left: Math.max(12, Math.min(cardWidth - 20, (targetRect ? targetRect.left + targetRect.width / 2 - cardLeft - 8 : cardWidth / 2 - 8))),
              top: -ARROW_WIDTH,
            }}
          />
        ) : isViewFullAnalysisStep ? (
          <div
            className="absolute w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-primary"
            style={{
              left: Math.max(12, Math.min(cardWidth - 20, (targetRect ? targetRect.left + targetRect.width / 2 - cardLeft - 8 : cardWidth / 2 - 8))),
              top: cardHeight,
            }}
          />
        ) : (
          <div
            className="absolute w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-primary"
            style={{
              left: -ARROW_WIDTH,
              top: Math.max(4, Math.min(cardHeight - 20, arrowTopInCard)),
            }}
          />
        )}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground">{stepConfig.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {stepConfig.description}
            </p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Step {tutorialStep} of {TOTAL_STEPS}
              </span>
              <Button onClick={handleGotIt}>
                {isLastStep ? "Got it" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
