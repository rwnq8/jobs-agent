// JOBS-TENANT-1 M2: idempotent copy of the jobsearch_* tables from qnfo-audit to tenant-jobs-db.
// Run as the body of an async function in the Cloudflare API code runner (cloudflare.request). Skips jobsearch_codes and jobsearch_sessions (sign-in secrets; the tenant issues its own).
// INSERT OR REPLACE makes a re-run safe after a partial run. Blocked 2026-11-16: the ultrastable account hit the D1 free-tier daily row limit (HTTP 400, code 7500).
async () => {
  const SRC = {acct:"edb167b78c9fb901ea5bca3ce58ccc4b", db:"35e2e573-92f3-46ac-83c6-22f6429fc5e5"};
  const DST = {acct:"81e3a4efb4eb66e613529b87682911bb", db:"47b839be-eb64-445b-9b3b-dff6d6caab3d"};
  const q = async (t, sql, params=[]) => {
    const r = await cloudflare.request({method:"POST", path:`/accounts/${t.acct}/d1/database/${t.db}/query`, body:{sql, params}});
    if(!r.success) throw new Error(JSON.stringify(r.errors));
    return r.result[0].results;
  };
  const tables = ["runs","matches","feeds","meta","events","prefs","feedback","bank","bank_history","history","calib","apps","auto"].map(x=>"jobsearch_"+x);
  const out = {};
  for (const t of tables) {
    const rows = []; let off = 0;
    for(;;){ const p = await q(SRC, `select * from ${t} order by rowid limit 100 offset ${off}`); if(!p.length) break; rows.push(...p); off += p.length; }
    for (let i=0;i<rows.length;i+=10) await Promise.all(rows.slice(i,i+10).map(r=>{ const c=Object.keys(r); return q(DST, `insert or replace into ${t} (${c.join(",")}) values (${c.map(()=>"?").join(",")})`, c.map(k=>r[k])); }));
    out[t] = {src: rows.length, dst: (await q(DST, `select count(*) n from ${t}`))[0].n};
  }
  return JSON.stringify(out);
}
