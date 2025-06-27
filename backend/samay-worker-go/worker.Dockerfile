# Stage 1: Build the binary using official Go + Debian Bookworm base
FROM golang:1.24-bookworm AS builder

WORKDIR /app

# Copy go.mod and go.sum first to leverage cache
COPY go.mod go.sum ./

RUN go mod download

# Copy source files
COPY . .

# Build statically-linked binary
RUN go build -ldflags="-s -w" -o worker .

# Stage 2: Minimal Debian-based runtime
FROM debian:bookworm-slim

WORKDIR /app

# Install CA certificates (needed for HTTPS requests in many CLI tools)
# RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
#     rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/worker .

# Entrypoint: run the CLI
ENTRYPOINT ["./worker"]

