import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { getCurrentTelemetry, getAnomalies } from '../services/api';
import TelemetryChart from './TelemetryChart';
import TelemetryGauge from './TelemetryGauge';
import { TelemetryData, AnomalyData } from '../types/telemetry';

// Create a unique ID for anomalies based on timestamp and type
const createUniqueId = (timestamp: string, type: string) => {
  const date = new Date(timestamp);
  return `${date.getTime()}-${type}`;
};

const Dashboard: React.FC = () => {
  const { 
    data: currentTelemetry, 
    isLoading: isLoadingCurrent,
    error: currentError
  } = useQuery<TelemetryData, Error>(
    'currentTelemetry',
    getCurrentTelemetry,
    {
      keepPreviousData: true,
      refetchInterval: 1000,
    }
  );

  const { 
    data: anomalies,
    error: anomaliesError 
  } = useQuery<AnomalyData[], Error>(
    'anomalies',
    () =>
      getAnomalies(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      ),
    {
      keepPreviousData: true,
      refetchInterval: 1000,
    }
  );

  // Combine and deduplicate anomalies
  const allAnomalies = React.useMemo(() => {
    const anomalyMap = new Map<string, AnomalyData>();
    
    // Add historical anomalies to the map
    (anomalies || []).forEach(anomaly => {
      const id = createUniqueId(anomaly.timestamp, anomaly.anomaly_type);
      anomalyMap.set(id, { ...anomaly, id });
    });
    
    // Add current anomaly if it exists
    if (currentTelemetry?.IsAnomaly && currentTelemetry?.AnomalyType) {
      const id = createUniqueId(currentTelemetry.Timestamp, currentTelemetry.AnomalyType);
      anomalyMap.set(id, {
        id,
        timestamp: currentTelemetry.Timestamp,
        anomaly_type: currentTelemetry.AnomalyType
      });
    }
    
    // Convert map to array and sort by timestamp (most recent first)
    return Array.from(anomalyMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [anomalies, currentTelemetry]);

  // Show error states if any
  if (currentError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading telemetry data: {(currentError as Error).message}
      </Alert>
    );
  }

  if (isLoadingCurrent || !currentTelemetry) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Ensure we have valid numbers for all telemetry values
  const safeTemp = typeof currentTelemetry?.Temperature === 'number' ? currentTelemetry.Temperature : 0;
  const safeBattery = typeof currentTelemetry?.Battery === 'number' ? currentTelemetry.Battery : 0;
  const safeAltitude = typeof currentTelemetry?.Altitude === 'number' ? currentTelemetry.Altitude : 0;
  const safeSignal = typeof currentTelemetry?.SignalStrength === 'number' ? currentTelemetry.SignalStrength : 0;

  const gauges = [
    {
      key: 'temp',
      value: safeTemp,
      title: 'Temperature',
      unit: '°C',
      min: 0,
      max: 40,
      warning: 35,
    },
    {
      key: 'battery',
      value: safeBattery,
      title: 'Battery',
      unit: '%',
      min: 0,
      max: 100,
      warning: 40,
      reverseWarning: true,
    },
    {
      key: 'altitude',
      value: safeAltitude,
      title: 'Altitude',
      unit: 'km',
      min: 300,
      max: 600,
      warning: 400,
      reverseWarning: true,
    },
    {
      key: 'signal',
      value: safeSignal,
      title: 'Signal Strength',
      unit: 'dB',
      min: -100,
      max: -20,
      warning: -80,
      reverseWarning: true,
    },
  ];

  return (
    <Box component="section" sx={{ mt: 4, mb: 4 }}>
      <Container maxWidth="xl">
        <Stack spacing={2}>
          <Typography variant="h4" gutterBottom>
            Satellite Telemetry Dashboard
          </Typography>

          <Grid container spacing={3}>
            {gauges.map((gauge) => (
              <Grid item xs={12} md={3} key={gauge.key}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <TelemetryGauge {...gauge} />
                </Paper>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <TelemetryChart />
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Anomalies
                </Typography>
                {allAnomalies.map((anomaly) => (
                  <Alert
                    key={anomaly.id}
                    severity="warning"
                    sx={{ mb: 1 }}
                  >
                    {new Date(anomaly.timestamp).toLocaleString()}: {anomaly.anomaly_type}
                  </Alert>
                ))}
                {anomaliesError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    Error loading anomalies: {(anomaliesError as Error).message}
                  </Alert>
                )}
                {allAnomalies.length === 0 && (
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No anomalies detected
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
};

export default Dashboard; 