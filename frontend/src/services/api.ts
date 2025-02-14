import axios, { AxiosResponse, AxiosError } from 'axios';
import { TelemetryData, AnomalyData } from '../types/telemetry';

const api = axios.create({
    baseURL: '/api/v1',
    timeout: 5000,
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', response);
    return response;
  },
  (error: AxiosError) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getTelemetryData = async (startTime?: string, endTime?: string): Promise<TelemetryData[]> => {
    const params = new URLSearchParams();
    if (startTime) params.append('start_time', startTime);
    if (endTime) params.append('end_time', endTime);

    const response = await api.get<TelemetryData[]>('/telemetry', { params });
    return response.data;
};

export const getCurrentTelemetry = async (): Promise<TelemetryData> => {
    try {
        const response = await api.get<TelemetryData>('/telemetry/current');
        console.log('Raw API response:', response);
        console.log('Current telemetry response data:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching current telemetry:', error);
        throw error;
    }
};

export const getAnomalies = async (startTime: string, endTime: string): Promise<AnomalyData[]> => {
    const params = new URLSearchParams();
    params.append('start_time', startTime);
    params.append('end_time', endTime);

    const response = await api.get<TelemetryData[]>('/telemetry/anomalies', { params });
    // Transform TelemetryData to AnomalyData
    return response.data.map((telemetry: TelemetryData) => ({
        id: telemetry.id ?? 0, // Provide a default value since id is optional in TelemetryData
        timestamp: telemetry.Timestamp,
        anomaly_type: telemetry.AnomalyType ?? 'Unknown'
    }));
}; 