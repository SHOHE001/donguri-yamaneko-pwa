import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html", "styles.css", "app.js", "reader-utils.js", "manifest.webmanifest", "sw.js",
  "content/donguri-yamaneko.html", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
];

await Promise.all(requiredFiles.map((file) => access(file)));
const manifest = JSON.parse(await readFile("manifest.webmanifest", "utf8"));
if (manifest.display !== "standalone" || manifest.lang !== "ja") throw new Error("Manifest must describe a standalone Japanese PWA.");

const index = await readFile("index.html", "utf8");
for (const reference of ["manifest.webmanifest", "styles.css", "app.js"]) {
  if (!index.includes(reference)) throw new Error(`index.html does not reference ${reference}`);
}

const story = await readFile("content/donguri-yamaneko.html", "utf8");
if (story.length < 9000 || !story.includes("<ruby>") || !story.includes("山ねこ　拝")) throw new Error("The Aozora Bunko story text appears incomplete.");

const worker = await readFile("sw.js", "utf8");
for (const file of requiredFiles.filter((file) => file !== "sw.js")) {
  if (!worker.includes(file)) throw new Error(`Service worker does not precache ${file}`);
}

console.log(`Static checks passed (${requiredFiles.length} required files).`);

