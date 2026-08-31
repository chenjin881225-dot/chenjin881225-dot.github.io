import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = resolve(import.meta.dirname, "..");
const clientRoot = join(projectRoot, "dist", "client");
const outputRoot = resolve(process.argv[2] ?? join(projectRoot, "outputs", "edgeone-static"));
const maxFileBytes = 25 * 1024 * 1024;
const maxFileCount = 20_000;

const unusedAssets = new Set([
  "intro-cover-lit-compact-fixed.png",
  "intro-cover-lit-compact.png",
  "intro-cover-default-final-v2.png",
  "intro-cover-default-compact-fixed.png",
  "intro-portrait-hq.png",
  "og-compact.png",
  "intro-cover-default-compact.png",
  "intro-portrait-clean-v3.png",
  "og-intro.png",
  "intro-portrait-v2.png",
  "og.png",
  "intro-cover-lit-hq.jpg",
  "intro-cover-default-hq.jpg",
  "intro-cover.jpg",
]);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(dirname(outputRoot), { recursive: true });
await cp(clientRoot, outputRoot, {
  recursive: true,
  filter: (source) => !unusedAssets.has(basename(source)),
});

const workerUrl = pathToFileURL(join(projectRoot, "dist", "server", "index.js"));
workerUrl.searchParams.set("edgeone-export", `${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("https://edgeone-static.local/", { headers: { accept: "text/html" } }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

if (!response.ok) {
  throw new Error(`Unable to render index.html: HTTP ${response.status}`);
}

const renderedHtml = await response.text();
const inlineScriptPattern = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
const inlineScripts = [];
let match;
while ((match = inlineScriptPattern.exec(renderedHtml)) !== null) {
  const source = match[1].trim();
  if (source) inlineScripts.push(source);
}

if (!inlineScripts.length) {
  throw new Error("No inline client bootstrap scripts were found in the rendered HTML");
}

const startupImports = [];
const bootstrapStatements = [];
for (const source of inlineScripts) {
  if (/^import\([\s\S]*\);?$/.test(source)) startupImports.push(source);
  else bootstrapStatements.push(source);
}

if (!startupImports.length) {
  throw new Error("The Vinext client startup import was not found");
}

// EdgeOne serves the app more reliably when the complete Vinext bootstrap is a
// same-origin module instead of a chain of inline scripts. Keep the RSC payload
// initialization ahead of the runtime import so hydration sees all page data.
const bootstrapSource = [
  ...bootstrapStatements,
  ...startupImports.map((source) => `await ${source.replace(/;$/, "")};`),
  "",
].join("\n");
const bootstrapRelativePath = "edgeone-bootstrap.js";
await writeFile(join(outputRoot, bootstrapRelativePath), bootstrapSource, "utf8");

const externalBootstrapTag = '<script type="module" src="/edgeone-bootstrap.js"></script>';
const htmlWithoutInlineScripts = renderedHtml.replace(inlineScriptPattern, "");
const html = htmlWithoutInlineScripts.includes("</body>")
  ? htmlWithoutInlineScripts.replace("</body>", `${externalBootstrapTag}</body>`)
  : `${htmlWithoutInlineScripts}${externalBootstrapTag}`;
await writeFile(join(outputRoot, "index.html"), html, "utf8");

await rm(join(outputRoot, "_headers"), { force: true });
await writeFile(
  join(outputRoot, "edgeone.json"),
  `${JSON.stringify({
    headers: [
      {
        source: "/index.html",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/edgeone-bootstrap.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/assets/*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ],
  }, null, 2)}\n`,
  "utf8",
);

const { readdir, stat } = await import("node:fs/promises");
const files = [];
const walk = async (folder) => {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const absolute = join(folder, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else files.push(absolute);
  }
};
await walk(outputRoot);

if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) {
  throw new Error("Inline scripts remain in index.html");
}
if (!html.includes(externalBootstrapTag)) {
  throw new Error("External EdgeOne bootstrap tag is missing from index.html");
}

const referencedPaths = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)]
  .map((reference) => reference[1])
  .filter((pathname) => (
    pathname.startsWith("/assets/")
    || /\.[a-z0-9]+(?:\?|$)/i.test(pathname)
  ));
const missingReferences = [];
for (const pathname of referencedPaths) {
  const cleanPathname = pathname.split("?")[0];
  const diskPath = join(outputRoot, ...cleanPathname.split("/").filter(Boolean));
  try {
    await readFile(diskPath);
  } catch {
    missingReferences.push(pathname);
  }
}
if (missingReferences.length) {
  throw new Error(`Missing files referenced by index.html: ${missingReferences.join(", ")}`);
}

const oversized = [];
let totalBytes = 0;
for (const file of files) {
  const size = (await stat(file)).size;
  totalBytes += size;
  if (size > maxFileBytes) oversized.push({ file, size });
}

if (files.length > maxFileCount) {
  throw new Error(`EdgeOne file limit exceeded: ${files.length}/${maxFileCount}`);
}
if (oversized.length) {
  throw new Error(`EdgeOne 25 MiB limit exceeded: ${JSON.stringify(oversized)}`);
}

console.log(JSON.stringify({
  outputRoot,
  fileCount: files.length,
  totalBytes,
  indexBytes: Buffer.byteLength(html),
  inlineScriptsMoved: inlineScripts.length,
  referencedFilesChecked: referencedPaths.length,
  oversizedFiles: oversized.length,
}, null, 2));
