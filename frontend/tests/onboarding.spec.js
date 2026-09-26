import { test, expect } from "@playwright/test"

// The challenge app is gated behind a group's shared password. With none stored
// the app resolves to "unauthenticated" and the onboarding screen renders — so
// this is a stable target for a first visual snapshot (no backend required).
test("onboarding screen renders for a new visitor", async ({ page }) => {
  // The join step lists every group; stub it so the snapshot doesn't depend on DB data.
  await page.route("**/tenants", (route) =>
    route.fulfill({ json: [{ id: 1, name: "541kate" }, { id: 2, name: "Runners" }] })
  )
  await page.goto("/challenges")
  await expect(page.getByRole("button", { name: "Join a group" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Runners" })).toBeVisible()
  await expect(page).toHaveScreenshot("onboarding.png", { fullPage: true })
})
