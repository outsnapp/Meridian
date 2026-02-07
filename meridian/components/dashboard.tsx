"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { UnifiedExecutiveCard } from "@/components/UnifiedExecutiveCard"
import { DepartmentSelector } from "@/components/department-selector"
import { ContextChatbot } from "@/components/context-chatbot"
import { DepartmentProvider, useDepartment } from "@/lib/department-context"
import { ProfileProvider, useProfile } from "@/lib/profile-context"
import { SharedItemsProvider } from "@/lib/shared-items-context"
import { ViewProvider, useView } from "@/lib/view-context"
import { ChatPanel } from "@/components/chat-panel"
import { AnalyticsPanel } from "@/components/analytics-panel"
import { SettingsPanel } from "@/components/settings-panel"
import { RiskHeatmapPanel } from "@/components/risk-heatmap-panel"
import { PredictionTrackerSection } from "@/components/prediction-tracker-section"
import { SettingsProvider } from "@/lib/settings-context"
import { api } from "@/lib/api"
import {
  apiEventToEventSchema,
  isVerifiedSource,
  type ApiEvent,
} from "@/lib/event-types"
import { subDepartmentToApiRole } from "@/lib/profile-config"
import type { EventSchema } from "@/lib/event-schema"
import { getUrgencyLevel, type UrgencyLevel } from "@/lib/urgency-utils"
import { UrgencyFilter } from "@/components/urgency-filter"

function DashboardWithProfile() {
  const { profileId } = useProfile()
  return (
    <SettingsProvider>
      <DepartmentProvider profileId={profileId}>
        <SharedItemsProvider>
          <ViewProvider>
            <DashboardBody />
          </ViewProvider>
        </SharedItemsProvider>
      </DepartmentProvider>
    </SettingsProvider>
  )
}

export function Dashboard() {
  return (
    <ProfileProvider>
      <DashboardWithProfile />
    </ProfileProvider>
  )
}

function DashboardBody() {
  const { department } = useDepartment()
  const { profileId } = useProfile()
  const { view } = useView()
  const [events, setEvents] = useState<EventSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel | null>(null)
  const [demoContext, setDemoContext] = useState<{ company_name?: string; markets?: string[] } | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    fetch(api.demoStatus())
      .then((r) => r.json())
      .then((d) => {
        if (d.demo_mode && d.company_name) {
          setDemoContext({ company_name: d.company_name, markets: d.markets ?? ["US", "India", "EU"] })
        } else {
          setDemoContext(null)
        }
      })
      .catch(() => setDemoContext(null))
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const role = subDepartmentToApiRole(profileId, department)
      const res = await fetch(api.events({ role }))
      const data = await res.json()
      if (res.ok && data.events) {
        const schemas = (data.events as ApiEvent[])
          .map(apiEventToEventSchema)
          .filter(isVerifiedSource)
        setEvents(schemas)
        setActiveCardId((prev) => (schemas.length > 0 && !prev ? `event-${schemas[0].id}` : prev))
      } else {
        setEvents([])
      }
    } catch {
      setError("Could not load events. Is the backend running?")
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [profileId, department])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handler = () => fetchEvents()
      window.addEventListener("meridian:refresh-events", handler)
      return () => window.removeEventListener("meridian:refresh-events", handler)
    }
  }, [fetchEvents])

  // Track which card is most visible using IntersectionObserver
  useEffect(() => {
    const root = mainRef.current
    if (!root) return

    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-card-id")
          if (id) {
            ratios.set(id, entry.intersectionRatio)
          }
        }

        let bestId: string | null = null
        let bestRatio = 0
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }

        if (bestId && bestRatio > 0.3) {
          setActiveCardId(bestId)
        }
      },
      {
        root,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )

    for (const el of cardRefs.current.values()) {
      observer.observe(el)
    }

    return () => observer.disconnect()
  }, [events.length])

  function setCardRef(cardId: string, el: HTMLDivElement | null) {
    if (el) {
      cardRefs.current.set(cardId, el)
    } else {
      cardRefs.current.delete(cardId)
    }
  }

  const urgencyCounts = { High: 0, Medium: 0, Low: 0, Other: 0 }
  for (const e of events) {
    urgencyCounts[getUrgencyLevel(e.decision_urgency)]++
  }
  const filteredEvents = selectedUrgency
    ? events.filter((e) => getUrgencyLevel(e.decision_urgency) === selectedUrgency)
    : []

  return (
    <DashboardContent
      view={view}
      events={filteredEvents}
      allEvents={events}
      loading={loading}
      error={error}
      activeCardId={activeCardId}
      selectedUrgency={selectedUrgency}
      setSelectedUrgency={setSelectedUrgency}
      urgencyCounts={urgencyCounts}
      mainRef={mainRef}
      cardRefs={cardRefs}
      setCardRef={setCardRef}
      demoContext={demoContext}
    />
  )
}

function DashboardContent({
  view,
  events,
  allEvents,
  loading,
  error,
  activeCardId,
  selectedUrgency,
  setSelectedUrgency,
  urgencyCounts,
  mainRef,
  cardRefs,
  setCardRef,
  demoContext,
}: {
  view: "feed" | "chat" | "analytics" | "heatmap" | "settings"
  events: EventSchema[]
  allEvents: EventSchema[]
  loading: boolean
  error: string | null
  activeCardId: string | null
  selectedUrgency: UrgencyLevel | null
  setSelectedUrgency: (v: UrgencyLevel | null) => void
  urgencyCounts: { High: number; Medium: number; Low: number; Other: number }
  mainRef: React.RefObject<HTMLElement | null>
  cardRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
  setCardRef: (cardId: string, el: HTMLDivElement | null) => void
  demoContext: { company_name?: string; markets?: string[] } | null
}) {
  if (view === "chat") {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="shrink-0 flex items-center gap-4 border-b border-border bg-card px-8 py-5 shadow-sm">
            <h1 className="text-lg font-bold text-foreground">Executive Intelligence Workspace</h1>
            <p className="text-xs text-muted-foreground">
              Discuss strategic response and decisions linked to intelligence signals
            </p>
          </header>
          <div className="flex-1 overflow-hidden min-h-0">
            <ChatPanel />
          </div>
        </main>
      </div>
    )
  }

  if (view === "analytics") {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-8 py-5">
            <div>
              <h1 className="text-lg font-bold text-foreground">Analytics</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Signal trends, breakdown, and impact distribution
              </p>
            </div>
          </header>
          <AnalyticsPanel />
        </main>
      </div>
    )
  }

  if (view === "settings") {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-8 py-5">
            <div>
              <h1 className="text-lg font-bold text-foreground">Settings</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Profile, region, notifications, and appearance
              </p>
            </div>
          </header>
          <SettingsPanel />
        </main>
      </div>
    )
  }

  if (view === "heatmap") {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-8 py-5">
            <div>
              <h1 className="text-lg font-bold text-foreground">Risk Heatmap</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Plant-level risk, revenue exposure, and timeline
              </p>
            </div>
          </header>
          <RiskHeatmapPanel />
        </main>
      </div>
    )
  }

  const showReports = Boolean(selectedUrgency)
  const hasEvents = allEvents.length > 0

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main ref={mainRef} className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-8 py-5">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Market Strategy
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              AI-powered intelligence for strategic decisions
            </p>
          </div>
          <div className="flex items-center gap-4">
            {demoContext?.company_name && (
              <div className="hidden sm:flex flex-col items-end text-right border-l border-border pl-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Analyzing: {demoContext.company_name} (Context)
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Markets: {demoContext.markets?.join(" | ") || "US | India | EU"}
                </span>
              </div>
            )}
            <DepartmentSelector />
          </div>
        </header>

        {/* Main content: selection bar first, reports only after selection */}
        <div className="mx-auto max-w-3xl px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              Loading events...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-6 py-8 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Start the backend with: uvicorn main:app --reload
              </p>
            </div>
          ) : !hasEvents ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Waiting for verified intelligence sources.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Use Fetch Live Data in the sidebar to fetch from OpenFDA, Serper, or CDSCO.
              </p>
            </div>
          ) : (
            <>
              <PredictionTrackerSection />
              {/* Selection bar - always shown when we have events, primary focus */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-foreground">
                  Choose decision urgency to view reports
                </p>
                <UrgencyFilter
                  selected={selectedUrgency}
                  onSelect={setSelectedUrgency}
                  counts={urgencyCounts}
                />
                {!showReports && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Click a button above to see reports for that urgency level
                  </p>
                )}
              </div>

              {/* Reports - ONLY when user has selected an urgency */}
              {showReports && (
                <div className="mt-8">
                  {events.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        No reports with {selectedUrgency} urgency
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {events
                        .filter(isVerifiedSource)
                        .map((event) => (
                          <div
                            key={event.id}
                            ref={(el) => setCardRef(`event-${event.id}`, el)}
                            data-card-id={`event-${event.id}`}
                          >
                            <UnifiedExecutiveCard event={event} />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <ContextChatbot
        activeCardId={activeCardId}
        activeCardTitle={allEvents.find((e) => `event-${e.id}` === activeCardId)?.title}
        activeCardSignalType={
          (() => {
            const ev = allEvents.find((e) => `event-${e.id}` === activeCardId)
            return ev?.event_type === "Risk" ? "Risk" : ev?.event_type === "Expansion" ? "Opportunity" : undefined
          })()
        }
        activeEventId={
          (() => {
            const ev = allEvents.find((e) => `event-${e.id}` === activeCardId)
            return ev ? parseInt(ev.id, 10) : null
          })()
        }
      />
    </div>
  )
}
