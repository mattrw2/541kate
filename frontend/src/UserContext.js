import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { apiUrl, apiFetch } from "./api"

const UserContext = createContext(null)

// Session state for the whole app:
//  - status: "loading" | "authenticated" | "unauthenticated"
//  - household / profiles: from the trusted-device cookie (GET /households/me)
//  - currentUser: the tapped profile (one-tap switch, no lock), remembered locally
export const UserProvider = ({ children }) => {
  const [status, setStatus] = useState("loading")
  const [household, setHousehold] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [currentUser, setCurrentUserState] = useState(null)

  const pickStoredProfile = (list) => {
    const storedId = parseInt(localStorage.getItem("currentProfileId") || "", 10)
    return list.find((p) => p.id === storedId) || null
  }

  const setCurrentUser = useCallback((user) => {
    if (user) localStorage.setItem("currentProfileId", String(user.id))
    else localStorage.removeItem("currentProfileId")
    setCurrentUserState(user)
  }, [])

  // Adopt a session returned by create/join household.
  const applySession = useCallback(
    ({ household, profiles, currentUser }) => {
      setHousehold(household)
      setProfiles(profiles || [])
      setStatus("authenticated")
      if (currentUser) setCurrentUser(currentUser)
      else setCurrentUserState(pickStoredProfile(profiles || []))
    },
    [setCurrentUser]
  )

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch(`${apiUrl}/households/me`)
      if (res.status === 401) {
        setStatus("unauthenticated")
        return
      }
      if (!res.ok) throw new Error("Failed to load household")
      const data = await res.json()
      setHousehold(data.household)
      setProfiles(data.profiles || [])
      setStatus("authenticated")
      setCurrentUserState((prev) => {
        const list = data.profiles || []
        if (prev && list.find((p) => p.id === prev.id)) return prev
        return pickStoredProfile(list)
      })
    } catch (e) {
      setStatus("unauthenticated")
    }
  }, [])

  // Untrust this device: clear the cookie server-side and reset local state.
  const signOut = useCallback(async () => {
    try {
      await apiFetch(`${apiUrl}/households/signout`, { method: "POST" })
    } catch (e) {
      // Even if the request fails, drop local state so the UI returns to setup.
    }
    localStorage.removeItem("currentProfileId")
    setCurrentUserState(null)
    setHousehold(null)
    setProfiles([])
    setStatus("unauthenticated")
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <UserContext.Provider
      value={{ status, household, profiles, currentUser, setCurrentUser, applySession, refresh, signOut }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useCurrentUser = () => useContext(UserContext)
