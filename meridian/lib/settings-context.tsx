"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { ProfileId } from "./profile-config"

export type RegionId = "north-america" | "europe" | "apac" | "latin-america" | "emea"

const REGIONS: { id: RegionId; label: string }[] = [
  { id: "north-america", label: "North America" },
  { id: "europe", label: "Europe" },
  { id: "apac", label: "APAC" },
  { id: "latin-america", label: "Latin America" },
  { id: "emea", label: "EMEA" },
]

interface SettingsContextValue {
  /** Region per profile - each profile has their own region */
  getRegion: (profileId: ProfileId) => RegionId
  setRegion: (profileId: ProfileId, region: RegionId) => void
  notificationsEnabled: boolean
  setNotificationsEnabled: (v: boolean) => void
  REGIONS: typeof REGIONS
}

const defaultRegion: RegionId = "north-america"

const SettingsContext = createContext<SettingsContextValue>({
  getRegion: () => defaultRegion,
  setRegion: () => {},
  notificationsEnabled: true,
  setNotificationsEnabled: () => {},
  REGIONS,
})

const STORAGE_KEY = "meridian-settings"

function loadSettings(): Record<string, unknown> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSettings(settings: Record<string, unknown>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [regions, setRegions] = useState<Record<ProfileId, RegionId>>(() => {
    const s = loadSettings()
    const r = s.regions as Record<string, RegionId> | undefined
    return r ?? {}
  })
  const [notificationsEnabled, setNotificationsEnabledState] = useState(() => {
    const s = loadSettings()
    return (s.notificationsEnabled as boolean) ?? true
  })

  const getRegion = useCallback(
    (profileId: ProfileId): RegionId => {
      return regions[profileId] ?? defaultRegion
    },
    [regions]
  )

  const setRegion = useCallback((profileId: ProfileId, region: RegionId) => {
    setRegions((prev) => {
      const next = { ...prev, [profileId]: region }
      saveSettings({ ...loadSettings(), regions: next })
      return next
    })
  }, [])

  const setNotificationsEnabled = useCallback((v: boolean) => {
    setNotificationsEnabledState(v)
    saveSettings({ ...loadSettings(), notificationsEnabled: v })
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        getRegion,
        setRegion,
        notificationsEnabled,
        setNotificationsEnabled,
        REGIONS,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
