import { test, expect } from "@playwright/test"

// The challenge app is gated behind a trusted device. With no device cookie the
// session resolves to "unauthenticated" and the onboarding screen renders — so
// this is a stable target for a first visual snapshot (no backend required).
test("onboarding screen renders for a new visitor", async ({ page }) => {
  await page.goto("/challenges")
  await expect(page.getByRole("button", { name: "Sign up" })).toBeVisible()
  await expect(page).toHaveScreenshot("onboarding.png", { fullPage: true })
})
