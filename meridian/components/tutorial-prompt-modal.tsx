"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookOpen, X } from "lucide-react"
import { useTutorial } from "@/lib/tutorial-context"

const STORAGE_KEY = "meridian-tutorial-prompt-seen"
const TUTORIAL_REQUESTED_KEY = "meridian-tutorial-requested"

/** Has the user ever been shown the tutorial prompt? (first visit = no key or empty) */
function getSeen(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Mark that the prompt was shown or that the user answered. Called once when we show the modal so it never appears again. */
function setSeen(value: "shown" | "yes" | "no") {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, value)
    if (value === "yes") localStorage.setItem(TUTORIAL_REQUESTED_KEY, "true")
  } catch {}
}

export function TutorialPromptModal() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const { startTutorial } = useTutorial()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const seen = getSeen()
    // Show only on the very first visit (no key set).
    if (!seen || seen === "") {
      setOpen(true)
    }
  }, [mounted])

  // Mark "shown" only after the dialog is actually open, so it never appears again (even on refresh).
  useEffect(() => {
    if (open) setSeen("shown")
  }, [open])

  function handleYes() {
    setSeen("yes")
    setOpen(false)
    startTutorial()
  }

  function handleNo() {
    setSeen("no")
    setOpen(false)
  }

  function handleClose() {
    const seen = getSeen()
    if (seen === "shown") setSeen("no")
    setOpen(false)
  }

  if (!mounted) return null

  function handleOpenChange(o: boolean) {
    if (!o) handleClose()
    else setOpen(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Welcome to MERIDIAN</DialogTitle>
              <DialogDescription className="mt-1">
                Would you like a quick tutorial of all the functionality of the web app?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-6">
          <Button variant="outline" onClick={handleNo} className="gap-2">
            <X className="h-4 w-4" />
            No thanks
          </Button>
          <Button onClick={handleYes} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Yes, show me
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** For future use: did the user ask for the tutorial? */
export function wasTutorialRequested(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(TUTORIAL_REQUESTED_KEY) === "true"
  } catch {
    return false
  }
}

/** Clear the "seen" flag so the welcome prompt shows again (e.g. for testing). */
export function resetTutorialPrompt(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TUTORIAL_REQUESTED_KEY)
  } catch {}
}
