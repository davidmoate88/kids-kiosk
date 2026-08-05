#!/bin/bash
# Nightly Postgres backup for kids-kiosk. Run via cron on the deployment
# container (no backup convention existed anywhere in the homelab before
# this — see docs/DEPLOY_HOME_SERVER.md).
#
# Install (from the container, once deployed):
#   0 4 * * * /opt/kids-kiosk/scripts/backup-db.sh >> /var/log/kids-kiosk-backup.log 2>&1
#
# Reads DATABASE_URL from .env.local rather than requiring it to already be
# in the cron environment — cron runs with a minimal environment, and
# .env.local is exactly where this project already keeps that value
# (matches every other secret in this project's convention).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

set -a
# shellcheck disable=SC1091
source .env.local
set +a

BACKUP_DIR="${KIDS_KIOSK_BACKUP_DIR:-/var/backups/kids-kiosk}"
RETENTION_DAYS=30
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DUMP_FILE="$BACKUP_DIR/kids_kiosk_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" > "$DUMP_FILE"
echo "$(date -Iseconds) backed up to $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"

# Retention: delete dumps older than RETENTION_DAYS rather than growing
# unbounded — the database itself is small, but no reason not to rotate.
find "$BACKUP_DIR" -name 'kids_kiosk_*.sql' -mtime "+$RETENTION_DAYS" -delete
