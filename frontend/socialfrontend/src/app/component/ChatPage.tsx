import React from "react";
import styles from "./css/ChatPage.module.css";
import friendsStyles from "./css/FriendsList.module.css";

const ChatPage: React.FC = () => {
  const friends = ["Alice", "Bob", "Charlie", "David", "Eve"];

  return (
    <div className={styles.chatContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className={friendsStyles.friendsList}>
        <h2>Friends</h2>
        <ul>
          {friends.map((friend, index) => (
            <li key={index}>{friend}</li>
          ))}
        </ul>
      </div>
      <div className={styles.chat}>
        <h2>Chat</h2>
        <div className={styles.chatBox}>Welcome to the Chat Page</div>
      </div>
    </div>
  );
};

export default ChatPage;