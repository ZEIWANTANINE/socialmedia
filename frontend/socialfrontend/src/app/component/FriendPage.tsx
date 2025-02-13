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
      <div className={styles.friendsList}>
        {filteredFriends.map((friend, index) => (
          <div key={index} className={styles.friendCard}>
            <div className={styles.friendAvatar}></div>
            <div className={styles.friendInfo}>
              <h3>{friend}</h3>
              <button className={styles.addFriendButton}>Add Friend</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsPage;