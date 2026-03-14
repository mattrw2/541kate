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
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(null)

  const createChallenge = useMutation({
    mutationFn: (formData) =>
      fetch(`${apiUrl}/challenges`, {
        method: "POST",
        body: formData,
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
        <p className="font-thin text-sm text-gray-500">Please select a user first.</p>
      </div>
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name) { setError("Name is required."); return }
    setError(null)
    const formData = new FormData()
    formData.append("name", form.name)
    formData.append("description", form.description)
    formData.append("goal_minutes", form.goal_minutes)
    formData.append("start_date", form.start_date || "")
    formData.append("end_date", form.end_date || "")
    formData.append("admin_user_id", currentUser.id)
    if (photo) formData.append("photo", photo)
    createChallenge.mutate(formData)
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <h2 className="text-2xl font-thin mb-6">New Challenge</h2>

      {error && <div className="text-red-500 text-sm font-thin mb-3">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="font-thin text-sm border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="font-thin text-sm border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">Goal (minutes)</label>
          <input
            type="number"
            value={form.goal_minutes}
            onChange={(e) => setForm((f) => ({ ...f, goal_minutes: parseInt(e.target.value) || 0 }))}
            className="font-thin text-sm border border-gray-200 rounded px-2 py-1.5 w-32 focus:outline-none focus:border-yellow-400"
            min="0"
          />
        </div>

        <div>
          <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">Start date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            className="font-thin text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div>
          <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">End date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            className="font-thin text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0] || null)}
            className="font-thin text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:border file:border-gray-200 file:rounded file:text-xs file:font-thin file:text-gray-600 file:bg-white hover:file:bg-gray-50"
          />
        </div>

        <button
          type="submit"
          disabled={createChallenge.isPending}
          className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-1.5 px-4 border border-yellow-600 hover:border-transparent rounded text-sm disabled:opacity-50"
        >
          {createChallenge.isPending ? "Creating..." : "Create Challenge"}
        </button>
      </form>
    </div>
  )
}

export default CreateChallenge
