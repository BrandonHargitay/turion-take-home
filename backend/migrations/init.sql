-- Create telemetry table
CREATE TABLE telemetry (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    subsystem_id SMALLINT NOT NULL,
    temperature REAL NOT NULL,
    battery REAL NOT NULL,
    altitude REAL NOT NULL,
    signal_strength REAL NOT NULL,
    is_anomaly BOOLEAN NOT NULL,
    anomaly_type VARCHAR(50),
    packet_sequence INT NOT NULL
);

CREATE INDEX idx_telemetry_timestamp ON telemetry (timestamp DESC);
CREATE INDEX idx_telemetry_subsystem_time ON telemetry (subsystem_id, timestamp DESC);
CREATE INDEX idx_telemetry_anomaly ON telemetry (is_anomaly, timestamp DESC) WHERE is_anomaly = true;

CREATE VIEW latest_telemetry AS
SELECT DISTINCT ON (subsystem_id)
    id,
    timestamp,
    subsystem_id,
    temperature,
    battery,
    altitude,
    signal_strength,
    is_anomaly,
    anomaly_type,
    packet_sequence
FROM telemetry
ORDER BY subsystem_id, timestamp DESC; 