import { createReadStream, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const outPath = join(
  root,
  "..",
  "..",
  "apps",
  "docs",
  "src",
  "data",
  "bundle-sizes.json"
);

const entries = [
  {
    import: "livecharts",
    file: "index.js",
    note: "Engine + theme helpers",
  },
  {
    import: "livecharts/react",
    file: "react/index.js",
    note: "React binding (engine inlined; react is peer)",
  },
  {
    import: "livecharts/vue",
    file: "vue/index.js",
    note: "Vue binding (engine inlined; vue is peer)",
  },
  {
    import: "livecharts/data",
    file: "data/index.js",
    note: "Helpers only — no canvas engine",
  },
];

async function gzipBytes(filePath) {
  let total = 0;
  const counter = new Writable({
    write(chunk, _enc, cb) {
      total += chunk.length;
      cb();
    },
  });
  await pipeline(createReadStream(filePath), createGzip({ level: 9 }), counter);
  return total;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(bytes >= 10_240 ? 0 : 1)} KB`;
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const measuredAt = new Date().toISOString();
const rows = [];

for (const entry of entries) {
  const filePath = join(dist, entry.file);
  const bytes = statSync(filePath).size;
  const gzip = await gzipBytes(filePath);
  rows.push({
    import: entry.import,
    note: entry.note,
    bytes,
    gzipBytes: gzip,
    min: formatKb(bytes),
    gzip: formatKb(gzip),
  });
}

const payload = {
  package: "livecharts",
  version: pkg.version,
  measuredAt,
  method: "ESM dist, gzip -9; framework peers not included",
  entries: rows,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`Wrote ${outPath}`);
for (const row of rows) {
  console.log(
    `  ${row.import.padEnd(18)} ${row.min.padStart(8)} → ${row.gzip} gzip`
  );
}
