import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import styles from "./css/RegisterPage.module.css";
import { apiEndpoints } from "../utils/api";

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("ROLE_USER");

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();

    const userInfo = { username, password, email, fullName, roles: role };

    axiosInstance.post(apiEndpoints.register, userInfo)
      .then(() => {
        alert("User registered successfully");
      })
      .catch((error) => console.error("Error registering user:", error));
  };

  return (
    <form className={styles.form} onSubmit={handleRegister}>
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
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
      />
      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className={styles.input}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)} className={styles.input}>
        <option value="ROLE_USER">User</option>
        <option value="ROLE_ADMIN">Admin</option>
      </select>
      <button type="submit" className={styles.button}>Register</button>
    </form>
  );
};

export default RegisterPage;