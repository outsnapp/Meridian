"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { ProfileId } from "./profile-config"
import { getProfile } from "./profile-config"

/** Legacy department keys used by share-data, recommendations, chatbot-data */
export type LegacyDepartment = "executive" | "finance" | "commercial" | "market-access"
/** Sub-department id (dynamic per profile) */
export type Department = string

interface DepartmentContextValue {
  department: Department
  setDepartment: (d: Department) => void
}

const DepartmentContext = createContext<DepartmentContextValue>({
  department: "executive",
  setDepartment: () => {},
})

interface DepartmentProviderProps {
  children: ReactNode
  profileId: ProfileId
}

export function DepartmentProvider({ children, profileId }: DepartmentProviderProps) {
  const profile = getProfile(profileId)
  const firstSubDept = profile.subDepartments[0]?.id ?? "executive"
  const [department, setDepartment] = useState<Department>(firstSubDept)

  useEffect(() => {
    const validIds = profile.subDepartments.map((s) => s.id)
    if (!validIds.includes(department)) {
      setDepartment(firstSubDept)
    }
  }, [profileId, department, firstSubDept, profile.subDepartments])

  return (
    <DepartmentContext.Provider value={{ department, setDepartment }}>
      {children}
    </DepartmentContext.Provider>
  )
}

export function useDepartment() {
  return useContext(DepartmentContext)
}
