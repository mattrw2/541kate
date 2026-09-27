import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { apiUrl, apiFetch } from "../api"
import { useCurrentUser, tenantInviteUrl } from "../UserContext"
import { UNITS } from "../units"
import { compressImage } from "../compressImage"
import { PhotoFocusPicker } from "../PhotoFocusPicker"
import { useCopyButton } from "../useCopyButton"

const CreateChallenge = () => {
  const { currentUser, tenant } = useCurrentUser()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    description: "",
    goal_minutes: "",
    unit: "minutes",
    start_date: "",
    end_date: "",
    prize: ""
  })
  const [photo, setPhoto] = useState(null)
  const [photoFocus, setPhotoFocus] = useState(null)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null)
  const { copied, copy } = useCopyButton()

  const createChallenge = useMutation({
    mutationFn: (formData) =>
      apiFetch(`${apiUrl}/challenges`, {
        method: "POST",
        body: formData
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create challenge.")
        return r.json()
      }),
    onSuccess: (data) => setCreated(data),
    onError: () => setError("Failed to create challenge.")
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) {
      setError("Name is required.")
      return
    }
    setError(null)
    const formData = new FormData()
    formData.append("name", form.name)
    formData.append("description", form.description)
    formData.append("goal_minutes", form.goal_minutes)
    formData.append("unit", form.unit)
    formData.append("start_date", form.start_date || "")
    formData.append("end_date", form.end_date || "")
    formData.append("prize", form.prize || "")
    if (photo) formData.append("photo", await compressImage(photo))
    if (photo && photoFocus) {
      formData.append("photo_focus_x", photoFocus.x)
      formData.append("photo_focus_y", photoFocus.y)
    }
    createChallenge.mutate(formData)
  }

  const inviteUrl = tenantInviteUrl(tenant, created?.id)

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
        <p className="text-gray-600 text-sm mb-6">
          Everyone in {tenant?.name} can see it. Share the link below to invite someone new.
        </p>

        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <label className="block text-xs text-gray-500 uppercase tracking-wide">
            Invite Link
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              onClick={(e) => e.target.select()}
              className="text-base border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none bg-gray-50 text-gray-700"
            />
            <button
              onClick={() => copy(inviteUrl)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-3 py-1.5 text-sm font-medium whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
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
    <div className="flex justify-center px-4 pt-4 pb-10">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl mb-6">New Challenge</h2>

        {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="text-base border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="text-base border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            Measure in
          </label>
          <div className="flex gap-2">
            {Object.entries(UNITS).map(([key, u]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm((f) => ({ ...f, unit: key }))}
                className={`text-sm rounded px-3 py-1.5 border ${form.unit === key ? "bg-yellow-600 text-white border-yellow-600" : "text-yellow-600 border-yellow-600 hover:bg-yellow-600 hover:text-white"}`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            Goal ({UNITS[form.unit].label.toLowerCase()})
          </label>
          <input
            type="number"
            value={form.goal_minutes}
            onChange={(e) =>
              setForm((f) => ({ ...f, goal_minutes: e.target.value }))
            }
            className="text-base border border-gray-200 rounded px-2 py-1.5 w-32 focus:outline-none focus:border-yellow-400"
            min="0"
            step={UNITS[form.unit].step}
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            Prize you're offering
          </label>
          <input
            type="text"
            value={form.prize}
            onChange={(e) => setForm((f) => ({ ...f, prize: e.target.value }))}
            placeholder="e.g. will shave my head"
            className="text-base border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            Start date
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, start_date: e.target.value }))
            }
            className={`text-base border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400 ${form.start_date ? "text-gray-700" : "text-gray-400"}`}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            End date
          </label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, end_date: e.target.value }))
            }
            className={`text-base border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400 ${form.end_date ? "text-gray-700" : "text-gray-400"}`}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
            Photo (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => { setPhoto(e.target.files[0] || null); setPhotoFocus(null) }}
            className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:border file:border-gray-200 file:rounded file:text-xs file:text-gray-600 file:bg-white hover:file:bg-gray-50"
          />
          <PhotoFocusPicker file={photo} focus={photoFocus} onChange={setPhotoFocus} />
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
    </div>
  )
}

export default CreateChallenge
