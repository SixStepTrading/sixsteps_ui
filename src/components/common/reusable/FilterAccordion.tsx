import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Button,
  IconButton,
  Divider,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';

export interface FilterAccordionProps {
  title: string;
  children?: React.ReactNode;
  mainFilters?: React.ReactNode;
  additionalFilters?: React.ReactNode;
  onApplyFilters?: () => void;
  onResetFilters?: () => void;
  activeFiltersCount?: number;
}

const FilterAccordion: React.FC<FilterAccordionProps> = ({
  title,
  children,
  mainFilters,
  additionalFilters,
  onApplyFilters,
  onResetFilters,
  activeFiltersCount = 0
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  return (
    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 2, 
        py: 1.5,
        bgcolor: '#fafafa'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterListIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight={500}>
            {title}
            {activeFiltersCount > 0 && (
              <Box 
                component="span"
                sx={{ 
                  ml: 1, 
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem'
                }}
              >
                {activeFiltersCount}
              </Box>
            )}
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1} alignItems="center">
          {onResetFilters && activeFiltersCount > 0 && (
            <Button 
              variant="outlined"
              size="small"
              onClick={onResetFilters}
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: 2, fontSize: '0.75rem', py: 0.5 }}
            >
              Reset
            </Button>
          )}
          
          {/* Advanced filters toggle */}
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={<ExpandMoreIcon 
              sx={{ 
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: '0.3s'
              }}
            />}
            sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
          >
            Advanced
          </Button>
          
          {onApplyFilters && (
            <Button 
              variant="contained" 
              size="small"
              onClick={onApplyFilters}
              startIcon={<FilterListIcon />}
              sx={{ borderRadius: 2, fontSize: '0.75rem', py: 0.5 }}
            >
              Apply
            </Button>
          )}
        </Stack>
      </Box>
      
      {/* Main filters */}
      <Box sx={{ p: 2 }}>
        {mainFilters && mainFilters}
        {children && !mainFilters && children}
      </Box>
      
      {/* Advanced filters */}
      {(additionalFilters || (children && mainFilters)) && (
        <Accordion 
          expanded={expanded} 
          onChange={handleChange}
          disableGutters
          elevation={0}
          sx={{ '&:before': { display: 'none' } }}
        >
          <AccordionDetails sx={{ p: 2, pt: 0, bgcolor: '#fafafa' }}>
            <Divider sx={{ mb: 2, mt: 0 }} />
            {additionalFilters && additionalFilters}
            {children && mainFilters && children}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default FilterAccordion;