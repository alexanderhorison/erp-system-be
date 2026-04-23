# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install build tools needed for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++ bash

COPY package*.json ./
RUN npm install --omit=dev

# Rebuild bcrypt in Stage 1 so Stage 2 doesn't need build tools
RUN npm rebuild bcrypt --build-from-source

# Strip unnecessary files from node_modules to reduce image size
RUN find /app/node_modules -type f \( \
      -name "*.map" \
      -o -name "*.md" \
      -o -name "*.markdown" \
      -o -name "CHANGELOG*" \
      -o -name "CHANGES*" \
      -o -name "HISTORY*" \
      -o -name "LICENSE*" \
      -o -name "NOTICE*" \
      -o -name "README*" \
      -o -name "*.ts" ! -name "*.d.ts" \
    \) -delete 2>/dev/null || true && \
    find /app/node_modules -type d \( \
      -name "test" \
      -o -name "tests" \
      -o -name "__tests__" \
      -o -name "example" \
      -o -name "examples" \
      -o -name "docs" \
    \) -exec rm -rf {} + 2>/dev/null || true && \
    rm -rf /app/node_modules/@types

COPY . .

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app

# Define build-time argument for port
ARG PORT

# Install only minimal runtime dependencies
RUN apk add --no-cache bash tzdata

# Set timezone to Asia/Jakarta
ENV TZ=Asia/Jakarta
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled node_modules (including built bcrypt) and app code from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
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
COPY --from=builder /app/files ./files
COPY --from=builder /app/.sequelizerc ./

# Create volume for persistent data
VOLUME ["/app/data"]

# Set ownership of application files to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port using build argument
EXPOSE $PORT

# Start the application
CMD ["sh", "-c", "PORT=${PORT:-4000} NODE_ENV=${NODE_ENV:-production} npm start"]
