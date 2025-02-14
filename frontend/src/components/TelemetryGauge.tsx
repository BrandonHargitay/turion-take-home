import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

interface TelemetryGaugeProps {
  value: number;
  title: string;
  unit: string;
  min: number;
  max: number;
  warning: number;
  reverseWarning?: boolean;
}

const GaugeContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '120px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

const GaugeValue = styled(Typography)<{ warning: boolean }>(({ theme, warning }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: warning ? theme.palette.error.main : theme.palette.success.main,
}));

const TelemetryGauge: React.FC<TelemetryGaugeProps> = ({
  value = 0,
  title,
  unit,
  min,
  max,
  warning,
  reverseWarning = false,
}) => {
  // Ensure value is a number and not undefined/null
  const safeValue = typeof value === 'number' ? value : 0;
  
  const isWarning = reverseWarning
    ? safeValue < warning
    : safeValue > warning;

  const percentage = ((safeValue - min) / (max - min)) * 100;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <GaugeContainer>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <GaugeValue warning={isWarning}>
        {safeValue.toFixed(1)}
        {unit}
      </GaugeValue>
      <Box
        sx={{
          width: '100%',
          height: '4px',
          bgcolor: 'grey.700',
          borderRadius: '2px',
          mt: 1,
        }}
      >
        <Box
          sx={{
            width: `${clampedPercentage}%`,
            height: '100%',
            bgcolor: isWarning ? 'error.main' : 'success.main',
            borderRadius: '2px',
            transition: 'width 0.3s ease-in-out',
          }}
        />
      </Box>
    </GaugeContainer>
  );
};

export default TelemetryGauge; 