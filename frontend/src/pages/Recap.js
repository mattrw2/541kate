import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { apiUrl } from "../api"

const PHOTOS = [
  "https://five41kate.onrender.com/1775516111022-IMG_7626.jpeg",
  "https://five41kate.onrender.com/1777869903283-IMG_9105.jpg",
  "",
  "",
  "",
  "",
  "",
]

const SLIDE_DURATION_MS = 5000

const ACTIVITY_CATEGORIES = ["Brisking", "Gaga ball", "Treadmill eating", "Making enchiladas", "Wheelchair exercises"]

const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const [year, month, day] = dateStr.split("-")
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const Recap = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: challenge } = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}`).then((r) => r.json()),
  })

  const { data: activities = [] } = useQuery({
    queryKey: ["challenge", id, "activities"],
    queryFn: () => fetch(`${apiUrl}/challenges/${id}/activities`).then((r) => r.json()),
  })

  const today = new Date().toLocaleDateString("en-CA")
  const isComplete = !!(challenge?.end_date && today > challenge.end_date)

  useEffect(() => {
    if (challenge && !isComplete) navigate(`/challenge/${id}`)
  }, [challenge, isComplete, id, navigate])

  const validActivities = activities.filter((a) => !a.IS_ARCHIVED)

  const totalMinutes = validActivities.reduce((sum, a) => sum + a.duration, 0)

  const userTotals = (() => {
    const t = {}
    validActivities.forEach((a) => {
      if (!t[a.user_id]) t[a.user_id] = { username: a.username, total: 0 }
      t[a.user_id].total += a.duration
    })
    return Object.values(t).sort((a, b) => b.total - a.total)
  })()
  const topUser = userTotals[0]

  const dailyTotals = (() => {
    const t = {}
    validActivities.forEach((a) => {
      t[a.date] = (t[a.date] || 0) + a.duration
    })
    return Object.entries(t).map(([date, total]) => ({ date, total })).sort((a, b) => b.total - a.total)
  })()
  const topDay = dailyTotals[0]

  const userDayTotals = (() => {
    const t = {}
    validActivities.forEach((a) => {
      const key = `${a.user_id}|${a.date}`
      if (!t[key]) t[key] = { username: a.username, date: a.date, total: 0 }
      t[key].total += a.duration
    })
    return Object.values(t).sort((a, b) => b.total - a.total)
  })()
  const topUserDay = userDayTotals[0]

  const categoryCounts = (() => {
    const counts = {}
    ACTIVITY_CATEGORIES.forEach((cat) => { counts[cat] = 0 })
    validActivities.forEach((a) => {
      const memo = (a.memo || "").toLowerCase()
      ACTIVITY_CATEGORIES.forEach((cat) => {
        if (memo.includes(cat.toLowerCase())) counts[cat]++
      })
    })
    return Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
  })()
  const topCategory = categoryCounts[0]

  const susUsers = (() => {
    const t = {}
    validActivities.forEach((a) => {
      if (!t[a.user_id]) t[a.user_id] = { username: a.username, total: 0 }
      t[a.user_id].total += a.sus_count || 0
    })
    return Object.values(t).filter((u) => u.total > 0).sort((a, b) => b.total - a.total)
  })()
  const susUser = susUsers[0]

  const susActivity = [...validActivities].filter((a) => (a.sus_count || 0) > 0).sort((a, b) => (b.sus_count || 0) - (a.sus_count || 0))[0]

  const dailyCounts = (() => {
    const c = {}
    validActivities.forEach((a) => {
      c[a.date] = (c[a.date] || 0) + 1
    })
    return Object.entries(c).map(([date, count]) => ({ date, count })).sort((a, b) => b.count - a.count)
  })()
  const topDayCount = dailyCounts[0]

  const userCounts = (() => {
    const c = {}
    validActivities.forEach((a) => {
      if (!c[a.user_id]) c[a.user_id] = { username: a.username, count: 0 }
      c[a.user_id].count++
    })
    return Object.values(c).sort((a, b) => b.count - a.count)
  })()
  const mostActiveUser = userCounts[0]

  const zeroMinuteCounts = (() => {
    const c = {}
    validActivities.filter((a) => a.duration === 0).forEach((a) => {
      if (!c[a.user_id]) c[a.user_id] = { username: a.username, count: 0 }
      c[a.user_id].count++
    })
    return Object.values(c).sort((a, b) => b.count - a.count)
  })()
  const siteAbuser = zeroMinuteCounts[0]

  const commenterCounts = (() => {
    const c = {}
    validActivities.forEach((a) => {
      (a.comments || []).forEach((cm) => {
        const key = cm.user_id ?? "anon"
        if (!c[key]) c[key] = { username: cm.username || "Anonymous", count: 0 }
        c[key].count++
      })
    })
    return Object.values(c).sort((a, b) => b.count - a.count)
  })()
  const topCommenter = commenterCounts[0]

  const slides = [
    { label: "Total Number of Minutes", value: totalMinutes.toLocaleString(), sub: "minutes app-wide" },
    topUser && { label: "Winner", value: topUser.username, sub: `${topUser.total} minutes` },
    topDay && { label: "Day With the Most Minutes", value: formatDate(topDay.date), sub: `${topDay.total} minutes` },
    topDayCount && { label: "Day With the Most Activities", value: formatDate(topDayCount.date), sub: `${topDayCount.count} activities` },
    mostActiveUser && { label: "Most Activities Logged", value: mostActiveUser.username, sub: `${mostActiveUser.count} activities` },
    topUserDay && { label: "Biggest Single Day", value: topUserDay.username, sub: `${topUserDay.total} minutes on ${formatDate(topUserDay.date)}` },
    siteAbuser && { label: "Site Abuser", value: siteAbuser.username, sub: `Posted ${siteAbuser.count} 0-minute activities. Really you couldn't have done 1 minute of work?` },
    susUser && { label: "Most Sus'd User", value: susUser.username, sub: `${susUser.total} sus votes` },
    susActivity && { label: "Most Sus'd Activity", value: susActivity.username, sub: `${susActivity.sus_count} sus votes${susActivity.memo ? ` for "${susActivity.memo}"` : ""}` },
    topCommenter && { label: "Most Comments", value: topCommenter.username, sub: `${topCommenter.count} comments` },
    topCategory && { label: "Most Popular Activity", value: topCategory[0], sub: `${topCategory[1]} times` },
  ].filter(Boolean)

  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (slides.length === 0) return
    const t = setTimeout(() => {
      setIdx((i) => Math.min(i + 1, slides.length - 1))
    }, SLIDE_DURATION_MS)
    return () => clearTimeout(t)
  }, [idx, slides.length])

  if (!challenge || !isComplete || slides.length === 0) return null

  const slide = slides[idx]
  const photo = PHOTOS[idx] || ""

  const handleClick = (e) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
    const w = e.currentTarget.offsetWidth
    if (x < w / 3) setIdx((i) => Math.max(0, i - 1))
    else setIdx((i) => Math.min(slides.length - 1, i + 1))
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col cursor-pointer select-none" onClick={handleClick}>
      <style>{`
        @keyframes recapProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      <div className="absolute top-0 left-0 right-0 flex gap-1 px-2 pt-2 z-20">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/30 rounded overflow-hidden">
            <div
              key={i === idx ? `active-${idx}` : `static-${i}`}
              className="h-full bg-white"
              style={{
                width: i < idx ? "100%" : "0%",
                animation: i === idx ? `recapProgress ${SLIDE_DURATION_MS}ms linear forwards` : "none",
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/challenge/${id}`) }}
        className="absolute top-4 right-4 text-white text-2xl z-30 leading-none w-8 h-8 flex items-center justify-center"
      >✕</button>

      <div className="absolute inset-0">
        {photo ? (
          <img src={photo} alt="" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500" />
        )}
      </div>

      <div className="relative z-10 mt-auto p-6 pb-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <p className="text-xs uppercase tracking-widest text-white/70 mb-2">{slide.label}</p>
        <p className="text-5xl font-bold text-white mb-2 break-words leading-tight">{slide.value}</p>
        <p className="text-base text-white/80">{slide.sub}</p>
      </div>
    </div>
  )
}

export default Recap
