# Turion GSW Take Home

### Starter Code
```go
package main

import (
    "bytes"
    "encoding/binary"
    "log"
    "math/rand"
    "net"
    "time"
)

// CCSDS Primary Header (6 bytes)
type CCSDSPrimaryHeader struct {
    PacketID      uint16 // Version(3 bits), Type(1 bit), SecHdrFlag(1 bit), APID(11 bits)
    PacketSeqCtrl uint16 // SeqFlags(2 bits), SeqCount(14 bits)
    PacketLength  uint16 // Total packet length minus 7
}

// CCSDS Secondary Header (10 bytes)
type CCSDSSecondaryHeader struct {
    Timestamp uint64 // Unix timestamp
    SubsystemID uint16 // Identifies the subsystem (e.g., power, thermal)
}

// Telemetry Payload
type TelemetryPayload struct {
    Temperature float32 // Temperature in Celsius
    Battery     float32 // Battery percentage
    Altitude    float32 // Altitude in kilometers
    Signal      float32 // Signal strength in dB
}

const (
    APID           = 0x01
    PACKET_VERSION = 0x0
    PACKET_TYPE    = 0x0    // 0 = TM (telemetry)
    SEC_HDR_FLAG   = 0x1    // Secondary header present
    SEQ_FLAGS      = 0x3    // Standalone packet
    SUBSYSTEM_ID   = 0x0001 // Main bus telemetry
)

func main() {
    conn, err := net.Dial("udp", "localhost:8089")
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    packetCount := uint16(0)
    for {
        data := createTelemetryPacket(&packetCount)
        
        _, err := conn.Write(data)
        if err != nil {
            log.Printf("Error sending telemetry: %v", err)
            continue
        }

        if packetCount%5 == 0 {
            log.Printf("Sent anomalous telemetry packet #%d\n", packetCount)
        } else {
            log.Printf("Sent normal telemetry packet #%d\n", packetCount)
        }
        
        time.Sleep(1 * time.Second)
        packetCount++
    }
}

func createTelemetryPacket(seqCount *uint16) []byte {
    buf := new(bytes.Buffer)

    // Create primary header
    // PacketID: Version(3) | Type(1) | SecHdrFlag(1) | APID(11)
    packetID := uint16(PACKET_VERSION)<<13 | 
                uint16(PACKET_TYPE)<<12 | 
                uint16(SEC_HDR_FLAG)<<11 | 
                uint16(APID)

    // PacketSeqCtrl: SeqFlags(2) | SeqCount(14)
    packetSeqCtrl := uint16(SEQ_FLAGS)<<14 | (*seqCount & 0x3FFF)

    // Generate telemetry data
    payload := generateTelemetryPayload(*seqCount%5 == 0)
    
    // Calculate total packet length (excluding primary header first 6 bytes)
    packetDataLength := uint16(binary.Size(CCSDSSecondaryHeader{}) + 
                              binary.Size(TelemetryPayload{}) - 1)

    primaryHeader := CCSDSPrimaryHeader{
        PacketID:      packetID,
        PacketSeqCtrl: packetSeqCtrl,
        PacketLength:  packetDataLength,
    }

    // Create secondary header
    secondaryHeader := CCSDSSecondaryHeader{
        Timestamp:   uint64(time.Now().Unix()),
        SubsystemID: SUBSYSTEM_ID,
    }

    // Write headers and payload
    binary.Write(buf, binary.BigEndian, primaryHeader)    // CCSDS uses big-endian
    binary.Write(buf, binary.BigEndian, secondaryHeader)
    binary.Write(buf, binary.BigEndian, payload)

    return buf.Bytes()
}

func generateTelemetryPayload(generateAnomaly bool) TelemetryPayload {
    if generateAnomaly {
        // Randomly choose one parameter to be anomalous
        anomalyType := rand.Intn(4)
        switch anomalyType {
        case 0:
            return TelemetryPayload{
                Temperature: randomFloat(35.0, 40.0), // High temperature anomaly
                Battery:     randomFloat(70.0, 100.0),
                Altitude:    randomFloat(500.0, 550.0),
                Signal:      randomFloat(-60.0, -40.0),
            }
        case 1:
            return TelemetryPayload{
                Temperature: randomFloat(20.0, 30.0),
                Battery:     randomFloat(20.0, 40.0), // Low battery anomaly
                Altitude:    randomFloat(500.0, 550.0),
                Signal:      randomFloat(-60.0, -40.0),
            }
        case 2:
            return TelemetryPayload{
                Temperature: randomFloat(20.0, 30.0),
                Battery:     randomFloat(70.0, 100.0),
                Altitude:    randomFloat(300.0, 400.0), // Low altitude anomaly
                Signal:      randomFloat(-60.0, -40.0),
            }
        default:
            return TelemetryPayload{
                Temperature: randomFloat(20.0, 30.0),
                Battery:     randomFloat(70.0, 100.0),
                Altitude:    randomFloat(500.0, 550.0),
                Signal:      randomFloat(-90.0, -80.0), // Weak signal anomaly
            }
        }
    }

    return TelemetryPayload{
        Temperature: randomFloat(20.0, 30.0),  // Normal operating range
        Battery:     randomFloat(70.0, 100.0), // Battery percentage
        Altitude:    randomFloat(500.0, 550.0),// Orbit altitude
        Signal:      randomFloat(-60.0, -40.0),// Signal strength
    }
}

func randomFloat(min, max float32) float32 {
    return min + rand.Float32()*(max-min)
}
```
### About this starter code:
This is a sample telemetry generator that sends spacecraft data over UDP. While you're welcome to use it as-is, you can also implement a simpler solution. The key requirement is the ability to:
- Serialize data into bytes
- Send those bytes over UDP
- Deserialize the received bytes back into structured data

That's all you need to know to get started!

### Part 1: Telemetry Ingestion Service (Required)
#### Requirements

1. Create a service that:

* listens for UDP packets containing spacecraft telemetry
* Decodes CCSDS-formatted packets according to provided structure
* Validates telemetry values against defined ranges:
```
Temperature: 20.0°C to 30.0°C (normal), >35.0°C (anomaly)
Battery: 70-100% (normal), <40% (anomaly)
Altitude: 500-550km (normal), <400km (anomaly)
Signal Strength: -60 to -40dB (normal), <-80dB (anomaly)
```

* Persists data to a database (Timescale or PostgreSQL preferred but not required.)
* Implements an alerting mechanism for out-of-range values (Anomalies)



## Part 2: Telemetry API Service (Required)
### Requirements
1. Create a REST API using Fiber/Echo (Go), FastAPI (Python), or Express/Fastify (TypeScript) that provides:
   - Historical telemetry queries with time range filtering
   - Aggregation endpoints (min, max, avg) over time periods
   - Current satellite status endpoint
   - Anomaly history endpoint

### API Endpoints (Minimum Required)
```
GET /api/v1/telemetry
  - Query Parameters: 
    - start_time (ISO8601)
    - end_time (ISO8601)
    
GET /api/v1/telemetry/current
  - Returns latest telemetry values

GET /api/v1/telemetry/anomalies
  - Query Parameters:
    - start_time (ISO8601)
    - end_time (ISO8601)
```


### Part 3 Front End Implementation
Create a telemetry dashboard that:
- **Real-time updates:** Display the most recent telemetry values in real time.
- **Historical graphs or tables:** Show historical telemetry data.
- **Anomaly notifications:** Provide real-time anomaly notifications.


### Technical Requirements
- Use **React** (You can use another front end tool, if you do not understand react) for the frontend.

---

### Optional
Candidates can emphasize either frontend or backend through optional requirements:

#### Frontend-Focused Optional Requirements
- **Error handling:** Implement basic error handling and loading states.
- **Responsive design:** Ensure the dashboard works on desktop and mobile.
- **User experience:** Add features like search/filter for telemetry data, dark mode, or theming.
- **Telemetry visualization:** Include charts for telemetry metrics (embedded Grafana is acceptable).

#### Backend-Focused Optional Requirements
- **Database migrations:** Implement migrations for storing telemetry data and managing schema evolution (setting up the system and having one migration is acceptable).
- **Observability:** Use OpenTelemetry to instrument backend APIs and pipelines, with optional visualization using Grafana Tempo, Loki, Prometheus/Mimir.
- **Integration test:** Write integration tests to ensure the API correctly serves telemetry data and handles edge cases (e.g., real-time updates, data gaps).
- **Performance testing:** Include performance benchmarks for real-time update pipelines and historical queries.

---

### Bonus Points
- **Docker Compose:** Provide a working Docker Compose file for local development with all dependencies (frontend, backend, database, observability tools).
- **Comprehensive tests:** Include unit tests, integration tests, and end-to-end tests.
- **Performance testing results:** Provide evidence of load testing or benchmarking (e.g., using tools like JMeter, k6, or Locust).
