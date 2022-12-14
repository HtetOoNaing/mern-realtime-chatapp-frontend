import { Switch, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Chat from "./pages/Chat";

function App() {
  return (
    <div className="app">
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/chats" component={Chat} />
      </Switch>
    </div>
  );
}

export default App;
