"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

const ProfileRedirectPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Get the current user's ID from localStorage
    const userId = localStorage.getItem("userId");
    
    if (userId) {
      // Redirect to the user's profile page
      router.push(`/profile/${userId}`);
    } else {
      // If no user ID found, redirect to login
      router.push("/");
    }
  }, [router]);

  // Display a loading indicator while redirecting
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default ProfileRedirectPage;