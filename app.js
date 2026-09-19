import { DEFAULT_PREFERENCES, normalisePreferences, readingPercentage } from "./reader-utils.js";

const STORAGE_KEY = "donguri-yamaneko:reader:v1";
const root = document.documentElement;
const story = document.querySelector("#storyText");
const progressBar = document.querySelector("#progressBar");
const progressLabel = document.querySelector("#progressLabel");
const dialog = document.querySelector("#settingsDialog");
const fontSize = document.querySelector("#fontSize");
const lineHeight = document.querySelector("#lineHeight");
const verticalWriting = document.querySelector("#verticalWriting");
const showRuby = document.querySelector("#showRuby");
const toast = document.querySelector("#toast");

let preferences = loadPreferences();
let deferredInstallPrompt;
let saveTimer;
let toastTimer;

function loadPreferences() {
  try {
    return normalisePreferences(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(savePreferences, 150);
}

function setThemeColour(theme) {
  const colours = { paper: "#173d2a", sepia: "#5b3d22", night: "#101c18" };
  document.querySelector('meta[name="theme-color"]').content = colours[theme];
}

function applyPreferences({ preservePosition = true } = {}) {
  const currentProgress = preservePosition ? getProgress() : preferences.progress;
  root.dataset.theme = preferences.theme;
  root.style.setProperty("--reader-size", `${preferences.fontSize}px`);
  root.style.setProperty("--reader-leading", preferences.lineHeight);
  story.classList.toggle("is-vertical", preferences.vertical);
  story.classList.toggle("hide-ruby", !preferences.ruby);
  setThemeColour(preferences.theme);

  document.querySelector(`input[name="theme"][value="${preferences.theme}"]`).checked = true;
  fontSize.value = preferences.fontSize;
  lineHeight.value = preferences.lineHeight;
  verticalWriting.checked = preferences.vertical;
  showRuby.checked = preferences.ruby;
  document.querySelector("#fontSizeValue").value = `${preferences.fontSize}px`;
  document.querySelector("#lineHeightValue").value = preferences.lineHeight.toFixed(1);

  requestAnimationFrame(() => restoreProgress(currentProgress));
}

function verticalExtent() {
  return Math.max(0, story.scrollWidth - story.clientWidth);
}

function pageExtent() {
  return Math.max(0, story.offsetHeight - window.innerHeight * 0.75);
}

function getProgress() {
  if (preferences.vertical) {
    return readingPercentage(Math.abs(story.scrollLeft), verticalExtent());
  }
  const storyTop = story.getBoundingClientRect().top + window.scrollY;
  return readingPercentage(Math.max(0, window.scrollY - storyTop), pageExtent());
}

function restoreProgress(progress) {
  const safeProgress = Math.max(0, Math.min(1, progress || 0));
  if (preferences.vertical) {
    story.scrollLeft = -verticalExtent() * safeProgress;
  } else if (safeProgress > 0) {
    const storyTop = story.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: storyTop + pageExtent() * safeProgress, behavior: "instant" });
  }
  updateProgress(safeProgress);
}

function updateProgress(progress = getProgress()) {
  const rounded = Math.round(progress * 100);
  progressBar.style.transform = `scaleX(${progress})`;
  progressLabel.textContent = `${rounded}% 読了`;
  preferences.progress = progress;
  queueSave();
}

function announce(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

async function loadStory() {
  try {
    const response = await fetch("content/donguri-yamaneko.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    story.innerHTML = await response.text();
    story.setAttribute("aria-busy", "false");
    applyPreferences({ preservePosition: false });
  } catch {
    story.innerHTML = '<p class="load-error">本文を読み込めませんでした。通信を確認して、もう一度開いてください。</p>';
    story.setAttribute("aria-busy", "false");
  }
}

document.querySelector("#settingsButton").addEventListener("click", () => dialog.showModal());

document.querySelector("#themeControl").addEventListener("change", (event) => {
  preferences.theme = event.target.value;
  applyPreferences();
});

fontSize.addEventListener("input", () => {
  preferences.fontSize = Number(fontSize.value);
  applyPreferences();
});

lineHeight.addEventListener("input", () => {
  preferences.lineHeight = Number(lineHeight.value);
  applyPreferences();
});

verticalWriting.addEventListener("change", () => {
  preferences.vertical = verticalWriting.checked;
  applyPreferences();
  announce(preferences.vertical ? "縦書きに切り替えました" : "横書きに切り替えました");
});

showRuby.addEventListener("change", () => {
  preferences.ruby = showRuby.checked;
  applyPreferences();
});

document.querySelector("#resetProgress").addEventListener("click", () => {
  preferences.progress = 0;
  savePreferences();
  restoreProgress(0);
  dialog.close();
  document.querySelector("#story").scrollIntoView({ behavior: "smooth" });
  announce("読書位置を最初に戻しました");
});

window.addEventListener("scroll", () => {
  if (!preferences.vertical) updateProgress();
}, { passive: true });

story.addEventListener("scroll", () => {
  if (preferences.vertical) updateProgress();
}, { passive: true });

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector("#installButton").hidden = false;
});

document.querySelector("#installButton").addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice.outcome === "accepted") announce("ホーム画面に追加しました");
  deferredInstallPrompt = undefined;
  document.querySelector("#installButton").hidden = true;
});

window.addEventListener("appinstalled", () => announce("ホーム画面から読めるようになりました"));
window.addEventListener("offline", () => announce("オフラインです。保存済みの本文を読めます"));
window.addEventListener("online", () => announce("オンラインに戻りました"));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}

loadStory();
