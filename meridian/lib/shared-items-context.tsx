"use client"

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from "react"

/** Snapshot of intelligence card content for display in chat */
export interface CardSnapshot {
  title: string
  summary: string
  impact_analysis: string
  whats_changing: string
  why_it_matters: string
  what_to_do_now: string
  decision_urgency?: string
  recommended_next_step?: string
  messaging_instructions?: string
  positioning_before?: string
  positioning_after?: string
  article_url?: string | null
}

export interface SharedItem {
  id: string
  cardId: string
  title: string
  signalType: "Risk" | "Opportunity"
  message: string
  recipients: string
  createdAt: string
  cardSnapshot?: CardSnapshot
}

export interface ChatMessage {
  id: string
  author: string
  text: string
  createdAt: string
}

interface SharedItemsContextValue {
  sharedItems: SharedItem[]
  addSharedItem: (item: Omit<SharedItem, "id" | "createdAt">) => void
  getMessages: (sharedItemId: string) => ChatMessage[]
  addMessage: (sharedItemId: string, author: string, text: string) => void
}

const STORAGE_KEY = "meridian-shared-items"
const MESSAGES_KEY = "meridian-chat-messages"

const defaultContext: SharedItemsContextValue = {
  sharedItems: [],
  addSharedItem: () => {},
  getMessages: () => [],
  addMessage: () => {},
}

const SharedItemsContext = createContext<SharedItemsContextValue>(defaultContext)

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function SharedItemsProvider({ children }: { children: ReactNode }) {
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([])
  const [messagesByItem, setMessagesByItem] = useState<Record<string, ChatMessage[]>>({})

  useEffect(() => {
    setSharedItems(loadFromStorage(STORAGE_KEY, []))
    setMessagesByItem(loadFromStorage(MESSAGES_KEY, {}))
  }, [])

  const addSharedItem = useCallback((item: Omit<SharedItem, "id" | "createdAt">) => {
    const newItem: SharedItem = {
      ...item,
      id: `shared-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    setSharedItems((prev) => {
      const next = [newItem, ...prev]
      saveToStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  const getMessages = useCallback(
    (sharedItemId: string) => messagesByItem[sharedItemId] ?? [],
    [messagesByItem]
  )

  const addMessage = useCallback((sharedItemId: string, author: string, text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      author,
      text,
      createdAt: new Date().toISOString(),
    }
    setMessagesByItem((prev) => {
      const list = prev[sharedItemId] ?? []
      const next = {
        ...prev,
        [sharedItemId]: [...list, newMsg],
      }
      saveToStorage(MESSAGES_KEY, next)
      return next
    })
  }, [])

  return (
    <SharedItemsContext.Provider
      value={{ sharedItems, addSharedItem, getMessages, addMessage }}
    >
      {children}
    </SharedItemsContext.Provider>
  )
}

export function useSharedItems() {
  return useContext(SharedItemsContext)
}
