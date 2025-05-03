"use client";

import React from 'react';
import AuthGuard from '../auth-guard';

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
} 