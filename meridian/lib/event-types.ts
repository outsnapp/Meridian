/**
 * API Event types and mappers for MERIDIAN
 */

import type { Department } from "./department-context"
import type { EventSchema } from "./event-schema"
import { PLACEHOLDER } from "./event-schema"

export interface ApiEvent {
  id: number | string
  title: string
  summary: string
  event_type: "Operational" | "Expansion" | "Risk"
  matched_role?: string
  tags?: string
  impact?: string
  suggested_action?: string
  source: string
  article_url?: string | null
  timestamp?: string | null
  updated_at?: string
  primary_outcome?: string
  what_is_changing?: string
  whats_changing?: string
  why_it_matters?: string
  what_to_do_now?: string
  decision_urgency?: string
  recommended_next_step?: string
  impact_analysis?: string
  confidence_level?: string
  confidence?: string
  assumptions?: string
  fetched_at?: string
  messaging_instructions?: string
  positioning_before?: string
  positioning_after?: string
  agent_action_log?: string
}

/** Map frontend department to API role filter (4 distinct roles) */
export function departmentToRole(
  department: Department
): "Strategy" | "Medical" | "Commercial" | "Finance" {
  const map: Record<Department, "Strategy" | "Medical" | "Commercial" | "Finance"> = {
    executive: "Strategy",
    finance: "Finance",
    commercial: "Commercial",
    "market-access": "Medical",
  }
  return map[department]
}

function orPlaceholder(v: string | undefined | null): string {
  return v && String(v).trim() ? String(v).trim() : PLACEHOLDER
}

/** Convert API event to canonical EventSchema for UnifiedExecutiveCard */
export function apiEventToEventSchema(event: ApiEvent): EventSchema {
  const updatedAt =
    event.updated_at ||
    (event.timestamp ? String(event.timestamp).slice(0, 10) : "—")

  return {
    id: String(event.id),
    title: orPlaceholder(event.title),
    summary: orPlaceholder(event.summary),
    event_type: event.event_type || "Operational",
    impact_analysis: orPlaceholder(event.impact_analysis || event.impact),
    primary_outcome: orPlaceholder(event.primary_outcome),
    confidence: orPlaceholder(event.confidence || event.confidence_level),
    whats_changing: orPlaceholder(event.whats_changing || event.what_is_changing),
    why_it_matters: orPlaceholder(event.why_it_matters),
    what_to_do_now: orPlaceholder(event.what_to_do_now || event.suggested_action),
    decision_urgency: orPlaceholder(event.decision_urgency),
    recommended_next_step: orPlaceholder(event.recommended_next_step),
    assumptions: orPlaceholder(event.assumptions),
    source: orPlaceholder(event.source),
    article_url: event.article_url && String(event.article_url).trim() ? String(event.article_url).trim() : undefined,
    updated_at: updatedAt || "—",
    fetched_at: event.fetched_at ?? undefined,
    matched_role: event.matched_role,
    messaging_instructions: event.messaging_instructions,
    positioning_before: event.positioning_before,
    positioning_after: event.positioning_after,
    agent_action_log: event.agent_action_log,
  }
}
