/**
 * Utilities for normalizing decision urgency from event data.
 * Values can be "High", "Medium", "Low" or longer strings like "High -- EU formulary..."
 */

export type UrgencyLevel = "High" | "Medium" | "Low" | "Other"

export function getUrgencyLevel(decisionUrgency: string): UrgencyLevel {
  const s = (decisionUrgency || "").trim()
  const lower = s.toLowerCase()
  if (lower.startsWith("high")) return "High"
  if (lower.startsWith("medium") || lower.startsWith("moderate")) return "Medium"
  if (lower.startsWith("low")) return "Low"
  return "Other"
}

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  High: "High Urgency",
  Medium: "Medium Urgency",
  Low: "Low Urgency",
  Other: "Other",
}
