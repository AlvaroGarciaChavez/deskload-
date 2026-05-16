FROM node:20-bookworm-slim

# Instalar Python y FFmpeg (requerimientos críticos para yt-dlp en Debian)
RUN apt-get update && apt-get install -y python3 ffmpeg curl && rm -rf /var/lib/apt/lists/*

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
