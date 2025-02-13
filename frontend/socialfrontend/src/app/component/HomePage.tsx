import React from "react";
import styles from "./css/HomePage.module.css";
import friendsStyles from "./css/FriendsList.module.css";

const HomePage: React.FC = () => {
  const friends = ["Alice", "Bob", "Charlie", "David", "Eve"];
  const posts = [
    { id: 1, content: "This is the first post.", likes: 10, comments: 2 },
    { id: 2, content: "This is the second post.", likes: 5, comments: 1 },
  ];

  return (
    <div className={styles.homeContainer} style={{ display: "flex", justifyContent: "center" }}>
      <div className={styles.mainContent}>
        {posts.map((post) => (
          <div key={post.id} className={styles.post}>
            <p>{post.content}</p>
            <div className={styles.postActions}>
              <button>Like ({post.likes})</button>
              <button>Comment ({post.comments})</button>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.rightSidebar}>
        <h2>Friends</h2>
        <ul>
          {friends.map((friend, index) => (
            <li key={index}>{friend}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HomePage;