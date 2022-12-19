import React, { useEffect, useState } from "react";
import axios from "axios";
import { ChatState } from "../context/ChatProvider";
import { Box } from "@chakra-ui/layout";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";

const Chat = () => {
  const { user } = ChatState();
  console.log("user", user);
  return (
    <div style={{ width: "100%" }}>
      {user && <SideDrawer />}
      <Box>
        {user && <MyChats />}
        {user && <ChatBox />}
      </Box>
    </div>
  );
};

export default Chat;
