FROM golang:1.21-alpine3.23 AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o main ./main.go


FROM alpine:3.23

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]

