// Units a challenge can measure activity in. activities.duration and
// challenges.goal_minutes hold amounts in the challenge's unit.
export const UNITS = {
  // tick: compact suffix for chart axes and quick-pick buttons ("30m", "3mi")
  minutes: { label: "Minutes", short: "min", tick: "m", quickPicks: [5, 10, 30, 45, 60], step: 1 },
  miles: { label: "Miles", short: "mi", tick: "mi", quickPicks: [1, 2, 3, 5, 10], step: 0.1 },
}

export const unitOf = (challenge) => UNITS[challenge?.unit] || UNITS.minutes

// Round away float noise from summing decimals (e.g. 0.1 + 0.2).
export const roundAmount = (n) => Math.round((Number(n) || 0) * 100) / 100

// "45 min", "3.1 mi"
export const formatAmount = (n, unit) => `${roundAmount(n)} ${unit.short}`
