import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiUrl, apiFetch, getTenantKey, setTenantKey, getActingUserId, setActingUserId } from "./api"

const UserContext = createContext(null)

// Tenant state for the whole app:
//  - status: "loading" | "authenticated" | "unauthenticated"
//  - tenant / profiles: from the stored tenant key (GET /tenants/me)
//  - currentUser: the profile being acted as (any profile in the tenant, one tap
//    to switch), remembered locally and sent as X-User-Id
export const UserProvider = ({ children }) => {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState(getTenantKey() ? "loading" : "unauthenticated")
  const [tenant, setTenant] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [currentUser, setCurrentUserState] = useState(null)

  const pickStoredProfile = (list) => list.find((p) => p.id === getActingUserId()) || null

  const setCurrentUser = useCallback((user) => {
    setActingUserId(user ? user.id : null)
    setCurrentUserState(user)
  }, [])

  // Adopt a tenant returned by POST /tenants or /tenants/join.
  const enterTenant = useCallback(
    ({ tenant, users, currentUser }) => {
      if (tenant.secret_key !== getTenantKey()) queryClient.clear()
      setTenantKey(tenant.secret_key)
      setTenant(tenant)
      setProfiles(users || [])
      setStatus("authenticated")
      setCurrentUser(currentUser || pickStoredProfile(users || []))
    },
    [queryClient, setCurrentUser]
  )

  // Forget the tenant on this device. Nothing to tell the server.
  const signOut = useCallback(() => {
    setTenantKey(null)
    setActingUserId(null)
    queryClient.clear()
    setCurrentUserState(null)
    setTenant(null)
    setProfiles([])
    setStatus("unauthenticated")
  }, [queryClient])

  const refresh = useCallback(async () => {
    if (!getTenantKey()) {
      setStatus("unauthenticated")
      return
    }
    try {
      // Don't send X-User-Id here: a stale id (deleted profile) would 403.
      const res = await apiFetch(`${apiUrl}/tenants/me`, { headers: { "X-User-Id": "" } })
      if (res.status === 401) {
        // Key is no longer valid.
        signOut()
        return
      }
      if (!res.ok) throw new Error("Failed to load tenant")
      const data = await res.json()
      setTenant(data.tenant)
      setProfiles(data.users || [])
      setStatus("authenticated")
      const list = data.users || []
      setCurrentUserState((prev) => {
        const next = (prev && list.find((p) => p.id === prev.id)) || pickStoredProfile(list)
        if (!next) setActingUserId(null)
        return next
      })
    } catch (e) {
      setStatus("unauthenticated")
    }
  }, [signOut])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <UserContext.Provider
      value={{ status, tenant, profiles, currentUser, setCurrentUser, enterTenant, refresh, signOut }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useCurrentUser = () => useContext(UserContext)

// Shareable link that lets someone join the current tenant. With a challengeId,
// the invite screen names that challenge and joining lands on it.
export const tenantInviteUrl = (tenant, challengeId) => {
  if (!tenant?.secret_key) return ""
  const url = `${window.location.origin}/join/${tenant.secret_key}`
  return challengeId ? `${url}?challenge=${challengeId}` : url
}
