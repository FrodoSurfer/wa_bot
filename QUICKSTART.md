# 🚀 Quick Start - Studio 118 Telegram WebApp

## Para Desarrolladores

### 1. Instalación (2 minutos)

```bash
# Clonar repositorio
git clone https://github.com/FrodoSurfer/studio.git
cd studio

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

Editar `.env` y agregar:
```
GEMINI_API_KEY=tu_api_key_aqui
```

### 2. Ejecutar Localmente

```bash
# Iniciar servidor
npm run server
# Servidor disponible en http://localhost:3000

# En otra terminal, ejecutar tests
npm test
```

### 3. Probar la Aplicación

Abrir en el navegador: http://localhost:3000

## Para Deployment en Producción

### Opción 1: Railway (Más Fácil) ⚡

1. Ir a [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Seleccionar repositorio `FrodoSurfer/studio`
4. Agregar variable: `GEMINI_API_KEY=tu_api_key`
5. ¡Deploy automático! ✅

### Opción 2: Render

1. Ir a [render.com](https://render.com)
2. New → Web Service
3. Conectar GitHub
4. Build: `npm install`
5. Start: `npm run server`
6. Agregar `GEMINI_API_KEY`

### Opción 3: Heroku

```bash
heroku create studio118-webapp
heroku config:set GEMINI_API_KEY=tu_api_key
git push heroku main
```

## Configurar Telegram Bot

### 1. Crear Bot

1. Abrir [@BotFather](https://t.me/BotFather) en Telegram
2. Enviar `/newbot`
3. Seguir instrucciones
4. Guardar el token

### 2. Configurar WebApp

1. Enviar `/newapp` a BotFather
2. Seleccionar tu bot
3. Configurar:
   - **Title**: Studio 118
   - **Description**: Tu salón de belleza
   - **URL**: https://tu-dominio.com/ (de Railway/Render/Heroku)
   - **Short name**: studio118

### 3. ¡Listo!

Abrir tu bot en Telegram → Aparecerá botón para abrir WebApp

## Endpoints API Disponibles

```bash
# Health check
curl https://tu-dominio.com/health

# Obtener precios
curl https://tu-dominio.com/api/precios

# Enviar mensaje
curl -X POST https://tu-dominio.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","message":"Hola"}'
```

## Archivos Importantes

- `server.js` - Backend API
- `public/index.html` - Frontend
- `agent.js` - Lógica de IA
- `precios.json` - Catálogo
- `.env.example` - Configuración

## Documentación Completa

- 📖 **README_WEBAPP.md** - Documentación técnica completa
- 🚀 **DEPLOYMENT.md** - Guía detallada de deployment
- 📝 **IMPLEMENTATION_SUMMARY.md** - Resumen de implementación

## Soporte

¿Problemas? Revisa la documentación o abre un issue en GitHub.

---

**Tiempo estimado de setup**: 5-10 minutos ⚡
