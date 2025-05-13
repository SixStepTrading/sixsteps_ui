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
  width: 40,
  height: 40,
  marginBottom: theme.spacing(0.5),
}));

const TrendIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  borderRadius: 8,
  padding: '1px 6px',
  fontSize: '0.7rem',
  fontWeight: 500,
}));

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  return (
    <Card sx={{ 
      height: '100%', 
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
      borderRadius: 2,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.08)',
      }
    }}>
      <CardContent sx={{ p: 1.8 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.75rem', mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.8, fontSize: '1.4rem' }}>
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
                  <TrendingUp fontSize="small" sx={{ mr: 0.3, fontSize: '0.9rem' }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ mr: 0.3, fontSize: '0.9rem' }} />
                )}
                {Math.abs(trend.value)}%
              </TrendIndicator>
            )}
          </Box>
          <IconWrapper sx={{ 
            backgroundColor: `${color}15`,
            boxShadow: `0 0 0 5px ${color}08`
          }}>
            {React.cloneElement(icon, { sx: { color: color, fontSize: '1.3rem' } })}
          </IconWrapper>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard; 