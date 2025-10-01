# Studio 118 - Telegram Web App - Guía de Instalación para DietPi

## Descripción
Sistema de gestión de citas, clientes y servicios para Studio 118, integrado con Telegram Web App. Optimizado para ejecutarse en hardware modesto (Intel Celeron, 4GB RAM).

## Requisitos del Sistema
- DietPi (cualquier versión reciente)
- Node.js 20.x o superior
- 500MB de espacio en disco
- 1GB RAM disponible (el sistema es muy ligero)
- Conexión a Internet

## Instalación en DietPi

### 1. Actualizar el sistema
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Instalar Node.js
```bash
# Usando el gestor de paquetes de DietPi
sudo dietpi-software

# O instalar manualmente Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Verificar instalación
```bash
node --version  # Debe mostrar v20.x.x
npm --version
```

### 4. Clonar o copiar el repositorio
```bash
cd /opt
sudo git clone https://github.com/FrodoSurfer/studio.git
cd studio
```

O si tienes los archivos en tu máquina local, cópialos al servidor:
```bash
scp -r /ruta/local/studio usuario@servidor-dietpi:/opt/
```

### 5. Instalar dependencias
```bash
cd /opt/studio
npm install --production
```

### 6. Configurar variables de entorno
```bash
# Crear archivo .env
sudo nano .env
```

Agregar el siguiente contenido (ajustar según necesites):
```env
# Puerto para la web app (por defecto 3008)
WEBAPP_PORT=3008

# Variables opcionales del bot de WhatsApp (si lo usas)
GEMINI_API_KEY=tu_api_key_aqui
CONVO_BUDGET_USD=1
LOG_LEVEL=silent
```

### 7. Crear servicio systemd para auto-inicio

#### Para el Bot de WhatsApp:
```bash
sudo nano /etc/systemd/system/studio118-bot.service
```

Contenido:
```ini
[Unit]
Description=Studio 118 WhatsApp Bot
After=network.target

[Service]
Type=simple
User=dietpi
WorkingDirectory=/opt/studio
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=studio118-bot

[Install]
WantedBy=multi-user.target
```

#### Para la Web App:
```bash
sudo nano /etc/systemd/system/studio118-webapp.service
```

Contenido:
```ini
[Unit]
Description=Studio 118 Web App
After=network.target

[Service]
Type=simple
User=dietpi
WorkingDirectory=/opt/studio
ExecStart=/usr/bin/node webapp/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=studio118-webapp
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 8. Habilitar e iniciar los servicios
```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable studio118-webapp.service

# Iniciar el servicio
sudo systemctl start studio118-webapp.service

# Verificar estado
sudo systemctl status studio118-webapp.service
```

Si también usas el bot de WhatsApp:
```bash
sudo systemctl enable studio118-bot.service
sudo systemctl start studio118-bot.service
```

### 9. Configurar firewall (opcional pero recomendado)
```bash
# Permitir el puerto 3008
sudo ufw allow 3008/tcp

# Si usas nginx como proxy (recomendado)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 10. Configurar Nginx como proxy reverso (recomendado)

Instalar Nginx:
```bash
sudo apt install nginx -y
```

Crear configuración:
```bash
sudo nano /etc/nginx/sites-available/studio118
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # Cambiar por tu dominio o IP

    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Habilitar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/studio118 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 11. (Opcional) Configurar SSL con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

## Integración con Telegram

### 1. Crear un Bot de Telegram
1. Habla con [@BotFather](https://t.me/botfather) en Telegram
2. Crea un nuevo bot con `/newbot`
3. Guarda el token del bot

### 2. Configurar Web App
1. Usa el comando `/newapp` en BotFather
2. Selecciona tu bot
3. Proporciona la URL de tu aplicación: `https://tu-dominio.com`
4. Proporciona nombre, descripción y foto

### 3. Añadir botón de Web App
Puedes crear un menú o enviar un mensaje con un botón inline que abra tu Web App.

## Mantenimiento

### Ver logs
```bash
# Web App
sudo journalctl -u studio118-webapp.service -f

# Bot de WhatsApp
sudo journalctl -u studio118-bot.service -f
```

### Reiniciar servicios
```bash
sudo systemctl restart studio118-webapp.service
sudo systemctl restart studio118-bot.service
```

### Actualizar la aplicación
```bash
cd /opt/studio
git pull
npm install --production
sudo systemctl restart studio118-webapp.service
```

### Backup de la base de datos
```bash
# La base de datos SQLite está en webapp/database/studio118.db
cp /opt/studio/webapp/database/studio118.db /backup/studio118-$(date +%Y%m%d).db
```

### Script de backup automático
```bash
sudo nano /etc/cron.daily/studio118-backup
```

Contenido:
```bash
#!/bin/bash
cp /opt/studio/webapp/database/studio118.db /backup/studio118-$(date +%Y%m%d).db
find /backup -name "studio118-*.db" -mtime +30 -delete
```

Hacer ejecutable:
```bash
sudo chmod +x /etc/cron.daily/studio118-backup
```

## Monitoreo de Recursos

### Verificar uso de memoria
```bash
free -h
ps aux | grep node
```

### Verificar uso de CPU
```bash
top -p $(pgrep -f "node.*webapp/server.js")
```

## Troubleshooting

### La aplicación no inicia
```bash
# Verificar logs
sudo journalctl -u studio118-webapp.service -n 50

# Verificar que el puerto esté libre
sudo netstat -tulpn | grep 3008

# Reiniciar servicio
sudo systemctl restart studio118-webapp.service
```

### Base de datos corrupta
```bash
# Restaurar desde backup
cp /backup/studio118-FECHA.db /opt/studio/webapp/database/studio118.db
sudo systemctl restart studio118-webapp.service
```

### Poco espacio en disco
```bash
# Limpiar logs antiguos
sudo journalctl --vacuum-time=7d

# Limpiar paquetes npm cache
npm cache clean --force
```

## Optimización para Hardware Modesto

La aplicación ya está optimizada para ejecutarse en hardware modesto:
- Usa SQLite (base de datos ligera sin servidor)
- Dependencias mínimas
- Sin frameworks pesados en frontend
- Backend Express ligero
- Memoria típica: ~50-100MB por proceso

### Configuración adicional de DietPi (opcional)
```bash
# Reducir swap si tienes SSD (prolonga vida útil)
sudo nano /etc/dkim/dietpi.txt
# Ajustar AUTO_SETUP_SWAPFILE_SIZE=512

# Deshabilitar servicios innecesarios
sudo dietpi-services
```

## Acceso a la Aplicación

- Directamente: `http://tu-ip:3008`
- Con Nginx: `http://tu-dominio.com`
- Con SSL: `https://tu-dominio.com`
- Desde Telegram: A través del botón de Web App

## Seguridad

### Recomendaciones básicas
1. **Usar HTTPS**: Siempre configura SSL con Let's Encrypt
2. **Firewall**: Permite solo los puertos necesarios
3. **Actualizaciones**: Mantén el sistema y Node.js actualizados
4. **Backups**: Configura backups automáticos diarios
5. **Autenticación**: La autenticación viene integrada con Telegram Web App

### Autenticación de Telegram
La autenticación se maneja automáticamente por Telegram Web App SDK. Telegram envía los datos del usuario de forma segura, por lo que no necesitas implementar login adicional.

## Soporte

Para problemas o preguntas:
- GitHub Issues: https://github.com/FrodoSurfer/studio/issues
- Documentación API: Ver `/api/health` para verificar que el servidor está funcionando

## Licencia
ISC - Ver archivo LICENSE en el repositorio
