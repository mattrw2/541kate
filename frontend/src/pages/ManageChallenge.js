import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiUrl } from "../api"
import { useCurrentUser } from "../UserContext"

const ManageChallenge = () => {
  const { id } = useParams()
  const { currentUser } = useCurrentUser()
  const queryClient = useQueryClient()

  const { data: challenge } = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}`).then((r) => r.json()),
  })

  const { data: participants = [] } = useQuery({
    queryKey: ["challenge", id, "participants"],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}/participants`).then((r) => r.json()),
  })

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch(`${apiUrl}/users`).then((r) => r.json()),
  })

  const [form, setForm] = useState({
    name: "",
    description: "",
    goal_minutes: 600,
    start_date: "",
    end_date: "",
  })
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [addUserId, setAddUserId] = useState("")

  useEffect(() => {
    if (challenge) {
      setForm({
        name: challenge.name || "",
        description: challenge.description || "",
        goal_minutes: challenge.goal_minutes || 600,
        start_date: challenge.start_date || "",
        end_date: challenge.end_date || "",
      })
    }
  }, [challenge])

  const updateChallenge = useMutation({
    mutationFn: (body) =>
      fetch(`${apiUrl}/challenges/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  const addParticipant = useMutation({
    mutationFn: (user_id) =>
      fetch(`${apiUrl}/challenges/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "participants"] })
      setAddUserId("")
    },
  })

  const removeParticipant = useMutation({
    mutationFn: (userId) =>
      fetch(`${apiUrl}/challenges/${id}/participants/${userId}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "participants"] }),
  })

  if (!challenge) return <div className="font-thin px-4">Loading...</div>
  if (!currentUser || currentUser.id !== challenge.admin_user_id) {
    return <div className="font-thin px-4 text-red-600">Access denied.</div>
  }

  const participantIds = participants.map((p) => p.id)
  const nonParticipants = allUsers.filter((u) => !participantIds.includes(u.id))

  return (
    <div className="max-w-md mx-auto px-4">
      <h2 className="text-2xl font-thin mb-4">Manage: {challenge.name}</h2>

      <section className="mb-8">
        <h3 className="text-lg font-thin mb-3 border-b border-gray-200 pb-1">Challenge Settings</h3>
        {saveSuccess && <div className="text-green-600 text-sm font-thin mb-2">Saved!</div>}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateChallenge.mutate({
              name: form.name,
              description: form.description,
              goal_minutes: form.goal_minutes,
              start_date: form.start_date || null,
              end_date: form.end_date || null,
            })
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-sm font-thin text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="font-thin border rounded px-2 py-1 w-full"
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
            disabled={updateChallenge.isPending}
            className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-1 px-3 border border-yellow-600 hover:border-transparent rounded disabled:opacity-50"
          >
            {updateChallenge.isPending ? "Saving..." : "Save"}
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-lg font-thin mb-3 border-b border-gray-200 pb-1">Members</h3>
        <ul className="space-y-2 mb-4">
          {participants.map((p) => (
            <li key={p.id} className="flex justify-between items-center text-sm font-thin">
              <span>{p.username}</span>
              {p.id !== challenge.admin_user_id && (
                <button
                  onClick={() => removeParticipant.mutate(p.id)}
                  className="text-red-500 text-xs border border-red-400 rounded px-2 py-0.5 hover:bg-red-500 hover:text-white"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        {nonParticipants.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              className="font-thin text-sm border rounded px-2 py-1"
            >
              <option value="">Add member...</option>
              {nonParticipants.map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
            <button
              onClick={() => { if (addUserId) addParticipant.mutate(addUserId) }}
              disabled={addParticipant.isPending}
              className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-1 px-2 border border-yellow-600 hover:border-transparent rounded text-sm disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default ManageChallenge
