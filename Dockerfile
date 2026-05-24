# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-bullseye-slim AS deps

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-bullseye-slim AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY start.sh ./start.sh

# Install prisma CLI globally (build time, has internet access)
# so it runs with all dependencies before starting the app
RUN npm install -g prisma@5.22.0 && npm cache clean --force && chmod +x start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Sync schema, seed if empty, then start
CMD ["./start.sh"]