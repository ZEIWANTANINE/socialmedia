"use client";
import React from "react";
import styles from "./css/Layout.module.css";
import { FaHome, FaBell, FaEnvelope, FaUser, FaComments, FaUsers } from "react-icons/fa";

interface LayoutProps {
  setPage: (page: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ setPage, children }) => {
  return (
    <div>
      <nav className={styles.topNav}>
        <input type="text" placeholder="Search..." className={styles.searchBar} />
        <div className={styles.centerNav}>
          <button onClick={() => setPage("home")} className={styles.navButton}>
            <FaHome />
          </button>
        </div>
        <div className={styles.rightNav}>
          <button className={styles.iconButton}>
            <FaBell />
          </button>
          <button className={styles.iconButton}>
            <FaEnvelope />
          </button>
          <button onClick={() => setPage("profile")} className={styles.iconButton}>
            <FaUser />
          </button>
        </div>
      </nav>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <button onClick={() => setPage("home")} className={styles.menuButton}>
            <FaHome /> Home
          </button>
          <button onClick={() => setPage("profile")} className={styles.menuButton}>
            <FaUser /> Profile
          </button>
          <button onClick={() => setPage("chat")} className={styles.menuButton}>
            <FaComments /> Chat
          </button>
          <button onClick={() => setPage("friends")} className={styles.menuButton}>
            <FaUsers /> Friends
          </button>
        </nav>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
};

export default Layout;