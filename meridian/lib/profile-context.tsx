"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { ProfileId } from "./profile-config"

interface ProfileContextValue {
  profileId: ProfileId
  setProfileId: (id: ProfileId) => void
}

const ProfileContext = createContext<ProfileContextValue>({
  profileId: "strategy-lead",
  setProfileId: () => {},
})

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState<ProfileId>("strategy-lead")

  return (
    <ProfileContext.Provider value={{ profileId, setProfileId }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
