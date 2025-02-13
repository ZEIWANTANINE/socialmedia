"use client";
import React from "react";
import styles from "./css/Layout.module.css";

interface LayoutProps {
  setPage: (page: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ setPage, children }) => {
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("profile")}>Profile</button>
        <button onClick={() => setPage("chat")}>Chat</button>
        <button onClick={() => setPage("friends")}>Friends</button>
      </nav>
      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default Layout;