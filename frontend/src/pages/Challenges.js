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
    <div className="max-w-2xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-thin">Challenges</h2>
        {currentUser ? (
          <Link
            to="/challenge/new"
            className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-1 px-3 border border-yellow-600 hover:border-transparent rounded text-sm"
          >
            New Challenge
          </Link>
        ) : (
          <span className="text-sm text-gray-500 font-thin">Select a user to create challenges.</span>
        )}
      </div>

      <ul className="space-y-4">
        {challenges.map((challenge) => (
          <li
            key={challenge.id}
            className="border border-yellow-600 rounded p-4"
          >
            <div className="flex justify-between items-start">
              <Link
                to={`/challenge/${challenge.id}`}
                className="text-lg font-thin text-yellow-600 hover:underline"
              >
                {challenge.name}
              </Link>
              <span className="text-sm font-thin text-gray-500">
                {challenge.participant_count} member{challenge.participant_count !== 1 ? "s" : ""}
              </span>
            </div>
            {challenge.description && (
              <p className="text-sm font-thin text-gray-600 mt-1">{challenge.description}</p>
            )}
            <div className="mt-2 text-xs font-thin text-gray-500 flex gap-4 flex-wrap">
              {(challenge.start_date || challenge.end_date) && (
                <span>
                  {formatDate(challenge.start_date)}
                  {challenge.start_date && challenge.end_date ? " – " : ""}
                  {formatDate(challenge.end_date)}
                </span>
              )}
              <span>Goal: {challenge.goal_minutes} minutes</span>
              {challenge.admin_username && <span>Created by {challenge.admin_username}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Challenges
