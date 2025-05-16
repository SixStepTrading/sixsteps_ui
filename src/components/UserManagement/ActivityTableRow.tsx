import React from 'react';

export interface UserActivity {
  id: string;
  user: string;
  action: string;
  details: string;
  dateTime: string;
  ipAddress: string;
} 