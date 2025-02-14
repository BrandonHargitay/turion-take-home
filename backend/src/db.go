package main

import (
	"context"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	pool *pgxpool.Pool
}

func initDB(ctx context.Context) (*DB, error) {
	// Get database URL from environment variable or use default
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://admin:password@localhost:5432/satellite_telemetry"
	}

	// Create connection pool
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		return nil, err
	}

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}

	return &DB{pool: pool}, nil
}

func (db *DB) Close() {
	if db.pool != nil {
		db.pool.Close()
	}
}

// SaveTelemetry saves telemetry data to the database
func (db *DB) SaveTelemetry(ctx context.Context, data *TelemetryData) error {
	query := `
		INSERT INTO telemetry (
			timestamp, subsystem_id, temperature, battery, 
			altitude, signal_strength, is_anomaly, anomaly_type, 
			packet_sequence
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := db.pool.Exec(ctx, query,
		data.Timestamp,
		data.SubsystemID,
		data.Temperature,
		data.Battery,
		data.Altitude,
		data.SignalStrength,
		data.IsAnomaly,
		data.AnomalyType,
		data.PacketSequence,
	)
	return err
} 