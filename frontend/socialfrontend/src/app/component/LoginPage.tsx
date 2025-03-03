import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import styles from "./css/LoginPage.module.css";
import { apiEndpoints } from "../utils/api";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await axiosInstance.post(
        apiEndpoints.login,
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // ✅ Lấy token từ response đúng cách
      const token = response.data.token; // Đảm bảo backend trả về { token: "JWT_TOKEN_HERE" }

      if (token) {
        localStorage.setItem("jwtToken", token);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        window.location.href = "/home"; // Redirect sau khi login thành công
      } else {
        console.error("Login failed: No token received");
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  return (
    <form className={styles.form} onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={styles.input}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.input}
        required
      />
      <button type="submit" className={styles.button}>Login</button>
    </form>
  );
};

export default LoginPage;
