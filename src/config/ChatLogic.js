export const getSender = (loggedUser, users) => {
  return loggedUser._id === users[0]._id ? users[1].name : users[0].name;
};

export const getSenderFull = (loggedUser, users) => {
  return loggedUser._id === users[0]._id ? users[1] : users[0];
};
