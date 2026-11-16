// JOBS-TENANT-1 M2: idempotent server-side copy of jobsearch_* from qnfo-audit to tenant-jobs-db, then a count check.
// Needs CLOUDFLARE_API_TOKEN (D1 edit on both accounts). Exit 0 only when every table's source and destination counts match.
// Skips jobsearch_codes and jobsearch_sessions (sign-in secrets; the tenant issues its own). INSERT OR REPLACE makes any rerun safe.
const T = process.env.CLOUDFLARE_API_TOKEN;
if (!T) { console.error("CLOUDFLARE_API_TOKEN not set"); process.exit(2); }
const SRC = { acct: "edb167b78c9fb901ea5bca3ce58ccc4b", db: "35e2e573-92f3-46ac-83c6-22f6429fc5e5" };
const DST = { acct: "81e3a4efb4eb66e613529b87682911bb", db: "47b839be-eb64-445b-9b3b-dff6d6caab3d" };
const q = async (t, sql, params = []) => {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${t.acct}/d1/database/${t.db}/query`, {
    method: "POST", headers: { authorization: "Bearer " + T, "content-type": "application/json" }, body: JSON.stringify({ sql, params }) });
  const j = await r.json();
  if (!j.success) throw new Error(JSON.stringify(j.errors));
  return j.result[0].results;
};
const tables = ["runs","matches","feeds","meta","events","prefs","feedback","bank","bank_history","history","calib","apps","auto"].map(x => "jobsearch_" + x);
let bad = 0;
for (const t of tables) {
  const n = async d => (await q(d, `select count(*) n from ${t}`))[0].n;
  if (await n(SRC) !== await n(DST)) {
    const rows = []; for (let off = 0; ; off += 100) { const p = await q(SRC, `select * from ${t} order by rowid limit 100 offset ${off}`); if (!p.length) break; rows.push(...p); }
    for (let i = 0; i < rows.length; i += 10) await Promise.all(rows.slice(i, i + 10).map(r => { const c = Object.keys(r); return q(DST, `insert or replace into ${t} (${c.join(",")}) values (${c.map(() => "?").join(",")})`, c.map(k => r[k])); }));
  }
  const [s, d] = [await n(SRC), await n(DST)];
  console.log(t, s, d, s === d ? "ok" : "MISMATCH"); if (s !== d) bad++;
}
process.exit(bad ? 1 : 0);
