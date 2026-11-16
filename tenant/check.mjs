// JOBS-TENANT-1: every binding in worker/wrangler.toml must have a tenant plan in tenant.json, and every table the worker touches must be listed.
import fs from "node:fs";
const t = JSON.parse(fs.readFileSync(new URL("./tenant.json", import.meta.url)));
const toml = fs.readFileSync(new URL("../worker/wrangler.toml", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("../worker/worker.js", import.meta.url), "utf8");
const bound = [...toml.matchAll(/^binding\s*=\s*"([A-Z_]+)"/gm)].map(m => m[1]);
const bad = [];
for (const b of bound) if (!t.bindings[b]) bad.push("binding without tenant plan: " + b);
const used = new Set([...js.matchAll(/(?:from|into|update|join)\s+(jobsearch_[a-z_]+)\b/gi)].map(m => m[1].toLowerCase()));
for (const x of used) if (!t.tables.includes(x)) bad.push("table not in tenant.json: " + x);
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`ok: ${bound.length} bindings, ${used.size} tables accounted for`);
