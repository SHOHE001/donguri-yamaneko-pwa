import test from "node:test";
import assert from "node:assert/strict";
import { clamp, normalisePreferences, readingPercentage } from "../reader-utils.js";

test("clamp keeps values inside the requested interval", () => {
  assert.equal(clamp(8, 10, 20), 10);
  assert.equal(clamp(14, 10, 20), 14);
  assert.equal(clamp(24, 10, 20), 20);
});

test("normalisePreferences rejects unknown themes and unsafe ranges", () => {
  assert.deepEqual(normalisePreferences({ theme: "neon", fontSize: 99, lineHeight: 0.2, vertical: 1, ruby: false, progress: 4 }), {
    theme: "paper", fontSize: 28, lineHeight: 1.6, vertical: true, ruby: false, progress: 1,
  });
});

test("readingPercentage handles empty and overflowing ranges", () => {
  assert.equal(readingPercentage(10, 0), 0);
  assert.equal(readingPercentage(25, 100), 0.25);
  assert.equal(readingPercentage(130, 100), 1);
});

