import axios from "axios";

const Axios = axios.create({
  baseURL: "https://hybrid-chat-app-api.onrender.com",
  headers: { Accept: "application/json", "Content-Type": "applicaton/json" },
});

export default Axios;
