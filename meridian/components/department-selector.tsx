"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDepartment, type Department } from "@/lib/department-context"

export function DepartmentSelector() {
  const { department, setDepartment } = useDepartment()

  return (
    <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
      <SelectTrigger className="h-8 w-52 rounded-md border-border bg-card text-xs text-foreground">
        <SelectValue placeholder="Select department" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="executive">Executive / Strategy</SelectItem>
        <SelectItem value="finance">Finance</SelectItem>
        <SelectItem value="commercial">Commercial / Sales</SelectItem>
        <SelectItem value="market-access">Market Access / Policy</SelectItem>
      </SelectContent>
    </Select>
  )
}
