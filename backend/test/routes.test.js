import { describe, it, expect } from "vitest"
import request from "supertest"
import app from "../src/server.js"

// These exercise the request pipeline (routing + middleware) on paths that
// return before any DB query runs, so they need no Postgres.

describe("device auth gating", () => {
  it("GET /challenges without a device cookie → 401", async () => {
    const res = await request(app).get("/challenges")
    expect(res.status).toBe(401)
  })

  it("GET /users without a device cookie → 401", async () => {
    const res = await request(app).get("/users")
    expect(res.status).toBe(401)
  })

  it("POST /activities without a device cookie → 401", async () => {
    const res = await request(app)
      .post("/activities")
      .field("data", JSON.stringify({ user_id: 1, duration: 30, date: "2026-01-01" }))
    expect(res.status).toBe(401)
  })
})

describe("request validation", () => {
  it("POST /households without a username → 400", async () => {
    const res = await request(app).post("/households").send({})
    expect(res.status).toBe(400)
  })

  it("POST /households/join without a code → 400", async () => {
    const res = await request(app).post("/households/join").send({})
    expect(res.status).toBe(400)
  })
})
