"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Bell, User, Building2, MapPin, Trash2, BookOpen } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProfile } from "@/lib/profile-context"
import { useDepartment } from "@/lib/department-context"
import { useSettings } from "@/lib/settings-context"
import { useSharedItems } from "@/lib/shared-items-context"
import { resetTutorialPrompt } from "@/components/tutorial-prompt-modal"
import { getProfile } from "@/lib/profile-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const readOnlyInputClass =
  "flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground cursor-default"

export function SettingsPanel() {
  const { theme, setTheme } = useTheme()
  const { profileId } = useProfile()
  const { department } = useDepartment()
  const { getRegion, setRegion, notificationsEnabled, setNotificationsEnabled, REGIONS } = useSettings()
  const { clearAllChatsAndShared } = useSharedItems()
  const profile = getProfile(profileId)
  const currentRegion = getRegion(profileId)
  const departmentLabel = profile.subDepartments.find((s) => s.id === department)?.label ?? department
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === "dark"
  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, region, notifications, and appearance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
          <CardDescription>Your user profile for the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={readOnlyInputClass} aria-readonly>
            {profile.name} — {profile.role}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Department
          </CardTitle>
          <CardDescription>
            Your area of focus within {profile.role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={readOnlyInputClass} aria-readonly>
            {departmentLabel}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Region / Office
          </CardTitle>
          <CardDescription>
            Region for {profile.name} — each profile has its own region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={currentRegion}
            onValueChange={(v) => setRegion(profileId, v as (typeof REGIONS)[number]["id"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
          <CardDescription>Enable or disable notification alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="text-sm font-medium">
              Receive notifications
            </Label>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Appearance
          </CardTitle>
          <CardDescription>Switch between light and dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="theme" className="text-sm font-medium">
              Dark mode
            </Label>
            <Switch id="theme" checked={isDark} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Welcome tutorial
          </CardTitle>
          <CardDescription>
            The &quot;Would you like a quick tutorial?&quot; prompt appears only on first visit. Use this to show it again (e.g. for testing).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              resetTutorialPrompt()
              toast.success("Welcome prompt reset. Reloading…")
              window.location.reload()
            }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Show welcome prompt again
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trash2 className="h-4 w-4" />
            Chats & shared items
          </CardTitle>
          <CardDescription>
            Clear all shared intelligence threads and chat messages so you can start fresh
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              clearAllChatsAndShared()
              toast.success("Chats and shared items cleared. You can use them again.")
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear chats and shared items
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
