import { ArrowBackIcon, PhoneIcon, ViewIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  useDisclosure,
  Flex,
  Select,
  Button,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { getSender, getSenderFull, isSameUser } from "../config/ChatLogic";
import { ChatState } from "../context/ChatProvider";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import "./styles.css";
import io from "socket.io-client";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { AES, enc } from "crypto-js";
import Axios from "../config/Axios";
import Peer from "simple-peer";

let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const {
    user,
    selectedChat,
    setSelectedChat,
    notifications,
    setNotifications,
  } = ChatState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSecure, setIsSecure] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  //video call
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callingUser, setCallingUser] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      setLoading(true);
      const { data } = await Axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      const messageArr = data.map((msg) => {
        const isSender = msg.sender._id === user._id;
        if (isSender) {
          let decryptedMsg = msg.content;
          if (msg.isSecure) {
            decryptedMsg = AES.decrypt(
              msg.content,
              selectedChat.passphrase
            ).toString(enc.Utf8);
          }
          msg.decrypted = true;
          msg.message = decryptedMsg;
        }
        return msg;
      });
      setMessages(messageArr);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to load the messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  useEffect(() => {
    socket = io(process.env.REACT_APP_BASE_URL);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    socket.on("me", async (id) => {
      setMe(id);
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await Axios.put(
          `/api/user/${user._id}`,
          {
            socketId: id,
          },
          config
        );
        console.log("data", data);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to update the user",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    });
  }, []);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        // give notification
        if (!notifications.includes(newMessageReceived)) {
          setNotifications([newMessageReceived, ...notifications]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageReceived]);
      }
    });
    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
      console.log("data.stream", data.stream);
      setStream(JSON.parse(data.stream));
    });
  });

  const callUser = () => {
    setCallingUser(true);
    console.log("callUser")
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;
        const anotherUser = selectedChat.users.find((u) => u._id !== user._id);
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: stream,
        });
        console.log("stream", stream);
        peer.on("signal", (data) => {
          socket.emit("callUser", {
            userToCall: anotherUser.socketId,
            signalData: data,
            from: me,
            name: name,
            stream: JSON.stringify(stream),
          });
        });

        peer.on("stream", (stream) => {
          userVideo.current.srcObject = stream;
        });

        socket.on("callAccepted", (signal) => {
          setCallAccepted(true);
          peer.signal(signal);
        });

        connectionRef.current = peer;
      });
  };

  const answerCall = () => {
    setCallAccepted(true);
    console.log("stream", stream);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    setCallingUser(false);
    connectionRef.current.destroy();
  };

  const sendMessage = async (e) => {
    if (e.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        let contentMsg = newMessage;
        if (isSecure === "1") {
          contentMsg = AES.encrypt(
            newMessage,
            selectedChat.passphrase
          ).toString();
        }

        setNewMessage("");
        const { data } = await Axios.post(
          `/api/message`,
          {
            content: contentMsg,
            chatId: selectedChat._id,
            isSecure,
          },
          config
        );
        const updatedData = { ...data, decrypted: true, message: newMessage };
        setMessages([...messages, updatedData]);
        socket.emit("new message", data);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;

      if (timeDiff >= timerLength && !typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "18px", md: "22px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center "
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {selectedChat.isGroupChat ? (
              <>
                {selectedChat.chatName}
                <IconButton
                  display={{ base: "flex" }}
                  icon={<ViewIcon />}
                  onClick={onOpen}
                />
                {isOpen && (
                  <>
                    <GroupChatModal
                      selectedChat={selectedChat}
                      setSelectedChat={setSelectedChat}
                      isOpen={isOpen}
                      onClose={onClose}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                {getSender(user, selectedChat.users)}
                <Flex>
                  {/* <IconButton
                    display={{ base: "flex" }}
                    icon={<PhoneIcon />}
                    onClick={callUser}
                  /> */}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </Flex>
              </>
            )}
          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {/* Messages Here */}
            {loading ? (
              <Spinner
                size="xl"
                width={20}
                height={20}
                alignSelf="center"
                margin="auto"
                color="teal"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} setMessages={setMessages} />
              </div>
            )}
            {isTyping ? (
              <Box mt={2}>
                <Lottie
                  options={defaultOptions}
                  width={70}
                  style={{ marginLeft: 0 }}
                />
              </Box>
            ) : (
              <></>
            )}
            {/* <Box sx={{ w: 500, h: 500 }}>
              {callingUser && (
                <video
                  playsInline
                  muted
                  ref={myVideo}
                  autoPlay
                  controls
                  style={{ width: "500px" }}
                />
              )}
              {callAccepted && !callEnded && (
                <video
                  playsInline
                  muted
                  ref={userVideo}
                  autoPlay
                  style={{ width: "500px" }}
                />
              )}
              {receivingCall && !callAccepted && (
                <div>
                  {name} is calling you...
                  <Button onClick={answerCall}>Answer</Button>
                </div>
              )}
            </Box> */}
            <Flex gap={2} mt={2}>
              {!selectedChat.isGroupChat && (
                <FormControl w={100}>
                  <Select
                    value={isSecure}
                    onChange={(e) => setIsSecure(e.target.value)}
                    bg="#E0E0E0"
                    cursor="pointer"
                  >
                    <option value={0}>plain</option>
                    <option value={1}>secure</option>
                  </Select>
                </FormControl>
              )}

              <FormControl onKeyDown={sendMessage} isRequired flex={1}>
                <Input
                  variant="filled"
                  bg="#E0E0E0"
                  placeholder="Enter a message.."
                  onChange={typingHandler}
                  value={newMessage}
                />
              </FormControl>
            </Flex>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
