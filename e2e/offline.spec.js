import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("offline reload keeps the story and leaves other apps' caches intact", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await caches.open("unrelated-pwa-v1");
    await caches.open("donguri-yamaneko-v1");
    await registration.unregister();
  });
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => caches.keys())).toContain("unrelated-pwa-v1");
  await expect.poll(() => page.evaluate(() => caches.keys())).not.toContain("donguri-yamaneko-v1");
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.goto("/?from=home");
  await expect(page.locator("#storyText")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#storyText")).toContainText("山ねこ");
  await expect(page.locator(".load-error")).toHaveCount(0);
  expect(await page.evaluate(() => caches.keys())).toContain("unrelated-pwa-v1");
});
