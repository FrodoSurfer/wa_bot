# Quick Start Guide - Studio 118

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
- Node.js 20.x or higher installed
- Terminal access

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/FrodoSurfer/studio.git
cd studio

# Install dependencies
npm install
```

### 3. Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set your configuration (optional)
nano .env
```

**Note**: For the Web App only, you don't need to change anything in `.env`. The default port 3008 will work fine.

### 4. Start the Application

#### Option A: Web App Only (Recommended for first time)
```bash
npm run webapp
```

#### Option B: WhatsApp Bot Only
```bash
# First, add your GEMINI_API_KEY to .env
npm start
```

#### Option C: Both (in separate terminals)
```bash
# Terminal 1
npm run webapp

# Terminal 2
npm start
```

### 5. Access the Application

- **Web App**: Open your browser and go to http://localhost:3008
- **WhatsApp Bot**: Scan the QR code that appears in the terminal

### 6. First Steps

#### Using the Web App:

1. **Add a Service** (if needed beyond defaults)
   - Go to "💇 Servicios" tab
   - Click "+ Nuevo Servicio"
   - Fill in name, price, and duration
   - Click "Guardar"

2. **Add a Client**
   - Go to "👥 Clientes" tab
   - Click "+ Nuevo Cliente"
   - Fill in name and phone (required)
   - Click "Guardar"

3. **Create an Appointment**
   - Go to "📅 Citas" tab
   - Click "+ Nueva Cita"
   - Select client and service
   - Choose date and time
   - Click "Guardar"

4. **Block Time Slots** (optional)
   - Go to "🚫 Bloques" tab
   - Click "+ Nuevo Bloque"
   - Set start and end times
   - Add a reason (e.g., "Vacaciones")
   - Click "Guardar"

### 7. Integration with Telegram

To use this as a Telegram Web App:

1. **Create a Telegram Bot**
   - Open Telegram and message [@BotFather](https://t.me/botfather)
   - Send `/newbot` and follow instructions
   - Save your bot token

2. **Create a Web App**
   - Message @BotFather again
   - Send `/newapp`
   - Select your bot
   - Send the URL: `http://your-server-ip:3008` (or your domain)
   - Add name, description, and photo

3. **Deploy to a Server** (for production)
   - See `DEPLOYMENT.md` for complete instructions
   - Use a server with a public IP or domain
   - Configure HTTPS for security

### 8. Default Services

The following services are pre-loaded on first run:
- Corte - $350 (60 min)
- Efecto de Color (Corto) - $3500 (120 min)
- Efecto de Color (Medio) - $3700 (150 min)
- Efecto de Color (Largo) - $4300 (180 min)
- Nanoplastia - $2500 (180 min)
- Extensiones - $3000 (180 min)

You can edit or add more services in the "💇 Servicios" tab.

## 📱 Testing the API

You can test the API endpoints directly:

```bash
# Get all services
curl http://localhost:3008/api/services

# Get all clients
curl http://localhost:3008/api/clients

# Health check
curl http://localhost:3008/api/health
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port 3008
lsof -ti:3008 | xargs kill -9

# Or use a different port
WEBAPP_PORT=3009 npm run webapp
```

### Database Issues
```bash
# Delete and recreate database
rm webapp/database/studio118.db
npm run webapp
```

### Cannot Connect to Web App
- Check firewall settings
- Ensure the server is running
- Try accessing from localhost first

## 📚 Next Steps

- Read `README.md` for detailed documentation
- Read `DEPLOYMENT.md` for production deployment
- Customize services and pricing for your business
- Explore API endpoints for integration

## 🆘 Need Help?

- Open an issue: https://github.com/FrodoSurfer/studio/issues
- Check API health: http://localhost:3008/api/health

---

**Welcome to Studio 118!** ✨ Start managing your appointments today!
