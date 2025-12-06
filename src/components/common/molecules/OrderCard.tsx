import React from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Button, 
  IconButton,
  Divider,
  Paper 
} from '@mui/material';
import { 
  Visibility as ViewIcon,
  Refresh as ReorderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as TrackIcon,
  ArrowForward as FollowUpIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

export interface OrderData {
  id: string;
  createdOn: string;
  totalProducts: number;
  items: number;
  amount: number;
  status: 'Draft' | 'Processing' | 'Pending Approval' | 'Partially Filled' | 'Executed';
  deliveryStatus?: string;
  deliveryDate?: string;
  estimatedDelivery?: string;
  completion?: number;
}

interface OrderCardProps {
  order: OrderData;
  onViewDetails: (id: string) => void;
  onReorder?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTrack?: (id: string) => void;
  onFollowUp?: (id: string) => void;
  onSubmit?: (id: string) => void;
  onContinueEditing?: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onReorder,
  onEdit,
  onDelete,
  onTrack,
  onFollowUp,
  onSubmit,
  onContinueEditing
}) => {
  // Determine status chip color
  const getStatusChip = () => {
    switch (order.status) {
      case 'Draft':
        return <Chip size="small" label="Draft" variant="outlined" />;
      case 'Processing':
        return <Chip size="small" label="Processing" color="info" />;
      case 'Pending Approval':
        return <Chip size="small" label="Pending Approval" color="warning" />;
      case 'Partially Filled':
        return <Chip size="small" label="Partially Filled" color="warning" />;
      case 'Executed':
        return <Chip size="small" label="Executed" color="success" />;
      default:
        return null;
    }
  };

  // Show appropriate action buttons based on order status
  const renderActions = () => {
    if (order.status === 'Executed') {
      return (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<ViewIcon />} 
            variant="text" 
            size="small" 
            onClick={() => onViewDetails(order.id)}
          >
            View Details
          </Button>
          {onReorder && (
            <Button 
              startIcon={<ReorderIcon />} 
              variant="outlined" 
              size="small" 
              onClick={() => onReorder(order.id)}
            >
              Reorder
            </Button>
          )}
        </Box>
      );
    } else if (order.status === 'Pending Approval') {
      return (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<ViewIcon />} 
            variant="text" 
            size="small" 
            onClick={() => onViewDetails(order.id)}
          >
            View Details
          </Button>
          {onEdit && (
            <Button 
              startIcon={<EditIcon />} 
              variant="outlined" 
              size="small" 
              onClick={() => onEdit(order.id)}
            >
              Edit
            </Button>
          )}
          {onFollowUp && (
            <Button 
              startIcon={<FollowUpIcon />} 
              variant="contained" 
              size="small" 
              color="primary"
              onClick={() => onFollowUp(order.id)}
            >
              Follow Up
            </Button>
          )}
        </Box>
      );
    } else if (order.status === 'Processing') {
      // Processing is a stalling state, no actions available
      return (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<ViewIcon />} 
            variant="text" 
            size="small" 
            onClick={() => onViewDetails(order.id)}
          >
            View Details
          </Button>
        </Box>
      );
    } else if (order.status === 'Partially Filled') {
      return (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<ViewIcon />} 
            variant="text" 
            size="small" 
            onClick={() => onViewDetails(order.id)}
          >
            View Details
          </Button>
          {onTrack && (
            <Button 
              startIcon={<TrackIcon />} 
              variant="contained" 
              size="small" 
              color="primary"
              onClick={() => onTrack(order.id)}
            >
              Track
            </Button>
          )}
        </Box>
      );
    } else if (order.status === 'Draft') {
      return (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onDelete && (
            <Button 
              startIcon={<DeleteIcon />} 
              variant="text" 
              size="small" 
              color="error"
              onClick={() => onDelete(order.id)}
            >
              Delete
            </Button>
          )}
          {onEdit && (
            <Button 
              startIcon={<EditIcon />} 
              variant="outlined" 
              size="small" 
              onClick={() => onEdit(order.id)}
            >
              Edit
            </Button>
          )}
          {onSubmit && (
            <Button 
              variant="contained" 
              size="small" 
              color="primary"
              onClick={() => onSubmit(order.id)}
            >
              Submit
            </Button>
          )}
          {onContinueEditing && (
            <Button 
              variant="contained" 
              size="small" 
              color="primary"
              onClick={() => onContinueEditing(order.id)}
            >
              Continue Editing
            </Button>
          )}
        </Box>
      );
    }
    return null;
  };

  // Render completion bar for drafts
  const renderCompletionBar = () => {
    if (order.status === 'Draft' && order.completion !== undefined) {
      return (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">Completion</Typography>
            <Typography variant="caption" color="text.secondary">{order.completion}%</Typography>
          </Box>
          <Box sx={{ 
            mt: 0.5,
            height: 4, 
            bgcolor: '#f0f0f0', 
            borderRadius: 2, 
            position: 'relative' 
          }}>
            <Box sx={{ 
              position: 'absolute', 
              left: 0, 
              top: 0, 
              height: '100%', 
              width: `${order.completion}%`, 
              bgcolor: 'primary.main', 
              borderRadius: 2 
            }} />
          </Box>
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 2, 
        border: '1px solid',
        borderColor: order.status === 'Pending Approval' ? 'warning.light' : 
                      order.status === 'Processing' ? 'info.light' : 
                      order.status === 'Partially Filled' ? 'warning.light' :
                      order.status === 'Executed' ? 'success.light' : 
                      'divider',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Box sx={{ 
        borderLeft: '4px solid', 
        borderLeftColor: order.status === 'Pending Approval' ? 'warning.main' : 
                          order.status === 'Processing' ? 'info.main' : 
                          order.status === 'Partially Filled' ? 'warning.main' :
                          order.status === 'Executed' ? 'success.main' : 
                          'divider',
        p: 2
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h6" component="div">
                {order.id}
              </Typography>
              {getStatusChip()}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Created on {order.createdOn}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={() => onViewDetails(order.id)}>
              <DownloadIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, md: 0 } }}>
          <Box sx={{ minWidth: 150, flex: { xs: '1 1 33%', md: 1 } }}>
            <Typography variant="caption" color="text.secondary">Total Products</Typography>
            <Typography variant="body1">{order.totalProducts} items</Typography>
          </Box>
          
          <Box sx={{ minWidth: 150, flex: { xs: '1 1 33%', md: 1 } }}>
            <Typography variant="caption" color="text.secondary">Amount</Typography>
            <Typography variant="body1">€{order.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
          </Box>
          
          <Box sx={{ minWidth: 150, flex: { xs: '1 1 33%', md: 1 } }}>
            <Typography variant="caption" color="text.secondary">
              {order.status === 'Executed' ? 'Delivery Status' : 'Estimated Delivery'}
            </Typography>
            {order.status === 'Executed' && order.deliveryStatus && order.deliveryDate ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                  size="small" 
                  label={order.deliveryStatus} 
                  color="success" 
                  sx={{ height: 24 }} 
                />
                <Typography variant="body2">on {order.deliveryDate}</Typography>
              </Box>
            ) : order.estimatedDelivery ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                  size="small" 
                  label="Awaiting approval" 
                  color="warning" 
                  variant="outlined" 
                  sx={{ height: 24 }} 
                />
              </Box>
            ) : order.status === 'Draft' ? (
              <Typography variant="body2">Not submitted</Typography>
            ) : (
              <Typography variant="body2">Expected on {order.estimatedDelivery}</Typography>
            )}
          </Box>
        </Box>

        {renderCompletionBar()}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          {renderActions()}
        </Box>
      </Box>
    </Paper>
  );
};

export default OrderCard; 