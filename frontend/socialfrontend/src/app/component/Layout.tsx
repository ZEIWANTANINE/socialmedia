"use client";
import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance"; // Import configured Axios instance
import styles from "./css/Layout.module.css";
import { FaHome, FaBell, FaEnvelope, FaUser, FaComments, FaUsers } from "react-icons/fa";

interface LayoutProps {
  setPage: (page: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ setPage, children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [friendsDropdownOpen, setFriendsDropdownOpen] = useState(false);

  const handleUserIconClick = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogin = () => {
    // Implement login logic here
    setIsAuthenticated(true);
    setDropdownOpen(false);
    setPage("login"); // Redirect to home page after login
  };

  const handleLogout = () => {
    // Implement logout logic here
    setIsAuthenticated(false);
    setDropdownOpen(false);
    setPage("register"); // Redirect to login page after logout
  };

  const handleEnvelopeClick = async () => {
    setFriendsDropdownOpen(!friendsDropdownOpen);
    if (!friendsDropdownOpen) {
      try {
        const response = await axiosInstance.get("/api/friends"); // Use configured Axios instance
        setFriends(response.data);
      } catch (error) {
        console.error("Error fetching friends list:", error);
      }
    }
  };

  const handleBellClick = async () => {
    setFriendsDropdownOpen(!friendsDropdownOpen);
    if (!friendsDropdownOpen) {
      try {
        const response = await axiosInstance.get("/api/friends"); // Use configured Axios instance
        setFriends(response.data);
      } catch (error) {
        console.error("Error fetching friends list:", error);
      }
    }
  };

  return (
    <div>
      <nav className={styles.topNav}>
        <input type="text" placeholder="Search..." className={styles.searchBar} />
        <div className={styles.rightNav}>
          <div className="relative">
            <button onClick={handleBellClick} className={styles.iconButton}>
              <FaBell />
            </button>
            {friendsDropdownOpen && (
              <div className={`${styles.dropdownMenu} absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg`} style={{ top: '100%', zIndex: 10 }}>
                <ul className="py-1">
                  {friends.map((friend, index) => (
                    <li key={index}>
                      <button
                        onClick={() => setPage(`chat/${friend}`)}
                        className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        {friend}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button className={styles.iconButton}>
            <FaEnvelope />
          </button>
          <div className="relative">
            <button onClick={handleUserIconClick} className={styles.iconButton}>
              <FaUser />
            </button>
            {dropdownOpen && (
              <div className={`${styles.dropdownMenu} absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg`} style={{ top: '100%', zIndex: 10 }}>
                <ul className="py-1">
                  {isAuthenticated ? (
                    <>
                      <li>
                        <button
                          onClick={() => setPage("profile")}
                          className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                        >
                          Profile
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <button
                        onClick={handleLogin}
                        className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        Login
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
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