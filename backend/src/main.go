package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Create context that listens for the interrupt signal from the OS
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Create wait group for graceful shutdown
	var wg sync.WaitGroup

	// Initialize database connection
	db, err := initDB(ctx)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Start UDP listener for telemetry ingestion
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := startTelemetryIngestion(ctx, db); err != nil {
			log.Printf("Telemetry ingestion error: %v", err)
		}
	}()

	// Start HTTP API server
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := startAPIServer(ctx, db); err != nil {
			log.Printf("API server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	<-ctx.Done()
	log.Println("Shutting down gracefully...")

	// Wait for all goroutines to finish
	wg.Wait()
	log.Println("Shutdown complete")
} 