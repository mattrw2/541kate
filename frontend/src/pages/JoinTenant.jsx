import { useEffect, useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { apiUrl, apiFetch } from "../api"
import { useCurrentUser } from "../UserContext"
import { usePageTitle } from "../usePageTitle"

const postJson = async (path, body) => {
  const res = await apiFetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error((await res.text()) || "Something went wrong")
  return res.json()
}

// Open a tenant: pick the group from the list and enter its shared password
// (or just tap it, for a public group). That's enough to get in and start
// browsing — who you're acting as is picked later, from the "Who's using
// this?" switcher, so nobody's forced to choose or create a profile up front.
// With lockKey (an invite link), the key is looked up straight away and the
// group list and password steps are skipped; challengeId (a challenge's
// invite link) names that challenge instead of the tenant.
export const JoinTenantForm = ({ initialKey = "", lockKey = false, challengeId = null, onJoined }) => {
  const { enterTenant } = useCurrentUser()
  const [key, setKey] = useState(initialKey)
  const [groups, setGroups] = useState(null) // [{ id, name }] for the picker
  const [group, setGroup] = useState(null) // the group picked from the list
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [entered, setEntered] = useState(false) // suppresses the form once in, while onJoined navigates away

  const run = async (fn) => {
    setBusy(true)
    setError("")
    try {
      await fn()
    } catch (e) {
      setError(e.message || "Something went wrong")
      setBusy(false)
    }
  }

  const enter = (state) => {
    enterTenant(state)
    setEntered(true)
    onJoined?.(state)
  }

  const lookUp = (k = key) => {
    if (!k.trim()) return
    run(async () => enter(await postJson("/tenants/join", { key: k.trim(), challenge_id: challengeId, tenant_id: group?.id })))
  }

  // Public groups need no password: look them up by id straight from the list.
  const joinPublic = (g) =>
    run(async () => enter(await postJson("/tenants/join", { tenant_id: g.id, challenge_id: challengeId })))

  useEffect(() => {
    if (lockKey) {
      lookUp(initialKey)
      return
    }
    apiFetch(`${apiUrl}/tenants`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setGroups)
      .catch(() => setGroups([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockKey, initialKey])

  if (entered) {
    return <p className="text-sm text-center text-gray-500">Opening…</p>
  }

  if (lockKey) {
    return <p className="text-sm text-center text-gray-500">{error ? "This invite link is invalid or expired." : "Checking invite…"}</p>
  }

  if (!group) {
    return (
      <div className="space-y-3">
        {groups === null && <p className="text-sm text-gray-400">Loading groups…</p>}
        {groups?.length === 0 && <p className="text-sm text-gray-400">No groups yet. Start one!</p>}
        <div className="space-y-2">
          {groups?.map((g) => (
            <button
              key={g.id}
              onClick={() => (g.is_public ? joinPublic(g) : (setGroup(g), setKey(""), setError("")))}
              disabled={busy}
              className="w-full flex items-center justify-between text-left border border-yellow-300 hover:border-yellow-600 hover:bg-yellow-50 rounded-lg px-3 py-2 text-base font-medium text-gray-800 disabled:opacity-50"
            >
              {g.name}
              {!g.is_public && <span className="text-xs font-normal text-gray-400">Private</span>}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button onClick={() => { setGroup(null); setError("") }} className="text-sm text-gray-400 hover:text-gray-600">← All groups</button>
      <h2 className="text-lg font-semibold text-gray-800">Enter the shared password for {group.name}</h2>
      <div>
        <input
          type="text"
          autoFocus
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && lookUp()}
          placeholder="Shared password"
          className="text-base border rounded-lg px-3 py-2 w-full tracking-widest uppercase"
        />
      </div>
      <button
        onClick={() => lookUp()}
        disabled={busy}
        className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg"
      >
        {busy ? "Opening…" : "Open group"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

// Landing page for an invite link: /join/:key, optionally ?challenge=<id> when
// shared from a challenge (joining then lands on that challenge).
const JoinTenant = () => {
  usePageTitle("Open a Group")
  const { key } = useParams()
  const [searchParams] = useSearchParams()
  const challengeId = searchParams.get("challenge")
  const { status, tenant } = useCurrentUser()
  const navigate = useNavigate()
  const done = (preview) => {
    const id = preview?.challenge?.id ?? (preview ? null : challengeId)
    navigate(id ? `/challenge/${id}` : "/challenges", { replace: true })
  }

  const alreadyIn = status === "authenticated" && tenant?.secret_key === key.toUpperCase()
  useEffect(() => {
    if (alreadyIn) done()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyIn])

  if (status === "loading" || alreadyIn) {
    return <div className="max-w-sm mx-auto px-4 py-10 text-center text-gray-500">Loading…</div>
  }

  return (
    <div className="flex justify-center px-4 pt-4 pb-10">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <JoinTenantForm initialKey={key} lockKey challengeId={challengeId} onJoined={done} />
        {status === "authenticated" && (
          <p className="text-xs text-gray-400 mt-4 text-center">
            Joining will switch this device out of <span className="font-semibold">{tenant?.name}</span>.
          </p>
        )}
      </div>
    </div>
  )
}

export default JoinTenant
