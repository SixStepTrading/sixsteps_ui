import React from 'react';
import { 
  Box, 
  Typography, 
  Pagination, 
  PaginationItem, 
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { 
  NavigateBefore as PreviousIcon, 
  NavigateNext as NextIcon 
} from '@mui/icons-material';

interface OrderPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

const OrderPagination: React.FC<OrderPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
    onItemsPerPageChange(event.target.value as number);
  };

  const getDisplayRange = () => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return `${start}-${end} of ${totalItems}`;
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 2,
      mt: 2
    }}>
      <Typography variant="body2" color="text.secondary">
        Showing {getDisplayRange()} orders
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            displayEmpty
            variant="outlined"
            sx={{ height: 32 }}
          >
            <MenuItem value={5}>5 per page</MenuItem>
            <MenuItem value={10}>10 per page</MenuItem>
            <MenuItem value={25}>25 per page</MenuItem>
            <MenuItem value={50}>50 per page</MenuItem>
          </Select>
        </FormControl>

        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          size="small"
          color="primary"
          shape="rounded"
          siblingCount={1}
          boundaryCount={1}
          renderItem={(item) => (
            <PaginationItem
              components={{ previous: PreviousIcon, next: NextIcon }}
              {...item}
            />
          )}
        />
      </Box>
    </Box>
  );
};

export default OrderPagination; 