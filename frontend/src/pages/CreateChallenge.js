import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { apiUrl } from "../api"
import { useCurrentUser } from "../UserContext"

const CreateChallenge = () => {
  const { currentUser } = useCurrentUser()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    description: "",
    goal_minutes: 600,
    start_date: "",
    end_date: "",
  })
  const [error, setError] = useState(null)

  const createChallenge = useMutation({
    mutationFn: (body) =>
      fetch(`${apiUrl}/challenges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create challenge.")
        return r.json()
      }),
    onSuccess: (data) => navigate(`/challenge/${data.id}`),
    onError: () => setError("Failed to create challenge."),
  })

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4">
        <p className="font-thin text-gray-600">Please select a user first.</p>
      </div>
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name) { setError("Name is required."); return }
    setError(null)
    createChallenge.mutate({
      name: form.name,
      description: form.description,
      goal_minutes: form.goal_minutes,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      admin_user_id: currentUser.id,
    })
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <h2 className="text-2xl font-thin mb-4">New Challenge</h2>

      {error && <div className="text-red-600 text-sm font-thin mb-2">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-thin text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="font-thin border rounded px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-thin text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="font-thin border rounded px-2 py-1 w-full"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-thin text-gray-700 mb-1">Goal (minutes)</label>
          <input
            type="number"
            value={form.goal_minutes}
            onChange={(e) => setForm((f) => ({ ...f, goal_minutes: parseInt(e.target.value) || 0 }))}
            className="font-thin border rounded px-2 py-1 w-32"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-thin text-gray-700 mb-1">Start date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            className="font-thin border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-sm font-thin text-gray-700 mb-1">End date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            className="font-thin border rounded px-2 py-1"
          />
        </div>

        <button
          type="submit"
          disabled={createChallenge.isPending}
          className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-2 px-4 border border-yellow-600 hover:border-transparent rounded disabled:opacity-50"
        >
          {createChallenge.isPending ? "Creating..." : "Create Challenge"}
        </button>
      </form>
    </div>
  )
}

export default CreateChallenge
