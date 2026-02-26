FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

# Build the application with CGO disabled
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server/main.go

FROM alpine:3.21

WORKDIR /app

COPY --from=builder /app/server .

COPY --from=builder /app/static ./static

EXPOSE 8080

CMD ["./server"]
