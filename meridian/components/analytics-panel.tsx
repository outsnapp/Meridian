"use client"

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

// Demo data
const SIGNAL_TREND = {
  regulatoryChange: 23,
  criticalRisks: 5,
  growthOpportunities: 3,
}

const SIGNAL_BREAKDOWN = [
  { type: "Regulatory", value: 8, fill: "var(--color-regulatory)" },
  { type: "Competitive", value: 6, fill: "var(--color-competitive)" },
  { type: "Safety", value: 5, fill: "var(--color-safety)" },
  { type: "Pricing / Payer", value: 7, fill: "var(--color-pricing)" },
]

const IMPACT_DISTRIBUTION = [
  { label: "High impact (>$100M)", value: 4, percent: 35 },
  { label: "Medium", value: 5, percent: 44 },
  { label: "Low", value: 2, percent: 21 },
]

const signalChartConfig: ChartConfig = {
  regulatory: { label: "Regulatory", color: "hsl(var(--chart-1))" },
  competitive: { label: "Competitive", color: "hsl(var(--chart-2))" },
  safety: { label: "Safety", color: "hsl(var(--chart-3))" },
  pricing: { label: "Pricing / Payer", color: "hsl(var(--chart-4))" },
}

const BAR_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
]

export function AnalyticsPanel() {
  const barData = SIGNAL_BREAKDOWN.map((d) => ({ type: d.type, value: d.value }))

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 py-8">
      {/* 1. Signal Trend Overview */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Signal Trend Overview
        </h2>
        <p className="text-xs text-muted-foreground/80 mb-4">
          Demo data · Based on structured intelligence signals
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Regulatory signals this quarter
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                ↑ {SIGNAL_TREND.regulatoryChange}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs prior quarter
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
                {SIGNAL_TREND.criticalRisks}
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
                {SIGNAL_TREND.growthOpportunities}
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
          Structured intelligence by signal category
        </p>
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={signalChartConfig} className="h-[280px] w-full">
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
              {SIGNAL_BREAKDOWN.map((item, i) => (
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
          </CardContent>
        </Card>
      </section>

      {/* 3. Impact Distribution */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Impact Distribution
        </h2>
        <p className="text-xs text-muted-foreground/80 mb-4">
          Business impact framing (demo data)
        </p>
        <Card>
          <CardContent className="pt-6 space-y-6">
            {IMPACT_DISTRIBUTION.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-card-foreground">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.value} signals · {item.percent}%
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
