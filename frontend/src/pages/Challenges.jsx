import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { apiUrl, apiFetch } from "../api"
import { useCurrentUser } from "../UserContext"
import { unitOf, formatAmount } from "../units"

const Challenges = () => {
  const { currentUser } = useCurrentUser()
  const { data: challenges = [], isPending } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => apiFetch(`${apiUrl}/challenges`).then((r) => r.json()),
  })

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split("-")
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const isEmpty = !isPending && challenges.length === 0

  // Same rule as the dashboard: a challenge is over once its end date has passed.
  // Upcoming ones haven't reached their start date yet; everything else is active.
  const today = new Date().toLocaleDateString("en-CA")
  const isPast = (c) => !!(c.end_date && today > c.end_date)
  const isUpcoming = (c) => !isPast(c) && !!(c.start_date && today < c.start_date)
  const active = challenges.filter((c) => !isPast(c) && !isUpcoming(c))
  const upcoming = challenges.filter(isUpcoming).sort((a, b) => a.start_date.localeCompare(b.start_date))
  const past = challenges.filter(isPast).sort((a, b) => b.end_date.localeCompare(a.end_date))

  const renderChallenge = (challenge) => (
    <li key={challenge.id} className={`border border-gray-200 rounded-lg p-4 ${isPast(challenge) ? "opacity-75" : ""}`}>
      <div className="flex gap-3">
        {challenge.photo_path && (
          <img
            src={`${apiUrl}${challenge.photo_path}`}
            alt=""
            className="w-16 h-16 rounded-md object-cover flex-shrink-0"
            style={challenge.photo_focus_x != null ? { objectPosition: `${challenge.photo_focus_x * 100}% ${challenge.photo_focus_y * 100}%` } : undefined}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <Link
              to={`/challenge/${challenge.id}`}
              className="text-lg font-semibold text-yellow-700 hover:underline"
            >
              {challenge.name}
            </Link>
          </div>
          {challenge.description && (
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{challenge.description}</p>
          )}
          <div className="mt-2 text-xs text-gray-700 flex gap-4 flex-wrap">
            {(challenge.start_date || challenge.end_date) && (
              <span>
                {formatDate(challenge.start_date)}
                {challenge.start_date && challenge.end_date ? " – " : ""}
                {formatDate(challenge.end_date)}
              </span>
            )}
            <span>Goal: {formatAmount(challenge.goal_minutes, unitOf(challenge))}</span>
            {challenge.admin_username && <span>by {challenge.admin_username}</span>}
          </div>
        </div>
      </div>
    </li>
  )

  const section = (title, list) =>
    list.length > 0 && (
      <section className="mb-8">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">{title}</h3>
        <ul className="space-y-3">{list.map(renderChallenge)}</ul>
      </section>
    )

  return (
    <div className="max-w-3xl mx-auto px-4">
      {!isEmpty && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl">Challenges</h2>
          {currentUser ? (
            <Link
              to="/challenge/new"
              className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-3 py-1.5 text-sm font-medium"
            >
              New Challenge
            </Link>
          ) : (
            <span className="text-sm text-gray-500">Select a user to create challenges.</span>
          )}
        </div>
      )}

      {isEmpty ? (
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No challenges yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            Create one to get started.
          </p>
          {currentUser && (
            <Link
              to="/challenge/new"
              className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-4 py-2 text-sm font-medium"
            >
              New Challenge
            </Link>
          )}
        </div>
      ) : (
      <>
        {section("Active", active)}
        {section("Upcoming", upcoming)}
        {section("Past", past)}
      </>
      )}
    </div>
  )
}

export default Challenges
