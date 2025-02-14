import React, { useState, useRef } from 'react';
import { useQuery } from 'react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import { Line } from 'react-chartjs-2';
import { Box, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Typography, Stack } from '@mui/material';
import { getTelemetryData } from '../services/api';
import { TelemetryData } from '../types/telemetry';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

// Time range options in minutes
const TIME_RANGES = [
  { value: 1, label: 'Last 1 minute' },
  { value: 2, label: 'Last 2 minutes' },
  { value: 5, label: 'Last 5 minutes' },
  { value: 10, label: 'Last 10 minutes' },
];

const TelemetryChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState(2);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const dataCache = useRef<TelemetryData[]>([]);
  const lastTimestamp = useRef<string | null>(null);
  const windowStartTime = useRef<Date | null>(null);

  const { data: telemetryData, isLoading, error } = useQuery<TelemetryData[], Error>(
    ['telemetryHistory', timeRange],
    async () => {
      const now = new Date();
      const endTime = now.toISOString();
      const startTime = new Date(now.getTime() - timeRange * 60 * 1000).toISOString();
      
      // Get all data for the time window
      const data = await getTelemetryData(startTime, endTime);
      
      // Sort by timestamp
      return data.sort((a, b) => 
        new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime()
      );
    },
    {
      refetchInterval: 1000,
      onSuccess: () => {
        setUpdateCount(prev => prev + 1);
        setLastUpdate(new Date());
      }
    }
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Real-time Telemetry Data',
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'second' as const,
          stepSize: 10,
          displayFormats: {
            second: 'HH:mm:ss',
          },
        },
        title: {
          display: true,
          text: 'Time',
        },
        adapters: {
          date: {
            locale: enUS,
          },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Value',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  } as const;

  if (error) {
    return (
      <Box height={400} display="flex" justifyContent="center" alignItems="center">
        <Alert severity="error">
          Error loading telemetry history: {(error as Error).message}
        </Alert>
      </Box>
    );
  }

  if (isLoading || !telemetryData) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  const data = {
    datasets: [
      {
        label: 'Temperature (°C)',
        data: telemetryData.map((d) => ({
          x: new Date(d.Timestamp),
          y: d.Temperature,
        })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderWidth: 1,
        pointRadius: 1.5,
      },
      {
        label: 'Battery (%)',
        data: telemetryData.map((d) => ({
          x: new Date(d.Timestamp),
          y: d.Battery,
        })),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderWidth: 1,
        pointRadius: 1.5,
      },
      {
        label: 'Altitude (km)',
        data: telemetryData.map((d) => ({
          x: new Date(d.Timestamp),
          y: d.Altitude,
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderWidth: 1,
        pointRadius: 1.5,
      },
      {
        label: 'Signal Strength (dB)',
        data: telemetryData.map((d) => ({
          x: new Date(d.Timestamp),
          y: d.SignalStrength,
        })),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderWidth: 1,
        pointRadius: 1.5,
      },
    ],
  };

  return (
    <Box>
      <Box mb={2}>
        <FormControl size="small">
          <InputLabel>Time Window</InputLabel>
          <Select
            value={timeRange}
            label="Time Window"
            onChange={(e) => setTimeRange(Number(e.target.value))}
            sx={{ minWidth: 150 }}
          >
            {TIME_RANGES.map((range) => (
              <MenuItem key={range.value} value={range.value}>
                {range.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box height={400}>
        <Line options={options} data={data} />
      </Box>
    </Box>
  );
};

export default TelemetryChart; 