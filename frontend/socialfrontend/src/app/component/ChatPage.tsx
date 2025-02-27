import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import styles from "./css/ChatPage.module.css";
import friendsStyles from "./css/FriendsList.module.css";
const ChatPage: React.FC = () => {
  const friends = ["Alice", "Bob", "Charlie", "David", "Eve"];
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: number; content: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const senderUsername = "currentLoggedInUser"; // Replace with the actual logged-in user's username

  useEffect(() => {
    if (selectedFriend) {
      // Fetch messages from the API
      axiosInstance.get(`/messages/${selectedFriend}`)
        .then((response) => setMessages(response.data))
        .catch((error) => console.error("Error fetching messages:", error));
    }
  }, [selectedFriend]);

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();

    if (newMessage.trim() === "") return;

    // Post the new message to the API
    axiosInstance.post("/messages", {
      senderUsername,
      receiverUsername: selectedFriend,
      content: newMessage,
    })
      .then((response) => {
        // Update the messages state with the new message
        setMessages((prevMessages) => [...prevMessages, response.data]);
        setNewMessage("");
      })
      .catch((error) => console.error("Error sending message:", error));
  };
  return (
    <div className={styles.chatContainer}>
      <div className={friendsStyles.friendsList}>
        <h2>Friends</h2>
        <ul>
          {friends.map((friend, index) => (
            <li
              key={index}
              onClick={() => setSelectedFriend(friend)}
              className={selectedFriend === friend ? friendsStyles.selectedFriend : ""}
            >
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
                {messages.map((message) => (
                  <div key={message.id} className={styles.message}>
                    {message.content}
                  </div>
                ))}
              </div>
              <form className={styles.messageForm} onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className={styles.messageInput}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className={styles.sendButton}>
                  Send
                </button>
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