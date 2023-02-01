import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  Textarea,
  FormErrorMessage,
} from "@chakra-ui/react";

const DecryptModal = ({
  isOpen,
  onClose,
  passText,
  setPassText,
  decryptMessage,
  errorMessage,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          fontSize="18px"
          fontFamily="Work sans"
          display="flex"
          justifyContent="center"
        >
          Decryption
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody
          display="flex"
          flexDir="column"
          alignItems="center"
          justifyContent="space-between"
        >
          <FormControl isInvalid={errorMessage}>
            <Textarea
              placeholder="Private Key"
              value={passText}
              onChange={(e) => setPassText(e.target.value)}
            />
            {errorMessage && (
              <FormErrorMessage>{errorMessage}</FormErrorMessage>
            )}
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={decryptMessage}>
            Decrypt
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DecryptModal;
