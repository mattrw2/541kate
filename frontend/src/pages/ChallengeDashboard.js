import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
import ChartDataLabels from "chartjs-plugin-datalabels"
import { ArrowUpOnSquareIcon, TrophyIcon, BoltIcon, Cog6ToothIcon, ChevronDownIcon, ChevronUpIcon, ChartBarIcon, MagnifyingGlassIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline"
import { apiUrl } from "../api"
import { useCurrentUser } from "../UserContext"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, ChartDataLabels)

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


const QuickSelect = ({ options, value, onSelect, label }) => (
  <div className="flex flex-wrap gap-2 min-w-0">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onSelect(opt)}
        className={`text-sm rounded px-2 py-1 border ${value === opt ? "bg-yellow-600 text-white border-yellow-600" : "text-yellow-600 border-yellow-600 hover:bg-yellow-600 hover:text-white"}`}
      >
        {label ? label(opt) : opt}
      </button>
    ))}
  </div>
)

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

const ActivityItem = ({ activity, onIncrementSus, onDecrementSus, onDelete, currentUser, challengeId, isComplete }) => {
  const locationAddress = activity.address
  const [showFullPhoto, setShowFullPhoto] = useState(false)
  const [susCount, setSusCount] = useState(activity.sus_count || 0)
  const [voted, setVoted] = useState(() => hasVotedSus(currentUser?.id, activity.id))
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    setVoted(hasVotedSus(currentUser?.id, activity.id))
  }, [currentUser?.id, activity.id])
  const [commentText, setCommentText] = useState("")
  const [showComments, setShowComments] = useState(false)
  const commentInputRef = useRef(null)
  const queryClient = useQueryClient()

  const [year, month, day] = activity.date.split("-")
  const date = new Date(year, month - 1, day)
  const monthStr = date.toLocaleDateString("en-US", { month: "short" })
  const dayStr = date.toLocaleDateString("en-US", { day: "numeric" })

  const comments = activity.comments || []

  const addComment = useMutation({
    mutationFn: (body) =>
      fetch(`${apiUrl}/activities/${activity.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", challengeId, "activities"] })
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
      <div className="flex items-stretch gap-3 px-3 py-2.5">
        {/* Col 1: date */}
        <div className="flex-shrink-0 text-center w-8 pt-0.5">
          <div className="text-[10px] uppercase tracking-wide text-gray-400">{monthStr}</div>
          <div className="text-lg font-light text-gray-700 leading-tight">{dayStr}</div>
        </div>

        <div className="w-px bg-yellow-400 self-stretch flex-shrink-0" />

        {/* Col 2: header + content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <span className="text-base font-medium text-gray-800">{activity.username}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isComplete && (
                <button
                  className="flex items-center gap-0.5 text-gray-400 hover:text-yellow-500 transition-colors"
                  onClick={handleSus}
                  onMouseOver={() => setHovering(true)}
                  onMouseOut={() => setHovering(false)}
                >
                  <img src={susActive ? "/suspicious.png" : "/suspicious_gray.png"} alt="Sus" width={16} height={16} />
                  {susCount > 0 && <span className="text-xs">{susCount}</span>}
                </button>
              )}
              <span className="text-base font-semibold text-gray-800 whitespace-nowrap">
                {activity.duration}<span className="text-xs font-normal text-gray-400 ml-0.5">min</span>
              </span>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(activity.id) }}
                  className="text-red-400 hover:text-red-600 transition-colors text-base leading-none p-1"
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Content rows */}
          {(activity.memo || activity.lat != null || activity.photo_path) && (
            <div
              className={`mt-0.5 ${activity.photo_path ? "cursor-pointer" : ""}`}
              onClick={() => activity.photo_path && setShowFullPhoto((v) => !v)}
            >
              {activity.memo && (
                <div className="text-sm text-gray-500">{activity.memo}{activity.is_boosted ? <span title="Boosted" className="ml-1">⚡</span> : null}</div>
              )}
              {!activity.memo && activity.is_boosted && (
                <span title="Boosted">⚡</span>
              )}
              {activity.lat != null && activity.lng != null && (
                <a
                  href={`https://www.google.com/maps?q=${activity.lat},${activity.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-gray-400 hover:text-yellow-500 mt-0.5 block"
                >
                  📍 {locationAddress || `${activity.lat.toFixed(4)}, ${activity.lng.toFixed(4)}`}
                </a>
              )}
              {activity.photo_path && (
                <img
                  src={`${apiUrl}${activity.photo_path}`}
                  alt={showFullPhoto ? "activity" : "thumbnail"}
                  loading="lazy"
                  className={showFullPhoto ? "mt-2 rounded-md max-w-full" : "w-8 h-8 rounded object-cover mt-1"}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      {(comments.length > 0 || showComments) && (
        <div className="px-3 pb-2 border-t border-gray-50">
          <div className="mt-1.5 space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="text-xs text-gray-600 border-l-2 border-yellow-200 pl-2">
                <span className="font-medium text-gray-700">{c.username || "Anonymous"}</span>
                <span className="ml-1">{c.text}</span>
              </div>
            ))}
            {currentUser && !isComplete && (
              <div className="flex gap-2 mt-1">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddComment() }}
                  placeholder="Add a comment..."
                  className="text-base border rounded px-2 py-1 flex-1"
                />
                <button
                  onClick={handleAddComment}
                  disabled={addComment.isPending || !commentText.trim()}
                  className={`rounded px-3 py-1 text-sm font-medium transition-colors ${commentText.trim() ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "bg-gray-100 text-gray-300 cursor-default"}`}
                >
                  Post
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {currentUser && !isComplete && comments.length === 0 && !showComments && (
        <button onClick={() => { setShowComments(true); setTimeout(() => commentInputRef.current?.focus(), 0) }} className="px-3 pb-2 flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 transition-colors">
          <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
          comment
        </button>
      )}
    </li>
  )
}

const ChallengeDashboard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useCurrentUser()
  const queryClient = useQueryClient()

  const { data: challenge } = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}`).then((r) => r.json()),
  })

const { data: activities = [], isRefetching: activitiesFetching } = useQuery({
    queryKey: ["challenge", id, "activities"],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}/activities`).then((r) => r.json()),
  })

  const { data: prizes = [], isSuccess: prizesLoaded } = useQuery({
    queryKey: ["challenge", id, "prizes"],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}/prizes`).then((r) => r.json()),
  })

  const today = new Date().toLocaleDateString("en-CA")
  const isComplete = !!(challenge?.end_date && today > challenge.end_date)

  const userTotals = (() => {
    const totals = {}
    activities.filter((a) => !a.IS_ARCHIVED).forEach((a) => {
      if (!totals[a.user_id]) totals[a.user_id] = { user_id: a.user_id, username: a.username, total_duration: 0 }
      totals[a.user_id].total_duration += a.duration
    })
    return Object.values(totals).sort((a, b) => b.total_duration - a.total_duration)
  })()
  const eligibleUsers = userTotals.filter((u) => u.total_duration >= (challenge?.goal_minutes || 0))
  const claimedUserIds = new Set(prizes.filter((p) => p.winner_user_id).map((p) => p.winner_user_id))
  const nextPicker = isComplete ? eligibleUsers.find((u) => {
    if (claimedUserIds.has(u.user_id)) return false
    return prizes.some((p) => !p.winner_user_id && p.user_id !== u.user_id)
  }) : null
  const isMyTurn = nextPicker?.user_id === currentUser?.id
  const isWaitingForTurn = isComplete && !isMyTurn && !!nextPicker && !!currentUser && !claimedUserIds.has(currentUser.id) && eligibleUsers.some((u) => u.user_id === currentUser.id)
  const [showForm, setShowForm] = useState(false)
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [activitySearch, setActivitySearch] = useState("")
  const [chartTodayOnly, setChartTodayOnly] = useState(false)
  const [formData, setFormData] = useState({ duration: "", date: today, memo: "", photo: null, is_boosted: false })
  const [tooltip, setTooltip] = useState(null)
  const [showPrizeForm, setShowPrizeForm] = useState(false)
  const [prizeForm, setPrizeForm] = useState({ name: "", description: "", riley_chooses: false })
  const [editingPrize, setEditingPrize] = useState(null)
  const [showManage, setShowManage] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showInfo, setShowInfo] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [copied, setCopied] = useState(false)
  const [manageForm, setManageForm] = useState({ name: "", description: "", goal_minutes: 600, start_date: "", end_date: "" })
  const [managePhoto, setManagePhoto] = useState(null)
  const [manageSaveSuccess, setManageSaveSuccess] = useState(false)

  useEffect(() => {
    if (prizesLoaded && currentUser && prizes.some((p) => p.user_id === currentUser.id)) {
      setShowInfo(false)
    }
  }, [prizesLoaded, prizes, currentUser])

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
      setFormData({ duration: "", date: today, memo: "", photo: null, is_boosted: false })
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

  const editPrizeMutation = useMutation({
    mutationFn: ({ prizeId, body }) =>
      fetch(`${apiUrl}/challenges/${id}/prizes/${prizeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "prizes"] })
      setEditingPrize(null)
    },
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
      setPrizeForm({ name: "", description: "", riley_chooses: false })
      setShowPrizeForm(false)
    },
  })

  const claimPrize = useMutation({
    mutationFn: (prizeId) =>
      fetch(`${apiUrl}/challenges/${id}/prizes/${prizeId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser?.id }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id, "prizes"] })
    },
  })

  const updateChallenge = useMutation({
    mutationFn: (formData) =>
      fetch(`${apiUrl}/challenges/${id}`, {
        method: "PUT",
        body: formData,
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", id] })
      setManageSaveSuccess(true)
      setTimeout(() => setManageSaveSuccess(false), 3000)
    },
  })

  const handleSave = () => {
    const { duration, date, memo, photo, is_boosted } = formData
    if (!date) { showTooltipMsg("Please enter a date."); return }
    if (!duration || duration < 0) { showTooltipMsg("Please enter a valid time."); return }

    const submit = (lat, lng) => {
      const fd = new FormData()
      fd.append("data", JSON.stringify({ user_id: currentUser.id, duration, date, memo, challenge_id: id, lat, lng, is_boosted }))
      if (photo) fd.append("photo", photo)
      saveActivity.mutate(fd)
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => submit(pos.coords.latitude, pos.coords.longitude),
        () => submit(null, null)
      )
    } else {
      submit(null, null)
    }
  }

  const handleAddPrize = () => {
    if (!prizeForm.description && !prizeForm.riley_chooses) { showTooltipMsg("Please enter a prize description."); return }
    addPrizeMutation.mutate({ name: prizeForm.riley_chooses ? "Riley will choose my fate" : prizeForm.description, description: prizeForm.description, user_id: currentUser?.id, riley_chooses: prizeForm.riley_chooses })
  }

  const chartOptions = challenge
    ? {
        indexAxis: "y",
        maintainAspectRatio: false,
        layout: { padding: { right: 24 } },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { callback: (value) => `${value}h` },
          },
          y: { beginAtZero: true, grid: { display: false }, ticks: { autoSkip: false } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const totalMin = Math.round(context.parsed.x * 60)
                const h = Math.floor(totalMin / 60)
                const m = totalMin % 60
                if (h && m) return `${h}h ${m}m`
                if (h) return `${h}h`
                return `${m}m`
              },
            },
          },
          datalabels: {
            anchor: "end",
            align: "end",
            clamp: true,
            color: "#374151",
            font: { size: 24 },
            formatter: (_value, context) => {
              const username = context.chart.data.labels[context.dataIndex]
              return username === "1scott" ? "*" : null
            },
          },
        },
      }
    : null

  const goalLinePlugin = {
    id: "goalLine",
    afterDraw: (chart) => {
      if (!challenge) return
      const { ctx, chartArea, scales } = chart
      const x = scales.x.getPixelForValue(challenge.goal_minutes / 60)
      if (x < chartArea.left || x > chartArea.right) return
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x, chartArea.top)
      ctx.lineTo(x, chartArea.bottom)
      ctx.lineWidth = 2
      ctx.strokeStyle = "orange"
      ctx.stroke()
      ctx.restore()
    },
  }

  const allTimeChartData = (() => {
    const totals = {}
    activities.filter((a) => !a.IS_ARCHIVED).forEach((a) => {
      totals[a.username] = (totals[a.username] || 0) + a.duration
    })
    return Object.entries(totals).map(([username, total_duration]) => ({ username, total_duration }))
      .sort((a, b) => b.total_duration - a.total_duration)
  })()

  const todayChartData = (() => {
    const totals = {}
    activities.filter((a) => !a.IS_ARCHIVED && a.date === today).forEach((a) => {
      totals[a.username] = (totals[a.username] || 0) + a.duration
    })
    return Object.entries(totals).map(([username, total_duration]) => ({ username, total_duration }))
      .sort((a, b) => b.total_duration - a.total_duration)
  })()

  const activeChartData = (chartTodayOnly ? todayChartData : allTimeChartData).filter((u) => u.total_duration > 0)

  const chartData = {
    labels: activeChartData.map((u) => u.username),
    datasets: [{ data: activeChartData.map((u) => u.total_duration / 60), backgroundColor: BG_COLORS, borderColor: BORDER_COLORS, borderWidth: 1 }],
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split("-")
    return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {activeTab === "dashboard" && currentUser && prizesLoaded && !prizes.some((p) => p.user_id === currentUser.id) && !isComplete && (
        <div className="mt-1 mb-4 bg-orange-100 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-orange-900">Add a prize to join this challenge</p>
          <button
            onClick={() => { if (currentUser) setShowPrizeForm(true) }}
            className="text-sm font-semibold text-orange-900 underline ml-3 flex-shrink-0 hover:text-orange-700"
          >
            Add Prize
          </button>
        </div>
      )}
      {activeTab === "dashboard" && isComplete && isMyTurn && (
        <div className="mt-1 mb-4 bg-orange-100 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-orange-900">Your turn to pick a prize</p>
          <button
            onClick={() => setActiveTab("prizes")}
            className="text-sm font-semibold text-orange-900 underline ml-3 flex-shrink-0 hover:text-orange-700"
          >
            Pick Prize
          </button>
        </div>
      )}
      {activeTab === "dashboard" && isWaitingForTurn && (
        <div className="mt-1 mb-4 bg-orange-100 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-orange-900">Waiting for {nextPicker.username} to pick a prize. Check back soon or check out the highlights.</p>
          <button
            onClick={() => navigate(`/challenge/${id}/recap`)}
            className="text-sm font-semibold text-orange-900 underline ml-3 flex-shrink-0 hover:text-orange-700"
          >
            Highlights
          </button>
        </div>
      )}
      {/* Persistent header */}
      {challenge && activeTab === "dashboard" && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <button onClick={() => setShowInfo(v => !v)} className="flex items-center gap-1.5 font-semibold text-lg text-gray-900 min-w-0">
                <span className="truncate">{challenge.name}</span>
                {showInfo ? <ChevronUpIcon className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>
              {isComplete && (
                <button
                  onClick={() => navigate(`/challenge/${id}/recap`)}
                  className="text-xs font-medium text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded px-1.5 py-0.5"
                >
                  Highlights
                </button>
              )}
            </div>
            <div className="flex gap-1.5 items-center">
{prizes.some((p) => p.user_id === currentUser?.id) && !isComplete && (
                <button onClick={() => setShowShare(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-3 py-1.5 text-sm font-medium flex items-center gap-1">
                  <ArrowUpOnSquareIcon className="w-3.5 h-3.5" />
                  Invite
                </button>
              )}
              {currentUser?.id === challenge.admin_user_id && (
                <button onClick={() => setShowManage(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-3 py-1.5 text-sm font-medium flex items-center gap-1.5">
                  <Cog6ToothIcon className="w-4 h-4" />
                  Manage
                </button>
              )}
            </div>
          </div>
          {challenge.photo_path && (
            <img src={`${apiUrl}${challenge.photo_path}`} alt={challenge.name} className="w-full h-32 sm:h-48 object-cover rounded-lg mt-2" />
          )}
          {showInfo && (
            <div className="mt-2">
              {challenge.description && <p className="text-sm text-gray-600 whitespace-pre-wrap">{challenge.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                {(challenge.start_date || challenge.end_date) && (
                  <span>{formatDate(challenge.start_date)}{challenge.start_date && challenge.end_date ? " – " : ""}{formatDate(challenge.end_date)}</span>
                )}
                <span>Goal: {challenge.goal_minutes} min</span>
                {challenge.admin_username && <span>by {challenge.admin_username}</span>}
              </div>
              <button onClick={() => setActiveTab("prizes")} className="text-xs text-yellow-600 hover:underline mt-2 block">View prizes</button>
            </div>
          )}
          <div className="border-b border-gray-200 mt-2" />
        </div>
      )}

          {/* Dashboard tab: chart + activities */}
          {activeTab === "dashboard" && (
            <>
              {challenge && chartOptions && (
                <div className="mx-4 mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setChartTodayOnly((v) => !v)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${chartTodayOnly ? "bg-yellow-600" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${chartTodayOnly ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                    <span className="text-xs text-gray-500">Today only</span>
                  </div>
                  <div style={{ height: `${Math.max(120, Math.min(activeChartData.length * 60 + 40, 600))}px` }}>
                    <Bar data={chartData} options={chartOptions} plugins={[goalLinePlugin]} />
                  </div>
                </div>
              )}
              <div className="mx-4 mt-4 border-t border-gray-200 pt-4 min-h-screen">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Activities</h3>
                  {currentUser && !isComplete && (
                    <button onClick={() => setShowForm(true)} disabled={prizesLoaded && !prizes.some((p) => p.user_id === currentUser.id)} className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                      <BoltIcon className="w-4 h-4" />
                      Add Activity
                    </button>
                  )}
                </div>
                <div className="relative mb-3">
                  <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    placeholder="Search activities..."
                    className="text-base border border-gray-200 rounded pl-7 pr-8 py-1.5 w-full focus:outline-none focus:border-yellow-400"
                  />
                  {activitySearch && (
                    <button onClick={() => setActivitySearch("")} className="absolute right-0 top-0 bottom-0 px-3 text-gray-400 hover:text-gray-600 text-lg">✕</button>
                  )}
                </div>
                {activitiesFetching && (
                  <div className="h-0.5 bg-yellow-500 animate-pulse rounded-full mb-3" />
                )}
                <ul className="space-y-2">
                  {(activitySearch ? activities : showAllActivities ? activities.filter((a) => !a.IS_ARCHIVED) : activities.filter((a) => !a.IS_ARCHIVED).slice(0, 20)).filter((a) => !activitySearch || a.username?.toLowerCase().includes(activitySearch.toLowerCase()) || a.memo?.toLowerCase().includes(activitySearch.toLowerCase())).map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      onIncrementSus={(aid) => incrementSus.mutate(aid)}
                      onDecrementSus={(aid) => decrementSus.mutate(aid)}
                      currentUser={currentUser}
                      onDelete={currentUser?.id === activity.user_id && !isComplete ? handleDeleteActivity : null}
                      challengeId={id}
                      isComplete={isComplete}
                    />
                  ))}
                </ul>
                {!activitySearch && activities.filter((a) => !a.IS_ARCHIVED).length > 20 && !showAllActivities && (
                  <button onClick={() => setShowAllActivities(true)} className="mt-3 text-sm text-yellow-600 hover:underline">
                    View all {activities.length} activities
                  </button>
                )}
              </div>
            </>
          )}

          {/* Prizes tab */}
          {activeTab === "prizes" && (
            <div className="mx-4 mt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Prizes</h3>
                {currentUser && !prizes.some((p) => p.user_id === currentUser.id) && !isComplete && (
                  <button
                    onClick={() => setShowPrizeForm(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
                  >
                    <TrophyIcon className="w-4 h-4" />
                    Add Prize
                  </button>
                )}
              </div>
              {prizes.length === 0 && <p className="text-sm text-gray-400">No prizes yet.</p>}
              <ul className="space-y-3">
                {prizes.map((prize) => (
                  <li key={prize.id} className="flex items-start justify-between border-b border-gray-200 pb-3">
                    <div>
                      <p className="text-base font-medium text-gray-800 whitespace-pre-wrap">{prize.riley_chooses ? (prize.description ? `🎲 ${prize.description}` : "🎲 Riley will choose my fate") : prize.name}{prize.username && <span className="text-xs text-gray-400 font-normal ml-1.5">by <span className="text-orange-500">{prize.username}</span></span>}</p>
                      {prize.winner_username && (
                        <p className="text-xs text-gray-500 mt-1">🏆 selected by <span className="font-medium text-gray-700">{prize.winner_username}</span></p>
                      )}
                    </div>
                    {!isComplete && ((prize.riley_chooses && currentUser?.username === "Riley") || (!prize.riley_chooses && (prize.user_id == null || currentUser?.id === prize.user_id))) && (
                      <button onClick={() => setEditingPrize(prize)} className="ml-3 flex-shrink-0 border border-gray-200 rounded px-2.5 py-1 text-xs text-gray-500 hover:border-yellow-500 hover:text-yellow-600 transition-colors">Edit</button>
                    )}
                    {isComplete && isMyTurn && !prize.winner_user_id && prize.user_id !== currentUser?.id && (
                      <button onClick={() => claimPrize.mutate(prize.id)} disabled={claimPrize.isPending} className="ml-3 flex-shrink-0 bg-yellow-600 hover:bg-yellow-700 text-white rounded px-3 py-1 text-xs font-medium disabled:opacity-50">
                        Pick
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}


      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
        {[
          { key: "dashboard", label: "Dashboard", icon: ChartBarIcon },
          { key: "prizes", label: "Prizes", icon: TrophyIcon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-sm font-medium transition-colors ${activeTab === key ? "text-yellow-600 border-t-2 border-yellow-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

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
                className="text-base border rounded px-2 py-1 flex-1 text-gray-600 bg-gray-50"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true) }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded px-3 py-1 whitespace-nowrap"
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
              {manageSaveSuccess && <div className="text-green-600 text-sm mb-2">Saved!</div>}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const fd = new FormData()
                  fd.append("name", manageForm.name)
                  fd.append("description", manageForm.description)
                  fd.append("goal_minutes", manageForm.goal_minutes)
                  fd.append("start_date", manageForm.start_date || "")
                  fd.append("end_date", manageForm.end_date || "")
                  if (managePhoto) fd.append("photo", managePhoto)
                  updateChallenge.mutate(fd)
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Name</label>
                  <input type="text" value={manageForm.name} onChange={(e) => setManageForm((f) => ({ ...f, name: e.target.value }))} className="text-base border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Description</label>
                  <textarea value={manageForm.description} onChange={(e) => setManageForm((f) => ({ ...f, description: e.target.value }))} className="text-base border border-gray-200 rounded px-2 py-1.5 w-full focus:outline-none focus:border-yellow-400" rows={2} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Goal (minutes)</label>
                  <input type="number" value={manageForm.goal_minutes} onChange={(e) => setManageForm((f) => ({ ...f, goal_minutes: parseInt(e.target.value) || 0 }))} className="text-base border border-gray-200 rounded px-2 py-1.5 w-32 focus:outline-none focus:border-yellow-400" min="0" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Start date</label>
                  <input type="date" value={manageForm.start_date} onChange={(e) => setManageForm((f) => ({ ...f, start_date: e.target.value }))} className="text-base border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">End date</label>
                  <input type="date" value={manageForm.end_date} onChange={(e) => setManageForm((f) => ({ ...f, end_date: e.target.value }))} className="text-base border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Photo (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setManagePhoto(e.target.files[0] || null)}
                    className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:border file:border-gray-200 file:rounded file:text-xs file:file:text-gray-600 file:bg-white hover:file:bg-gray-50"
                  />
                </div>
                <button type="submit" disabled={updateChallenge.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-4 py-1.5 text-sm disabled:opacity-50">
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
            <p className="text-xs text-gray-400 mb-3">You ({currentUser?.username}) are providing this prize.</p>
            {tooltip && <div className="text-sm text-red-500 mb-3">{tooltip}</div>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrizeForm((f) => ({ ...f, riley_chooses: true }))}
                  className={`text-sm border rounded px-3 py-2 text-center transition-colors ${prizeForm.riley_chooses ? "bg-yellow-600 border-yellow-600 text-white" : "border-gray-200 text-gray-600 hover:border-yellow-400 hover:text-yellow-700"}`}
                >
                  🎲 Riley chooses
                </button>
                <button
                  type="button"
                  onClick={() => setPrizeForm((f) => ({ ...f, riley_chooses: false }))}
                  className={`text-sm border rounded px-3 py-2 text-center transition-colors ${!prizeForm.riley_chooses ? "bg-yellow-600 border-yellow-600 text-white" : "border-gray-200 text-gray-600 hover:border-yellow-400 hover:text-yellow-700"}`}
                >
                  I'll define it
                </button>
              </div>
              {!prizeForm.riley_chooses && (
                <textarea value={prizeForm.description} onChange={(e) => setPrizeForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the prize" rows={3} className="border rounded px-2 py-1 w-full text-base" />
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowPrizeForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                <button type="button" onClick={handleAddPrize} disabled={addPrizeMutation.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-4 py-1.5 text-sm disabled:opacity-50">
                  {addPrizeMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Edit Prize modal */}
      <Dialog open={!!editingPrize} onClose={() => setEditingPrize(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-light text-gray-800">Edit Prize</Dialog.Title>
              <button onClick={() => setEditingPrize(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="space-y-3">
              <textarea
                value={editingPrize?.description ?? ""}
                onChange={(e) => setEditingPrize((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the prize"
                rows={3}
                className="border rounded px-2 py-1 w-full text-base"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setEditingPrize(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                <button
                  type="button"
                  onClick={() => editPrizeMutation.mutate({ prizeId: editingPrize.id, body: { name: editingPrize.description, description: editingPrize.description } })}
                  disabled={editPrizeMutation.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-4 py-1.5 text-sm disabled:opacity-50"
                >
                  {editPrizeMutation.isPending ? "Saving..." : "Save"}
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

            {tooltip && <div className="text-sm text-red-500 mb-3">{tooltip}</div>}

            <div className="space-y-3">
              <input type="date" value={formData.date} onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))} className="w-full p-2 border rounded text-base" />

              <div className="space-y-2">
                <QuickSelect
                  options={[5, 10, 30, 45, 60]}
                  value={parseInt(formData.duration) || null}
                  onSelect={(m) => setFormData((f) => ({ ...f, duration: String(m) }))}
                  label={(m) => `${m}m`}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-16 px-2 py-1 border rounded text-base"
                    style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
                  />
                  <span className="text-sm text-gray-500">minutes</span>
                  {formData.duration > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData((f) => f.is_boosted ? { ...f, duration: String(Math.round(parseInt(f.duration) / 2)), is_boosted: false } : { ...f, duration: String(parseInt(f.duration) * 2), is_boosted: true })}
                      className={`text-xs border rounded px-2 py-1 transition-colors ${formData.is_boosted ? "bg-yellow-500 text-white border-yellow-500" : "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"}`}
                    >
                      {formData.is_boosted ? "⚡ Boosted!" : "Boost my exercise"}
                    </button>
                  )}
                </div>
              </div>

              <QuickSelect
                options={["Brisking", "Gaga ball", "Treadmill eating", "Making enchiladas", "Wheelchair exercises"]}
                value={formData.memo}
                onSelect={(opt) => setFormData((f) => ({ ...f, memo: opt }))}
              />
              <textarea value={formData.memo} onChange={(e) => setFormData((f) => ({ ...f, memo: e.target.value }))} placeholder="Description" rows={2} className="border rounded w-full px-2 py-1 text-base" />

              <div className="flex items-center gap-3">
                <label className="cursor-pointer bg-yellow-600 hover:bg-yellow-700 text-white rounded px-2 py-1 text-sm">
                  Photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFormData((f) => ({ ...f, photo: e.target.files[0] || null }))} />
                </label>
                {formData.photo && (
                  <img src={URL.createObjectURL(formData.photo)} alt="thumbnail" className="w-10 h-10 object-cover rounded" />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                <button type="button" onClick={handleSave} disabled={saveActivity.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-4 py-1.5 text-sm disabled:opacity-50">
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
