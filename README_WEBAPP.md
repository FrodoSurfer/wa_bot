# Studio 118 - Sistema de Chat con Telegram WebApp

Sistema completo de chat para Studio 118 con integración de Telegram WebApp, backend REST API y frontend interactivo.

## 📋 Características

### Frontend (Telegram WebApp)
- ✅ Integración completa con Telegram WebApp API
- ✅ Autenticación automática con usuario de Telegram
- ✅ Interfaz adaptativa con temas de Telegram
- ✅ Acciones rápidas para servicios comunes
- ✅ Feedback háptico para interacciones
- ✅ Gestión de estado de conversación
- ✅ Manejo de errores robusto

### Backend (REST API)
- ✅ API REST con Express.js
- ✅ CORS configurado para seguridad
- ✅ Gestión de sesiones por usuario
- ✅ Endpoints para chat, sesiones, precios y reservas
- ✅ Integración con agente Gemini
- ✅ Limpieza automática de sesiones antiguas

### Características de Seguridad
- 🔒 Autenticación de usuario vía Telegram
- 🔒 CORS configurado
- 🔒 Validación de entrada de datos
- 🔒 Manejo de errores centralizado
- 🔒 Rate limiting implícito por sesión

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js v18 o superior
- Cuenta de Telegram y Bot Token (para Telegram WebApp)
- API Key de Google Gemini

### Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/FrodoSurfer/studio.git
cd studio
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` y agregar tu API Key de Gemini:
```
GEMINI_API_KEY=tu_api_key_aquí
PORT=3000
CORS_ORIGIN=*
```

4. Iniciar el servidor:
```bash
npm run server
```

El servidor estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
studio/
├── public/
│   └── index.html          # Frontend con Telegram WebApp
├── server.js               # Backend REST API
├── agent.js                # Agente de IA con Gemini
├── index.js                # Bot de WhatsApp (separado)
├── precios.json            # Catálogo de precios
├── package.json            # Dependencias del proyecto
├── .env.example            # Ejemplo de configuración
└── README_WEBAPP.md        # Esta documentación
```

## 🔌 API Endpoints

### POST `/api/chat`
Envía un mensaje al agente de IA.

**Request:**
```json
{
  "userId": "telegram_user_id",
  "message": "Hola, quiero información sobre servicios",
  "media": []  // opcional
}
```

**Response:**
```json
{
  "success": true,
  "message": "¡Hola! Te cuento sobre nuestros servicios...",
  "usage": {...},
  "model": "gemini-2.5-flash-lite"
}
```

### GET `/api/session/:userId`
Obtiene el estado de la sesión de un usuario.

**Response:**
```json
{
  "success": true,
  "state": {
    "service": null,
    "photos": {...},
    "booking": {...}
  },
  "historyLength": 5
}
```

### DELETE `/api/session/:userId`
Limpia la sesión de un usuario.

### GET `/api/precios`
Obtiene el catálogo de precios.

**Response:**
```json
{
  "success": true,
  "precios": {
    "efecto_de_color": {
      "corto": 3500,
      "medio": 3700,
      "largo": 4300
    },
    ...
  }
}
```

### POST `/api/booking`
Crea una reserva (placeholder para integración futura).

**Request:**
```json
{
  "userId": "telegram_user_id",
  "service": "corte",
  "date": "2024-10-15",
  "time": "15:30"
}
```

### GET `/health`
Health check del servidor.

## 🎨 Integración con Telegram WebApp

### Configurar Bot de Telegram

1. Crear un bot con [@BotFather](https://t.me/BotFather)
2. Configurar el WebApp:
```
/newapp
# Seleccionar tu bot
# Nombre: Studio 118
# Descripción: Tu salón de belleza
# URL: https://tu-dominio.com/
```

3. El frontend ya está configurado para usar la API de Telegram:
   - `window.Telegram.WebApp.initDataUnsafe.user` - Información del usuario
   - `tg.ready()` - Inicializa la WebApp
   - `tg.expand()` - Expande a pantalla completa
   - `tg.MainButton` - Botón principal para acciones
   - `tg.BackButton` - Botón de retroceso
   - `tg.HapticFeedback` - Retroalimentación háptica

### Características Implementadas

1. **Autenticación**: El usuario es automáticamente identificado por Telegram
2. **Tema Adaptativo**: La UI se adapta al tema de Telegram (oscuro/claro)
3. **Navegación**: Botones de Telegram para navegación
4. **Feedback**: Vibración háptica para confirmar acciones
5. **Estado**: Gestión de conversación persistente

## 🧪 Testing

### Test de Health Check
```bash
curl http://localhost:3000/health
```

### Test de Chat API
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "message": "Hola"
  }'
```

### Test de Precios
```bash
curl http://localhost:3000/api/precios
```

## 🔧 Configuración Avanzada

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | API Key de Google Gemini | (requerido) |
| `PORT` | Puerto del servidor | 3000 |
| `NODE_ENV` | Entorno (development/production) | development |
| `CORS_ORIGIN` | Origen permitido para CORS | * |

### Personalización del Frontend

El archivo `public/index.html` puede personalizarse:
- Colores y estilos en el `<style>`
- Acciones rápidas en `quickActions`
- Mensajes del sistema en la función `init()`

### Limpieza de Sesiones

Las sesiones inactivas por más de 24 horas se eliminan automáticamente. 
Para cambiar este comportamiento, modificar en `server.js`:
```javascript
const DAY_MS = 24 * 60 * 60 * 1000; // 24 horas
```

## 📦 Deployment

### Docker

El proyecto incluye un Dockerfile. Para construir y ejecutar:

```bash
docker build -t studio118-webapp .
docker run -p 3000:3000 --env-file .env studio118-webapp
```

### Servicios en la Nube

Recomendaciones para deployment:
- **Heroku**: Fácil deployment con Git
- **Vercel**: Ideal para frontend estático
- **Railway**: Simple para aplicaciones Node.js
- **Google Cloud Run**: Escalable y serverless

### Variables de Entorno en Producción

Asegúrate de configurar:
```bash
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
GEMINI_API_KEY=tu_clave_real
```

## 🐛 Troubleshooting

### El servidor no inicia
- Verificar que el puerto no esté en uso
- Revisar que las dependencias estén instaladas: `npm install`
- Verificar que `.env` tenga `GEMINI_API_KEY`

### Errores de CORS
- Configurar `CORS_ORIGIN` en `.env`
- Para desarrollo usar `CORS_ORIGIN=*`
- Para producción usar el dominio específico

### Telegram WebApp no carga
- Verificar que la URL del WebApp esté correcta en BotFather
- Asegurarse de que el servidor sea accesible públicamente (no localhost)
- Revisar la consola del navegador para errores

## 📝 Licencia

ISC License - Ver archivo LICENSE para más detalles

## 👥 Autor

Frodo Surfer - [GitHub](https://github.com/FrodoSurfer)

## 🙏 Agradecimientos

- Google Gemini AI
- Telegram Bot API
- Express.js community
