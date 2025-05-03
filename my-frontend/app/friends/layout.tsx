"use client";

import React from 'react';
import AuthGuard from '../auth-guard';

export default function FriendsLayout({
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