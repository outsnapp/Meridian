import type { Department } from "./department-context"

// ── Colleagues & Teams ──────────────────────────────────────────────

export interface Colleague {
  id: string
  name: string
  role: string
  department: Department
  initials: string
}

export interface Team {
  id: string
  name: string
  memberCount: number
}

export const colleagues: Colleague[] = [
  { id: "c1", name: "James Park", role: "CFO", department: "finance", initials: "JP" },
  { id: "c2", name: "Maria Rossi", role: "VP Commercial EU", department: "commercial", initials: "MR" },
  { id: "c3", name: "David Liu", role: "Head of Market Access", department: "market-access", initials: "DL" },
  { id: "c4", name: "Sarah Mitchell", role: "Chief Strategy Officer", department: "executive", initials: "SM" },
  { id: "c5", name: "Thomas Weber", role: "Director, Pricing", department: "finance", initials: "TW" },
  { id: "c6", name: "Elena Vasquez", role: "VP Regulatory Affairs", department: "market-access", initials: "EV" },
]

export const teams: Team[] = [
  { id: "t1", name: "Executive Committee", memberCount: 8 },
  { id: "t2", name: "EU Pricing & Access", memberCount: 12 },
  { id: "t3", name: "Oncology Strategy", memberCount: 6 },
  { id: "t4", name: "Immunology Commercial", memberCount: 9 },
]

// ── Content Scopes ──────────────────────────────────────────────────

export type ContentScope = "summary" | "impact" | "recommendation" | "full"

export const contentScopeLabels: Record<ContentScope, string> = {
  summary: "Summary only",
  impact: "Impact Analysis",
  recommendation: "AI Recommendation",
  full: "Full card",
}

// ── Smart Default Messages ──────────────────────────────────────────

interface CardContext {
  cardId: "biosimilar-entry" | "medicare-reimbursement"
  signalType: "Risk" | "Opportunity"
  title: string
  quantifiedImpact: string
}

const cardContexts: Record<string, CardContext> = {
  "biosimilar-entry": {
    cardId: "biosimilar-entry",
    signalType: "Risk",
    title: "Competitive Entry: Biosimilar Approval in EU",
    quantifiedImpact: "12.4% Q4 revenue impact across EU markets",
  },
  "medicare-reimbursement": {
    cardId: "medicare-reimbursement",
    signalType: "Opportunity",
    title: "Medicare Part B Reimbursement Shift",
    quantifiedImpact: "5% reimbursement increase for high-efficacy biologics",
  },
}

const smartMessages: Record<string, Record<Department, string>> = {
  "biosimilar-entry": {
    executive:
      "Flagging this biosimilar approval — potential 12% Q4 revenue impact. We should align on pricing response before formulary lock-in.",
    finance:
      "Heads up on this EU biosimilar entry — need to stress-test Q4 guidance. Can we run the three-scenario model this week?",
    commercial:
      "Competitive alert: X-Bio authorized in EU. We need to move on top-20 account defense before their commercial teams begin outreach.",
    "market-access":
      "EMA biosimilar approval flagged — HTA reassessment windows will open within 6 months. Should we fast-track the NICE evidence package?",
  },
  "medicare-reimbursement": {
    executive:
      "Potential margin uplift in immunology from the Part B reimbursement shift. Worth a quick alignment on portfolio repositioning before Q1.",
    finance:
      "CMS reimbursement update could lift immunology forecasts 4-7%. Should we revise ASP assumptions before the planning cycle closes?",
    commercial:
      "Reimbursement tailwind for our immunology portfolio — field teams need updated messaging and a provider economics calculator.",
    "market-access":
      "Part B methodology change creates an opportunity to strengthen our PBM negotiating position. Let's revise pending formulary submissions.",
  },
}

export function getSmartDefaultMessage(
  cardId: string,
  department: Department,
): string {
  return smartMessages[cardId]?.[department] ?? ""
}

export function getCardContext(cardId: string): CardContext | null {
  return cardContexts[cardId] ?? null
}

// ── Share Hover Hints ───────────────────────────────────────────────

const shareHints: Record<string, Record<Department, string>> = {
  "biosimilar-entry": {
    executive:
      "Share with Chief Strategy Officer or Executive Committee",
    finance:
      "Share with CFO or Director of Pricing",
    commercial:
      "Share with Commercial Ops or Regional Sales Leads",
    "market-access":
      "Share with VP Regulatory Affairs or EU Pricing & Access",
  },
  "medicare-reimbursement": {
    executive:
      "Share with Chief Strategy Officer or Immunology Strategy leads",
    finance:
      "Share with CFO or Revenue Planning team",
    commercial:
      "Share with Field Team Leads or Immunology Commercial",
    "market-access":
      "Share with Head of Market Access or Formulary team",
  },
}

export function getShareHint(
  cardId: string,
  department: Department,
): string {
  return shareHints[cardId]?.[department] ?? "Share with relevant stakeholders"
}
