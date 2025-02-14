package main

import (
	"bytes"
	"context"
	"encoding/binary"
	"log"
	"net"
	"time"
)

// TelemetryData represents processed telemetry data
type TelemetryData struct {
	Timestamp      time.Time
	SubsystemID    uint16
	Temperature    float32
	Battery        float32
	Altitude       float32
	SignalStrength float32
	IsAnomaly      bool
	AnomalyType    string
	PacketSequence uint16
}

func startTelemetryIngestion(ctx context.Context, db *DB) error {
	addr := ":8089"
	udpAddr, err := net.ResolveUDPAddr("udp", addr)
	if err != nil {
		return err
	}

	conn, err := net.ListenUDP("udp", udpAddr)
	if err != nil {
		return err
	}
	defer conn.Close()

	log.Printf("Listening for telemetry on UDP %s", addr)

	buffer := make([]byte, 1024)
	for {
		select {
		case <-ctx.Done():
			return nil
		default:
			n, _, err := conn.ReadFromUDP(buffer)
			if err != nil {
				log.Printf("Error reading UDP: %v", err)
				continue
			}

			data, err := processTelemetryPacket(buffer[:n])
			if err != nil {
				log.Printf("Error processing telemetry: %v", err)
				continue
			}

			if err := db.SaveTelemetry(ctx, data); err != nil {
				log.Printf("Error saving telemetry: %v", err)
				continue
			}

			if data.IsAnomaly {
				log.Printf("Anomaly detected: %s", data.AnomalyType)
			}
		}
	}
}

func processTelemetryPacket(packet []byte) (*TelemetryData, error) {
	buf := bytes.NewReader(packet)

	// Read primary header
	var primaryHeader CCSDSPrimaryHeader
	if err := binary.Read(buf, binary.BigEndian, &primaryHeader); err != nil {
		return nil, err
	}

	// Read secondary header
	var secondaryHeader CCSDSSecondaryHeader
	if err := binary.Read(buf, binary.BigEndian, &secondaryHeader); err != nil {
		return nil, err
	}

	// Read payload
	var payload TelemetryPayload
	if err := binary.Read(buf, binary.BigEndian, &payload); err != nil {
		return nil, err
	}

	// Check for anomalies
	isAnomaly := false
	var anomalyType string

	if payload.Temperature > 35.0 {
		isAnomaly = true
		anomalyType = "HIGH_TEMPERATURE"
	} else if payload.Battery < 40.0 {
		isAnomaly = true
		anomalyType = "LOW_BATTERY"
	} else if payload.Altitude < 400.0 {
		isAnomaly = true
		anomalyType = "LOW_ALTITUDE"
	} else if payload.Signal < -80.0 {
		isAnomaly = true
		anomalyType = "WEAK_SIGNAL"
	}

	return &TelemetryData{
		Timestamp:      time.Unix(int64(secondaryHeader.Timestamp), 0),
		SubsystemID:    secondaryHeader.SubsystemID,
		Temperature:    payload.Temperature,
		Battery:        payload.Battery,
		Altitude:       payload.Altitude,
		SignalStrength: payload.Signal,
		IsAnomaly:      isAnomaly,
		AnomalyType:    anomalyType,
		PacketSequence: primaryHeader.PacketSeqCtrl & 0x3FFF,
	}, nil
} 