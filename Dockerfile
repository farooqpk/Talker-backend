# Stage 1: Build
FROM node:20-alpine AS build

# Install OpenSSL and dependencies for Prisma
RUN apk update && \
    apk add --no-cache \
    openssl \
    libssl1.1 \
    zlib \
    && rm -rf /var/cache/apk/*
    
# Set the working directory
WORKDIR /app

# Copy application code
COPY . .

# Install dependencies
RUN npm ci

# Set the environment variable
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy only the production build from the previous stage
COPY --from=build /app/dist ./dist

# Copy only production dependencies
COPY --from=build /app/node_modules ./node_modules

# Start the application
CMD [ "node", "dist/main.js" ]
