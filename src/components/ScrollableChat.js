import { Avatar, Tooltip, useDisclosure } from "@chakra-ui/react";
import React, { useState } from "react";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogic";
import { ChatState } from "../context/ChatProvider";
import { AES, enc } from "crypto-js";
import DecryptModal from "./miscellaneous/DecryptModal";

const ScrollableChat = ({ messages, setMessages }) => {
  const { user, selectedChat } = ChatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [passText, setPassText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const showMoal = (msg) => {
    console.log("msg", msg);
    if (msg.sender._id === user._id || msg.decrypted || !msg.isSecure) return;
    setSelectedMsg(msg);
    setPassText(selectedChat.passphrase);
    setErrorMessage("");
    onOpen();
  };

  const decryptMessage = () => {
    const msg = selectedMsg;
    const decryptedMsg = AES.decrypt(msg.content, passText).toString(enc.Utf8);
    if (!decryptedMsg) {
      setErrorMessage("Your key is not correct!");
      return;
    }
    msg.decrypted = true;
    msg.message = decryptedMsg;
    const tmpMessages = [...messages];
    const msgIndex = tmpMessages.findIndex((mess) => mess._id === msg._id);
    if (msgIndex !== -1) {
      tmpMessages[msgIndex] = msg;
      setMessages(tmpMessages);
    }
    onClose();
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: isSameUser(messages, m, i) ? 3 : 10,
            }}
          >
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
              <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                <Avatar
                  mr={1}
                  size="sm"
                  cursor="pointer"
                  name={m.sender.name}
                  src={m.sender.pic}
                />
              </Tooltip>
            )}
            <span
              style={{
                backgroundColor: `${
                  m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                }`,
                borderRadius: "20px",
                padding: "5px 15px",
                maxWidth: "75%",
                marginLeft: isSameSenderMargin(messages, m, i, user._id),
                cursor: `${m.sender._id === user._id ? "default" : "pointer"}`,
              }}
              onClick={() => showMoal(m)}
            >
              {m.decrypted ? m.message : m.content}
            </span>
          </div>
        ))}
      <DecryptModal
        isOpen={isOpen}
        onClose={onClose}
        passText={passText}
        setPassText={setPassText}
        decryptMessage={decryptMessage}
        errorMessage={errorMessage}
      />
    </ScrollableFeed>
  );
};

export default ScrollableChat;
