import React, { useContext } from 'react';
import { SidebarContext } from '../../../contexts/SidebarContext';
import { SummaryBar } from '../molecules';

interface ActionBarProps {
  selectedCount: number;
  totalItems: number;
  totalAmount: number;
  onSaveAsDraft: () => void;
  onCreateOda: () => void;
  onSaveForLater?: () => void;
  hasSelectionProblems?: boolean;
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
      onSaveAsDraft={props.onSaveAsDraft}
      onCreateOrder={props.onCreateOda}
      sidebarWidth={sidebarWidth}
      onSaveForLater={props.onSaveForLater}
      hasSelectionProblems={props.hasSelectionProblems}
    />
  );
};

export default ActionBar; 