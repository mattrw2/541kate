import { useState } from "react"
import { apiUrl, apiFetch } from "../api"
import { useCurrentUser } from "../UserContext"

// Shown when there is no trusted device yet. Either start a new household or
// join an existing one with its code (the code is also the add-device path).
const Onboarding = () => {
  const { applySession } = useCurrentUser()
  const [mode, setMode] = useState("join")
  const [username, setUsername] = useState("")
  const [code, setCode] = useState("541KATE")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

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
      applySession(await res.json())
    } catch (e) {
      setError(e.message || "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  const submitCreate = () => {
    if (!username.trim()) return
    post("/households", { username: username.trim() })
  }

  const submitJoin = () => {
    if (!code.trim()) return
    post("/households/join", { code: code.trim() })
  }

  const tabClass = (active) =>
    `flex-1 py-2 text-sm font-medium rounded-lg ${
      active ? "bg-yellow-600 text-white" : "bg-yellow-50 text-gray-600"
    }`

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex gap-2 mb-5">
          <button className={tabClass(mode === "create")} onClick={() => { setMode("create"); setError("") }}>
            Sign up
          </button>
          <button className={tabClass(mode === "join")} onClick={() => { setMode("join"); setError("") }}>
            Sign in
          </button>
        </div>

        {mode === "create" ? (
          <div className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCreate()}
              placeholder="Your name"
              className="text-base border rounded-lg px-3 py-2 w-full"
            />
            <p className="text-xs text-gray-400 -mt-1">
              Sharing this device with family? You can add a profile for each person later.
            </p>
            <button
              onClick={submitCreate}
              disabled={busy}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg"
            >
              {busy ? "Creating…" : "Get started"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Household code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && submitJoin()}
                placeholder="Household code"
                className="text-base border rounded-lg px-3 py-2 w-full tracking-widest uppercase"
              />
            </div>
            <button
              onClick={submitJoin}
              disabled={busy}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg"
            >
              {busy ? "Joining…" : "Sign in"}
            </button>
            <p className="text-xs text-gray-400">
              Ask someone in the household for the code.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  )
}

export default Onboarding
