# Home server deployment (Proxmox)

Running live at **http://192.168.1.58/** — an LXC container (VMID 108,
named `kids-kiosk`) on the Proxmox host at `192.168.1.174`, alongside
`family-dashboard` (103), `work-copilot` (104), `aitrader` (105),
`tools-hub` (106) and `cablegrid` (107). This is the only deployment target
for Phase 2 — the backend needs a real, persistent Postgres database and a
server that keeps running to serve the dashboard and (eventually) the
nightly sync cron, which a serverless platform like Vercel doesn't fit as
naturally as the self-hosted containers the rest of this Proxmox host
already uses.

## What's set up

- **Container**: Ubuntu 25.04, 2 cores, 2GB RAM, 512MB swap, 10GB disk,
  DHCP networking — same spec as `aitrader`/`cablegrid`. `onboot: 1`.
- **Runtime**: Node.js 22.23.2 (NodeSource), PostgreSQL 17 (Ubuntu's own
  package, not Docker — matches the local dev substitution documented in
  the Phase 2 plan).
- **Database**: role/database both named `kids_kiosk`, password in
  `/opt/kids-kiosk/.env.local` on the container (not in this repo). Schema
  applied via `npm run db:migrate`; the actual data (parent login +
  everything approved) was migrated once from local dev via `pg_dump
  --data-only --schema=public` / `psql -f`, **not** by re-running
  `scripts/seed.ts` on the server — the seed script only replays the
  original hardcoded list from `lib/approved-videos.ts` and would have
  missed anything added since through the dashboard. Re-run the seed
  script directly only for a genuinely fresh, empty database.
- **App**: `/opt/kids-kiosk` — a plain copy of this repo (not a git clone,
  no deploy credentials on the container), `node_modules` installed
  directly on the container.
- **Build**: plain `npm run build` (`next build`) — this project has no
  Workers-targeted build variant to avoid, unlike `cablegrid-uk`.
  `npm run start -- -H 0.0.0.0 -p 80` binds to the bare IP on port 80, like
  every other container here.
- **Service**: `systemd` unit at `/etc/systemd/system/kids-kiosk.service`,
  `Restart=always`.
- **Auth**: `auth.ts` sets `trustHost: true` — Auth.js otherwise rejects
  requests whose `Host` header isn't a platform it recognizes (Vercel,
  etc.), which is exactly what a bare-IP/self-hosted deployment looks like.
  Without this, every request to `/api/auth/*` 500s with `UntrustedHost`
  (caught during first deploy — see the git history around this file for
  the exact symptom if it ever regresses).
- **Nightly sync**: root's crontab on the container, `0 3 * * *` hitting
  `http://localhost/api/cron/sync` with the `x-cron-secret` header (value
  in `.env.local`, same file as everything else). Logs to
  `/var/log/kids-kiosk-sync.log`.

## Updating

Same tar/scp/`pct push`/`pct exec` pattern as `cablegrid`:

```bash
cd kids-kiosk
tar czf /tmp/kids_kiosk_deploy.tar.gz \
  --exclude='node_modules' --exclude='.next' --exclude='.git' \
  --exclude='.env.local' --exclude='*.tsbuildinfo' --exclude='.vercel' .
scp -i ~/.ssh/proxmox_family_dashboard /tmp/kids_kiosk_deploy.tar.gz root@192.168.1.174:/tmp/
ssh -i ~/.ssh/proxmox_family_dashboard root@192.168.1.174 "
  pct push 108 /tmp/kids_kiosk_deploy.tar.gz /tmp/kids_kiosk_deploy.tar.gz &&
  pct exec 108 -- tar xzf /tmp/kids_kiosk_deploy.tar.gz -C /opt/kids-kiosk &&
  pct exec 108 -- bash -c 'cd /opt/kids-kiosk && npm install && npm run build' &&
  pct exec 108 -- systemctl restart kids-kiosk
"
```

`--exclude='.env.local'` is deliberate — never overwrite the server's real
secrets/DB URL with the local dev file. If the schema changes, run
`pct exec 108 -- bash -c 'cd /opt/kids-kiosk && npm run db:migrate'` after
the build step. Skip `npm install` for a faster restart if dependencies
didn't change.

## Operating it

```bash
# Container-level (from the Proxmox host)
ssh -i ~/.ssh/proxmox_family_dashboard root@192.168.1.174
pct enter 108           # shell inside the container
pct stop 108 / start 108

# Service-level (from inside the container, e.g. via `pct exec 108 -- ...`)
systemctl status kids-kiosk
systemctl restart kids-kiosk
journalctl -u kids-kiosk -f     # tail logs

# Database (from inside the container)
PGPASSWORD=<see .env.local> psql -h localhost -U kids_kiosk -d kids_kiosk
```

## Known gaps vs. a "real" production setup

- **No HTTPS, no public hostname** — plain HTTP on the LAN only, same as
  every other container here. A Cloudflare tunnel (like `cablegrid` and
  `tools-hub` have) hasn't been set up for this one — deliberately not
  done yet, since `/watch` and `/tv` have no login at all by design (a kid
  just presses play), so making them internet-reachable is a real,
  separate decision from just "get it hosted," not an oversight.
- **No firewall rule reviewed** — reachable from anywhere on the LAN.
- **No backup of the database** — worth a cron'd `pg_dump` somewhere if
  the approved-content list becomes something you'd mind losing (the
  underlying YouTube data can always be re-synced, but a parent's curation
  choices — what's approved, what folder, auto-approve settings — can't).
- **Single instance, no monitoring/alerting** beyond systemd's own restart
  behaviour.

None of that blocks "is this a real, usable app that a parent can add
content to without David editing code" — that's verified working end to
end (login, add a source, sync, approve, live on `/watch` and `/tv`,
nightly cron) — just flagging what's not done, same spirit as `cablegrid`'s
own notes.
