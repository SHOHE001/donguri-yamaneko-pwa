export const DEFAULT_PREFERENCES = Object.freeze({
  theme: "paper",
  fontSize: 18,
  lineHeight: 1.9,
  vertical: false,
  ruby: true,
  progress: 0,
});

export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

export function normalisePreferences(candidate = {}) {
  const themes = new Set(["paper", "sepia", "night"]);
  return {
    theme: themes.has(candidate.theme) ? candidate.theme : DEFAULT_PREFERENCES.theme,
    fontSize: clamp(candidate.fontSize ?? DEFAULT_PREFERENCES.fontSize, 15, 28),
    lineHeight: clamp(candidate.lineHeight ?? DEFAULT_PREFERENCES.lineHeight, 1.6, 2.4),
    vertical: Boolean(candidate.vertical),
    ruby: candidate.ruby !== false,
    progress: clamp(candidate.progress ?? 0, 0, 1),
  };
}

export function readingPercentage(position, extent) {
  if (!Number.isFinite(extent) || extent <= 0) return 0;
  return clamp(position / extent, 0, 1);
}

