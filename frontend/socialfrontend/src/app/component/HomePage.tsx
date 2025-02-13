import React, { useState } from "react";
import styles from "./css/HomePage.module.css";
import friendsStyles from "./css/FriendsList.module.css";

const HomePage: React.FC = () => {
  const friends = ["Alice", "Bob", "Charlie", "David", "Eve"];
  const [posts, setPosts] = useState([
    { id: 1, content: "This is the first post.", likes: 10, comments: 2 },
    { id: 2, content: "This is the second post.", likes: 5, comments: 1 },
  ]);
  const [newPost, setNewPost] = useState("");

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      setPosts([{ id: posts.length + 1, content: newPost, likes: 0, comments: 0 }, ...posts]);
      setNewPost("");
    }
  };

  return (
    <div className={styles.homeContainer} style={{ display: "flex", justifyContent: "center" }}>
      <div className={styles.mainContent}>
        <form onSubmit={handlePostSubmit} className={styles.newPostForm}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className={styles.newPostInput}
          />
          <button type="submit" className={styles.newPostButton}>Post</button>
        </form>
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