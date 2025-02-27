"use client";
import React from "react";
import { useState } from "react";
import Layout from "./component/Layout";
import HomePage from "./component/HomePage";
import ProfilePage from "./component/ProfilePage";
import ChatPage from "./component/ChatPage";
import FriendsPage from "./component/FriendPage";
import RegisterPage from "./component/RegisterPage";
import LoginPage from "./component/LoginPage";
export default function App() {
  const [page, setPage] = useState("home");

  return (
    <html lang="en">
      <body>
        <Layout setPage={setPage}>
          {page === "register" && <RegisterPage />}
          {page === "login" && <LoginPage />}
          {page === "home" && <HomePage />}
          {page === "profile" && <ProfilePage />}
          {page === "chat" && <ChatPage />}
          {page === "friends" && <FriendsPage />}
        </Layout>
      </body>
    </html>
  );
}