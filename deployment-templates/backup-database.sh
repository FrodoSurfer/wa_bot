#!/bin/bash

# Studio 118 Database Backup Script
# Place this in /etc/cron.daily/ or run via cron

BACKUP_DIR="/backup/studio118"
DB_PATH="/opt/studio/webapp/database/studio118.db"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
cp "$DB_PATH" "$BACKUP_DIR/studio118-${TIMESTAMP}.db"

# Compress backup
gzip "$BACKUP_DIR/studio118-${TIMESTAMP}.db"

# Log backup
echo "[$(date)] Database backed up to $BACKUP_DIR/studio118-${TIMESTAMP}.db.gz" >> /var/log/studio118-backup.log

# Remove old backups (older than retention days)
find "$BACKUP_DIR" -name "studio118-*.db.gz" -mtime +$RETENTION_DAYS -delete

# Log cleanup
echo "[$(date)] Old backups cleaned up (retention: $RETENTION_DAYS days)" >> /var/log/studio118-backup.log
