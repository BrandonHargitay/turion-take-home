export interface TelemetryData {
    id?: number;
    Timestamp: string;
    SubsystemID: number;
    Temperature: number;
    Battery: number;
    Altitude: number;
    SignalStrength: number;
    IsAnomaly: boolean;
    AnomalyType: string | null;
    PacketSequence: number;
}

export interface TelemetryResponse {
    data: TelemetryData[];
}

export interface CurrentTelemetryResponse {
    data: TelemetryData;
}

export interface AnomalyData {
    id: string | number;
    timestamp: string;
    anomaly_type: string;
} 