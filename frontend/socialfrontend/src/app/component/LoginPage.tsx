import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import styles from "./css/LoginPage.module.css";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    axiosInstance.post("/api/auth/login", { username, password })
      .then((response) => {
        const token = response.data; // Ensure you get the token from the response
        localStorage.setItem("jwtToken", token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // Redirect to the chat page or another page
        window.location.href = "/chat";
      })
      .catch((error) => console.error("Error logging in:", error));
  };

  return (
    <form className={styles.form} onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={styles.input}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.input}
      />
      <button type="submit" className={styles.button}>Login</button>
    </form>
  );
};

export default LoginPage;