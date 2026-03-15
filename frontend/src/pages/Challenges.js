import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { apiUrl } from "../api"
import { useCurrentUser } from "../UserContext"

const Challenges = () => {
  const { currentUser } = useCurrentUser()
  const { data: challenges = [] } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => fetch(`${apiUrl}/challenges`).then((r) => r.json()),
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

  return (
    <div className="max-w-3xl mx-auto px-4">
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

      <ul className="space-y-3">
        {challenges.map((challenge) => (
          <li key={challenge.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <Link
                to={`/challenge/${challenge.id}`}
                className="text-lg font-semibold text-yellow-700 hover:underline"
              >
                {challenge.name}
              </Link>
            </div>
            {challenge.description && (
              <p className="text-sm text-gray-700 mt-1">{challenge.description}</p>
            )}
            <div className="mt-2 text-xs text-gray-700 flex gap-4 flex-wrap">
              {(challenge.start_date || challenge.end_date) && (
                <span>
                  {formatDate(challenge.start_date)}
                  {challenge.start_date && challenge.end_date ? " – " : ""}
                  {formatDate(challenge.end_date)}
                </span>
              )}
              <span>Goal: {challenge.goal_minutes} min</span>
              {challenge.admin_username && <span>by {challenge.admin_username}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Challenges
