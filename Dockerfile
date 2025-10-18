# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies for building native modules like bcrypt
RUN apk add --no-cache python3 make g++ bash

COPY package*.json ./
RUN npm install
COPY . .

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app

# Install runtime dependencies for bcrypt and other native modules
RUN apk add --no-cache bash libc6-compat python3 make g++

# Create a non-root user to run the application
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files and node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Rebuild bcrypt for Alpine Linux to prevent SIGSEGV
RUN npm rebuild bcrypt --build-from-source

# Copy only the necessary application code
COPY --from=builder /app/app.js ./
COPY --from=builder /app/config ./config
COPY --from=builder /app/const ./const
COPY --from=builder /app/controllers ./controllers
COPY --from=builder /app/models ./models
COPY --from=builder /app/routers ./routers
COPY --from=builder /app/services ./services
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeders ./seeders
COPY --from=builder /app/helpers ./helpers
COPY --from=builder /app/data ./data
COPY --from=builder /app/template ./template
COPY --from=builder /app/.sequelizerc ./

# Try to copy .env file if it exists using shell commands instead of COPY
RUN touch .env && \
    if [ -f /builder/.env ]; then cp /builder/.env ./.env; fi

# Create volume for persistent data
VOLUME ["/app/data"]

# Set ownership of application files to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port (will be overridden by environment)
EXPOSE ${PORT:-4000}

# Start the application using environment variables
CMD ["sh", "-c", "PORT=${PORT:-4000} NODE_ENV=${NODE_ENV:-production} npm start"]