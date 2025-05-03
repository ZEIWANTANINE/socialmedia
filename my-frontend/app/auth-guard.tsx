"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from './utils/axiosInstance';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('jwtToken');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/');
        return;
      }
      
      try {
        const response = await axiosInstance.get('/auth/check-auth');
        console.log('Auth check response:', response.data);
        
        if (response.data.isAuthenticated) {
          setIsAuthenticated(true);
        } else {
          // Token invalid, redirect to login
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Error checking auth, clear storage and redirect
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Đang xác thực...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
} 