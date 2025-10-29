# Imagen base
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /usr/src/app

# Dependencias del sistema (git para dependencias npm desde repos)
RUN apk add --no-cache git

# Copia de definiciones para aprovechar caché
COPY package*.json ./

# Instalación de dependencias (usa ci si existe lockfile, si no, fallback a install)
RUN npm install --omit=dev

# Copia del resto del código
COPY . .

# Modo producción
ENV NODE_ENV=production

# No exponemos puertos porque Baileys no abre un server HTTP
# EXPOSE 3008  # Puedes eliminarlo

# Ejecuta el bot
CMD ["node", "index.js"]
