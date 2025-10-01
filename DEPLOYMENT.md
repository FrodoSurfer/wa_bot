# Guía de Despliegue - Studio 118 Telegram WebApp

## Despliegue Rápido en Servicios Cloud

### 1. Railway.app (Recomendado)

Railway es ideal para aplicaciones Node.js y ofrece deployment automático desde GitHub.

**Pasos:**

1. Crear cuenta en [Railway.app](https://railway.app)
2. Click en "New Project" → "Deploy from GitHub repo"
3. Seleccionar el repositorio `FrodoSurfer/studio`
4. Railway detectará automáticamente el proyecto Node.js
5. Agregar variables de entorno:
   - `GEMINI_API_KEY`: Tu API key de Google Gemini
   - `PORT`: 3000 (Railway lo asignará automáticamente)
   - `NODE_ENV`: production
6. Deploy automático

**Configuración adicional:**

En el archivo `railway.json` (opcional):
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run server",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Render.com

Render ofrece hosting gratuito con buen soporte para Node.js.

**Pasos:**

1. Crear cuenta en [Render.com](https://render.com)
2. Click en "New +" → "Web Service"
3. Conectar repositorio GitHub
4. Configurar:
   - **Name**: studio118-webapp
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Region**: US West (o el más cercano)
5. Variables de entorno:
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
6. Click en "Create Web Service"

### 3. Heroku

**Pasos:**

1. Instalar Heroku CLI: `npm install -g heroku`
2. Login: `heroku login`
3. Crear app:
```bash
heroku create studio118-webapp
```
4. Configurar variables:
```bash
heroku config:set GEMINI_API_KEY=tu_api_key
heroku config:set NODE_ENV=production
```
5. Deploy:
```bash
git push heroku main
```

Agregar `Procfile` en la raíz:
```
web: npm run server
```

### 4. Vercel

Vercel es ideal para aplicaciones serverless.

**Pasos:**

1. Instalar Vercel CLI: `npm i -g vercel`
2. En el directorio del proyecto:
```bash
vercel
```
3. Seguir las instrucciones
4. Configurar variables de entorno en el dashboard de Vercel

Agregar `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

## Configuración de Telegram Bot

Una vez desplegado, configura tu Telegram Bot:

### 1. Crear el Bot

1. Hablar con [@BotFather](https://t.me/BotFather) en Telegram
2. Enviar `/newbot`
3. Seguir las instrucciones para crear el bot
4. Guardar el **Bot Token** que te proporciona

### 2. Configurar WebApp

1. En BotFather, enviar `/newapp`
2. Seleccionar tu bot
3. Configurar:
   - **Title**: Studio 118
   - **Description**: Tu salón de belleza en El Refugio, Querétaro
   - **Photo**: Subir el logo de Studio 118
   - **Demo GIF** (opcional): Una demostración de la app
   - **URL**: `https://tu-dominio.com/` (la URL de tu deployment)
   - **Short name**: studio118 (será usado en el link: t.me/tu_bot/studio118)

### 3. Probar el Bot

1. Abrir tu bot en Telegram
2. Debe aparecer un botón para abrir la WebApp
3. Al hacer click, se abrirá tu frontend

## Variables de Entorno Críticas

```bash
# Requerido
GEMINI_API_KEY=tu_api_key_aqui

# Recomendado para producción
NODE_ENV=production
PORT=3000                    # Railway/Heroku lo asignan automáticamente
CORS_ORIGIN=*               # En producción, especificar dominio exacto

# Opcional
CONVO_BUDGET_USD=1
STRICT_DOMAIN=true
```

## Seguridad en Producción

### 1. Configurar CORS correctamente

En producción, no usar `*`. Especificar el dominio:

```javascript
// En server.js
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://tu-dominio.com',
    credentials: true
}));
```

### 2. Rate Limiting

Agregar rate limiting para prevenir abuso:

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: 'Demasiadas solicitudes, por favor intenta más tarde.'
});

app.use('/api/', limiter);
```

### 3. Validación de Telegram WebApp Data

Para producción, validar que las requests vienen realmente de Telegram:

```javascript
import crypto from 'crypto';

function validateTelegramWebAppData(initData, botToken) {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
    
    const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
    
    return calculatedHash === hash;
}
```

## Monitoreo

### 1. Logs

Usar un servicio de logging como:
- **Papertrail**: Integración fácil con Heroku/Railway
- **Loggly**: Recolección de logs centralizada
- **Sentry**: Para tracking de errores

### 2. Health Checks

El endpoint `/health` permite monitorear el estado:

```bash
# Configurar en UptimeRobot o similar
curl https://tu-dominio.com/health
```

### 3. Métricas

Considerar agregar:
- **New Relic**: Monitoreo de performance
- **DataDog**: Métricas y APM
- **Google Analytics**: Tracking de uso

## Base de Datos (Futuro)

Para persistencia de sesiones y citas, considerar:

### Redis (Recomendado para sesiones)

```bash
npm install redis
```

```javascript
import { createClient } from 'redis';

const redis = createClient({
    url: process.env.REDIS_URL
});

await redis.connect();

// Guardar sesión
await redis.set(`session:${userId}`, JSON.stringify(session), {
    EX: 86400 // Expira en 24 horas
});

// Obtener sesión
const session = JSON.parse(await redis.get(`session:${userId}`));
```

### MongoDB (Para datos permanentes)

```bash
npm install mongodb
```

Para almacenar:
- Historial de conversaciones
- Citas agendadas
- Información de clientes
- Análisis de uso

## Costos Estimados

### Servicios Gratuitos

- **Railway**: $5/mes de crédito (suficiente para desarrollo)
- **Render**: Plan gratuito con limitaciones
- **Vercel**: Plan gratuito generoso
- **Heroku**: $7/mes (plan básico)

### APIs

- **Google Gemini**: Gratis hasta cierto límite, luego ~$0.001 por request
- **Telegram Bot API**: Gratis

### Estimado Total

Para un salón con ~100 clientes activos/mes:
- Hosting: $0-10/mes
- Gemini API: $5-20/mes
- **Total: $5-30/mes**

## Checklist de Deployment

- [ ] Variables de entorno configuradas
- [ ] CORS configurado para producción
- [ ] Rate limiting implementado
- [ ] Health checks configurados
- [ ] Logs centralizados
- [ ] Telegram Bot configurado
- [ ] WebApp URL configurada en BotFather
- [ ] Dominio personalizado (opcional)
- [ ] SSL/HTTPS habilitado (automático en Railway/Vercel/Heroku)
- [ ] Backup de datos configurado (si aplica)

## Soporte

Para problemas de deployment:
- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Heroku: https://devcenter.heroku.com

---

**Nota**: Para un deployment rápido y sencillo, **Railway** es la opción más recomendada. 
Detecta automáticamente Node.js, configura SSL, y ofrece deployment continuo desde GitHub.
