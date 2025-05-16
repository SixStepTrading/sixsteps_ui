import React from 'react';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Administrator' | 'Manager' | 'Pharmacy' | 'Supplier';
  associatedEntity: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
} 