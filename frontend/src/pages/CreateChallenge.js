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
    goal_minutes: "",
    start_date: "",
    end_date: "",
  })
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)

  const createChallenge = useMutation({
    mutationFn: (formData) =>
      fetch(`${apiUrl}/challenges`, {
        method: "POST",
        body: formData,
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create challenge.")
        return r.json()
      }),
    onSuccess: (data) => setCreated(data),
    onError: () => setError("Failed to create challenge."),
  })

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

  const inviteUrl = created
    ? `${window.location.origin}/challenge/${created.id}`
    : ""

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl).then(() => setCopied(true))
    } else {
      const el = document.createElement("textarea")
      el.value = inviteUrl
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
    }
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4">
        <p className="text-sm text-gray-500">Please select a user first.</p>
      </div>
    )
  }

  if (created) {
    return (
      <div className="max-w-md mx-auto px-4">
        <h2 className="text-2xl mb-2">{created.name} created!</h2>
        <p className="text-gray-600 text-sm mb-6">Share the link below with members so they can join the challenge.</p>

        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <label className="block text-xs text-gray-500 uppercase tracking-wide">Invite Link</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              onClick={(e) => e.target.select()}
              className="text-base border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none bg-gray-50 text-gray-700"
            />
            <button
              onClick={handleCopy}
              className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-3 py-1.5 text-sm font-medium whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-gray-400">Members can open this link and select their name to join and log activities.</p>
        </div>

        <button
          onClick={() => navigate(`/challenge/${created.id}`)}
          className="mt-6 bg-yellow-600 hover:bg-yellow-700 text-white rounded px-4 py-2 text-sm font-medium w-full"
        >
          Go to Challenge
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <h2 className="text-2xl mb-6">New Challenge</h2>

      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="text-base border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="text-base border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Goal (minutes)</label>
          <input
            type="number"
            value={form.goal_minutes}
            onChange={(e) => setForm((f) => ({ ...f, goal_minutes: e.target.value }))}
            className="text-base border border-gray-200 rounded px-2 py-1.5 w-32 focus:outline-none focus:border-yellow-400"
            min="0"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Start date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            className="text-base border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">End date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            className="text-base border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0] || null)}
            className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:border file:border-gray-200 file:rounded file:text-xs file:text-gray-600 file:bg-white hover:file:bg-gray-50"
          />
        </div>

        <button
          type="submit"
          disabled={createChallenge.isPending}
          className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-4 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {createChallenge.isPending ? "Creating..." : "Create Challenge"}
        </button>
      </form>
    </div>
  )
}

export default CreateChallenge
