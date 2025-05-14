import React, { useContext } from 'react';
import { SidebarContext } from '../../../contexts/SidebarContext';
import { SummaryBar } from '../molecules';

interface ActionBarProps {
  selectedCount: number;
  totalItems: number;
  totalAmount: number;
  onSaveForLater: () => void;
  onSaveAsDraft: () => void;
  onCreateOda: () => void;
}

const ActionBar: React.FC<ActionBarProps> = (props) => {
  // Call useContext unconditionally at the top level
  const sidebarContext = useContext(SidebarContext);
  
  // Default value if context is unavailable
  let sidebarWidth = 0;
  
  try {
    // Use the context value safely
    sidebarWidth = sidebarContext?.isDrawerCollapsed ? 72 : 240;
  } catch (error) {
    console.error("Error accessing SidebarContext:", error);
    // Fallback width
    sidebarWidth = 0;
  }
  
  return (
    <SummaryBar
      selectedCount={props.selectedCount}
      totalItems={props.totalItems}
      totalAmount={props.totalAmount}
      onSaveForLater={props.onSaveForLater}
      onSaveAsDraft={props.onSaveAsDraft}
      onCreateOrder={props.onCreateOda}
      sidebarWidth={sidebarWidth}
    />
  );
};

export default ActionBar; 