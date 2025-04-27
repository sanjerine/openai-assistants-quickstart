"use client";

import React from "react";
import Chat from "./components/chat";

const Home = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="max-w-[900px] w-full h-full">
        <Chat />
      </div>
    </div>
  );
};

export default Home;
