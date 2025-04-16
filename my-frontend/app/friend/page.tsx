"use client";
import React, { useState } from "react";

const FriendsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const friends = ["Alice", "Bob", "Charlie", "David", "Eve"];

  const filteredFriends = friends.filter((friend) =>
    friend.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Search friends..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredFriends.map((friend, index) => (
          <div key={index} className="p-4 border rounded shadow">
            <div className="h-16 w-16 bg-gray-300 rounded-full mb-2"></div>
            <h3 className="text-lg font-bold">{friend}</h3>
            <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
              Add Friend
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsPage;