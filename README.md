# Satellite Telemetry System

A real-time satellite telemetry monitoring system that simulates and visualizes satellite health data.

## System Overview

This project implements a complete satellite telemetry monitoring system with:

- **Telemetry Generator**: Simulates a satellite by sending telemetry data via UDP every second
- **Backend API**: 
  - Ingests telemetry data via UDP (port 8089)
  - Stores data in PostgreSQL
  - Provides REST API endpoints for data access
- **Frontend Dashboard**:
  - Real-time telemetry visualization
  - Interactive time-series charts
  - Live gauge displays for current values
  - Anomaly detection and alerts

## Technology Stack

- **Frontend**:
  - React with TypeScript
  - Chart.js for data visualization
  - Material-UI for components
  - React Query for data fetching
- **Backend**:
  - Go
  - PostgreSQL for data storage
  - UDP server for telemetry ingestion
  - REST API for data access
- **Infrastructure**:
  - Docker and Docker Compose
  - Nginx for frontend serving

## Getting Started

1. Prerequisites:
   - Docker
   - Docker Compose

2. Run the system:
   ```bash
   docker-compose up -d
   ```

3. Access the dashboard:
   - Frontend: http://localhost:3000
   - API: http://localhost:8080

## Services

- **postgres**: PostgreSQL database (port 5432)
- **api**: Backend API service (port 8080)
- **frontend**: Web dashboard (port 3000)
- **telemetry**: Telemetry data generator

## Project Structure

```
.
├── backend/             # Go backend service
│   ├── src/            # Backend source code
│   └── migrations/     # Database migrations
├── frontend/           # React frontend
│   └── src/           # Frontend source code
└── docker-compose.yml  # Service configuration
```

## API Endpoints

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
