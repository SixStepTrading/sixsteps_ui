import React, { useState } from 'react';
import { 
  Box, 
  TableCell, 
  TableCellProps, 
  TableSortLabel, 
  Tooltip, 
  IconButton 
} from '@mui/material';
import { 
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ImportExport as ImportExportIcon 
} from '@mui/icons-material';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableColumnHeaderProps extends TableCellProps {
  label: string;
  id: string;
  tooltip?: string;
  activeSort: string | null;
  activeDirection: SortDirection;
  onSort: (id: string, direction: SortDirection) => void;
  isSticky?: boolean;
  leftPosition?: number;
  minWidth?: number | string;
  backgroundColor?: string;
  showSortIconOnHover?: boolean;
  zIndex?: number;
}

const SortableColumnHeader: React.FC<SortableColumnHeaderProps> = ({
  label,
  id,
  tooltip,
  activeSort,
  activeDirection,
  onSort,
  isSticky = false,
  leftPosition,
  minWidth,
  backgroundColor = '#f9f9f9',
  showSortIconOnHover = true,
  zIndex = 3,
  ...rest
}) => {
  const [hover, setHover] = useState(false);
  const isActive = activeSort === id;

  const getNextDirection = (): SortDirection => {
    if (!isActive || activeDirection === null) return 'asc';
    return activeDirection === 'asc' ? 'desc' : null;
  };

  const handleSort = () => {
    const newDirection = getNextDirection();
    onSort(id, newDirection);
  };

  const renderSortIcon = () => {
    if (isActive) {
      if (activeDirection === 'asc') {
        return <ArrowUpwardIcon fontSize="small" />;
      }
      if (activeDirection === 'desc') {
        return <ArrowDownwardIcon fontSize="small" />;
      }
    }
    
    return <ImportExportIcon fontSize="small" color="disabled" />;
  };

  const content = (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        width: '100%',
        '&:hover': {
          color: 'primary.main',
        }
      }}
      onClick={handleSort}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Box component="span">
        {label}
      </Box>
      
      {(isActive || (hover && showSortIconOnHover)) && (
        <Box 
          component="span" 
          sx={{ 
            opacity: isActive ? 1 : 0.5,
            transition: 'opacity 0.2s',
            ml: 0.5,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {renderSortIcon()}
        </Box>
      )}
    </Box>
  );

  const cellContent = tooltip ? (
    <Tooltip title={tooltip} arrow>
      {content}
    </Tooltip>
  ) : content;

  return (
    <TableCell
      {...rest}
      sx={{
        ...isSticky ? {
          position: 'sticky',
          left: leftPosition,
          top: 0,
          zIndex: 100,
          borderRight: '1px solid rgba(224, 224, 224, 0.4)',
          boxShadow: isSticky && leftPosition === 450 ? '3px 0px 5px -1px rgba(0,0,0,0.15)' : 'none'
        } : {
          position: 'sticky',
          top: 0,
          zIndex: 2
        },
        bgcolor: backgroundColor,
        minWidth: minWidth,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        padding: '8px 16px',
        ...(rest.sx || {})
      }}
    >
      {cellContent}
    </TableCell>
  );
};

export default SortableColumnHeader; 