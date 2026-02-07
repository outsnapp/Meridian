/**
 * Canonical Event Schema for MERIDIAN.
 * Mandatory shape for all intelligence cards. No optional fields at render time.
 */

export type EventType = "Operational" | "Expansion" | "Risk"

export interface EventSchema {
  id: string
  title: string
  summary: string
  event_type: EventType
  impact_analysis: string
  primary_outcome: string
  confidence: string
  whats_changing: string
  why_it_matters: string
  what_to_do_now: string
  decision_urgency: string
  recommended_next_step: string
  assumptions: string
  source: string
  updated_at: string
  fetched_at?: string  // When the raw news was ingested (ISO or empty)
  matched_role?: string
}

export const PLACEHOLDER = "Not enough verified data yet."
