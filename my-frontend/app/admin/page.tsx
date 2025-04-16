"use client";
import React from "react";


interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div >
      <nav >
        <h1>Admin Panel</h1>
        {/* Add admin navigation links here */}
      </nav>
      <main >{children}</main>
    </div>
  );
};

export default AdminLayout;
