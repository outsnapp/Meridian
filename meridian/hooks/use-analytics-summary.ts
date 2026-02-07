"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"

export type AnalyticsSummary = {
  total_events_30d: number
  by_type: { Risk: number; Expansion: number; Operational: number }
  by_urgency: { High: number; Medium: number; Low: number }
  by_source: { OpenFDA: number; Serper: number; CDSCO: number }
  by_role: { Strategy: number; Medical: number; Commercial: number }
}

export function useAnalyticsSummary() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(api.analyticsSummary())
      if (!res.ok) {
        throw new Error(res.statusText || "Failed to load analytics")
      }
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return { data, loading, error, refetch: fetchSummary }
}
