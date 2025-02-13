import React, { useState } from "react";
import styles from "./css/ChatPage.module.css";
import friendsStyles from "./css/FriendsList.module.css";

const ChatPage: React.FC = () => {
  const friends = ["Alice", "Bob", "Charlie", "David", "Eve"];
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  return (
    <div className={styles.chatContainer}>
      <div className={friendsStyles.friendsList}>
        <h2>Friends</h2>
        <ul>
          {friends.map((friend, index) => (
            <li key={index} onClick={() => setSelectedFriend(friend)} className={selectedFriend === friend ? friendsStyles.selectedFriend : ""}>
              {friend}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.chat}>
        {selectedFriend ? (
          <>
            <h2>Chat with {selectedFriend}</h2>
            <div className={styles.chatBox}>
              <div className={styles.messages}>
                <div className={styles.message}>Hello, how are you?</div>
                <div className={styles.message}>I'm good, thanks!</div>
              </div>
              <form className={styles.messageForm}>
                <input type="text" placeholder="Type a message..." className={styles.messageInput} />
                <button type="submit" className={styles.sendButton}>Send</button>
              </form>
            </div>
          </>
        ) : (
          <div className={styles.noChatSelected}>Select a friend to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;