# Deployment Templates

This directory contains ready-to-use templates for deploying Studio 118 in production.

## Files

### 1. `studio118-webapp.service`
Systemd service file for the web application.

**Installation:**
```bash
sudo cp studio118-webapp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable studio118-webapp.service
sudo systemctl start studio118-webapp.service
```

### 2. `nginx-studio118.conf`
Nginx reverse proxy configuration.

**Installation:**
```bash
sudo cp nginx-studio118.conf /etc/nginx/sites-available/studio118
# Edit the file and change 'example.com' to your domain
sudo nano /etc/nginx/sites-available/studio118
sudo ln -s /etc/nginx/sites-available/studio118 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. `backup-database.sh`
Automated database backup script.

**Installation:**
```bash
sudo mkdir -p /backup/studio118
sudo cp backup-database.sh /etc/cron.daily/studio118-backup
sudo chmod +x /etc/cron.daily/studio118-backup
```

Or add to crontab for specific times:
```bash
# Daily at 2 AM
0 2 * * * /path/to/backup-database.sh
```

## Usage

See `../DEPLOYMENT.md` for complete deployment instructions.

## Customization

All templates are designed to be easily customized:
- Change paths if you installed in a different location
- Modify user/group in systemd service
- Update domain name in nginx config
- Adjust backup retention in backup script
