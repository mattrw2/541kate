import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { apiUrl, apiFetch } from "../api"
import { useCurrentUser } from "../UserContext"

// Landing page for a challenge invite link (/join/:token). One self-contained
// screen — no separate "sign up" / "join household" steps:
//  - New visitor: type your name → account is created and you're dropped into
//    the challenge in a single step.
//  - Already signed in: one tap to join as your current account.
const JoinChallenge = () => {
  const { token } = useParams()
  const { status, household, applySession, signOut } = useCurrentUser()
  const navigate = useNavigate()
  const [challengeName, setChallengeName] = useState("")
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)

  // Public lookup so we can show what they're joining.
  useEffect(() => {
    apiFetch(`${apiUrl}/challenges/by-token/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("This invite link is invalid or expired."))))
      .then((c) => setChallengeName(c.name))
      .catch((e) => setError(e.message))
  }, [token])

  const redeem = async () => {
    const r = await apiFetch(`${apiUrl}/challenges/redeem/${token}`, { method: "POST" })
    if (!r.ok) throw new Error((await r.text()) || "Couldn't join the challenge.")
    const data = await r.json()
    navigate(`/challenge/${data.challenge_id}`, { replace: true })
  }

  // New visitor: create an account named after them, then join — one step.
  const createAndJoin = async () => {
    if (!name.trim()) return
    setBusy(true)
    setError("")
    try {
      const res = await apiFetch(`${apiUrl}/households`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name.trim() }),
      })
      if (!res.ok) throw new Error((await res.text()) || "Something went wrong")
      applySession(await res.json())
      await redeem()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  // Returning visitor: join as the account already on this device.
  const joinAsCurrent = async () => {
    setBusy(true)
    setError("")
    try {
      await redeem()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (error && !challengeName) {
    return <div className="max-w-sm mx-auto px-4 py-10 text-center text-red-500">{error}</div>
  }
  if (status === "loading") {
    return <div className="max-w-sm mx-auto px-4 py-10 text-center text-gray-500">Loading…</div>
  }
  if (busy) {
    return (
      <div className="max-w-sm mx-auto px-4 py-10 text-center text-gray-500">
        {challengeName ? `Joining ${challengeName}…` : "Joining challenge…"}
      </div>
    )
  }

  const header = (
    <>
      <p className="text-sm text-gray-500 mb-1 text-center">You're invited to</p>
      <h1 className="text-xl font-bold text-gray-800 mb-5 text-center">{challengeName || "a challenge"}</h1>
    </>
  )

  // Already signed in: one tap to join.
  if (status === "authenticated") {
    return (
      <div className="flex justify-center px-4 pt-4 pb-10">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          {header}
          <p className="text-gray-600 mb-4 text-center">
            Join as <span className="font-semibold">{household?.name}</span>?
          </p>
          <button
            onClick={joinAsCurrent}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 rounded-lg"
          >
            Join challenge
          </button>
          <button onClick={() => signOut()} className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600">
            Not you? Start over
          </button>
          {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}
        </div>
      </div>
    )
  }

  // New visitor: just a name.
  return (
    <div className="flex justify-center px-4 pt-4 pb-10">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        {header}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createAndJoin()}
          placeholder="Your name"
          className="text-base border rounded-lg px-3 py-2 w-full"
        />
        <button
          onClick={createAndJoin}
          className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 rounded-lg"
        >
          Join challenge
        </button>
        {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  )
}

export default JoinChallenge
