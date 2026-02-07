"use client"

import { Rss, BarChart3, MessageCircle, Settings, Zap, ChevronDown, Map } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useView } from "@/lib/view-context"
import { useProfile } from "@/lib/profile-context"
import { PROFILES, getProfile, type ProfileId } from "@/lib/profile-config"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { icon: Rss, label: "Intelligence Feed", view: "feed" as const },
  { icon: MessageCircle, label: "Chat", view: "chat" as const },
  { icon: BarChart3, label: "Analytics", view: "analytics" as const },
  { icon: Map, label: "Risk Heatmap", view: "heatmap" as const },
]

function dispatchRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("meridian:refresh-events"))
  }
}

export function AppSidebar() {
  const { view, setView } = useView()
  const { profileId, setProfileId } = useProfile()
  const profile = getProfile(profileId)
  const activeItem =
    view === "settings"
      ? "Settings"
      : view === "chat"
        ? "Chat"
        : view === "analytics"
          ? "Analytics"
          : view === "heatmap"
            ? "Risk Heatmap"
            : "Intelligence Feed"
  const [isLoading, setIsLoading] = useState(false)

  async function handleLoadIntelligence() {
    if (isLoading) return
    setIsLoading(true)
    toast.info("Fetching live data...")
    try {
      // 1. Fetch live data
      const ingestRes = await fetch(api.ingestLive(), { method: "POST" })
      await ingestRes.json()

      // 2. Process with AI
      const processRes = await fetch(api.process(), { method: "POST" })
      const processData = await processRes.json()
      const processed = processRes.ok ? processData.processed ?? 0 : 0

      dispatchRefresh()
      setView("feed")

      if (processed > 0) {
        toast.success(`Ready! ${processed} events from live data.`)
      } else {
        toast.success("Pipeline complete. Load intelligence to generate signals.")
      }
    } catch {
      toast.error("Could not reach backend. Is it running on port 8000?")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside className="flex h-screen w-56 flex-col justify-between bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
      <div>
        <div className="px-5 py-6">
          <h1 className="text-sm font-bold tracking-widest text-[hsl(var(--sidebar-primary))]">
            MERIDIAN
          </h1>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = activeItem === item.label
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setView(item.view)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                    : "text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Fetch Live Data - single consolidated action */}
        <div className="mt-6 px-3">
          <Button
            variant="default"
            size="lg"
            onClick={handleLoadIntelligence}
            disabled={isLoading}
            className="w-full gap-2.5 h-11 rounded-lg font-medium shadow-sm bg-[hsl(var(--sidebar-primary))] hover:bg-[hsl(var(--sidebar-primary))]/90 text-[hsl(var(--sidebar-primary-foreground))]"
          >
            <Zap className={cn("h-4 w-4 shrink-0", isLoading && "animate-pulse")} />
            {isLoading ? "Fetching..." : "Fetch Live Data"}
          </Button>
          <p className="mt-2 text-[10px] text-[hsl(var(--sidebar-muted))] text-center leading-tight">
            Fetches live data and processes with AI
          </p>
        </div>
        <div className="mt-3 px-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-lg text-xs font-medium border-dashed"
            onClick={async () => {
              try {
                const res = await fetch(api.demoLoadSunPharma(), { method: "POST" })
                const data = await res.json()
                if (res.ok && data.status === "ok") {
                  toast.success(`Loaded ${data.events_created ?? 0} signals. Risk models updated.`)
                  dispatchRefresh()
                } else {
                  toast.error(data.detail || "Load failed")
                }
              } catch (e) {
                toast.error("Could not load Sun Pharma case")
              }
            }}
          >
            Load Sun Pharma Case
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-3 pb-5">
        <button
          type="button"
          onClick={() => setView("settings")}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            activeItem === "Settings"
              ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
              : "text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--sidebar-accent))]">
                <span className="text-[10px] font-bold text-[hsl(var(--sidebar-foreground))]">
                  {profile.name.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[hsl(var(--sidebar-foreground))] truncate">{profile.name}</p>
                <p className="text-[10px] text-[hsl(var(--sidebar-muted))] truncate">{profile.role}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--sidebar-muted))]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            {PROFILES.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setProfileId(p.id as ProfileId)}
                className={cn(profileId === p.id && "bg-accent")}
              >
                <div>
                  <p className="text-xs font-medium">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.role}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
