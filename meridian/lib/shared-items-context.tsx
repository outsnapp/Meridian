"use client"

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from "react"
import type { ProfileId } from "@/lib/profile-config"

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
  /** For Signal Context Panel: Geography, Therapy, Product */
  tags?: string
  source?: string
  updated_at?: string
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
  /** Only these positions can see this thread; sharer always sees it. Omit/empty = legacy, visible to all. */
  sharedWithPositionIds?: ProfileId[]
  /** Who shared it; they always see the thread. */
  sharedByProfileId?: ProfileId
}

export type ChatMessageType = "user" | "system" | "ai_summary" | "decision" | "action_item"

export interface ChatMessage {
  id: string
  author: string
  text: string
  createdAt: string
  type?: ChatMessageType
  role?: string
}

interface SharedItemsContextValue {
  sharedItems: SharedItem[]
  /** Returns only threads the current user (profileId) is allowed to see. */
  sharedItemsForPosition: (profileId: ProfileId) => SharedItem[]
  addSharedItem: (item: Omit<SharedItem, "id" | "createdAt">) => void
  getMessages: (sharedItemId: string) => ChatMessage[]
  addMessage: (sharedItemId: string, author: string, text: string, type?: ChatMessageType, role?: string) => void
  markThreadRead: (sharedItemId: string) => void
  getUnreadCount: (sharedItemId: string) => number
  /** Clear all shared items, chat messages, and read state (localStorage + in-memory). */
  clearAllChatsAndShared: () => void
}

const STORAGE_KEY = "meridian-shared-items"
const MESSAGES_KEY = "meridian-chat-messages"
const READ_AT_KEY = "meridian-chat-read-at"

const defaultContext: SharedItemsContextValue = {
  sharedItems: [],
  sharedItemsForPosition: () => [],
  addSharedItem: () => {},
  getMessages: () => [],
  addMessage: () => {},
  markThreadRead: () => {},
  getUnreadCount: () => 0,
  clearAllChatsAndShared: () => {},
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
  const [readAtByItem, setReadAtByItem] = useState<Record<string, string>>({})

  // Initial load from localStorage
  useEffect(() => {
    setSharedItems(loadFromStorage(STORAGE_KEY, []))
    setMessagesByItem(loadFromStorage(MESSAGES_KEY, {}))
    setReadAtByItem(loadFromStorage(READ_AT_KEY, {}))
  }, [])

  // Sync when another tab/window clears or updates shared data (e.g. Strategic Lead clears → Medical Officer's tab sees it)
  useEffect(() => {
    if (typeof window === "undefined") return
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setSharedItems(e.newValue ? JSON.parse(e.newValue) : [])
      } else if (e.key === MESSAGES_KEY) {
        setMessagesByItem(e.newValue ? JSON.parse(e.newValue) : {})
      } else if (e.key === READ_AT_KEY) {
        setReadAtByItem(e.newValue ? JSON.parse(e.newValue) : {})
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
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
    const now = new Date().toISOString()
    const sysMsgs: ChatMessage[] = [
      { id: `msg-${Date.now()}-sys1`, author: "System", text: "AI generated brief shared", createdAt: now, type: "system" },
    ]
    if (item.recipients && item.recipients.trim() && item.recipients !== "—") {
      sysMsgs.push({ id: `msg-${Date.now()}-sys2`, author: "System", text: "Signal escalated to leadership", createdAt: now, type: "system" })
    }
    setMessagesByItem((prev) => {
      const list = prev[newItem.id] ?? []
      const next = { ...prev, [newItem.id]: [...list, ...sysMsgs] }
      saveToStorage(MESSAGES_KEY, next)
      return next
    })
  }, [])

  const getMessages = useCallback(
    (sharedItemId: string) => messagesByItem[sharedItemId] ?? [],
    [messagesByItem]
  )

  const addMessage = useCallback((
    sharedItemId: string,
    author: string,
    text: string,
    type: ChatMessageType = "user",
    role?: string
  ) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      author,
      text,
      createdAt: new Date().toISOString(),
      type,
      role,
    }
    setMessagesByItem((prev) => {
      const list = prev[sharedItemId] ?? []
      const next = { ...prev, [sharedItemId]: [...list, newMsg] }
      saveToStorage(MESSAGES_KEY, next)
      return next
    })
  }, [])

  const markThreadRead = useCallback((sharedItemId: string) => {
    const now = new Date().toISOString()
    setReadAtByItem((prev) => {
      const next = { ...prev, [sharedItemId]: now }
      saveToStorage(READ_AT_KEY, next)
      return next
    })
  }, [])

  const getUnreadCount = useCallback(
    (sharedItemId: string) => {
      const readAt = readAtByItem[sharedItemId]
      const messages = messagesByItem[sharedItemId] ?? []
      if (!readAt) return messages.length
      return messages.filter((m) => m.createdAt > readAt).length
    },
    [messagesByItem, readAtByItem]
  )

  const sharedItemsForPosition = useCallback(
    (profileId: ProfileId) => {
      return sharedItems.filter((item) => {
        const allowed = item.sharedWithPositionIds
        if (!allowed || allowed.length === 0) return true
        if (item.sharedByProfileId === profileId) return true
        return allowed.includes(profileId)
      })
    },
    [sharedItems]
  )

  const clearAllChatsAndShared = useCallback(() => {
    setSharedItems([])
    setMessagesByItem({})
    setReadAtByItem({})
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(MESSAGES_KEY)
        localStorage.removeItem(READ_AT_KEY)
      } catch {}
    }
  }, [])

  return (
    <SharedItemsContext.Provider
      value={{
        sharedItems,
        sharedItemsForPosition,
        addSharedItem,
        getMessages,
        addMessage,
        markThreadRead,
        getUnreadCount,
        clearAllChatsAndShared,
      }}
    >
      {children}
    </SharedItemsContext.Provider>
  )
}

export function useSharedItems() {
  return useContext(SharedItemsContext)
}
