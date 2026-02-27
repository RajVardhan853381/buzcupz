#!/bin/bash

# =============================================================================
# CAFEelevate - Database Restore Script
# =============================================================================
# This script restores a PostgreSQL database from a backup file.
# WARNING: This will DROP the existing database and recreate it!
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Usage function
usage() {
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Examples:"
    echo "  $0 backups/latest.sql.gz"
    echo "  $0 backups/daily/backup_20260126.sql.gz"
    echo "  $0 backups/cafeelevate_20260126_140530.sql.gz"
    exit 1
}

# Check if backup file argument is provided
if [ $# -ne 1 ]; then
    usage
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if required environment variables are set
if [ -z "${PGHOST:-}" ]; then
    error "PGHOST environment variable not set"
    exit 1
fi

if [ -z "${PGDATABASE:-}" ]; then
    error "PGDATABASE environment variable not set"
    exit 1
fi

if [ -z "${PGUSER:-}" ]; then
    error "PGUSER environment variable not set"
    exit 1
fi

# Warning and confirmation
warn "⚠️  WARNING: This will DROP and RECREATE the database: ${PGDATABASE}"
warn "⚠️  All current data will be LOST!"
echo ""
read -p "Are you sure you want to continue? (type 'YES' to confirm): " -r
echo ""

if [ "$REPLY" != "YES" ]; then
    log "Restore cancelled."
    exit 0
fi

log "Starting database restore from: $BACKUP_FILE"

# Get backup file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup file size: $BACKUP_SIZE"

# Test if backup file is valid
log "Validating backup file..."
if ! gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    error "Backup file appears to be corrupted"
    exit 1
fi

# Terminate all connections to the database
log "Terminating all connections to database: ${PGDATABASE}"
psql -h "$PGHOST" -U "$PGUSER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${PGDATABASE}' AND pid <> pg_backend_pid();" || true

# Drop and recreate database
log "Dropping database: ${PGDATABASE}"
dropdb -h "$PGHOST" -U "$PGUSER" --if-exists "${PGDATABASE}" || {
    error "Failed to drop database"
    exit 1
}

log "Creating database: ${PGDATABASE}"
createdb -h "$PGHOST" -U "$PGUSER" "${PGDATABASE}" || {
    error "Failed to create database"
    exit 1
}

# Restore the backup
log "Restoring backup..."
if gunzip -c "$BACKUP_FILE" | psql -h "$PGHOST" -U "$PGUSER" -d "${PGDATABASE}" > /dev/null; then
    log "Backup restored successfully"
else
    error "Restore failed"
    exit 1
fi

# Verify restoration
log "Verifying restoration..."
TABLE_COUNT=$(psql -h "$PGHOST" -U "$PGUSER" -d "${PGDATABASE}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
log "Restored ${TABLE_COUNT} tables"

# Run database migrations to ensure schema is up to date
log "Running database migrations..."
if command -v npx &> /dev/null; then
    npx prisma migrate deploy || warn "Migration failed. You may need to run migrations manually."
else
    warn "npx not found. Skipping migrations. Run 'npx prisma migrate deploy' manually."
fi

log "✅ Database restore completed successfully"
echo ""
log "Next steps:"
log "  1. Verify application connectivity"
log "  2. Check data integrity"
log "  3. Restart application services if needed"
