"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type AppView = "feed" | "chat" | "analytics" | "discovery" | "simulations"

interface ViewContextValue {
  view: AppView
  setView: (v: AppView) => void
}

const ViewContext = createContext<ViewContextValue>({
  view: "feed",
  setView: () => {},
})

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>("feed")
  return (
    <ViewContext.Provider value={{ view, setView }}>{children}</ViewContext.Provider>
  )
}

export function useView() {
  return useContext(ViewContext)
}
