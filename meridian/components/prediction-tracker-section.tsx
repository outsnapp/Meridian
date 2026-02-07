"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

interface TrackerItem {
  event_description: string
  prediction_date: string | null
  predicted_days: string
  actual_days: number | null
  actual_outcome: string | null
  outcome_date: string | null
}

export function PredictionTrackerSection() {
  const [items, setItems] = useState<TrackerItem[]>([])
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(api.demoPredictionTracker())
      .then((r) => r.json())
      .then((d) => {
        if (d.items?.length) setItems(d.items)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading || items.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-6">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors">
          <div>
            <h3 className="text-sm font-bold text-foreground">Prediction Tracker</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Past predictions vs actual outcomes — how we performed
            </p>
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-4 pb-4 pt-2">
            <div className="space-y-4">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-muted/20 p-4 text-sm"
                >
                  <p className="font-medium text-foreground">{item.event_description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.prediction_date && (
                      <span>Predicted in {item.prediction_date}: warning in {item.predicted_days} days.</span>
                    )}
                    {!item.prediction_date && (
                      <span>Our system predicted: {item.predicted_days} days to action.</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs font-medium text-foreground">
                    Actual: {item.actual_outcome ?? "Outcome recorded"} in {item.actual_days ?? "—"} days
                    {item.outcome_date && ` (${item.outcome_date})`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
