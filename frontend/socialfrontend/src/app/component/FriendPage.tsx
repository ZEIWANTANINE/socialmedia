import React, { useState } from "react";
import styles from "./css/FriendPage.module.css";

const FriendsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const friends = ["Alice", "Bob", "Charlie", "David", "Eve"];

  const filteredFriends = friends.filter(friend =>
    friend.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.friendsContainer}>
      <input
        type="text"
        placeholder="Search friends..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchBar}
      />
      <ul className={styles.friendsList}>
        {filteredFriends.map((friend, index) => (
          <li key={index}>{friend}</li>
        ))}
      </ul>
    </div>
  );
};

export default FriendsPage;