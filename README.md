# 🤖 Studio 118 WhatsApp Bot | Bot de WhatsApp Studio 118

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/Baileys-latest-orange.svg)](https://github.com/WhiskeySockets/Baileys)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5%20Flash%20Lite-purple.svg)](https://ai.google.dev/)

[English](#english) | [Español](#español)

---

<a name="english"></a>
## 🇬🇧 English

### 📖 About This Project

**Studio 118 WhatsApp Bot** is a highly functional, AI-powered WhatsApp assistant created through **vibe coding** — an organic development approach that prioritizes rapid iteration, intuitive design, and real-world functionality over rigid planning. This bot was built with a focus on delivering immediate value while maintaining clean, maintainable code.

This bot serves as a virtual beauty salon assistant for **Studio 118** (El Refugio, Querétaro, México), handling client conversations with the warmth and expertise of owner Esveidy. It's powered by Google's Gemini AI and the robust Baileys WhatsApp library.

### ✨ Key Features

- 🎨 **Smart Service Recognition**: Automatically detects service types (Color, Extensions, Nanoplastia, Cut & Style)
- 💬 **Natural Conversations**: Empathetic, human-like responses that adapt to client tone
- 📸 **Image Processing**: Handles reference photos for color and style consultations
- 💰 **Dynamic Pricing**: Integrated pricing system based on service type and hair length
- 📅 **Appointment Management**: Intelligent scheduling with availability checking
- 🔒 **Budget Control**: Built-in token/cost management to control AI spending
- 🚀 **Typing Simulation**: Realistic typing indicators for natural conversation flow
- 🛡️ **Safety Guards**: Jailbreak protection and off-topic conversation handling
- 🐳 **Docker Ready**: Fully containerized for easy deployment
- 🌐 **Production Ready**: Optimized for low-cost, high-performance operation

### 🏗️ Architecture

The bot consists of three main components:

1. **`index.js`** - WhatsApp connection manager
   - Handles Baileys socket connection
   - Manages conversation history and session state
   - Implements typing simulation
   - Controls budget and token usage

2. **`agent.js`** - Gemini AI agent
   - Personality: Esveidy from Studio 118
   - Function calling for pricing and availability
   - Optimized prompts for cost efficiency
   - Safety settings and content moderation

3. **`Dockerfile` & `docker-compose.yml`** - Containerization
   - Production-ready Node.js 20 Alpine image
   - Persistent authentication storage
   - Environment-based configuration

### 🎯 The "Vibe Coding" Philosophy

This project embodies **vibe coding** principles:

- ✅ **Iterative Excellence**: Rapidly developed with continuous refinement
- ✅ **Functional First**: Every feature works immediately and reliably
- ✅ **Real-World Testing**: Built by solving actual business needs
- ✅ **Organic Structure**: Code evolved naturally through use cases
- ✅ **Smart Optimization**: Cost-aware from day one (Gemini Flash Lite)
- ✅ **Pragmatic Choices**: Best-in-class libraries (Baileys, Gemini, Pino)

### 📋 Prerequisites

- **Node.js** 20 or higher
- **npm** (comes with Node.js)
- **WhatsApp account** (for bot connection)
- **Google Gemini API key** ([Get one here](https://ai.google.dev/))
- **Docker** (optional, for containerized deployment)

### 🚀 Installation

#### Local Setup

```bash
# Clone the repository
git clone https://github.com/FrodoSurfer/wa_bot.git
cd wa_bot

# Install dependencies
npm install

# Create your .env file (see Configuration section below)
cp .env.example .env
nano .env

# Start the bot
npm start
```

#### Docker Setup

```bash
# Clone the repository
git clone https://github.com/FrodoSurfer/wa_bot.git
cd wa_bot

# Create your .env file (see Configuration section below)
cp .env.example .env
nano .env

# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### ⚙️ Configuration

Create a `.env` file in the project root with the following variables:

```bash
# ============================================
# REQUIRED: Gemini AI Configuration
# ============================================

# Your Google Gemini API Key (REQUIRED)
# Get it from: https://ai.google.dev/
GEMINI_API_KEY=your_gemini_api_key_here

# Preferred Gemini model (optional, defaults to gemini-2.5-flash-lite)
# Options: gemini-2.5-flash-lite, gemini-2.0-flash-lite-001, gemini-2.0-flash
GEMINI_MODEL=gemini-2.5-flash-lite

# ============================================
# Budget Control (Cost Management)
# ============================================

# Maximum USD to spend per conversation (default: 1)
# The bot will switch to low-cost mode at 70% and stop at 100%
CONVO_BUDGET_USD=1.0

# Gemini pricing table (JSON format)
# Update these values according to current Gemini pricing
GEMINI_PRICING_JSON={"gemini-2.5-flash-lite":{"input":0.000015,"output":0.00006},"gemini-2.0-flash-lite-001":{"input":0.000015,"output":0.00006},"gemini-2.0-flash":{"input":0.0001,"output":0.0003},"gemini-2.5-flash":{"input":0.000075,"output":0.0003}}

# ============================================
# Conversation Behavior
# ============================================

# Enable strict domain filtering (true/false)
# When true, bot will refuse off-topic conversations
STRICT_DOMAIN=true

# ============================================
# Typing Simulation (Human-like behavior)
# ============================================

# Words per minute typing speed (default: 180)
# Simulates realistic human typing
TYPING_WPM=180

# Base typing delay in milliseconds (default: 1200)
TYPING_BASE_MS=1200

# Minimum typing delay in milliseconds (default: 1500)
TYPING_MIN_MS=1500

# Maximum typing delay in milliseconds (default: 8000)
TYPING_MAX_MS=8000

# Typing jitter/variation factor 0-1 (default: 0.35)
# Adds randomness to typing simulation
TYPING_JITTER=0.35

# ============================================
# Logging
# ============================================

# Log level: 'silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'
LOG_LEVEL=silent
```

### 📝 Example `.env` Files

#### Minimal Configuration (Quick Start)
```bash
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CONVO_BUDGET_USD=1.0
STRICT_DOMAIN=true
LOG_LEVEL=silent
```

#### Development Configuration
```bash
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-2.5-flash-lite
CONVO_BUDGET_USD=2.0
STRICT_DOMAIN=false
TYPING_WPM=200
TYPING_BASE_MS=800
TYPING_MIN_MS=1000
TYPING_MAX_MS=5000
TYPING_JITTER=0.4
LOG_LEVEL=info
```

#### Production Configuration
```bash
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-2.5-flash-lite
CONVO_BUDGET_USD=1.0
GEMINI_PRICING_JSON={"gemini-2.5-flash-lite":{"input":0.000015,"output":0.00006},"gemini-2.0-flash-lite-001":{"input":0.000015,"output":0.00006},"gemini-2.0-flash":{"input":0.0001,"output":0.0003},"gemini-2.5-flash":{"input":0.000075,"output":0.0003}}
STRICT_DOMAIN=true
TYPING_WPM=180
TYPING_BASE_MS=1200
TYPING_MIN_MS=1500
TYPING_MAX_MS=8000
TYPING_JITTER=0.35
LOG_LEVEL=silent
```

### 🎮 Usage

1. **Start the bot** using `npm start` or Docker
2. **Scan the QR code** that appears in the terminal with WhatsApp
3. **The bot is ready!** Send a message to the WhatsApp number to start

**First Run:**
- A QR code will be displayed in the terminal
- Open WhatsApp on your phone
- Go to **Settings** → **Linked Devices** → **Link a Device**
- Scan the QR code
- Authentication data is saved in `auth_info_baileys/` directory

**Subsequent Runs:**
- Bot will connect automatically using saved credentials
- No QR code needed unless logged out

### 💬 Conversation Examples

```
Client: "Hi, I need a haircut on Saturday"
Bot: "¡Claro que sí, hermosa! Me encanta la idea de verte el sábado para ese corte."
Bot: "¿Tienes alguna hora en mente que te quede bien?"

Client: "I want balayage, how much is it?"
Bot: "¡Súper! Para darte el precio exacto del balayage, cuéntame:"
Bot: "¿Cómo tienes el largo de tu cabello? (corto, medio, largo)"

Client: "I need nanoplastia"
Bot: "¡Genial! La nanoplastia es increíble para dejar tu cabello suavecito y manejable. ✨"
Bot: "¿Ya tienes una fecha y hora en mente, o quieres que te ayude a encontrar un hueco?"
```

### 📊 Cost Optimization

The bot is designed to be extremely cost-efficient:

- Uses **Gemini 2.5 Flash Lite** (cheapest model)
- Implements **conversation history limiting** (5-8 turns)
- Applies **token budget controls** per conversation
- Switches to **low-cost mode** at 70% budget usage
- **Stops AI calls** at 100% budget exhaustion
- Optimized prompt with **short, direct responses**
- Function calling for **structured data** (reduces tokens)

**Estimated Costs:**
- Average conversation: **$0.0005 - $0.002 USD**
- 1000 conversations: **~$0.50 - $2.00 USD**
- Monthly (1000 clients): **Under $5 USD**

### 🛠️ Troubleshooting

**QR Code doesn't appear:**
```bash
# Check if port 5222 (WhatsApp's port) is not blocked
# Increase log level to debug
LOG_LEVEL=debug npm start
```

**"GEMINI_API_KEY not defined" warning:**
```bash
# Make sure your .env file exists and contains GEMINI_API_KEY
cat .env | grep GEMINI_API_KEY
```

**Bot doesn't respond:**
```bash
# Check budget status in logs
# Verify Gemini API key is valid
# Ensure you're not in a WhatsApp group (bot ignores groups)
```

**Authentication issues:**
```bash
# Delete auth folder and re-scan QR code
rm -rf auth_info_baileys/
npm start
```

**Docker container doesn't start:**
```bash
# Check logs
docker-compose logs studio118-bot

# Rebuild container
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 📁 Project Structure

```
wa_bot/
├── index.js              # Main WhatsApp connection handler
├── agent.js              # Gemini AI agent with personality
├── package.json          # Node.js dependencies
├── Dockerfile            # Docker container definition
├── docker-compose.yml    # Docker Compose configuration
├── .env                  # Environment variables (create this)
├── auth_info_baileys/    # WhatsApp session storage (auto-generated)
└── README.md            # This file
```

### 🤝 Contributing

Contributions are welcome! This project was built with vibe coding, so feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the ISC License.

### 👨‍💻 Author

**Frodo Surfer** - [GitHub](https://github.com/FrodoSurfer)

### 🙏 Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - Amazing WhatsApp Web API
- [Google Gemini](https://ai.google.dev/) - Powerful AI for natural conversations
- Studio 118 - The inspiration for this bot
- The vibe coding community - For the organic development philosophy

---

<a name="español"></a>
## 🇲🇽 Español

### 📖 Acerca de Este Proyecto

**Studio 118 WhatsApp Bot** es un asistente de WhatsApp altamente funcional impulsado por IA, creado mediante **vibe coding** — un enfoque de desarrollo orgánico que prioriza la iteración rápida, el diseño intuitivo y la funcionalidad del mundo real sobre la planificación rígida. Este bot fue construido con un enfoque en entregar valor inmediato mientras se mantiene un código limpio y mantenible.

Este bot sirve como asistente virtual de salón de belleza para **Studio 118** (El Refugio, Querétaro, México), manejando conversaciones con clientes con la calidez y experiencia de la dueña Esveidy. Está impulsado por Gemini AI de Google y la robusta biblioteca Baileys para WhatsApp.

### ✨ Características Principales

- 🎨 **Reconocimiento Inteligente de Servicios**: Detecta automáticamente tipos de servicio (Color, Extensiones, Nanoplastia, Corte y Estilo)
- 💬 **Conversaciones Naturales**: Respuestas empáticas y humanas que se adaptan al tono del cliente
- 📸 **Procesamiento de Imágenes**: Maneja fotos de referencia para consultas de color y estilo
- 💰 **Precios Dinámicos**: Sistema de precios integrado basado en tipo de servicio y largo de cabello
- 📅 **Gestión de Citas**: Programación inteligente con verificación de disponibilidad
- 🔒 **Control de Presupuesto**: Gestión integrada de tokens/costos para controlar el gasto en IA
- 🚀 **Simulación de Escritura**: Indicadores de escritura realistas para flujo de conversación natural
- 🛡️ **Protecciones de Seguridad**: Protección contra jailbreak y manejo de conversaciones fuera de tema
- 🐳 **Listo para Docker**: Completamente containerizado para despliegue fácil
- 🌐 **Listo para Producción**: Optimizado para operación de bajo costo y alto rendimiento

### 🏗️ Arquitectura

El bot consiste en tres componentes principales:

1. **`index.js`** - Gestor de conexión de WhatsApp
   - Maneja la conexión socket de Baileys
   - Gestiona historial de conversación y estado de sesión
   - Implementa simulación de escritura
   - Controla presupuesto y uso de tokens

2. **`agent.js`** - Agente de IA Gemini
   - Personalidad: Esveidy de Studio 118
   - Llamadas a funciones para precios y disponibilidad
   - Prompts optimizados para eficiencia de costos
   - Configuraciones de seguridad y moderación de contenido

3. **`Dockerfile` & `docker-compose.yml`** - Containerización
   - Imagen Node.js 20 Alpine lista para producción
   - Almacenamiento persistente de autenticación
   - Configuración basada en variables de entorno

### 🎯 La Filosofía del "Vibe Coding"

Este proyecto encarna los principios del **vibe coding**:

- ✅ **Excelencia Iterativa**: Desarrollado rápidamente con refinamiento continuo
- ✅ **Funcional Primero**: Cada característica funciona inmediata y confiablemente
- ✅ **Pruebas del Mundo Real**: Construido resolviendo necesidades de negocio reales
- ✅ **Estructura Orgánica**: El código evolucionó naturalmente a través de casos de uso
- ✅ **Optimización Inteligente**: Consciente de costos desde el día uno (Gemini Flash Lite)
- ✅ **Decisiones Pragmáticas**: Bibliotecas de primera clase (Baileys, Gemini, Pino)

### 📋 Prerrequisitos

- **Node.js** 20 o superior
- **npm** (viene con Node.js)
- **Cuenta de WhatsApp** (para conexión del bot)
- **Clave API de Google Gemini** ([Obtener aquí](https://ai.google.dev/))
- **Docker** (opcional, para despliegue containerizado)

### 🚀 Instalación

#### Configuración Local

```bash
# Clonar el repositorio
git clone https://github.com/FrodoSurfer/wa_bot.git
cd wa_bot

# Instalar dependencias
npm install

# Crear tu archivo .env (ver sección de Configuración abajo)
cp .env.example .env
nano .env

# Iniciar el bot
npm start
```

#### Configuración con Docker

```bash
# Clonar el repositorio
git clone https://github.com/FrodoSurfer/wa_bot.git
cd wa_bot

# Crear tu archivo .env (ver sección de Configuración abajo)
cp .env.example .env
nano .env

# Construir y ejecutar con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### ⚙️ Configuración

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# ============================================
# REQUERIDO: Configuración de Gemini AI
# ============================================

# Tu clave API de Google Gemini (REQUERIDO)
# Obtenerla de: https://ai.google.dev/
GEMINI_API_KEY=tu_clave_api_gemini_aqui

# Modelo Gemini preferido (opcional, por defecto gemini-2.5-flash-lite)
# Opciones: gemini-2.5-flash-lite, gemini-2.0-flash-lite-001, gemini-2.0-flash
GEMINI_MODEL=gemini-2.5-flash-lite

# ============================================
# Control de Presupuesto (Gestión de Costos)
# ============================================

# Máximo USD a gastar por conversación (por defecto: 1)
# El bot cambiará a modo bajo costo al 70% y se detendrá al 100%
CONVO_BUDGET_USD=1.0

# Tabla de precios de Gemini (formato JSON)
# Actualiza estos valores según los precios actuales de Gemini
GEMINI_PRICING_JSON={"gemini-2.5-flash-lite":{"input":0.000015,"output":0.00006},"gemini-2.0-flash-lite-001":{"input":0.000015,"output":0.00006},"gemini-2.0-flash":{"input":0.0001,"output":0.0003},"gemini-2.5-flash":{"input":0.000075,"output":0.0003}}

# ============================================
# Comportamiento de Conversación
# ============================================

# Habilitar filtrado estricto de dominio (true/false)
# Cuando es true, el bot rechazará conversaciones fuera de tema
STRICT_DOMAIN=true

# ============================================
# Simulación de Escritura (Comportamiento humano)
# ============================================

# Velocidad de escritura en palabras por minuto (por defecto: 180)
# Simula escritura humana realista
TYPING_WPM=180

# Retraso base de escritura en milisegundos (por defecto: 1200)
TYPING_BASE_MS=1200

# Retraso mínimo de escritura en milisegundos (por defecto: 1500)
TYPING_MIN_MS=1500

# Retraso máximo de escritura en milisegundos (por defecto: 8000)
TYPING_MAX_MS=8000

# Factor de variación/jitter de escritura 0-1 (por defecto: 0.35)
# Añade aleatoriedad a la simulación de escritura
TYPING_JITTER=0.35

# ============================================
# Registro (Logging)
# ============================================

# Nivel de log: 'silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'
LOG_LEVEL=silent
```

### 📝 Ejemplos de Archivos `.env`

#### Configuración Mínima (Inicio Rápido)
```bash
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CONVO_BUDGET_USD=1.0
STRICT_DOMAIN=true
LOG_LEVEL=silent
```

#### Configuración de Desarrollo
```bash
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-2.5-flash-lite
CONVO_BUDGET_USD=2.0
STRICT_DOMAIN=false
TYPING_WPM=200
TYPING_BASE_MS=800
TYPING_MIN_MS=1000
TYPING_MAX_MS=5000
TYPING_JITTER=0.4
LOG_LEVEL=info
```

#### Configuración de Producción
```bash
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-2.5-flash-lite
CONVO_BUDGET_USD=1.0
GEMINI_PRICING_JSON={"gemini-2.5-flash-lite":{"input":0.000015,"output":0.00006},"gemini-2.0-flash-lite-001":{"input":0.000015,"output":0.00006},"gemini-2.0-flash":{"input":0.0001,"output":0.0003},"gemini-2.5-flash":{"input":0.000075,"output":0.0003}}
STRICT_DOMAIN=true
TYPING_WPM=180
TYPING_BASE_MS=1200
TYPING_MIN_MS=1500
TYPING_MAX_MS=8000
TYPING_JITTER=0.35
LOG_LEVEL=silent
```

### 🎮 Uso

1. **Iniciar el bot** usando `npm start` o Docker
2. **Escanear el código QR** que aparece en la terminal con WhatsApp
3. **¡El bot está listo!** Envía un mensaje al número de WhatsApp para comenzar

**Primera Ejecución:**
- Se mostrará un código QR en la terminal
- Abre WhatsApp en tu teléfono
- Ve a **Configuración** → **Dispositivos Vinculados** → **Vincular un Dispositivo**
- Escanea el código QR
- Los datos de autenticación se guardan en el directorio `auth_info_baileys/`

**Ejecuciones Posteriores:**
- El bot se conectará automáticamente usando las credenciales guardadas
- No se necesita código QR a menos que se haya cerrado sesión

### 💬 Ejemplos de Conversación

```
Cliente: "Hola, necesito un corte el sábado"
Bot: "¡Claro que sí, hermosa! Me encanta la idea de verte el sábado para ese corte."
Bot: "¿Tienes alguna hora en mente que te quede bien?"

Cliente: "Quiero balayage, ¿cuánto cuesta?"
Bot: "¡Súper! Para darte el precio exacto del balayage, cuéntame:"
Bot: "¿Cómo tienes el largo de tu cabello? (corto, medio, largo)"

Cliente: "Necesito nanoplastia"
Bot: "¡Genial! La nanoplastia es increíble para dejar tu cabello suavecito y manejable. ✨"
Bot: "¿Ya tienes una fecha y hora en mente, o quieres que te ayude a encontrar un hueco?"
```

### 📊 Optimización de Costos

El bot está diseñado para ser extremadamente eficiente en costos:

- Usa **Gemini 2.5 Flash Lite** (modelo más económico)
- Implementa **limitación de historial de conversación** (5-8 turnos)
- Aplica **controles de presupuesto de tokens** por conversación
- Cambia a **modo bajo costo** al 70% de uso del presupuesto
- **Detiene llamadas de IA** al 100% de agotamiento del presupuesto
- Prompt optimizado con **respuestas cortas y directas**
- Llamadas a funciones para **datos estructurados** (reduce tokens)

**Costos Estimados:**
- Conversación promedio: **$0.0005 - $0.002 USD**
- 1000 conversaciones: **~$0.50 - $2.00 USD**
- Mensual (1000 clientes): **Menos de $5 USD**

### 🛠️ Solución de Problemas

**El código QR no aparece:**
```bash
# Verifica que el puerto 5222 (puerto de WhatsApp) no esté bloqueado
# Aumenta el nivel de log a debug
LOG_LEVEL=debug npm start
```

**Advertencia "GEMINI_API_KEY no definido":**
```bash
# Asegúrate de que tu archivo .env existe y contiene GEMINI_API_KEY
cat .env | grep GEMINI_API_KEY
```

**El bot no responde:**
```bash
# Verifica el estado del presupuesto en los logs
# Verifica que la clave API de Gemini sea válida
# Asegúrate de no estar en un grupo de WhatsApp (el bot ignora grupos)
```

**Problemas de autenticación:**
```bash
# Elimina la carpeta de autenticación y vuelve a escanear el código QR
rm -rf auth_info_baileys/
npm start
```

**El contenedor Docker no inicia:**
```bash
# Verifica los logs
docker-compose logs studio118-bot

# Reconstruye el contenedor
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 📁 Estructura del Proyecto

```
wa_bot/
├── index.js              # Manejador principal de conexión de WhatsApp
├── agent.js              # Agente de IA Gemini con personalidad
├── package.json          # Dependencias de Node.js
├── Dockerfile            # Definición del contenedor Docker
├── docker-compose.yml    # Configuración de Docker Compose
├── .env                  # Variables de entorno (crear este archivo)
├── auth_info_baileys/    # Almacenamiento de sesión de WhatsApp (auto-generado)
└── README.md            # Este archivo
```

### 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este proyecto fue construido con vibe coding, así que siéntete libre de:

1. Hacer fork del repositorio
2. Crear una rama de característica (`git checkout -b feature/caracteristica-increible`)
3. Hacer commit de tus cambios (`git commit -m 'Añadir característica increíble'`)
4. Push a la rama (`git push origin feature/caracteristica-increible`)
5. Abrir un Pull Request

### 📄 Licencia

Este proyecto está licenciado bajo la Licencia ISC.

### 👨‍💻 Autor

**Frodo Surfer** - [GitHub](https://github.com/FrodoSurfer)

### 🙏 Agradecimientos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - Increíble API de WhatsApp Web
- [Google Gemini](https://ai.google.dev/) - IA poderosa para conversaciones naturales
- Studio 118 - La inspiración para este bot
- La comunidad de vibe coding - Por la filosofía de desarrollo orgánico

