"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

const SCENARIOS = [
  "Do nothing",
  "Defensive pricing",
  "Portfolio bundling",
  "Accelerated access agreements",
] as const

type Scenario = (typeof SCENARIOS)[number]

const IMPACT_ROWS = [
  { scenario: "Do nothing", revenueImpact: "−18%", risk: "High" as const, riskColor: "text-destructive", matches: ["Do nothing"] },
  { scenario: "Reprice early", revenueImpact: "−6%", risk: "Medium" as const, riskColor: "text-amber-600", matches: ["Defensive pricing"] },
  { scenario: "Bundle portfolio", revenueImpact: "−3%", risk: "Low" as const, riskColor: "text-emerald-600", matches: ["Portfolio bundling", "Accelerated access agreements"] },
]

const KEY_ASSUMPTIONS = [
  "Based on EU oncology biosimilar precedents",
  "Assumes formulary lock-in cycles",
  "Assumes competitor parity pricing",
]

export function SimulationsPanel() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0])
  const [assumptionsOpen, setAssumptionsOpen] = useState(false)

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-8 py-8">
      {/* Header */}
      <section>
        <h1 className="text-lg font-bold text-foreground">Scenario Simulation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare strategic scenarios with demo impact ranges
        </p>
      </section>

      {/* 1. Scenario Selector */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Scenario Selector
        </h2>
        <Select value={selectedScenario} onValueChange={(v) => setSelectedScenario(v as Scenario)}>
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder="Select a scenario" />
          </SelectTrigger>
          <SelectContent>
            {SCENARIOS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* 2. Impact Comparison Cards */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Impact Comparison
        </h2>
        <p className="text-xs text-muted-foreground/80 mb-4">
          Demo data · Illustrative ranges
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {IMPACT_ROWS.map((row) => (
            <Card
              key={row.scenario}
              className={cn(
                row.matches?.includes(selectedScenario)
                  ? "ring-2 ring-[hsl(var(--accent))]"
                  : ""
              )}
            >
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Scenario
                </p>
                <p className="font-semibold text-card-foreground mb-4">{row.scenario}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue Impact</span>
                    <span className="font-medium tabular-nums">{row.revenueImpact}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Risk</span>
                    <span className={cn("font-medium flex items-center gap-1", row.riskColor)}>
                      {row.risk === "High" && "🔴"}
                      {row.risk === "Medium" && "🟡"}
                      {row.risk === "Low" && "🟢"}
                      {row.risk}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. Key Assumptions (expandable) */}
      <section>
        <Collapsible open={assumptionsOpen} onOpenChange={setAssumptionsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
              >
                <span className="text-sm font-semibold text-foreground">
                  Key Assumptions
                </span>
                {assumptionsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4 px-4">
                <p className="text-xs text-muted-foreground mb-3">
                  These assumptions build confidence in the scenario outputs.
                </p>
                <ul className="space-y-2 text-sm text-card-foreground">
                  {KEY_ASSUMPTIONS.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </section>
    </div>
  )
}
