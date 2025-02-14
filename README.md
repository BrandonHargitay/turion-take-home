# Satellite Telemetry Dashboard

A real-time dashboard for monitoring satellite telemetry data, including temperature, battery levels, altitude, and signal strength.

## Features

- Real-time telemetry data visualization
- Interactive charts showing historical data
- Anomaly detection and highlighting
- Time range filtering for data display
- Responsive design for various screen sizes

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. Clone the repository:
   ```bash
   git clone git@github.com:BrandonHargitay/turion-take-home.git
   cd turion-take-home
   ```

2. Start the application:
   ```bash
   docker-compose up -d
   ```

3. Access the dashboard:
   - Frontend: http://localhost:3000
   - API: http://localhost:8080

## Architecture

The application consists of several components:

- **Frontend**: React application with TypeScript
- **Backend API**: Go service handling telemetry data
- **Database**: PostgreSQL for data storage
- **Telemetry Generator**: Simulates satellite telemetry data

## Development

The project uses Docker Compose for local development. Each component can be rebuilt individually:

```bash
# Rebuild and restart specific service
docker-compose up -d --build [service_name]

# Rebuild all services
docker-compose up -d --build
```

## Project Structure

```
├── backend/             # Go backend API
│   ├── migrations/      # Database migrations
│   └── src/            # Source code
├── frontend/           # React frontend
│   ├── src/           # Source code
│   └── public/        # Static files
└── docker-compose.yml  # Docker composition
```


## Services

- **postgres**: PostgreSQL database (port 5432)
- **api**: Backend API service (port 8080)
- **frontend**: Web dashboard (port 3000)
- **telemetry**: Telemetry data generator

## API Endpoints

### API Documentation
```
GET /
Response: Overview of available endpoints

GET /api/v1/
Response: Detailed API documentation
```

### Get Historical Telemetry Data
```
GET /api/v1/telemetry

Query Parameters:
- start_time (ISO8601) - Start of time window (e.g., "2024-03-14T10:00:00Z")
- end_time (ISO8601) - End of time window (e.g., "2024-03-14T10:02:00Z")

Response:
[
  {
    "Timestamp": "2024-03-14T10:00:00Z",
    "SubsystemID": 1,
    "Temperature": 25.5,
    "Battery": 85.0,
    "Altitude": 525.0,
    "SignalStrength": -50.0,
    "IsAnomaly": false,
    "AnomalyType": null,
    "PacketSequence": 123
  },
  ...
]
```

### Get Current Telemetry
```
GET /api/v1/telemetry/current

Response:
{
  "Timestamp": "2024-03-14T10:02:00Z",
  "SubsystemID": 1,
  "Temperature": 36.5,
  "Battery": 35.0,
  "Altitude": 525.0,
  "SignalStrength": -50.0,
  "IsAnomaly": true,
  "AnomalyType": "HIGH_TEMPERATURE",
  "PacketSequence": 124
}
```

### Get Anomalies
```
GET /api/v1/telemetry/anomalies

Query Parameters:
- start_time (ISO8601) - Start of time window
- end_time (ISO8601) - End of time window

Response:
[
  {
    "id": "1710408000-HIGH_TEMPERATURE",
    "timestamp": "2024-03-14T10:00:00Z",
    "anomaly_type": "HIGH_TEMPERATURE"
  },
  {
    "id": "1710408300-LOW_BATTERY",
    "timestamp": "2024-03-14T10:05:00Z",
    "anomaly_type": "LOW_BATTERY"
  }
]
```
