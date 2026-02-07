"use client"

import { cn } from "@/lib/utils"
import type { UrgencyLevel } from "@/lib/urgency-utils"
import { AlertTriangle, Clock, Minus } from "lucide-react"

interface UrgencyFilterProps {
  selected: UrgencyLevel | null
  onSelect: (level: UrgencyLevel | null) => void
  counts: { High: number; Medium: number; Low: number; Other: number }
  className?: string
}

const URGENCY_CONFIG: { level: UrgencyLevel; label: string; icon: React.ElementType; className: string }[] = [
  { level: "High", label: "High Urgency", icon: AlertTriangle, className: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30" },
  { level: "Medium", label: "Medium Urgency", icon: Clock, className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/30" },
  { level: "Low", label: "Low Urgency", icon: Minus, className: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20 border-emerald-600/30" },
  { level: "Other", label: "Other", icon: Minus, className: "bg-muted text-muted-foreground hover:bg-muted/80 border-border" },
]

export function UrgencyFilter({ selected, onSelect, counts, className }: UrgencyFilterProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {URGENCY_CONFIG.filter(({ level }) => counts[level] > 0).map(({ level, label, icon: Icon, className: btnClass }) => {
        const count = counts[level]
        const isActive = selected === level
        return (
          <button
            key={level}
            type="button"
            onClick={() => onSelect(isActive ? null : level)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              btnClass,
              isActive && "ring-2 ring-offset-2 ring-offset-background ring-[currentColor]"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{label}</span>
            <span className="rounded-full bg-black/10 dark:bg-white/10 px-2 py-0.5 text-xs font-semibold">
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
