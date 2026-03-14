import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js"
import annotationPlugin from "chartjs-plugin-annotation"
import { apiUrl } from "../api"
import { useCurrentUser } from "../UserContext"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, annotationPlugin)

const BG_COLORS = [
  "rgba(255, 99, 132, 0.2)",
  "rgba(255, 159, 64, 0.2)",
  "rgba(255, 205, 86, 0.2)",
  "rgba(75, 192, 192, 0.2)",
  "rgba(54, 162, 235, 0.2)",
  "rgba(153, 102, 255, 0.2)",
  "rgba(201, 203, 207, 0.2)",
]
const BORDER_COLORS = [
  "rgb(255, 99, 132)",
  "rgb(255, 159, 64)",
  "rgb(255, 205, 86)",
  "rgb(75, 192, 192)",
  "rgb(54, 162, 235)",
  "rgb(153, 102, 255)",
  "rgb(201, 203, 207)",
]

const ActivityItem = ({ activity, onIncrementSus }) => {
  const [showFullPhoto, setShowFullPhoto] = useState(false)
  const [susCount, setSusCount] = useState(activity.sus_count || 0)
  const [hovering, setHovering] = useState(false)

  const [year, month, day] = activity.date.split("-")
  const dateStr = new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  const handleSus = (e) => {
    e.stopPropagation()
    setSusCount((c) => c + 1)
    onIncrementSus(activity.id)
  }

  const susActive = susCount > 0 || hovering

  return (
    <li
      className={`font-extralight text-sm grid justify-items-start grid-cols-[auto,1fr,auto] px-2 gap-2 rounded-md border-x border-t last:border-b border-x-yellow-600 border-t-yellow-600 last:border-b-yellow-600 items-start pt-2 mx-4 max-w-[500px] ${activity.photo_path ? "hover:cursor-pointer" : ""}`}
      onClick={() => activity.photo_path && setShowFullPhoto((v) => !v)}
    >
      <div className="flex flex-col items-center w-12">
        <span>{dateStr}</span>
      </div>

      <div className="mb-1">
        <span className="flex flex-col text-left w-full">{activity.username}</span>
        <span className="text-xs text-yellow-600">{activity.memo}</span>
        {activity.photo_path && showFullPhoto && (
          <img
            src={`${apiUrl}${activity.photo_path}`}
            alt="activity"
            style={{ width: "auto", height: "auto" }}
          />
        )}
      </div>

      <div className="flex items-center">
        {activity.photo_path && !showFullPhoto && (
          <img
            src={`${apiUrl}${activity.photo_path}`}
            alt="thumbnail"
            width={30}
            height={30}
            className="mr-2"
          />
        )}
        <button
          className="bg-transparent text-yellow-600 p-1 font-bold mr-1 flex items-center"
          onClick={handleSus}
          onMouseOver={() => setHovering(true)}
          onMouseOut={() => setHovering(false)}
        >
          <img
            src={susActive ? "/suspicious.png" : "/suspicious_gray.png"}
            alt="Sus"
            width={18}
            height={18}
          />
          {susCount > 0 && <span className="ml-1">{susCount}</span>}
        </button>
        <span>{activity.duration} min</span>
      </div>
    </li>
  )
}

const ChallengeDashboard = () => {
  const { id } = useParams()
  const { currentUser } = useCurrentUser()
  const queryClient = useQueryClient()

  const { data: challenge } = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}`).then((r) => r.json()),
  })

  const { data: durationData = [] } = useQuery({
    queryKey: ["challenge", id, "duration"],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}/duration`).then((r) => r.json()),
  })

  const { data: activities = [] } = useQuery({
    queryKey: ["challenge", id, "activities"],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}/activities`).then((r) => r.json()),
  })

  const { data: participants = [] } = useQuery({
    queryKey: ["challenge", id, "participants"],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}/participants`).then((r) => r.json()),
  })

  const { data: prizes = [] } = useQuery({
    queryKey: ["challenge", id, "prizes"],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}/prizes`).then((r) => r.json()),
  })

  const [showForm, setShowForm] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [formData, setFormData] = useState({ user_id: "", duration: "", date: "", memo: "", photo: null })
  const [newUsername, setNewUsername] = useState("")
  const [tooltip, setTooltip] = useState(null)
  const [showPrizeForm, setShowPrizeForm] = useState(false)
  const [prizeForm, setPrizeForm] = useState({ name: "", description: "" })

  useEffect(() => {
    if (currentUser && participants.length > 0) {
      const isParticipant = participants.some((p) => p.id === currentUser.id)
      if (isParticipant) setFormData((f) => ({ ...f, user_id: currentUser.id }))
    }
  }, [currentUser, participants])

  const showTooltipMsg = (msg) => {
    setTooltip(msg)
    setTimeout(() => setTooltip(null), 3000)
  }

  const addUserMutation = useMutation({
    mutationFn: async (username) => {
      const res = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      const user = await res.json()
      await fetch(`${apiUrl}/challenges/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      })
      return user
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "participants"] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setFormData((f) => ({ ...f, user_id: user.id }))
      setShowAddUser(false)
      setNewUsername("")
    },
    onError: () => showTooltipMsg("Failed to add user."),
  })

  const saveActivity = useMutation({
    mutationFn: (fd) =>
      fetch(`${apiUrl}/activities`, { method: "POST", body: fd }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "activities"] })
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "duration"] })
      setFormData({ user_id: currentUser?.id || "", duration: "", date: "", memo: "", photo: null })
      setShowForm(false)
    },
  })

  const incrementSus = useMutation({
    mutationFn: (activityId) =>
      fetch(`${apiUrl}/activities/increment/${activityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
  })

  const addPrizeMutation = useMutation({
    mutationFn: (body) =>
      fetch(`${apiUrl}/challenges/${id}/prizes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "prizes"] })
      setPrizeForm({ name: "", description: "" })
      setShowPrizeForm(false)
    },
  })

  const handleAddUser = () => {
    if (participants.map((u) => u.username).includes(newUsername)) {
      showTooltipMsg("User already exists in this challenge.")
      return
    }
    addUserMutation.mutate(newUsername)
  }

  const handleSave = () => {
    const { user_id, duration, date, memo, photo } = formData
    if (!user_id) { showTooltipMsg("Please select a user."); return }
    if (!date) { showTooltipMsg("Please enter a date."); return }
    if (!duration || duration < 0) { showTooltipMsg("Please enter a valid time."); return }
    const fd = new FormData()
    fd.append("data", JSON.stringify({ user_id, duration, date, memo, challenge_id: id }))
    if (photo) fd.append("photo", photo)
    saveActivity.mutate(fd)
  }

  const handleAddPrize = () => {
    if (!prizeForm.name) { showTooltipMsg("Please enter a prize name."); return }
    addPrizeMutation.mutate({ name: prizeForm.name, description: prizeForm.description, user_id: currentUser?.id })
  }

  const chartOptions = challenge
    ? {
        indexAxis: "y",
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true },
          y: { beginAtZero: true, grid: { display: false }, ticks: { autoSkip: false } },
        },
        plugins: {
          legend: { display: false },
          annotation: {
            annotations: {
              line1: {
                type: "line",
                scaleID: "x",
                value: challenge.goal_minutes,
                borderColor: "orange",
                borderWidth: 2,
                label: { enabled: true, content: String(challenge.goal_minutes) },
              },
            },
          },
        },
      }
    : null

  const chartData = {
    labels: durationData.map((u) => u.username),
    datasets: [{ data: durationData.map((u) => u.total_duration), backgroundColor: BG_COLORS, borderColor: BORDER_COLORS, borderWidth: 1 }],
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split("-")
    return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div>
      <header className="relative">
        <div
          className="bg-gray-200"
          style={{ background: "url('/IMG_1096.jpg') left/cover", width: "100%", height: "150px" }}
        />
        <div className="absolute top-0 right-0 p-4 text-white font-extralight text-xl">
          {challenge?.name || ""}
        </div>
        <div className="absolute top-10 right-5 p-4">
          <img src="/jogging.png" className="w-20 h-20" alt="jogging" />
        </div>
      </header>

      {challenge && (
        <div className="mx-4 mt-3 max-w-[500px]">
          {challenge.description && (
            <p className="font-thin text-sm text-gray-600">{challenge.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs font-thin text-gray-500 mt-1">
            {(challenge.start_date || challenge.end_date) && (
              <span>
                {formatDate(challenge.start_date)}
                {challenge.start_date && challenge.end_date ? " – " : ""}
                {formatDate(challenge.end_date)}
              </span>
            )}
            <span>Goal: {challenge.goal_minutes} min</span>
            {currentUser?.id === challenge.admin_user_id && (
              <Link
                to={`/challenge/${id}/manage`}
                className="ml-auto text-yellow-600 border border-yellow-600 rounded px-2 py-0.5 text-xs font-thin hover:bg-yellow-600 hover:text-white"
              >
                Manage
              </Link>
            )}
          </div>
        </div>
      )}

      {challenge && chartOptions && (
        <div style={{ height: "500px" }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      {/* Prizes */}
      <div className="mx-4 mt-4 max-w-[500px]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-thin text-base">Prizes</h3>
          <button
            onClick={() => setShowPrizeForm((v) => !v)}
            className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-0.5 px-2 border border-yellow-600 hover:border-transparent rounded text-sm"
          >
            Add Prize
          </button>
        </div>

        {showPrizeForm && (
          <div className="mb-3">
            <input
              type="text"
              value={prizeForm.name}
              onChange={(e) => setPrizeForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Prize name"
              className="font-thin border rounded px-2 py-1 w-full mb-1 text-sm"
            />
            <input
              type="text"
              value={prizeForm.description}
              onChange={(e) => setPrizeForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              className="font-thin border rounded px-2 py-1 w-full mb-1 text-sm"
            />
            <button
              type="button"
              onClick={handleAddPrize}
              disabled={addPrizeMutation.isPending}
              className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-1 px-3 border border-yellow-600 hover:border-transparent rounded text-sm disabled:opacity-50"
            >
              Save
            </button>
          </div>
        )}

        {prizes.length === 0 && !showPrizeForm && (
          <p className="text-sm font-thin text-gray-400">No prizes yet.</p>
        )}
        <ul className="space-y-1">
          {prizes.map((prize) => (
            <li key={prize.id} className="text-sm font-thin border-b border-gray-200 pb-1">
              <span className="font-normal">{prize.name}</span>
              {prize.description && <span className="text-gray-600"> — {prize.description}</span>}
              {prize.username && <span className="text-xs text-gray-400"> by {prize.username}</span>}
            </li>
          ))}
        </ul>
      </div>

      {tooltip && <div className="mx-4 text-sm text-red-600 font-thin mt-2">{tooltip}</div>}

      <div className="flex justify-center max-w-[500px] mt-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-transparent rounded hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white p-1 border mb-1 border-yellow-600 hover:border-transparent"
        >
          Add Activity
        </button>
      </div>

      <div className="max-w-[530px]">
        <hr className="mx-4 my-1 border-gray-300 mb-2" />
      </div>

      {showForm && (
        <div>
          <div className="flex items-center">
            <select
              value={formData.user_id}
              onChange={(e) => setFormData((f) => ({ ...f, user_id: e.target.value }))}
              className="w-[calc(100%-4rem)] max-w-[500px] p-2 ml-4 mr-2 border rounded font-thin"
            >
              <option value="">Select an option</option>
              {participants.map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
            <button type="button" className="font-thin text-2xl" onClick={() => setShowAddUser((v) => !v)}>
              +
            </button>
          </div>

          {showAddUser && (
            <div className="ml-10 mt-1">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Name"
                className="p-2 py-1 font-thin border rounded placeholder-gray-400 mr-1"
              />
              <button
                type="button"
                onClick={handleAddUser}
                disabled={addUserMutation.isPending}
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white font-thin border rounded p-2 py-1 disabled:opacity-50"
              >
                Add User
              </button>
            </div>
          )}

          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
            className="font-thin mx-4 p-2 border mt-1 rounded"
          />
          <br />
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData((f) => ({ ...f, duration: e.target.value }))}
            placeholder="0"
            min="0"
            className="font-thin w-12 p-2 ml-4 mr-1 mt-1 border rounded"
            style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
          />
          <span className="font-thin">minutes</span>
          <br />
          <textarea
            value={formData.memo}
            onChange={(e) => setFormData((f) => ({ ...f, memo: e.target.value }))}
            placeholder="Description"
            className="font-thin border rounded mx-4 m-1 w-[calc(100%-2rem)] max-w-[500px] px-2 py-1"
          />
          <br />

          <div className="mx-4 mb-1 flex items-center gap-2">
            <label className="cursor-pointer font-thin text-yellow-600 border border-yellow-600 rounded px-2 py-1 text-sm hover:bg-yellow-600 hover:text-white">
              Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFormData((f) => ({ ...f, photo: e.target.files[0] || null }))}
              />
            </label>
            {formData.photo && (
              <img src={URL.createObjectURL(formData.photo)} alt="thumbnail" className="w-10 h-10 object-cover" />
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveActivity.isPending}
            className="mx-4 mb-1 bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-2 px-4 border border-yellow-600 hover:border-transparent rounded disabled:opacity-50"
          >
            {saveActivity.isPending ? "Saving..." : "Save"}
          </button>
          <hr className="my-1 border-gray-300 mb-2" />
        </div>
      )}

      <ul>
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} onIncrementSus={(aid) => incrementSus.mutate(aid)} />
        ))}
      </ul>
    </div>
  )
}

export default ChallengeDashboard
