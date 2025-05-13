import React from 'react';
import { TableCell, TableCellProps } from '@mui/material';

interface StickyTableCellProps extends TableCellProps {
  leftPosition: number;
  isHeader?: boolean;
  backgroundColor?: string;
  minWidth?: number | string;
  zIndex?: number;
  hasBorder?: boolean;
}

const StickyTableCell: React.FC<StickyTableCellProps> = ({
  leftPosition,
  isHeader = false,
  backgroundColor,
  minWidth,
  zIndex = 2,
  hasBorder = true,
  children,
  ...rest
}) => {
  const getBgColor = () => {
    if (backgroundColor) return backgroundColor;
    return isHeader ? '#f9f9f9' : 'inherit';
  };

  return (
    <TableCell
      {...rest}
      sx={{
        position: 'sticky',
        left: leftPosition,
        top: isHeader ? 0 : 'auto',
        bgcolor: getBgColor(),
        minWidth: minWidth,
        zIndex: zIndex,
        borderRight: hasBorder ? '1px solid rgba(224, 224, 224, 0.7)' : 'none',
        ...(rest.sx || {})
      }}
    >
      {children}
    </TableCell>
  );
};

export default StickyTableCell; 