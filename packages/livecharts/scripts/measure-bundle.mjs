import {
  createReadStream,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
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
    file: "index.js",
    import: "livecharts",
    note: "Engine + theme helpers",
  },
  {
    file: "react/index.js",
    import: "livecharts/react",
    note: "React binding (engine inlined; react is peer)",
  },
  {
    file: "vue/index.js",
    import: "livecharts/vue",
    note: "Vue binding (engine inlined; vue is peer)",
  },
  {
    file: "data/index.js",
    import: "livecharts/data",
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
    bytes,
    gzip: formatKb(gzip),
    gzipBytes: gzip,
    import: entry.import,
    min: formatKb(bytes),
    note: entry.note,
  });
}

const payload = {
  entries: rows,
  measuredAt,
  method: "ESM dist, gzip -9; framework peers not included",
  package: "livecharts",
  version: pkg.version,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`Wrote ${outPath}`);
for (const row of rows) {
  console.log(
    `  ${row.import.padEnd(18)} ${row.min.padStart(8)} → ${row.gzip} gzip`
  );
}
