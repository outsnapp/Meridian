"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDepartment } from "@/lib/department-context"
import { useProfile } from "@/lib/profile-context"
import { getProfile } from "@/lib/profile-config"

export function DepartmentSelector() {
  const { department, setDepartment } = useDepartment()
  const { profileId } = useProfile()
  const profile = getProfile(profileId)
  const subDepts = profile.subDepartments

  return (
    <Select value={department} onValueChange={setDepartment}>
      <SelectTrigger className="h-8 w-52 rounded-md border-border bg-card text-xs text-foreground">
        <SelectValue placeholder="Select area" />
      </SelectTrigger>
      <SelectContent>
        {subDepts.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
