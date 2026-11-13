# jobs-agent

Rowan's autonomous job-search agent. It finds postings from public ATS feeds and forwarded LinkedIn alerts, scores them against a verified record of Rowan's experience, tailors a resume from that record, and (gated) applies. It runs on Cloudflare under the Qniverse and is tied to the Me companion (me.q08.org) and the Ultra Stable platform.

- `worker/` is the Cloudflare Worker (`qnfo-jobsearch`, served at jobs.q08.org). History was split out of QNFO/qnfo-workers with `git commit-tree`, so `git log` shows the original commits; each message ends with the source SHA.
- `prototype/` is the original Python pipeline and claim ledger.
- `migrations/` holds the D1 migrations (database `qnfo-audit`).
- Roadmap and work items live in GitHub issues (label `roadmap`).

Deploy: until the sync in issue "Deploy sync from this repo" lands, QNFO/qnfo-workers `qnfo-jobsearch/` is the deploy source; change both together.

Rules that bind this repo: never fabricate a resume claim (every line traces to the ledger); never scrape logged-in LinkedIn pages; the first live submission on Rowan's behalf is confirmed with Rowan, after that the autopilot gates apply; interview and offer mail is surfaced to Rowan at once.
