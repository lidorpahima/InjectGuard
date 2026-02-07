# Debian-based image: Prisma engines work reliably (Alpine/musl often causes "not compatible with your system")
FROM node:18-slim

WORKDIR /app

# Prisma needs OpenSSL at runtime; slim image may lack it or Prisma picks wrong engine without it
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Prisma generate (schema already in image; DATABASE_URL can be set at runtime)
RUN npx prisma generate

EXPOSE 3000

# Dev: hot reload. For production use: npm run build && npm start
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
