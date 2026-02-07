"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type Department =
  | "executive"
  | "finance"
  | "commercial"
  | "market-access"

interface DepartmentContextValue {
  department: Department
  setDepartment: (d: Department) => void
}

const DepartmentContext = createContext<DepartmentContextValue>({
  department: "executive",
  setDepartment: () => {},
})

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [department, setDepartment] = useState<Department>("executive")

  return (
    <DepartmentContext.Provider value={{ department, setDepartment }}>
      {children}
    </DepartmentContext.Provider>
  )
}

export function useDepartment() {
  return useContext(DepartmentContext)
}
