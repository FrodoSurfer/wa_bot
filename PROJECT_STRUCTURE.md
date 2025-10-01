# Studio 118 - Project Structure

This document provides a complete overview of the project structure and file organization.

## 📁 Directory Structure

```
studio/
├── .git/                           # Git repository data
├── .gitignore                      # Git ignore rules
├── .env.example                    # Environment configuration template
├── package.json                    # Node.js dependencies and scripts
├── Dockerfile                      # Docker configuration (WhatsApp bot)
├── docker-compose.yml              # Docker Compose setup
├── index.js                        # WhatsApp bot main entry point
├── agent.js                        # Gemini AI agent logic
│
├── README.md                       # Main project documentation
├── QUICKSTART.md                   # 5-minute getting started guide
├── DEPLOYMENT.md                   # Production deployment guide
├── PROJECT_STRUCTURE.md            # This file
│
├── webapp/                         # Web Application
│   ├── server.js                   # Express backend server
│   ├── database/
│   │   ├── init.js                 # Database initialization
│   │   └── studio118.db            # SQLite database (auto-generated)
│   └── public/
│       ├── index.html              # Frontend HTML (Telegram Web App)
│       └── app.js                  # Frontend JavaScript
│
└── deployment-templates/           # Production deployment templates
    ├── README.md                   # Template usage guide
    ├── studio118-webapp.service    # Systemd service file
    ├── nginx-studio118.conf        # Nginx reverse proxy config
    └── backup-database.sh          # Database backup script
```

## 📄 File Descriptions

### Root Files

#### Configuration Files
- **`.gitignore`**: Excludes node_modules, database, auth files, and logs
- **`.env.example`**: Template for environment variables
- **`package.json`**: Node.js project configuration and dependencies
- **`Dockerfile`**: Container configuration for WhatsApp bot
- **`docker-compose.yml`**: Multi-container orchestration

#### Application Files
- **`index.js`**: WhatsApp bot using Baileys library
- **`agent.js`**: AI conversation agent using Gemini

#### Documentation Files
- **`README.md`**: Complete project overview and documentation
- **`QUICKSTART.md`**: Quick 5-minute setup guide
- **`DEPLOYMENT.md`**: Detailed production deployment for DietPi
- **`PROJECT_STRUCTURE.md`**: This file - project structure reference

### webapp/ Directory

#### Backend
- **`server.js`** (16KB): Express.js server with REST API
  - CRUD endpoints for clients, services, appointments, schedule
  - SQLite database integration
  - CORS support for Telegram Web App
  - Health check endpoint

#### Database
- **`database/init.js`** (3.5KB): Database initialization
  - Creates tables on first run
  - Loads default services
  - Sets up foreign keys

- **`database/studio118.db`** (28KB): SQLite database file
  - Auto-generated on first run
  - Contains all application data
  - Excluded from git via .gitignore

#### Frontend
- **`public/index.html`** (15KB): Telegram Web App interface
  - Responsive design with TailwindCSS
  - Four main tabs: Appointments, Clients, Services, Blocks
  - Modal forms for CRUD operations
  - Telegram WebApp SDK integration

- **`public/app.js`** (24KB): Frontend application logic
  - API communication
  - UI state management
  - Form handling and validation
  - Telegram integration

### deployment-templates/ Directory

Production-ready deployment files:

- **`README.md`**: Usage instructions for templates
- **`studio118-webapp.service`**: Systemd service configuration
- **`nginx-studio118.conf`**: Nginx reverse proxy with SSL
- **`backup-database.sh`**: Automated backup script

## 🔧 Key Technologies

### Backend
- **Node.js 20.x**: JavaScript runtime
- **Express 4.x**: Web framework
- **better-sqlite3**: SQLite database driver
- **CORS**: Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript**: No frameworks, pure JS
- **TailwindCSS**: Utility-first CSS (via CDN)
- **Telegram WebApp SDK**: Native Telegram integration

### WhatsApp Bot
- **Baileys 6.x**: WhatsApp Web API
- **Gemini AI**: Conversational AI
- **Pino**: Logging

## 📊 Database Schema

### Tables

**clients**
- id (PRIMARY KEY)
- name (TEXT)
- phone (TEXT UNIQUE)
- email (TEXT)
- notes (TEXT)
- last_visit (DATE)
- created_at, updated_at

**services**
- id (PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- base_price (REAL)
- duration_minutes (INTEGER)
- active (INTEGER)
- created_at, updated_at

**appointments**
- id (PRIMARY KEY)
- client_id (FOREIGN KEY → clients)
- service_id (FOREIGN KEY → services)
- appointment_date (DATETIME)
- end_time (DATETIME)
- status (TEXT)
- notes (TEXT)
- price (REAL)
- created_at, updated_at

**schedule_blocks**
- id (PRIMARY KEY)
- start_time (DATETIME)
- end_time (DATETIME)
- reason (TEXT)
- created_at, updated_at

## 🚀 NPM Scripts

```json
{
  "start": "node index.js",           // Start WhatsApp bot
  "webapp": "node webapp/server.js",   // Start web app
  "dev": "node webapp/server.js"       // Alias for webapp
}
```

## 🌐 API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Services
- `GET /api/services` - List all services
- `GET /api/services/:id` - Get single service
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Appointments
- `GET /api/appointments` - List all appointments
- `GET /api/appointments/:id` - Get single appointment
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Schedule Blocks
- `GET /api/schedule` - List all blocks
- `POST /api/schedule` - Create block
- `DELETE /api/schedule/:id` - Delete block

### Health Check
- `GET /api/health` - Server health status

## 📦 Dependencies

### Production Dependencies
```json
{
  "@google/generative-ai": "^0.21.0",
  "@whiskeysockets/baileys": "^6.7.2",
  "better-sqlite3": "^9.2.2",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.18.2",
  "pino": "^8.1.0",
  "qrcode-terminal": "^0.12.0"
}
```

### Development Notes
- No dev dependencies required
- Pure JavaScript (no TypeScript)
- No build process needed
- Minimal and lightweight

## 🔒 Security Considerations

### Files Excluded from Git
- `node_modules/` - Dependencies
- `auth_info_baileys/` - WhatsApp authentication
- `*.db`, `*.sqlite*` - Database files
- `.env` - Environment variables
- `*.log` - Log files

### Environment Variables
See `.env.example` for required and optional variables.

### API Security
- CORS configured
- Input validation on backend
- Foreign key constraints
- SQL injection protection (parameterized queries)

## 📈 Performance Characteristics

### Memory Usage
- Web App: ~50-100MB
- WhatsApp Bot: ~100-150MB
- Database: Grows with data (starts at 28KB)

### Disk Usage
- Base installation: ~500MB (includes node_modules)
- Database: Minimal (SQLite efficient storage)
- Logs: Managed by system/rotation

### Suitable For
- Intel Celeron processors
- 4GB RAM systems
- Raspberry Pi 4 (2GB+)
- DietPi, Raspbian, Ubuntu Server

## 🆘 Troubleshooting

### Common File Locations

**Database**: `webapp/database/studio118.db`
**Logs**: Check systemd journal or configured log location
**Config**: `.env` in project root
**Authentication**: `auth_info_baileys/` for WhatsApp

### File Permissions
Ensure the application user has:
- Read/write access to `webapp/database/`
- Read access to all other files
- Execute permission on `node` binary

## 📝 Development Workflow

1. Edit source files
2. Test with `npm run webapp`
3. Commit changes
4. Deploy to production server
5. Restart service: `sudo systemctl restart studio118-webapp`

## 🎯 Next Steps

- Explore `README.md` for full documentation
- Follow `QUICKSTART.md` for quick setup
- Read `DEPLOYMENT.md` for production deployment
- Use `deployment-templates/` for server setup

---

**Studio 118** - Lightweight appointment management system ✨
