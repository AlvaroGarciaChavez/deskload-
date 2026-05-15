FROM node:20-alpine

# Instalar Python y FFmpeg (requerimientos críticos para yt-dlp)
RUN apk add --no-cache python3 ffmpeg

# Crear y movernos a la carpeta de la app
WORKDIR /app

# Copiar configuración de Node y descargar librerías
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto del código del servidor
COPY . .

# Exponer el puerto donde correrá el backend
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
