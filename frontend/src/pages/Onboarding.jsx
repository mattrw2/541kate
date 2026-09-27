import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiUrl, apiFetch, setTenantKey, setActingUserId } from "../api"
import { useCurrentUser } from "../UserContext"
import { JoinTenantForm } from "./JoinTenant"
import kateFace from "../kate-face.jpg"
import { useCopyButton } from "../useCopyButton"
import { VisibilityChoice } from "../VisibilityChoice"

// Shown right after starting a group: the generated shared password, which they
// can change to something memorable before continuing.
const SavePassword = ({ created, onDone }) => {
  const [password, setPassword] = useState(created.tenant.secret_key)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const { copied, copy } = useCopyButton()

  const finish = async () => {
    const next = password.trim().toUpperCase()
    if (next === created.tenant.secret_key) return onDone(created)
    setBusy(true)
    setError("")
    try {
      const res = await apiFetch(`${apiUrl}/tenants/password`, {
        method: "PUT",
        // Not signed in yet, so send the generated password explicitly.
        headers: { "Content-Type": "application/json", "X-Tenant-Key": created.tenant.secret_key },
        body: JSON.stringify({ password: next }),
      })
      if (!res.ok) throw new Error((await res.text()) || "Could not save the password")
      const { tenant } = await res.json()
      onDone({ ...created, tenant })
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Save your shared password</h2>
      <p className="text-sm text-gray-500">
        Anyone joining {created.tenant.name} will need it. Change it to something memorable if you like.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && finish()}
          className="text-lg font-mono font-bold tracking-widest border-2 border-yellow-300 bg-yellow-50 rounded-lg px-3 py-2 w-full min-w-0 uppercase"
        />
        <button
          onClick={() => copy(password.trim().toUpperCase())}
          className="text-sm border border-yellow-600 text-yellow-700 hover:bg-yellow-600 hover:text-white rounded-lg px-3 whitespace-nowrap"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <button
        onClick={finish}
        disabled={busy}
        className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg"
      >
        {busy ? "Saving…" : "I've saved it, continue"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

// Shown when this device has no tenant key yet. Either join an existing group with
// its shared password, or start a new one (as a brand-new user).
const Onboarding = () => {
  const { enterTenant } = useCurrentUser()
  const navigate = useNavigate()
  const [mode, setMode] = useState("join")
  // Whatever page they were on, land on the challenges list once they're in.
  const goToChallenges = () => navigate("/challenges", { replace: true })
  const [username, setUsername] = useState("")
  const [tenantName, setTenantName] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)

  const post = async (path, body) => {
    setBusy(true)
    setError("")
    try {
      const res = await apiFetch(`${apiUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.text()) || "Something went wrong")
      const result = await res.json()
      // Remember the group right away so a reload during the next step doesn't lose it.
      setTenantKey(result.tenant.secret_key)
      setActingUserId(result.currentUser.id)
      // Public groups are joined from the list without a password, so there's
      // nothing to save: go straight in. Private groups show the password step.
      if (result.tenant.is_public) {
        enterTenant(result)
        goToChallenges()
      } else {
        setCreated(result)
      }
    } catch (e) {
      setError(e.message || "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  const submitCreate = () => {
    if (!username.trim() || !tenantName.trim()) {
      setError("Enter a username and a group name.")
      return
    }
    post("/tenants", { username: username.trim(), tenantName: tenantName.trim(), is_public: isPublic })
  }

  const tabClass = (active) =>
    `flex-1 py-2 text-sm font-medium rounded-lg ${
      active ? "bg-yellow-600 text-white" : "bg-yellow-50 text-gray-600"
    }`

  return (
    <div className="flex flex-col items-center px-4 py-10">
      <div className="text-center mb-3">
        <p className="text-sm text-gray-500">Welcome to</p>
        <h1 className="text-2xl font-bold text-gray-800">Exercise Challenges</h1>
        <div className="inline-flex items-center gap-2 mt-2 text-gray-600">
          <span className="text-sm">by</span>
          <span className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-300 rounded-full pl-1 pr-3 py-1">
            <img src={kateFace} alt="" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-semibold text-gray-800">Kate</span>
          </span>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm px-6 pb-6 pt-4">
        {created ? (
          <SavePassword created={created} onDone={(result) => { enterTenant(result); goToChallenges() }} />
        ) : (
          <>
            <div className="flex gap-2 mb-5">
              <button className={tabClass(mode === "join")} onClick={() => { setMode("join"); setError("") }}>
                Join a group
              </button>
              <button className={tabClass(mode === "create")} onClick={() => { setMode("create"); setError("") }}>
                Start a group
              </button>
            </div>

            {mode === "create" ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-800">Start a new group</h2>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitCreate()}
                  placeholder="Your username"
                  className="text-base border rounded-lg px-3 py-2 w-full"
                />
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitCreate()}
                  placeholder="Group name"
                  className="text-base border rounded-lg px-3 py-2 w-full"
                />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Visibility</p>
                  <VisibilityChoice isPublic={isPublic} onChange={setIsPublic} />
                </div>
                <button
                  onClick={submitCreate}
                  disabled={busy}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg"
                >
                  {busy ? "Creating…" : "Create group"}
                </button>
              </div>
            ) : (
              <JoinTenantForm onJoined={goToChallenges} />
            )}

            {mode === "create" && error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}

export default Onboarding
