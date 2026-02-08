"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type TutorialContextValue = {
  /** Current step (1 = Intelligence Feed, etc.); null = not in tutorial */
  tutorialStep: number | null
  startTutorial: () => void
  nextStep: () => void
  endTutorial: () => void
}

const TutorialContext = createContext<TutorialContextValue | null>(null)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [tutorialStep, setTutorialStep] = useState<number | null>(null)

  const startTutorial = useCallback(() => setTutorialStep(1), [])
  const nextStep = useCallback(() => setTutorialStep((s) => (s == null ? null : s + 1)), [])
  const endTutorial = useCallback(() => setTutorialStep(null), [])

  return (
    <TutorialContext.Provider value={{ tutorialStep, startTutorial, nextStep, endTutorial }}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext)
  if (!ctx) {
    return {
      tutorialStep: null,
      startTutorial: () => {},
      nextStep: () => {},
      endTutorial: () => {},
    }
  }
  return ctx
}
