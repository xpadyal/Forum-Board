# ---------- Base Builder ----------
    FROM node:22-alpine AS builder
    WORKDIR /app
    
    # Install dependencies first (cached for faster builds)
    COPY package*.json ./
    RUN npm ci
    
    # Copy the rest of the project files
    COPY . .
    
    # Set environment variables for build
    # NEXT_PUBLIC_API_URL can be passed as build argument
    ARG NEXT_PUBLIC_API_URL
    ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    ENV NEXT_TELEMETRY_DISABLED=1
    
    # Build the Next.js app
    RUN npm run build
    
    # ---------- Production Runner ----------
    FROM node:22-alpine AS runner
    WORKDIR /app
    
    # Copy only necessary files from builder
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/node_modules ./node_modules
    
    # Set environment variables
    ENV NODE_ENV=production
    ENV PORT=8080
    
    # Expose port for Fly
    EXPOSE 8080
    
    # Start Next.js
    CMD ["npm", "start"]
    