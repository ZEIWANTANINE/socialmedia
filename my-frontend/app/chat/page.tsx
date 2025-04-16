"use client";
import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const ChatPage: React.FC = () => {
  const friends = ["Alice", "Bob", "Charlie", "David", "Eve"];
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: number; content: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const senderUsername = "currentLoggedInUser"; // Replace with the actual logged-in user's username

  useEffect(() => {
    if (selectedFriend) {
      axiosInstance
        .get(`/messages/${selectedFriend}`)
        .then((response) => setMessages(response.data))
        .catch((error) => console.error("Error fetching messages:", error));
    }
  }, [selectedFriend]);

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();

    if (newMessage.trim() === "") return;

    axiosInstance
      .post("/messages", {
        senderUsername,
        receiverUsername: selectedFriend,
        content: newMessage,
      })
      .then((response) => {
        setMessages((prevMessages) => [...prevMessages, response.data]);
        setNewMessage("");
      })
      .catch((error) => console.error("Error sending message:", error));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/4 bg-white p-4 shadow">
        <h2 className="text-lg font-bold mb-4">Friends</h2>
        <ul className="space-y-2">
          {friends.map((friend, index) => (
            <li
              key={index}
              onClick={() => setSelectedFriend(friend)}
              className={`p-2 rounded cursor-pointer ${
                selectedFriend === friend ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {friend}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 p-4">
        {selectedFriend ? (
          <>
            <h2 className="text-lg font-bold mb-4">Chat with {selectedFriend}</h2>
            <div className="flex flex-col h-full border rounded p-4">
              <div className="flex-1 overflow-y-auto space-y-2">
                {messages.map((message) => (
                  <div key={message.id} className="p-2 bg-gray-200 rounded">
                    {message.content}
                  </div>
                ))}
              </div>
              <form className="flex mt-4" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-l"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="bg-blue-500 text-white px-4 rounded-r">
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">Select a friend to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;