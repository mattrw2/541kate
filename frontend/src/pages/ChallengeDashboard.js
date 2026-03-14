import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog } from "@headlessui/react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js"
import annotationPlugin from "chartjs-plugin-annotation"
import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline"
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

const getSusKey = (userId) => `sus_votes_${userId}`
const hasVotedSus = (userId, activityId) => {
  if (!userId) return false
  const votes = JSON.parse(localStorage.getItem(getSusKey(userId)) || "[]")
  return votes.includes(activityId)
}
const setSusVote = (userId, activityId, val) => {
  const votes = JSON.parse(localStorage.getItem(getSusKey(userId)) || "[]")
  const updated = val ? [...new Set([...votes, activityId])] : votes.filter((id) => id !== activityId)
  localStorage.setItem(getSusKey(userId), JSON.stringify(updated))
}

const ActivityItem = ({ activity, onIncrementSus, onDecrementSus, onDelete, currentUser }) => {
  const [showFullPhoto, setShowFullPhoto] = useState(false)
  const [susCount, setSusCount] = useState(activity.sus_count || 0)
  const [voted, setVoted] = useState(() => hasVotedSus(currentUser?.id, activity.id))
  const [hovering, setHovering] = useState(false)
  const [commentText, setCommentText] = useState("")
  const commentInputRef = useRef(null)
  const queryClient = useQueryClient()

  const [year, month, day] = activity.date.split("-")
  const date = new Date(year, month - 1, day)
  const monthStr = date.toLocaleDateString("en-US", { month: "short" })
  const dayStr = date.toLocaleDateString("en-US", { day: "numeric" })

  const { data: comments = [] } = useQuery({
    queryKey: ["activity", activity.id, "comments"],
    queryFn: () => fetch(`${apiUrl}/activities/${activity.id}/comments`).then((r) => r.json()),
  })

  const addComment = useMutation({
    mutationFn: (body) =>
      fetch(`${apiUrl}/activities/${activity.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity", activity.id, "comments"] })
      setCommentText("")
    },
  })

  const handleSus = (e) => {
    e.stopPropagation()
    if (!currentUser) return
    if (voted) {
      setSusCount((c) => Math.max(0, c - 1))
      setVoted(false)
      setSusVote(currentUser.id, activity.id, false)
      onDecrementSus(activity.id)
    } else {
      setSusCount((c) => c + 1)
      setVoted(true)
      setSusVote(currentUser.id, activity.id, true)
      onIncrementSus(activity.id)
    }
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    addComment.mutate({ user_id: currentUser?.id, text: commentText.trim() })
  }

  const susActive = voted || hovering

  return (
    <li className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-shadow">
      <div
        className={`flex items-start gap-3 px-3 py-2.5 ${activity.photo_path ? "cursor-pointer" : ""}`}
        onClick={() => activity.photo_path && setShowFullPhoto((v) => !v)}
      >
        <div className="flex-shrink-0 text-center w-8 pt-0.5">
          <div className="text-[10px] uppercase tracking-wide text-gray-400">{monthStr}</div>
          <div className="text-lg font-light text-gray-700 leading-tight">{dayStr}</div>
        </div>

        <div className="w-px bg-yellow-400 self-stretch flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800">{activity.username}</div>
          {activity.memo && (
            <div className="text-xs text-gray-500 mt-0.5">{activity.memo}</div>
          )}
          {activity.lat != null && activity.lng != null && (
            <a
              href={`https://www.google.com/maps?q=${activity.lat},${activity.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-gray-400 hover:text-yellow-500 mt-0.5 block"
            >
              📍 {activity.lat.toFixed(4)}, {activity.lng.toFixed(4)}
            </a>
          )}
          {activity.photo_path && showFullPhoto && (
            <img src={`${apiUrl}${activity.photo_path}`} alt="activity" className="mt-2 rounded-md max-w-full" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {activity.photo_path && !showFullPhoto && (
            <img src={`${apiUrl}${activity.photo_path}`} alt="thumbnail" className="w-8 h-8 rounded object-cover" />
          )}
          <button
            className="flex items-center gap-0.5 text-gray-400 hover:text-yellow-500 transition-colors"
            onClick={handleSus}
            onMouseOver={() => setHovering(true)}
            onMouseOut={() => setHovering(false)}
          >
            <img src={susActive ? "/suspicious.png" : "/suspicious_gray.png"} alt="Sus" width={16} height={16} />
            {susCount > 0 && <span className="text-xs">{susCount}</span>}
          </button>
          <span className="text-sm font-light text-gray-600 whitespace-nowrap">
            {activity.duration}<span className="text-xs text-gray-400 ml-0.5">min</span>
          </span>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(activity.id) }}
              className="text-gray-300 hover:text-red-400 transition-colors text-xs leading-none"
              title="Delete"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="px-3 pb-2 border-t border-gray-50">
        <div className="mt-1.5 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="text-xs text-gray-600 border-l-2 border-yellow-200 pl-2">
              <span className="font-medium text-gray-700">{c.username || "Anonymous"}</span>
              <span className="ml-1">{c.text}</span>
              {c.lat != null && c.lng != null && (
                <a
                  href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-gray-400 hover:text-yellow-500"
                >
                  📍 {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                </a>
              )}
            </div>
          ))}
          {currentUser && (
            <div className="flex gap-1 mt-1">
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddComment() }}
                placeholder="Add a comment..."
                className="font-thin text-xs border rounded px-2 py-1 flex-1"
              />
              <button
                onClick={handleAddComment}
                disabled={addComment.isPending}
                className="text-xs text-yellow-600 border border-yellow-600 rounded px-2 py-1 hover:bg-yellow-600 hover:text-white disabled:opacity-50"
              >
                Post
              </button>
            </div>
          )}
        </div>
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

  const { data: prizes = [] } = useQuery({
    queryKey: ["challenge", id, "prizes"],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}/prizes`).then((r) => r.json()),
  })

  const { data: participants = [] } = useQuery({
    queryKey: ["challenge", id, "participants"],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}/participants`).then((r) => r.json()),
    enabled: !!challenge && currentUser?.id === challenge.admin_user_id,
  })

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch(`${apiUrl}/users`).then((r) => r.json()),
    enabled: !!challenge && currentUser?.id === challenge.admin_user_id,
  })

  const today = new Date().toLocaleDateString("en-CA")
  const [showForm, setShowForm] = useState(false)
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [formData, setFormData] = useState({ duration: "", date: today, memo: "", photo: null })
  const [tooltip, setTooltip] = useState(null)
  const [showPrizeForm, setShowPrizeForm] = useState(false)
  const [prizeForm, setPrizeForm] = useState({ name: "", description: "" })
  const [showManage, setShowManage] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const [manageForm, setManageForm] = useState({ name: "", description: "", goal_minutes: 600, start_date: "", end_date: "" })
  const [manageSaveSuccess, setManageSaveSuccess] = useState(false)
  const [addUserId, setAddUserId] = useState("")

  useEffect(() => {
    if (challenge && showManage) {
      setManageForm({
        name: challenge.name || "",
        description: challenge.description || "",
        goal_minutes: challenge.goal_minutes || 600,
        start_date: challenge.start_date || "",
        end_date: challenge.end_date || "",
      })
    }
  }, [challenge, showManage])

  const showTooltipMsg = (msg) => {
    setTooltip(msg)
    setTimeout(() => setTooltip(null), 3000)
  }

  const saveActivity = useMutation({
    mutationFn: (fd) =>
      fetch(`${apiUrl}/activities`, { method: "POST", body: fd }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "activities"] })
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "duration"] })
      setFormData({ duration: "", date: today, memo: "", photo: null })
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

  const decrementSus = useMutation({
    mutationFn: (activityId) =>
      fetch(`${apiUrl}/activities/decrement/${activityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
  })

  const deleteActivity = useMutation({
    mutationFn: (activityId) =>
      fetch(`${apiUrl}/activities/${activityId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "activities"] })
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "duration"] })
    },
  })

  const handleDeleteActivity = (activityId) => {
    if (window.confirm("Delete this activity?")) deleteActivity.mutate(activityId)
  }

  const deletePrize = useMutation({
    mutationFn: (prizeId) =>
      fetch(`${apiUrl}/challenges/${id}/prizes/${prizeId}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "prizes"] }),
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

  const updateChallenge = useMutation({
    mutationFn: (body) =>
      fetch(`${apiUrl}/challenges/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id] })
      setManageSaveSuccess(true)
      setTimeout(() => setManageSaveSuccess(false), 3000)
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

  const handleSave = () => {
    const { duration, date, memo, photo } = formData
    if (!date) { showTooltipMsg("Please enter a date."); return }
    if (!duration || duration < 0) { showTooltipMsg("Please enter a valid time."); return }
    if (!navigator.geolocation) {
      showTooltipMsg("Geolocation is not supported by your browser.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const fd = new FormData()
        fd.append("data", JSON.stringify({ user_id: currentUser.id, duration, date, memo, challenge_id: id, lat: pos.coords.latitude, lng: pos.coords.longitude }))
        if (photo) fd.append("photo", photo)
        saveActivity.mutate(fd)
      },
      () => { showTooltipMsg("Location access is required to log an activity.") }
    )
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

  const participantIds = participants.map((p) => p.id)
  const nonParticipants = allUsers.filter((u) => !participantIds.includes(u.id))

  return (
    <div className="max-w-3xl mx-auto">
      {/* Full-width header */}
      <header className="relative">
        <div
          className="bg-gray-200"
          style={{ background: "url('/IMG_1096.jpg') left/cover", width: "100%", height: "150px" }}
        />
        <div className="absolute top-0 right-0 p-4 text-white font-bold text-2xl drop-shadow">
          {challenge?.name || ""}
        </div>
        <div className="absolute top-10 right-5 p-4">
          <img src="/jogging.png" className="w-20 h-20" alt="jogging" />
        </div>
      </header>

      <div>
        <div>
          {challenge && (
            <div className="mx-4 mt-3 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-base text-gray-800">{challenge.name}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowShare(true)}
                    className="bg-yellow-700 text-white border border-yellow-700 rounded px-2 py-0.5 text-xs font-thin hover:bg-yellow-800 hover:border-yellow-800 flex items-center gap-1"
                  >
                    <ArrowUpOnSquareIcon className="w-3.5 h-3.5" />
                    Invite
                  </button>
                  {currentUser?.id === challenge.admin_user_id && (
                    <button
                      onClick={() => setShowManage(true)}
                      className="text-yellow-600 border border-yellow-600 rounded px-2 py-0.5 text-xs font-thin hover:bg-yellow-600 hover:text-white"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>
              {challenge.description && (
                <p className="font-thin text-sm text-gray-600">{challenge.description}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-thin text-gray-500 mt-2">
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
            </div>
          )}

          {challenge && chartOptions && (
            <div style={{ height: "400px" }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}

          {/* Prizes */}
          <div className="mx-4 mt-4 mb-8 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-thin text-sm text-gray-500 uppercase tracking-wide">Prizes</h3>
              <button
                onClick={() => setShowPrizeForm(true)}
                className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-0.5 px-2 border border-yellow-600 hover:border-transparent rounded text-sm"
              >
                Add Prize
              </button>
            </div>
            {prizes.length === 0 && (
              <p className="text-sm font-thin text-gray-400">No prizes yet.</p>
            )}
            <ul className="space-y-1">
              {prizes.map((prize) => (
                <li key={prize.id} className="flex items-center justify-between text-sm font-thin border-b border-gray-200 pb-1">
                  <span>
                    <span className="font-normal">{prize.name}</span>
                    {prize.description && <span className="text-gray-600"> — {prize.description}</span>}
                    {prize.username && <span className="text-xs text-gray-400"> by {prize.username}</span>}
                  </span>
                  {currentUser?.id === prize.user_id && (
                    <button
                      onClick={() => { if (window.confirm("Delete this prize?")) deletePrize.mutate(prize.id) }}
                      className="text-gray-300 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Activity list */}
        <div className="mx-4 mt-4 mb-8 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-thin text-sm text-gray-500 uppercase tracking-wide">Activity</h3>
            {currentUser && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-0.5 px-2 border border-yellow-600 hover:border-transparent rounded text-sm"
              >
                Add Activity
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {(showAllActivities ? activities : activities.slice(0, 20)).map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onIncrementSus={(aid) => incrementSus.mutate(aid)}
                onDecrementSus={(aid) => decrementSus.mutate(aid)}
                currentUser={currentUser}
                onDelete={currentUser?.id === activity.user_id ? handleDeleteActivity : null}
              />
            ))}
          </ul>
          {activities.length > 20 && !showAllActivities && (
            <button
              onClick={() => setShowAllActivities(true)}
              className="mt-3 text-sm font-thin text-yellow-600 hover:underline"
            >
              View all {activities.length} activities
            </button>
          )}
        </div>
      </div>

      {/* FAB */}
      {currentUser && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-14 h-14 text-3xl shadow-lg flex items-center justify-center transition-colors z-40"
          aria-label="Add Activity"
        >
          +
        </button>
      )}

      {/* Share modal */}
      <Dialog open={showShare} onClose={() => { setShowShare(false); setCopied(false) }} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-light text-gray-800">Invite</Dialog.Title>
              <button onClick={() => { setShowShare(false); setCopied(false) }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={window.location.href}
                className="font-thin text-sm border rounded px-2 py-1 flex-1 text-gray-600 bg-gray-50"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true) }}
                className="text-sm font-thin text-yellow-600 border border-yellow-600 rounded px-3 py-1 hover:bg-yellow-600 hover:text-white whitespace-nowrap"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Manage modal */}
      <Dialog open={showManage} onClose={() => setShowManage(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-light text-gray-800">Manage: {challenge?.name}</Dialog.Title>
              <button onClick={() => setShowManage(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <section className="mb-6">
              {manageSaveSuccess && <div className="text-green-600 text-sm font-thin mb-2">Saved!</div>}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  updateChallenge.mutate({
                    name: manageForm.name,
                    description: manageForm.description,
                    goal_minutes: manageForm.goal_minutes,
                    start_date: manageForm.start_date || null,
                    end_date: manageForm.end_date || null,
                  })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">Name</label>
                  <input type="text" value={manageForm.name} onChange={(e) => setManageForm((f) => ({ ...f, name: e.target.value }))} className="font-thin text-sm border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">Description</label>
                  <textarea value={manageForm.description} onChange={(e) => setManageForm((f) => ({ ...f, description: e.target.value }))} className="font-thin text-sm border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400" rows={2} />
                </div>
                <div>
                  <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">Goal (minutes)</label>
                  <input type="number" value={manageForm.goal_minutes} onChange={(e) => setManageForm((f) => ({ ...f, goal_minutes: parseInt(e.target.value) || 0 }))} className="font-thin text-sm border border-gray-200 rounded px-2 py-1.5 w-32 focus:outline-none focus:border-yellow-400" min="0" />
                </div>
                <div>
                  <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">Start date</label>
                  <input type="date" value={manageForm.start_date} onChange={(e) => setManageForm((f) => ({ ...f, start_date: e.target.value }))} className="font-thin text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-thin text-gray-500 uppercase tracking-wide mb-1">End date</label>
                  <input type="date" value={manageForm.end_date} onChange={(e) => setManageForm((f) => ({ ...f, end_date: e.target.value }))} className="font-thin text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400" />
                </div>
                <button type="submit" disabled={updateChallenge.isPending} className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-1.5 px-4 border border-yellow-600 hover:border-transparent rounded text-sm disabled:opacity-50">
                  {updateChallenge.isPending ? "Saving..." : "Save"}
                </button>
              </form>
            </section>

          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Add Prize modal */}
      <Dialog open={showPrizeForm} onClose={() => setShowPrizeForm(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-light text-gray-800">Add Prize</Dialog.Title>
              <button onClick={() => setShowPrizeForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            {tooltip && <div className="text-sm text-red-500 font-thin mb-3">{tooltip}</div>}
            <div className="space-y-3">
              <input type="text" value={prizeForm.name} onChange={(e) => setPrizeForm((f) => ({ ...f, name: e.target.value }))} placeholder="Prize name" className="font-thin border rounded px-2 py-1 w-full text-sm" autoFocus />
              <input type="text" value={prizeForm.description} onChange={(e) => setPrizeForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" className="font-thin border rounded px-2 py-1 w-full text-sm" />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowPrizeForm(false)} className="font-thin text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                <button type="button" onClick={handleAddPrize} disabled={addPrizeMutation.isPending} className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-1.5 px-4 border border-yellow-600 hover:border-transparent rounded text-sm disabled:opacity-50">
                  {addPrizeMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Add Activity modal */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-light text-gray-800">Add Activity</Dialog.Title>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {tooltip && <div className="text-sm text-red-500 font-thin mb-3">{tooltip}</div>}

            <div className="space-y-3">
              <input type="date" value={formData.date} onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))} className="font-thin w-full p-2 border rounded text-sm" />

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="font-thin w-20 p-2 border rounded text-sm"
                  style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
                />
                <span className="font-thin text-sm text-gray-500">minutes</span>
              </div>

              <textarea value={formData.memo} onChange={(e) => setFormData((f) => ({ ...f, memo: e.target.value }))} placeholder="Description" rows={2} className="font-thin border rounded w-full px-2 py-1 text-sm" />

              <div className="flex items-center gap-3">
                <label className="cursor-pointer font-thin text-yellow-600 border border-yellow-600 rounded px-2 py-1 text-sm hover:bg-yellow-600 hover:text-white">
                  Photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFormData((f) => ({ ...f, photo: e.target.files[0] || null }))} />
                </label>
                {formData.photo && (
                  <img src={URL.createObjectURL(formData.photo)} alt="thumbnail" className="w-10 h-10 object-cover rounded" />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="font-thin text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                <button type="button" onClick={handleSave} disabled={saveActivity.isPending} className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-1.5 px-4 border border-yellow-600 hover:border-transparent rounded text-sm disabled:opacity-50">
                  {saveActivity.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}

export default ChallengeDashboard
