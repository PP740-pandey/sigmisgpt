import "./App.css";
import { ContextProvider } from "./MyContext.jsx";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";

function App() {
    return (
        <ContextProvider>
            <div className="app">
                <Sidebar />
                <ChatWindow />
            </div>
        </ContextProvider>
    );
}

export default App;