FROM golang:1.21-alpine

WORKDIR /app

COPY telemetry_generator.go .

CMD ["go", "run", "telemetry_generator.go"] 