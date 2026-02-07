"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface HeatmapRow {
  plant: string
  risk: string
  revenue_cr: number
  timeline_days: number
}

export function RiskHeatmapPanel() {
  const [rows, setRows] = useState<HeatmapRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(api.demoRiskHeatmap())
      .then((r) => r.json())
      .then((d) => {
        if (d.rows) setRows(d.rows)
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading risk heatmap...
      </div>
    )
  }

  const riskBadge = (risk: string) => {
    if (risk === "high")
      return <span className="inline-flex h-3 w-3 rounded-full bg-red-500" title="High risk" />
    if (risk === "medium")
      return <span className="inline-flex h-3 w-3 rounded-full bg-amber-500" title="Medium risk" />
    return <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500" title="Low risk" />
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-foreground mb-1">Risk Heatmap</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Plant-level risk, revenue exposure, and expected timeline
      </p>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left font-semibold text-foreground p-4">Plant</th>
              <th className="text-left font-semibold text-foreground p-4">Risk</th>
              <th className="text-right font-semibold text-foreground p-4">Revenue (Cr)</th>
              <th className="text-right font-semibold text-foreground p-4">Timeline</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                <td className="p-4 font-medium text-foreground">{r.plant}</td>
                <td className="p-4">{riskBadge(r.risk)}</td>
                <td className="p-4 text-right text-foreground">{r.revenue_cr} Cr</td>
                <td className="p-4 text-right text-foreground">{r.timeline_days}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
