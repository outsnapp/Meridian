"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type DemoModeContextValue = {
  isSunPharmaActive: boolean
  setSunPharmaActive: (active: boolean) => void
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null)

export function SunPharmaDemoProvider({ children }: { children: ReactNode }) {
  const [isSunPharmaActive, setIsSunPharmaActive] = useState(false)
  const setSunPharmaActive = useCallback((active: boolean) => {
    setIsSunPharmaActive(active)
  }, [])
  return (
    <DemoModeContext.Provider value={{ isSunPharmaActive, setSunPharmaActive }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useSunPharmaDemo(): DemoModeContextValue {
  const ctx = useContext(DemoModeContext)
  if (!ctx) {
    return {
      isSunPharmaActive: false,
      setSunPharmaActive: () => {},
    }
  }
  return ctx
}
