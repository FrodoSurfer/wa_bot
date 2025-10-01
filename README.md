# Studio 118 - Sistema Integral de Gestión

Sistema completo para gestión de citas, clientes y servicios de belleza, integrado con WhatsApp y Telegram.

## 🌟 Características

### Bot de WhatsApp
- Conversaciones naturales con IA (Gemini)
- Gestión de citas automática
- Información de servicios y precios
- Soporte para fotos e historial químico

### Telegram Web App
- 📅 **Gestión de Citas**: Crear, editar y eliminar citas
- 👥 **CRM de Clientes**: Base de datos completa de clientes
- 💇 **Servicios y Precios**: Administración de servicios
- 🚫 **Bloques de Horario**: Gestión de disponibilidad

## 🚀 Inicio Rápido

### Requisitos
- Node.js 20.x o superior
- 500MB de espacio en disco
- 1GB RAM disponible

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/FrodoSurfer/studio.git
cd studio

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
nano .env

# Iniciar Web App
npm run webapp

# En otra terminal, iniciar Bot de WhatsApp (opcional)
npm start
```

### Variables de Entorno

```env
# Web App
WEBAPP_PORT=3008

# Bot de WhatsApp (opcional)
GEMINI_API_KEY=tu_api_key_aqui
CONVO_BUDGET_USD=1
LOG_LEVEL=silent
```

## 📱 Telegram Web App

### Características
- Interfaz optimizada para móvil
- Integración nativa con Telegram
- Sin necesidad de login adicional
- Modo oscuro automático

### Endpoints API

#### Clientes
- `GET /api/clients` - Listar clientes
- `GET /api/clients/:id` - Obtener cliente
- `POST /api/clients` - Crear cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente

#### Servicios
- `GET /api/services` - Listar servicios
- `GET /api/services/:id` - Obtener servicio
- `POST /api/services` - Crear servicio
- `PUT /api/services/:id` - Actualizar servicio
- `DELETE /api/services/:id` - Eliminar servicio

#### Citas
- `GET /api/appointments` - Listar citas
- `GET /api/appointments/:id` - Obtener cita
- `POST /api/appointments` - Crear cita
- `PUT /api/appointments/:id` - Actualizar cita
- `DELETE /api/appointments/:id` - Eliminar cita

#### Bloques de Horario
- `GET /api/schedule` - Listar bloques
- `POST /api/schedule` - Crear bloque
- `DELETE /api/schedule/:id` - Eliminar bloque

## 🗄️ Base de Datos

SQLite con las siguientes tablas:
- `clients` - Información de clientes
- `services` - Servicios y precios
- `appointments` - Citas programadas
- `schedule_blocks` - Bloques de horario no disponibles

## 🔧 Desarrollo

### Estructura del Proyecto

```
studio/
├── agent.js              # Lógica del agente IA
├── index.js              # Bot de WhatsApp
├── package.json          # Dependencias
├── webapp/
│   ├── server.js         # Servidor Express
│   ├── database/
│   │   └── init.js       # Inicialización DB
│   └── public/
│       ├── index.html    # Frontend
│       └── app.js        # Lógica del frontend
├── DEPLOYMENT.md         # Guía de despliegue
└── README.md             # Este archivo
```

### Scripts Disponibles

```bash
npm start           # Iniciar bot de WhatsApp
npm run webapp      # Iniciar Web App
npm run dev         # Alias de webapp
```

## 📦 Despliegue en Producción

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas de instalación en DietPi.

### Resumen
1. Instalar Node.js 20.x
2. Clonar repositorio
3. Instalar dependencias
4. Configurar variables de entorno
5. Crear servicios systemd
6. Configurar Nginx (opcional)
7. Configurar SSL con Let's Encrypt

## 🔒 Seguridad

- Autenticación integrada con Telegram
- CORS configurado
- Datos validados en backend
- SQLite con foreign keys habilitadas
- Preparado para HTTPS

## 💡 Uso

### Crear Bot de Telegram
1. Habla con [@BotFather](https://t.me/botfather)
2. Crea un nuevo bot con `/newbot`
3. Usa `/newapp` para crear Web App
4. Proporciona URL de tu aplicación

### Configurar Web App
1. La aplicación se sirve en `http://localhost:3008`
2. Configura este URL en Telegram BotFather
3. Añade botón de Web App a tu bot

## 🎨 Personalización

### Estilos
El frontend usa TailwindCSS. Los colores se adaptan automáticamente al tema de Telegram.

### Servicios Predeterminados
Los servicios se cargan automáticamente en la primera ejecución:
- Corte - $350 (60 min)
- Efecto de Color (Corto) - $3500 (120 min)
- Efecto de Color (Medio) - $3700 (150 min)
- Efecto de Color (Largo) - $4300 (180 min)
- Nanoplastia - $2500 (180 min)
- Extensiones - $3000 (180 min)

## 🐛 Solución de Problemas

### La aplicación no inicia
```bash
# Verificar puerto disponible
lsof -i :3008

# Ver logs
npm run webapp 2>&1 | tee webapp.log
```

### Error de base de datos
```bash
# Eliminar y reinicializar
rm webapp/database/studio118.db
npm run webapp
```

### Problemas de memoria
El sistema está optimizado para hardware modesto (50-100MB típico).

## 📊 Monitoreo

### Health Check
```bash
curl http://localhost:3008/api/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

ISC License - ver LICENSE para más detalles

## 👤 Autor

**Frodo Surfer**
- GitHub: [@FrodoSurfer](https://github.com/FrodoSurfer)

## 🙏 Agradecimientos

- Gemini AI por el motor de conversación
- Baileys por la integración con WhatsApp
- Telegram por el Web App SDK
- La comunidad de código abierto

---

**Studio 118** - Sistema de gestión para el salón de belleza moderno ✨
