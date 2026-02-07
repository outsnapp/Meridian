"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Sparkles, AlertTriangle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface WatchlistItem {
  id: string
  title: string
  type: "Risk" | "Opportunity"
  status: "Active"
  lastUpdate: string
}

const INITIAL_WATCHLIST: WatchlistItem[] = [
  {
    id: "1",
    title: "Oncology – EU biosimilars",
    type: "Risk",
    status: "Active",
    lastUpdate: "2 days ago",
  },
  {
    id: "2",
    title: "GLP-1 regulatory policy (US)",
    type: "Risk",
    status: "Active",
    lastUpdate: "1 day ago",
  },
  {
    id: "3",
    title: "India fast-track approvals",
    type: "Opportunity",
    status: "Active",
    lastUpdate: "3 days ago",
  },
]

const SUGGESTED_AREAS = [
  "EU pricing policy shifts",
  "Oncology tender timelines",
]

export function DiscoveryPanel() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(INITIAL_WATCHLIST)
  const [addWatchOpen, setAddWatchOpen] = useState(false)
  const [addType, setAddType] = useState<"therapeutic" | "region" | "competitor">("therapeutic")
  const [addValue, setAddValue] = useState("")

  function handleAddWatch() {
    if (!addValue.trim()) return
    const newItem: WatchlistItem = {
      id: `wl-${Date.now()}`,
      title: addValue.trim(),
      type: "Opportunity",
      status: "Active",
      lastUpdate: "Just now",
    }
    setWatchlist((prev) => [newItem, ...prev])
    setAddValue("")
    setAddWatchOpen(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-8 py-8">
      {/* 1. Strategic Watchlist */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Strategic Watchlist
        </h2>
        <p className="text-xs text-muted-foreground/80 mb-4">
          Proactive intelligence monitoring
        </p>
        <div className="space-y-3">
          {watchlist.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground">{item.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Status: {item.status}</span>
                      <span>·</span>
                      <span>Last update: {item.lastUpdate}</span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0",
                      item.type === "Risk"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    )}
                  >
                    {item.type === "Risk" ? (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    )}
                    {item.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Suggested Watch Areas */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Suggested Watch Areas
        </h2>
        <Card className="border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/[0.03]">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[hsl(var(--accent))]/10 p-2 shrink-0">
                <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground mb-2">
                  Based on recent signals, MERIDIAN recommends monitoring:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {SUGGESTED_AREAS.map((area, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-[hsl(var(--accent))]">–</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Add Watch Button */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Add to Watchlist
        </h2>
        <Button
          onClick={() => setAddWatchOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Watch
        </Button>
      </section>

      {/* Add Watch Dialog */}
      <Dialog open={addWatchOpen} onOpenChange={setAddWatchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Watchlist</DialogTitle>
            <DialogDescription>
              Add a therapeutic area, region, or competitor to monitor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {(
                  [
                    { value: "therapeutic" as const, label: "Therapeutic Area" },
                    { value: "region" as const, label: "Region" },
                    { value: "competitor" as const, label: "Competitor" },
                  ] as const
                ).map((opt) => (
                  <Button
                    key={opt.value}
                    variant={addType === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAddType(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-value">
                {addType === "therapeutic" && "Therapeutic Area (e.g. Oncology, Immunology)"}
                {addType === "region" && "Region (e.g. EU, US, India)"}
                {addType === "competitor" && "Competitor Name"}
              </Label>
              <Input
                id="add-value"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                placeholder={
                  addType === "therapeutic"
                    ? "e.g. Oncology – EU biosimilars"
                    : addType === "region"
                      ? "e.g. India fast-track approvals"
                      : "e.g. Competitor X"
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddWatchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWatch} disabled={!addValue.trim()}>
              Add to Watchlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
