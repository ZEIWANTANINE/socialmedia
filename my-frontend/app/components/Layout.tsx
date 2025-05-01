"use client";

import React from "react";
import { FaHome, FaEnvelope, FaUser, FaComments, FaUsers } from "react-icons/fa";
import Link from "next/link";
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
  userId: string; // Thêm userId để truyền vào Layout
  disableWebSocket?: boolean;
}

export default function Layout({ children, userId, disableWebSocket = false }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <input
          type="text"
          placeholder="Search..."
          className="w-96 p-2 rounded bg-gray-700 text-white"
        />
        <div className="flex gap-4">
          <Link href={`/profile/${userId}`} className="p-2">
            <FaEnvelope />
          </Link>
          {!disableWebSocket && <NotificationBell userId={userId} />}
          <Link href={`/profile/${userId}`} className="p-2">
            <FaUser />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-64 bg-gray-200 p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/home" className="block w-full text-left p-2 hover:bg-gray-300 rounded">
                <FaHome className="inline-block mr-2" /> Home
              </Link>
            </li>
            <li>
              <Link href={`/profile/${userId}`} className="block w-full text-left p-2 hover:bg-gray-300 rounded">
                <FaUser className="inline-block mr-2" /> Profile
              </Link>
            </li>
            <li>
              <Link href="/chat" className="block w-full text-left p-2 hover:bg-gray-300 rounded">
                <FaComments className="inline-block mr-2" /> Chat
              </Link>
            </li>
            <li>
              <Link href="/friend" className="block w-full text-left p-2 hover:bg-gray-300 rounded">
                <FaUsers className="inline-block mr-2" /> Friends
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}