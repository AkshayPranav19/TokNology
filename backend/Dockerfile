# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Ensure dev deps (e.g., nodemon) are installed
ENV NODE_ENV=development

# Install deps first (cache layer)
COPY package*.json ./
RUN npm ci --include=dev

# Copy app source
COPY . .

ENV PORT=5050
EXPOSE 5050

# Start your dev server (expects "dev" script in package.json)
CMD ["npm", "run", "dev"]
