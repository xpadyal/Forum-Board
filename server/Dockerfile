# ---------- Build stage ----------
  FROM node:22-alpine AS builder
  WORKDIR /app
  
  # 1️⃣ Copy package files and Prisma schema first (for caching)
  COPY package*.json ./
  COPY prisma ./prisma/
  
  # 2️⃣ Install all deps (include dev so we can run prisma generate)
  RUN npm ci
  
  # 3️⃣ Generate Prisma client
  # RUN npx prisma generate
  
  # 4️⃣ Copy the rest of the app (source code, migrations, etc.)
  COPY . .
  
  # ---------- Runtime stage ----------
  FROM node:22-alpine
  WORKDIR /app
  
   # 5️⃣ Copy package files and install only production deps + dotenv (needed at runtime)
   COPY package*.json ./
   RUN npm ci --omit=dev && npm install dotenv
   
   # 6️⃣ Copy node_modules Prisma client and migrations from builder
   COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
   COPY --from=builder /app/prisma ./prisma
   COPY --from=builder /app/src ./src
   COPY --from=builder /app/server.js ./
   COPY --from=builder /app/config.js ./
   COPY --from=builder /app/package*.json ./
  
  # 7️⃣ Env + exposed port
  ENV NODE_ENV=production
  ENV PORT=8080
  EXPOSE 8080
  
  # 8️⃣ Run Prisma migration deploy before starting server
  CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm start"]

  