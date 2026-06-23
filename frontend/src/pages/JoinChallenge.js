import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { apiUrl, apiFetch } from "../api"
import { useCurrentUser } from "../UserContext"
import Onboarding from "./Onboarding"

// Landing page for a challenge invite link (/join/:token).
//  - Brand-new visitor: run household setup, then auto-join (they set up a
//    household specifically to accept this invite).
//  - Already signed in: confirm first — join as the current household, or switch
//    to a different one. Never silently reuse the current session.
const JoinChallenge = () => {
  const { token } = useParams()
  const { status, household, signOut } = useCurrentUser()
  const navigate = useNavigate()
  const [challengeName, setChallengeName] = useState("")
  const [error, setError] = useState("")
  const [joining, setJoining] = useState(false)
  const wentThroughSetup = useRef(false)
  const autoJoined = useRef(false)

  // Public lookup so we can show what they're joining before setup.
  useEffect(() => {
    apiFetch(`${apiUrl}/challenges/by-token/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("This invite link is invalid or expired."))))
      .then((c) => setChallengeName(c.name))
      .catch((e) => setError(e.message))
  }, [token])

  // Remember if this visitor set up a household on this page.
  useEffect(() => {
    if (status === "unauthenticated") wentThroughSetup.current = true
  }, [status])

  const join = () => {
    setJoining(true)
    setError("")
    apiFetch(`${apiUrl}/challenges/redeem/${token}`, { method: "POST" })
      .then(async (r) =>
        r.ok ? r.json() : Promise.reject(new Error((await r.text()) || "Couldn't join the challenge."))
      )
      .then((data) => navigate(`/challenge/${data.challenge_id}`, { replace: true }))
      .catch((e) => {
        setError(e.message)
        setJoining(false)
      })
  }

  // Auto-join only right after the visitor sets up a household here.
  useEffect(() => {
    if (status === "authenticated" && wentThroughSetup.current && !autoJoined.current) {
      autoJoined.current = true
      join()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  if (error) {
    return <div className="max-w-sm mx-auto px-4 py-10 text-center text-red-500">{error}</div>
  }

  if (status === "loading") {
    return <div className="max-w-sm mx-auto px-4 py-10 text-center text-gray-500">Loading…</div>
  }

  if (status === "unauthenticated") {
    return (
      <div className="px-4 py-6">
        {challengeName && (
          <p className="text-center text-gray-600 mb-3">
            You're invited to <span className="font-semibold">{challengeName}</span>. Set up this
            device to join.
          </p>
        )}
        <Onboarding />
      </div>
    )
  }

  // Authenticated. If we're auto-joining (fresh setup) or mid-request, show a spinner.
  if (joining || autoJoined.current) {
    return (
      <div className="max-w-sm mx-auto px-4 py-10 text-center text-gray-500">
        {challengeName ? `Joining ${challengeName}…` : "Joining challenge…"}
      </div>
    )
  }

  // Already signed in: confirm before joining.
  return (
    <div className="flex justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <p className="text-sm text-gray-500 mb-1">You're invited to</p>
        <h1 className="text-xl font-bold text-gray-800 mb-5">{challengeName || "a challenge"}</h1>
        <p className="text-gray-600 mb-4">
          Join as <span className="font-semibold">{household?.name}</span>?
        </p>
        <button
          onClick={join}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 rounded-lg"
        >
          Join challenge
        </button>
        <button
          onClick={() => signOut()}
          className="mt-3 text-sm text-gray-400 hover:text-gray-600"
        >
          Not you? Use a different household
        </button>
      </div>
    </div>
  )
}

export default JoinChallenge
