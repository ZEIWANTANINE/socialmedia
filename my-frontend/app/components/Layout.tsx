"use client";

import React from "react";
import { FaHome, FaBell, FaEnvelope, FaUser, FaComments, FaUsers } from "react-icons/fa";
import Link from "next/link";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
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
          <button className="p-2">
            <FaEnvelope />
          </button>
          <button className="p-2">
            <FaBell />
          </button>
          <button className="p-2">
            <FaUser />
          </button>
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
              <Link href="/profile" className="block w-full text-left p-2 hover:bg-gray-300 rounded">
                <FaUser className="inline-block mr-2" /> Profile
              </Link>
            </li>
            <li>
              <Link href="/chat" className="block w-full text-left p-2 hover:bg-gray-300 rounded">
                <FaComments className="inline-block mr-2" /> Chat
              </Link>
            </li>
            <li>
              <Link href="/friends" className="block w-full text-left p-2 hover:bg-gray-300 rounded">
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