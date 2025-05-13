import React from 'react';
import { Box, Card, CardContent, Typography, SvgIconProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<SvgIconProps>;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  width: 48,
  height: 48,
  marginBottom: theme.spacing(1),
}));

const TrendIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  borderRadius: 12,
  padding: '2px 8px',
  fontSize: '0.75rem',
  fontWeight: 500,
}));

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  return (
    <Card sx={{ 
      height: '100%', 
      boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
      borderRadius: 2,
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
      }
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            {trend && (
              <TrendIndicator 
                sx={{ 
                  bgcolor: trend.isPositive ? `${color}15` : '#ffebee',
                  color: trend.isPositive ? color : '#f44336',
                  display: 'inline-flex',
                }}
              >
                {trend.isPositive ? (
                  <TrendingUp fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                )}
                {Math.abs(trend.value)}%
              </TrendIndicator>
            )}
          </Box>
          <IconWrapper sx={{ 
            backgroundColor: `${color}15`,
            boxShadow: `0 0 0 8px ${color}08`
          }}>
            {React.cloneElement(icon, { sx: { color: color, fontSize: '1.5rem' } })}
          </IconWrapper>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard; 