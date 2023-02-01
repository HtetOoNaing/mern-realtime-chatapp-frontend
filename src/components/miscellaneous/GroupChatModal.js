import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useToast,
  FormControl,
  Input,
} from "@chakra-ui/react";

import { ChatState } from "../../context/ChatProvider";
import { Select } from "chakra-react-select";
import Axios from "../../config/Axios";

const GroupChatModal = ({ selectedChat, isOpen, onClose }) => {
  const [groupChatName, setGroupChatName] = useState("");
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { user, chats, setChats } = ChatState();

  const fetchUsers = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await Axios.get(`/api/user`, config);
      const userOptions = data.map((user) => ({
        label: user.name,
        value: user._id,
      }));
      setUsers(userOptions);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to load the search results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      setGroupChatName(selectedChat.chatName);
      setSelectedUsers(
        selectedChat.users.map((user) => ({
          label: user.name,
          value: user._id,
        }))
      );
    }
  }, [selectedChat]);

  const createNewChat = async (config) => {
    const { data } = await Axios.post(
      `/api/chat/group`,
      {
        name: groupChatName,
        users: JSON.stringify(selectedUsers.map((u) => u.value)),
      },
      config
    );
    console.log("created new chat");
    setChats([data, ...chats]);
  };

  const updateChat = async (config) => {
    const { data } = await Axios.put(
      `/api/chat/group/${selectedChat._id}`,
      {
        name: groupChatName,
        users: JSON.stringify(selectedUsers.map((u) => u.value)),
      },
      config
    );
    const updatedChats = chats.map((chat) =>
      chat._id === data._id ? data : chat
    );
    setChats(updatedChats);
  };

  const handleSubmit = async () => {
    if (!groupChatName || selectedUsers.length <= 0) {
      toast({
        title: "Please fill all the fields",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      selectedChat ? await updateChat(config) : await createNewChat(config);
      console.log("finish");
      onClose();
      toast({
        title: selectedChat
          ? "Group Chat is updated!"
          : "New Group Chat created!",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Fail to create the chat!",
        description: error.response.data,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          fontSize="20px"
          fontFamily="Work sans"
          display="flex"
          justifyContent="center"
        >
          {selectedChat ? groupChatName : "Create Group Chat"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDir="column" alignItems="center">
          <FormControl>
            <Input
              placeholder="ChatName"
              mb={3}
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <Select
              isMulti
              name="colors"
              options={users}
              placeholder="Select some colors..."
              closeMenuOnSelect={false}
              value={selectedUsers}
              onChange={setSelectedUsers}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            {selectedChat ? "Update Chat" : "Create Chat"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GroupChatModal;
