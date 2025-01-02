# Stage 1: Build
FROM node:20-slim AS build

# Install OpenSSL 3.0.x (for Prisma) and log the OpenSSL version
RUN apt-get update -y && \
    apt-get install -y openssl=3.0.* && \
    apt-get clean && \
    echo "OpenSSL Version: $(openssl version)"

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
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy only the production build from the previous stage
COPY --from=build /app/dist ./dist

# Copy only production dependencies
COPY --from=build /app/node_modules ./node_modules

# Start the application
CMD [ "node", "dist/main.js" ]
