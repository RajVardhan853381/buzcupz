#!/bin/bash

# =============================================================================
# CAFEelevate - Database Backup Script
# =============================================================================
# This script creates compressed PostgreSQL backups with rotation.
# Daily backups are retained for 7 days, weekly backups for 4 weeks.
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS=7
RETENTION_WEEKS=4
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/cafeelevate_${TIMESTAMP}.sql.gz"
DATE_DAY=$(date +%Y%m%d)
DATE_WEEK=$(date +%Y_week%V)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/weekly"

log "Starting database backup..."

# Check if required environment variables are set
if [ -z "${PGHOST:-}" ]; then
    error "PGHOST environment variable not set"
    exit 1
fi

if [ -z "${PGDATABASE:-}" ]; then
    error "PGDATABASE environment variable not set"
    exit 1
fi

# Create the backup
log "Backing up database: ${PGDATABASE}@${PGHOST}"

if pg_dump --verbose --clean --if-exists --format=plain --no-owner --no-privileges \
    | gzip > "$BACKUP_FILE"; then
    
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup created successfully: $BACKUP_FILE (${BACKUP_SIZE})"
    
    # Create daily backup symlink
    ln -sf "$BACKUP_FILE" "${BACKUP_DIR}/daily/backup_${DATE_DAY}.sql.gz"
    
    # On Sundays, create a weekly backup
    if [ "$(date +%u)" -eq 7 ]; then
        log "Creating weekly backup..."
        ln -sf "$BACKUP_FILE" "${BACKUP_DIR}/weekly/backup_${DATE_WEEK}.sql.gz"
    fi
    
    # Create 'latest' symlink
    ln -sf "$BACKUP_FILE" "${BACKUP_DIR}/latest.sql.gz"
    
else
    error "Backup failed"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Cleanup old backups
log "Cleaning up old backups..."

# Remove daily backups older than RETENTION_DAYS
find "${BACKUP_DIR}/daily" -name "backup_*.sql.gz" -type l -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# Remove weekly backups older than RETENTION_WEEKS weeks
find "${BACKUP_DIR}/weekly" -name "backup_*.sql.gz" -type l -mtime +$((RETENTION_WEEKS * 7)) -delete 2>/dev/null || true

# Remove orphaned backup files (not linked from daily or weekly)
find "${BACKUP_DIR}" -maxdepth 1 -name "cafeelevate_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# Show backup statistics
DAILY_COUNT=$(find "${BACKUP_DIR}/daily" -name "backup_*.sql.gz" -type l 2>/dev/null | wc -l)
WEEKLY_COUNT=$(find "${BACKUP_DIR}/weekly" -name "backup_*.sql.gz" -type l 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "Backup summary:"
log "  - Daily backups: ${DAILY_COUNT}"
log "  - Weekly backups: ${WEEKLY_COUNT}"
log "  - Total backup size: ${TOTAL_SIZE}"

log "Backup completed successfully"
