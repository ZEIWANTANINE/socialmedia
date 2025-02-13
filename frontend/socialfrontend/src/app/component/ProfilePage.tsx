import React from "react";
import styles from "./css/ProfilePage.module.css";

const ProfilePage: React.FC = () => {
  return (
    <div className={styles.profileContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className={styles.coverPhoto}></div>
      <div className={styles.profileInfo}>
        <div className={styles.profilePicture}></div>
        <div className={styles.profileDetails}>
          <h1>John Doe</h1>
          <p>Software Engineer at Tech Company</p>
          <p>Lives in San Francisco, CA</p>
        </div>
      </div>
      <div className={styles.profileContent}>
        <div className={styles.posts}>
          <h2>Posts</h2>
          <div className={styles.post}>This is a sample post.</div>
          <div className={styles.post}>Another sample post.</div>
        </div>
        <div className={styles.friendsList}>
          <h2>Friends</h2>
          <ul>
            <li>Alice</li>
            <li>Bob</li>
            <li>Charlie</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;