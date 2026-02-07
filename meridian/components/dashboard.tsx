"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { UnifiedExecutiveCard } from "@/components/UnifiedExecutiveCard"
import { DepartmentSelector } from "@/components/department-selector"
import { ContextChatbot } from "@/components/context-chatbot"
import { DepartmentProvider, useDepartment } from "@/lib/department-context"
import { SharedItemsProvider } from "@/lib/shared-items-context"
import { ViewProvider, useView } from "@/lib/view-context"
import { ChatPanel } from "@/components/chat-panel"
import { AnalyticsPanel } from "@/components/analytics-panel"
import { DiscoveryPanel } from "@/components/discovery-panel"
import { SimulationsPanel } from "@/components/simulations-panel"
import { api } from "@/lib/api"
import {
  apiEventToEventSchema,
  departmentToRole,
  type ApiEvent,
} from "@/lib/event-types"
import type { EventSchema } from "@/lib/event-schema"

export function Dashboard() {
  return (
    <DepartmentProvider>
      <SharedItemsProvider>
        <ViewProvider>
          <DashboardBody />
        </ViewProvider>
      </SharedItemsProvider>
    </DepartmentProvider>
  )
}

function DashboardBody() {
  const { department } = useDepartment()
  const { view } = useView()
  const [events, setEvents] = useState<EventSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const role = departmentToRole(department)
      const res = await fetch(api.events({ role }))
      const data = await res.json()
      if (res.ok && data.events) {
        const schemas = (data.events as ApiEvent[]).map(apiEventToEventSchema)
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
  }, [department])

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

  return (
    <DashboardContent
      view={view}
      events={events}
      loading={loading}
      error={error}
      activeCardId={activeCardId}
      mainRef={mainRef}
      cardRefs={cardRefs}
      setCardRef={setCardRef}
    />
  )
}

function DashboardContent({
  view,
  events,
  loading,
  error,
  activeCardId,
  mainRef,
  cardRefs,
  setCardRef,
}: {
  view: "feed" | "chat" | "analytics" | "discovery" | "simulations"
  events: EventSchema[]
  loading: boolean
  error: string | null
  activeCardId: string | null
  mainRef: React.RefObject<HTMLElement | null>
  cardRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
  setCardRef: (cardId: string, el: HTMLDivElement | null) => void
}) {
  if (view === "chat") {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="shrink-0 flex items-center gap-4 border-b border-border bg-card px-8 py-5">
            <h1 className="text-lg font-bold text-foreground">Chat</h1>
            <p className="text-xs text-muted-foreground">
              View shared intelligence and discuss with colleagues
            </p>
          </header>
          <div className="flex-1 overflow-hidden">
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

  if (view === "discovery") {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-8 py-5">
            <div>
              <h1 className="text-lg font-bold text-foreground">Discovery</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Strategic watchlist and recommended monitoring areas
              </p>
            </div>
          </header>
          <DiscoveryPanel />
        </main>
      </div>
    )
  }

  if (view === "simulations") {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-8 py-5">
            <div>
              <h1 className="text-lg font-bold text-foreground">Scenario Simulation</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Compare strategic scenarios with impact ranges
              </p>
            </div>
          </header>
          <SimulationsPanel />
        </main>
      </div>
    )
  }

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
          <DepartmentSelector />
        </header>

        {/* Card Feed */}
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
          ) : events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No events yet
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Click &quot;Run Simulation&quot; for demo data, or &quot;Fetch Live Data&quot; + &quot;Process with AI&quot; for real intelligence
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {events.map((event) => (
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
      </main>

      <ContextChatbot
        activeCardId={activeCardId}
        activeCardTitle={events.find((e) => `event-${e.id}` === activeCardId)?.title}
        activeCardSignalType={
          (() => {
            const ev = events.find((e) => `event-${e.id}` === activeCardId)
            return ev?.event_type === "Risk" ? "Risk" : ev?.event_type === "Expansion" ? "Opportunity" : undefined
          })()
        }
        activeEventId={
          (() => {
            const ev = events.find((e) => `event-${e.id}` === activeCardId)
            return ev ? parseInt(ev.id, 10) : null
          })()
        }
      />
    </div>
  )
}
