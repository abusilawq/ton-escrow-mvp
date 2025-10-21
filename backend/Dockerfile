# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Dependencies o'rnatish
COPY package*.json ./
RUN npm install

# Source code nusxalash
COPY . .

# Build
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
