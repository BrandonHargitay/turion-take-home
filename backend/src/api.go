package main

import (
	"context"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func startAPIServer(ctx context.Context, db *DB) error {
	app := fiber.New()

	app.Use(logger.New())
	app.Use(cors.New())

	// Root endpoint with API information
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Satellite Telemetry API",
			"version": "1.0",
			"endpoints": []string{
				"/api/v1/telemetry - Get historical telemetry data",
				"/api/v1/telemetry/current - Get current telemetry",
				"/api/v1/telemetry/anomalies - Get anomaly data",
			},
		})
	})

	// Setup API routes
	api := app.Group("/api/v1")

	// API documentation
	api.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"endpoints": map[string]interface{}{
				"/telemetry": map[string]string{
					"description": "Get historical telemetry data",
					"method":     "GET",
					"params":     "start_time (ISO8601), end_time (ISO8601)",
				},
				"/telemetry/current": map[string]string{
					"description": "Get current telemetry data",
					"method":     "GET",
				},
				"/telemetry/anomalies": map[string]string{
					"description": "Get anomaly data",
					"method":     "GET",
					"params":     "start_time (ISO8601), end_time (ISO8601)",
				},
			},
		})
	})

	// Get telemetry data with time range
	api.Get("/telemetry", func(c *fiber.Ctx) error {
		startTime := c.Query("start_time")
		endTime := c.Query("end_time")

		var start, end time.Time
		var err error

		if startTime != "" {
			start, err = time.Parse(time.RFC3339, startTime)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{
					"error": "Invalid start_time format. Use ISO8601",
				})
			}
		} else {
			start = time.Now().Add(-24 * time.Hour) // Default to last 24 hours
		}

		if endTime != "" {
			end, err = time.Parse(time.RFC3339, endTime)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{
					"error": "Invalid end_time format. Use ISO8601",
				})
			}
		} else {
			end = time.Now()
		}

		query := `
			SELECT timestamp, subsystem_id, temperature, battery, 
				   altitude, signal_strength, is_anomaly, anomaly_type, 
				   packet_sequence
			FROM telemetry
			WHERE timestamp BETWEEN $1 AND $2
			ORDER BY timestamp DESC`

		rows, err := db.pool.Query(ctx, query, start, end)
		if err != nil {
			return err
		}
		defer rows.Close()

		var results []TelemetryData
		for rows.Next() {
			var data TelemetryData
			err := rows.Scan(
				&data.Timestamp,
				&data.SubsystemID,
				&data.Temperature,
				&data.Battery,
				&data.Altitude,
				&data.SignalStrength,
				&data.IsAnomaly,
				&data.AnomalyType,
				&data.PacketSequence,
			)
			if err != nil {
				return err
			}
			results = append(results, data)
		}

		return c.JSON(results)
	})

	// Get current telemetry
	api.Get("/telemetry/current", func(c *fiber.Ctx) error {
		query := `
			SELECT timestamp, subsystem_id, temperature, battery, 
				   altitude, signal_strength, is_anomaly, anomaly_type, 
				   packet_sequence
			FROM telemetry
			ORDER BY timestamp DESC
			LIMIT 1`

		var data TelemetryData
		err := db.pool.QueryRow(ctx, query).Scan(
			&data.Timestamp,
			&data.SubsystemID,
			&data.Temperature,
			&data.Battery,
			&data.Altitude,
			&data.SignalStrength,
			&data.IsAnomaly,
			&data.AnomalyType,
			&data.PacketSequence,
		)
		if err != nil {
			return err
		}

		return c.JSON(data)
	})

	// Get anomalies
	api.Get("/telemetry/anomalies", func(c *fiber.Ctx) error {
		startTime := c.Query("start_time")
		endTime := c.Query("end_time")

		var start, end time.Time
		var err error

		if startTime != "" {
			start, err = time.Parse(time.RFC3339, startTime)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{
					"error": "Invalid start_time format. Use ISO8601",
				})
			}
		} else {
			start = time.Now().Add(-24 * time.Hour) // Default to last 24 hours
		}

		if endTime != "" {
			end, err = time.Parse(time.RFC3339, endTime)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{
					"error": "Invalid end_time format. Use ISO8601",
				})
			}
		} else {
			end = time.Now()
		}

		query := `
			SELECT timestamp, subsystem_id, temperature, battery, 
				   altitude, signal_strength, is_anomaly, anomaly_type, 
				   packet_sequence
			FROM telemetry
			WHERE timestamp BETWEEN $1 AND $2
				AND is_anomaly = true
			ORDER BY timestamp DESC`

		rows, err := db.pool.Query(ctx, query, start, end)
		if err != nil {
			return err
		}
		defer rows.Close()

		var results []TelemetryData
		for rows.Next() {
			var data TelemetryData
			err := rows.Scan(
				&data.Timestamp,
				&data.SubsystemID,
				&data.Temperature,
				&data.Battery,
				&data.Altitude,
				&data.SignalStrength,
				&data.IsAnomaly,
				&data.AnomalyType,
				&data.PacketSequence,
			)
			if err != nil {
				return err
			}
			results = append(results, data)
		}

		return c.JSON(results)
	})

	// Start server
	go func() {
		if err := app.Listen(":8080"); err != nil {
			log.Printf("API server error: %v", err)
		}
	}()

	// Wait for context cancellation
	<-ctx.Done()
	return app.Shutdown()
} 