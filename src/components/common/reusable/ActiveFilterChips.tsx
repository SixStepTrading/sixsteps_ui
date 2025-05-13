import React from 'react';
import { Box, Chip, Typography, Stack, Button } from '@mui/material';

export interface ActiveFilter {
  id: string;
  label: string;
  value: string | number | boolean | Array<number>;
}

export interface ActiveFilterChipsProps {
  filters: ActiveFilter[];
  onRemove: (filterId: string) => void;
  onClearAll?: () => void;
}

const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({ filters, onRemove, onClearAll }) => {
  if (filters.length === 0) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Active filters:
        </Typography>
        {onClearAll && (
          <Button 
            size="small" 
            color="primary"
            onClick={onClearAll}
            sx={{ 
              fontSize: '0.75rem', 
              minWidth: 'auto', 
              p: '3px 8px',
              ml: 'auto'
            }}
          >
            Clear All
          </Button>
        )}
      </Stack>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {filters.map((filter) => {
          let chipLabel = `${filter.label}: `;
          
          if (Array.isArray(filter.value)) {
            chipLabel += `€${filter.value[0]} - €${filter.value[1]}`;
          } else if (typeof filter.value === 'boolean') {
            chipLabel = filter.label;
          } else {
            chipLabel += filter.value;
          }
          
          return (
            <Chip
              key={filter.id}
              label={chipLabel}
              size="small"
              onDelete={() => onRemove(filter.id)}
              sx={{ borderRadius: 1 }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default ActiveFilterChips; 