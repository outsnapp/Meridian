"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts"
import { TrendingUp, AlertTriangle, Zap } from "lucide-react"
import { useAnalyticsSummary } from "@/hooks/use-analytics-summary"

const typeChartConfig: ChartConfig = {
  Risk: { label: "Risk", color: "hsl(var(--chart-1))" },
  Expansion: { label: "Expansion", color: "hsl(var(--chart-2))" },
  Operational: { label: "Operational", color: "hsl(var(--chart-3))" },
}

const BAR_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
]

export function AnalyticsPanel() {
  const { data, loading, error, refetch } = useAnalyticsSummary()

  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = () => refetch()
    window.addEventListener("meridian:refresh-events", handler)
    return () => window.removeEventListener("meridian:refresh-events", handler)
  }, [refetch])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 px-8 py-8">
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          Loading analytics...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 px-8 py-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-6 py-8 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Ensure the backend is running. You can retry from the sidebar.
          </p>
        </div>
      </div>
    )
  }

  if (!data || data.total_events_30d === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 px-8 py-8">
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Waiting for verified intelligence sources.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Use Fetch Live Data in the sidebar to fetch from OpenFDA, Serper, or CDSCO.
          </p>
        </div>
      </div>
    )
  }

  const { total_events_30d, by_type, by_urgency } = data
  const barData = [
    { type: "Risk", value: by_type.Risk },
    { type: "Expansion", value: by_type.Expansion },
    { type: "Operational", value: by_type.Operational },
  ].filter((d) => d.value > 0)
  const urgencyTotal = by_urgency.High + by_urgency.Medium + by_urgency.Low
  const urgencyRows = [
    { label: "High urgency", value: by_urgency.High, percent: urgencyTotal > 0 ? Math.round((by_urgency.High / urgencyTotal) * 100) : 0 },
    { label: "Medium urgency", value: by_urgency.Medium, percent: urgencyTotal > 0 ? Math.round((by_urgency.Medium / urgencyTotal) * 100) : 0 },
    { label: "Low urgency", value: by_urgency.Low, percent: urgencyTotal > 0 ? Math.round((by_urgency.Low / urgencyTotal) * 100) : 0 },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 py-8">
      {/* 1. Signal Trend Overview */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Signal Trend Overview
        </h2>
        <p className="text-xs text-muted-foreground/80 mb-4">
          Last 30 days · Based on stored intelligence events
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total signals (30 days)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {total_events_30d}
              </div>
              <p className="text-xs text-muted-foreground">
                Events in database
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Critical risks detected
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {by_type.Risk}
              </div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Growth opportunities flagged
              </CardTitle>
              <Zap className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {by_type.Expansion}
              </div>
              <p className="text-xs text-muted-foreground">
                Expansion & favorable signals
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 2. Signal Breakdown by Type */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Signal Breakdown by Type
        </h2>
        <p className="text-xs text-muted-foreground/80 mb-4">
          Events by signal category
        </p>
        <Card>
          <CardContent className="pt-6">
            {barData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                No type breakdown available
              </div>
            ) : (
              <>
                <ChartContainer config={typeChartConfig} className="h-[280px] w-full">
                  <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="type"
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
                <div className="mt-4 flex flex-wrap gap-4 justify-center">
                  {barData.map((item, i) => (
                    <div key={item.type} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.type}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 3. Urgency Distribution */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Urgency Distribution
        </h2>
        <p className="text-xs text-muted-foreground/80 mb-4">
          Events by decision urgency
        </p>
        <Card>
          <CardContent className="pt-6 space-y-6">
            {urgencyRows.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-card-foreground">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.value} signals{urgencyTotal > 0 ? ` · ${item.percent}%` : ""}
                  </span>
                </div>
                <Progress value={item.percent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
