"use client";

import React from "react";
import styles from "./page.module.css"; // use simple styles for demonstration purposes
import Chat from "./components/chat";

const Home = () => {
  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <Chat />
      </div>
    </div>
  );
};

export default Home;
