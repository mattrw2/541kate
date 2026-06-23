import { describe, it, expect } from "vitest"
import { paramize } from "../src/paramize.js"

describe("paramize", () => {
  it("converts ? placeholders to $1, $2, …", () => {
    expect(paramize("SELECT * FROM users WHERE id = ? AND name = ?")).toBe(
      "SELECT * FROM users WHERE id = $1 AND name = $2"
    )
  })

  it("numbers placeholders left to right", () => {
    expect(paramize("? ? ? ?")).toBe("$1 $2 $3 $4")
  })

  it("leaves queries without placeholders unchanged", () => {
    expect(paramize("SELECT 1")).toBe("SELECT 1")
  })
})
