import { AddIcon } from "@chakra-ui/icons";
import { Box, Button, Stack, Text, useToast, Avatar } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect } from "react";
import { getSender } from "../config/ChatLogic";
import { ChatState } from "../context/ChatProvider";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";

const MyChats = ({ fetchAgain }) => {
  const { user, selectedChat, setSelectedChat, chats, setChats } = ChatState();

  const toast = useToast();

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`/api/chat`, config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    fetchChats();
  }, [fetchAgain]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p="3"
      bg="white"
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "22px", md: "24px", lg: "26px" }}
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        My Chats
        <GroupChatModal>
          <Button
            display="flex"
            fontSize={{ base: "17px", md: "10px", lg: "16px" }}
            rightIcon={<AddIcon fontSize="14px" />}
          >
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>
      <Box
        display="flex"
        flexDir="column"
        mt={2}
        // p={2}
        // bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll" spacing={0}>
            {chats.map((chat) => {
              const sender = getSender(user, chat.users);
              return (
                <Box
                  onClick={() => setSelectedChat(chat)}
                  cursor="pointer"
                  bg={selectedChat === chat ? "#38B2AC" : "inherit"}
                  color={selectedChat === chat ? "white" : "black"}
                  px={2.5}
                  py={2}
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  key={chat._id}
                >
                  <Avatar
                    mr={2}
                    size="md"
                    cursor="pointer"
                    name={chat.isGroupChat ? chat.chatName : sender}
                    src={user.pic}
                  />
                  <Box>
                    <Text>{chat.isGroupChat ? chat.chatName : sender}</Text>
                    {chat.latestMessage && (
                      <Text fontSize="xs" noOfLines={1}>
                        <b>
                          {chat.latestMessage.sender._id === user._id
                            ? "You: "
                            : `${chat.latestMessage.sender.name}: `}
                        </b>
                        {chat.latestMessage.content}
                      </Text>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
