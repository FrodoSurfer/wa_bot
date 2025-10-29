# Bot de WhatsApp con Configuración Automática

Bot de WhatsApp para negocios con integración de Gemini AI y configuración automática mediante interfaz web.

## 🚀 Características

- **Bot de WhatsApp** usando Baileys
- **IA Conversacional** con Google Gemini
- **Configuración Automática** mediante interfaz web
- **Análisis de Imágenes** para extraer servicios y precios
- **Generación Automática** de archivos de configuración

## 📋 Requisitos Previos

- Node.js 20 o superior
- Cuenta de Google Cloud con acceso a Gemini API
- Número de teléfono para WhatsApp Business

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd wa_bot
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` con las siguientes variables:

```env
# API Key de Gemini (requerido)
GEMINI_API_KEY=tu_api_key_aqui

# Modelo de Gemini (opcional, por defecto: gemini-2.5-flash-lite)
GEMINI_MODEL=gemini-2.5-flash-lite

# Puerto del servidor de configuración (opcional, por defecto: 3000)
CONFIG_SERVER_PORT=3000

# Configuración de presupuesto (opcional)
CONVO_BUDGET_USD=1
TYPING_WPM=180
TYPING_BASE_MS=1200
TYPING_MIN_MS=1500
TYPING_MAX_MS=8000
TYPING_JITTER=0.35

# Nivel de log (opcional)
LOG_LEVEL=silent

# Precios de Gemini (opcional, en formato JSON)
GEMINI_PRICING_JSON={"gemini-2.0-flash-lite-001":{"input":0.000075,"output":0.0003}}
```

## 🎯 Configuración Automática del Bot

### Paso 1: Iniciar el Servidor de Configuración

```bash
npm run config
```

Esto iniciará el servidor web en `http://localhost:3000`

### Paso 2: Acceder a la Interfaz Web

Abre tu navegador y accede a `http://localhost:3000`

### Paso 3: Completar el Formulario

1. **Nombre del Negocio** (requerido): Ej. "Studio 118"
2. **Nombre del/la Dueño/a** (opcional): Ej. "Esveidy"
3. **Ubicación** (opcional): Ej. "Querétaro, México"
4. **Dominio del Negocio** (requerido): Ej. "salón de belleza"
5. **Imagen del Menú/Servicios** (requerido): Sube una foto de tu menú o lista de servicios

### Paso 4: Generar Configuración

Haz clic en "✨ Generar Configuración" y espera mientras la IA:
- Analiza la imagen de tu menú
- Extrae los servicios y precios
- Genera los archivos `config.json` y `precios.json`

### Paso 5: Verificar los Archivos Generados

Después de la generación exitosa, encontrarás dos archivos en la raíz del proyecto:

**config.json** - Configuración del negocio:
```json
{
  "businessName": "Studio 118",
  "domain": "salón de belleza",
  "ownerName": "Esveidy",
  "location": "Querétaro, México",
  "systemPrompt": "...",
  "generatedAt": "2025-10-29T01:00:00.000Z"
}
```

**precios.json** - Lista de precios y servicios:
```json
{
  "efecto_de_color": {
    "corto": 3500,
    "medio": 3700,
    "largo": 4300,
    "nota": "Incluye balayage, babylights, mechas"
  },
  "corte": {
    "base": 350
  }
}
```

## 🤖 Ejecutar el Bot de WhatsApp

Una vez configurado, inicia el bot:

```bash
npm start
```

### Primera vez:
1. El bot mostrará un código QR en la terminal
2. Escanea el código QR con WhatsApp desde tu teléfono
3. El bot se conectará y estará listo para recibir mensajes

### Subsecuentes ejecuciones:
El bot se conectará automáticamente usando las credenciales guardadas en `auth_info_baileys/`

## 📁 Estructura del Proyecto

```
wa_bot/
├── index.js              # Bot principal de WhatsApp
├── agent.js              # Lógica de IA con Gemini
├── config-server.js      # Servidor web de configuración
├── config.json           # Configuración generada (auto)
├── precios.json          # Precios generados (auto)
├── public/
│   └── index.html        # Interfaz web de configuración
├── uploads/              # Carpeta temporal de imágenes
├── auth_info_baileys/    # Credenciales de WhatsApp
├── package.json
└── .env                  # Variables de entorno
```

## 🐳 Docker

### Construir y ejecutar con Docker Compose

```bash
docker-compose up -d
```

Esto levantará el bot en modo daemon. Para ver los logs:

```bash
docker-compose logs -f
```

## 🔍 API Endpoints

El servidor de configuración expone los siguientes endpoints:

- `GET /` - Interfaz web de configuración
- `POST /generate-config` - Generar configuración (multipart/form-data)
- `GET /health` - Estado del servidor

## 📝 Personalización

### Modificar el Prompt del Sistema

Puedes modificar el comportamiento del bot editando el `systemPrompt` en `config.json` o regenerándolo con nuevos parámetros desde la interfaz web.

### Agregar Nuevos Servicios

1. Edita `precios.json` manualmente, o
2. Usa el configurador web con una nueva imagen de menú

### Formato de Servicios

Los servicios pueden tener diferentes estructuras:

**Precio único:**
```json
"corte": {
  "base": 350
}
```

**Precio por largo:**
```json
"efecto_de_color": {
  "corto": 3500,
  "medio": 3700,
  "largo": 4300,
  "extra_largo": 5000,
  "nota": "Descripción opcional"
}
```

**Precio por cantidad:**
```json
"cubrimiento_de_cana": {
  "30gr": 800,
  "40gr": 1000,
  "50gr": 1200
}
```

## 🛡️ Seguridad

- Las imágenes subidas se eliminan automáticamente después de procesarlas
- No se almacenan datos sensibles en el servidor
- El bot valida tipos de archivo permitidos (solo imágenes)
- Tamaño máximo de archivo: 10MB

## ⚙️ Variables de Entorno Completas

| Variable | Descripción | Default | Requerido |
|----------|-------------|---------|-----------|
| `GEMINI_API_KEY` | API Key de Google Gemini | - | ✅ |
| `GEMINI_MODEL` | Modelo de IA a usar | gemini-2.5-flash-lite | ❌ |
| `CONFIG_SERVER_PORT` | Puerto del servidor web | 3000 | ❌ |
| `CONVO_BUDGET_USD` | Presupuesto por conversación | 1 | ❌ |
| `LOG_LEVEL` | Nivel de logging | silent | ❌ |
| `TYPING_WPM` | Palabras por minuto al escribir | 180 | ❌ |
| `TYPING_BASE_MS` | Tiempo base de escritura | 1200 | ❌ |
| `TYPING_MIN_MS` | Tiempo mínimo de escritura | 1500 | ❌ |
| `TYPING_MAX_MS` | Tiempo máximo de escritura | 8000 | ❌ |
| `TYPING_JITTER` | Variación en tiempo de escritura | 0.35 | ❌ |

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

ISC

## 👤 Autor

Frodo Surfer

## 🙏 Agradecimientos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - Librería de WhatsApp
- [Google Gemini](https://ai.google.dev/) - IA Conversacional
- [Express](https://expressjs.com/) - Framework web
