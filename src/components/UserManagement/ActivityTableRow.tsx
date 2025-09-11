import React from 'react';

export interface UserActivity {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    surname: string;
    role: string;
  };
  ip: string;
  action: string;
  timestamp: number;
  formattedDate: string;
  details: any;
  userAgent: string;
} 