import { test, expect } from "@playwright/test";

const storageKey = "donguri-yamaneko:reader:v1";

async function ready(page) {
  await expect(page.locator("#storyText")).toHaveAttribute("aria-busy", "false");
  await page.evaluate(() => new Promise(requestAnimationFrame));
}

test("changing writing direction keeps the reading position and text visible", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.evaluate(() => {
    const story = document.querySelector("#storyText");
    window.scrollTo({
      top: story.getBoundingClientRect().top + window.scrollY + (story.offsetHeight - innerHeight * 0.75) / 2,
      behavior: "instant",
    });
  });
  await expect(page.locator("#progressLabel")).toHaveText("50% 読了");
  await page.locator("#settingsButton").click();
  await page.locator("label:has(#verticalWriting) span").click();
  await expect(page.locator("#storyText")).toHaveClass(/is-vertical/);
  await expect(page.locator("#progressLabel")).toHaveText("50% 読了");
  await page.locator(".close-button").click();
  await expect(page.locator("#storyText")).toBeInViewport();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key))?.vertical, storageKey);
  await page.reload();
  await ready(page);
  await expect(page.locator("#progressLabel")).toHaveText("50% 読了");
  await expect(page.locator("#storyText")).toBeInViewport();
  await page.locator("#settingsButton").click();
  await page.locator("label:has(#verticalWriting) span").click();
  await expect(page.locator("#progressLabel")).toHaveText("50% 読了");
  await page.locator(".close-button").click();
  await page.reload();
  await ready(page);
  await expect(page.locator("#progressLabel")).toHaveText("50% 読了");
});

test("scrolling while the story loads does not overwrite saved progress", async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ progress: 0.6 }));
  }, storageKey);
  let release;
  const delayed = new Promise((resolve) => { release = resolve; });
  await page.route("**/content/donguri-yamaneko.html", async (route) => {
    await delayed;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  await page.waitForTimeout(200);
  const beforeLoad = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).progress, storageKey);
  release();
  expect(beforeLoad).toBe(0.6);
  await ready(page);
  await expect(page.locator("#progressLabel")).toHaveText("60% 読了");
});

test("unavailable storage does not prevent resetting and changing settings", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Storage unavailable", "QuotaExceededError"); };
  });
  await page.goto("/");
  await ready(page);
  await page.locator("#settingsButton").click();
  await page.locator("#resetProgress").click();
  await expect(page.locator("#settingsDialog")).not.toBeVisible();
  await page.locator("#settingsButton").click();
  await page.locator('label:has(input[value="night"]) span').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await page.waitForTimeout(200);
  expect(errors).toEqual([]);
});

test("pagehide flushes a pending preference save", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const stored = await page.evaluate((key) => {
    const input = document.querySelector("#fontSize");
    input.value = "24";
    input.dispatchEvent(new Event("input"));
    window.dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem(key));
  }, storageKey);
  expect(stored.fontSize).toBe(24);
});

test("install is hidden until the browser offers installation", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await expect(page.locator("#installButton")).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt")));
  await expect(page.locator("#installButton")).toBeVisible();
});
