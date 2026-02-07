/**
 * User profiles and sub-department mappings for MERIDIAN.
 * Each profile (Strategy Lead, Medical Officer, etc.) sees news filtered to their domain
 * and has profile-specific sub-categorizations.
 */

export type ProfileId = "strategy-lead" | "medical-officer" | "commercial-head" | "finance-lead"

export type ApiRole = "Strategy" | "Medical" | "Commercial" | "Finance"

/** Sub-department within a profile - maps to API role for event filtering */
export interface SubDepartment {
  id: string
  label: string
  apiRole: ApiRole
}

export interface UserProfile {
  id: ProfileId
  name: string
  role: string
  subDepartments: SubDepartment[]
}

export const PROFILES: UserProfile[] = [
  {
    id: "strategy-lead",
    name: "Anna Chen",
    role: "Strategy Lead",
    subDepartments: [
      { id: "executive", label: "Executive / Strategy", apiRole: "Strategy" },
      { id: "finance", label: "Finance", apiRole: "Finance" },
      { id: "commercial", label: "Commercial / Sales", apiRole: "Commercial" },
      { id: "market-access", label: "Market Access / Policy", apiRole: "Medical" },
    ],
  },
  {
    id: "medical-officer",
    name: "Dr. Sarah Mitchell",
    role: "Medical Officer",
    subDepartments: [
      { id: "regulatory", label: "Regulatory Affairs", apiRole: "Medical" },
      { id: "clinical", label: "Clinical Safety", apiRole: "Medical" },
      { id: "pharmacovigilance", label: "Pharmacovigilance", apiRole: "Medical" },
      { id: "market-access", label: "Market Access / HTA", apiRole: "Medical" },
    ],
  },
  {
    id: "commercial-head",
    name: "Maria Rossi",
    role: "Commercial Head",
    subDepartments: [
      { id: "commercial", label: "Commercial", apiRole: "Commercial" },
      { id: "sales", label: "Sales", apiRole: "Commercial" },
      { id: "marketing", label: "Marketing", apiRole: "Commercial" },
    ],
  },
  {
    id: "finance-lead",
    name: "James Park",
    role: "Finance Lead",
    subDepartments: [
      { id: "finance", label: "Finance", apiRole: "Finance" },
      { id: "pricing", label: "Pricing", apiRole: "Finance" },
      { id: "reimbursement", label: "Reimbursement", apiRole: "Finance" },
    ],
  },
]

export function getProfile(id: ProfileId): UserProfile {
  const p = PROFILES.find((x) => x.id === id)
  if (!p) return PROFILES[0]
  return p
}

export function subDepartmentToApiRole(profileId: ProfileId, subDeptId: string): ApiRole {
  const profile = getProfile(profileId)
  const sub = profile.subDepartments.find((s) => s.id === subDeptId)
  return sub?.apiRole ?? profile.subDepartments[0].apiRole
}

import type { LegacyDepartment } from "./department-context"

export function subDepartmentToLegacyDepartment(profileId: ProfileId, subDeptId: string): LegacyDepartment {
  const role = subDepartmentToApiRole(profileId, subDeptId)
  const map: Record<ApiRole, LegacyDepartment> = {
    Strategy: "executive",
    Medical: "market-access",
    Commercial: "commercial",
    Finance: "finance",
  }
  return map[role]
}
