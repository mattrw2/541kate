import { describe, it, expect } from "vitest"
import request from "supertest"
import app from "../src/server.js"

// These exercise the request pipeline (routing + middleware) on paths that
// return before any DB query runs, so they need no Postgres.

describe("tenant key gating", () => {
  it("GET /challenges without a tenant key → 401", async () => {
    const res = await request(app).get("/challenges")
    expect(res.status).toBe(401)
  })

  it("POST /users without a tenant key → 401", async () => {
    const res = await request(app).post("/users").send({ username: "kate" })
    expect(res.status).toBe(401)
  })

  it("POST /activities without a tenant key → 401 (before parsing data)", async () => {
    const res = await request(app).post("/activities").field("data", "not json")
    expect(res.status).toBe(401)
  })

  it("POST /activities without a tenant key → 401", async () => {
    const res = await request(app)
      .post("/activities")
      .field("data", JSON.stringify({ user_id: 1, duration: 30, date: "2026-01-01" }))
    expect(res.status).toBe(401)
  })
})

describe("request validation", () => {
  it("POST /tenants without a username → 400", async () => {
    const res = await request(app).post("/tenants").send({})
    expect(res.status).toBe(400)
  })

  it("POST /tenants without a tenantName → 400", async () => {
    const res = await request(app).post("/tenants").send({ username: "kate" })
    expect(res.status).toBe(400)
  })

  it("POST /tenants/join with an invalid tenant_id → 404", async () => {
    const res = await request(app).post("/tenants/join").send({ tenant_id: "abc" })
    expect(res.status).toBe(404)
  })

  it("POST /tenants/join without a key → 400", async () => {
    const res = await request(app).post("/tenants/join").send({})
    expect(res.status).toBe(400)
  })

  it("PUT /tenants/password without a tenant key → 401", async () => {
    const res = await request(app).put("/tenants/password").send({ password: "NEWPASS" })
    expect(res.status).toBe(401)
  })

  it("PUT /tenants/visibility without a tenant key → 401", async () => {
    const res = await request(app).put("/tenants/visibility").send({ is_public: false })
    expect(res.status).toBe(401)
  })

  it("GET /tenants/me without a tenant key → 401", async () => {
    const res = await request(app).get("/tenants/me")
    expect(res.status).toBe(401)
  })
})
