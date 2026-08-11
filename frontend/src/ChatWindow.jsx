import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useRef, useEffect } from "react";

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        sendMessage,
        loading,
        model,
        setModel,
        setSidebarOpen,
        createNewChat,
        prevChats,
        errorMsg,
        setErrorMsg,
    } = useContext(MyContext);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const textareaRef = useRef(null);

    // Auto-adjust textarea height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
        }
    }, [prompt]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!loading && prompt.trim()) {
                sendMessage();
            }
        }
    };

    const handleExportChat = () => {
        if (!prevChats || prevChats.length === 0) {
            alert("No messages to export.");
            return;
        }

        const formattedText = prevChats
            .map((c) => `### ${c.role.toUpperCase()}\n${c.content}\n`)
            .join("\n---\n\n");

        const blob = new Blob([formattedText], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sigmisgpt-chat-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setIsProfileOpen(false);
    };

    const modelsList = [
        { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", desc: "Fastest & Multimodal", icon: "fa-bolt" },
        { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Lite", desc: "High Efficiency", icon: "fa-rocket" },
        { id: "gemini-flash-latest", name: "Gemini Flash Latest", desc: "Latest Stable Release", icon: "fa-brain" },
    ];

    const currentModelObj = modelsList.find((m) => m.id === model) || modelsList[0];

    return (
        <main className="chatWindow">
            {/* Top Navigation Bar */}
            <header className="navbar">
                <div className="navLeft">
                    <button
                        className="mobileMenuBtn"
                        onClick={() => setSidebarOpen(true)}
                        title="Open Sidebar"
                    >
                        <i className="fa-solid fa-bars"></i>
                    </button>

                    {/* Model Selector Dropdown */}
                    <div className="modelSelector">
                        <button
                            className="modelBtn"
                            onClick={() => setIsModelDropdownOpen((prev) => !prev)}
                        >
                            <i className={`fa-solid ${currentModelObj.icon} modelIcon`}></i>
                            <span className="modelName">{currentModelObj.name}</span>
                            <i className="fa-solid fa-chevron-down caretIcon"></i>
                        </button>

                        {isModelDropdownOpen && (
                            <div className="modelMenu">
                                {modelsList.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`modelOption ${m.id === model ? "active" : ""}`}
                                        onClick={() => {
                                            setModel(m.id);
                                            setIsModelDropdownOpen(false);
                                        }}
                                    >
                                        <i className={`fa-solid ${m.icon}`}></i>
                                        <div className="modelOptionDetails">
                                            <span className="optionTitle">{m.name}</span>
                                            <span className="optionDesc">{m.desc}</span>
                                        </div>
                                        {m.id === model && <i className="fa-solid fa-check activeCheck"></i>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="navRight">
                    <button
                        className="headerActionBtn"
                        onClick={createNewChat}
                        title="New Chat"
                    >
                        <i className="fa-solid fa-square-plus"></i>
                    </button>

                    <div className="profileContainer">
                        <button
                            className="userAvatarBtn"
                            onClick={() => setIsProfileOpen((prev) => !prev)}
                            title="Profile & Menu"
                        >
                            <span>P</span>
                        </button>

                        {isProfileOpen && (
                            <div className="profileDropdown">
                                <div className="dropdownHeader">
                                    <span className="dropdownName">Piyush Pandey</span>
                                    <span className="dropdownEmail">sigmis@ai.dev</span>
                                </div>
                                <hr className="dropdownDivider" />

                                <div className="dropdownItem" onClick={handleExportChat}>
                                    <i className="fa-solid fa-download"></i>
                                    <span>Export Chat (.md)</span>
                                </div>

                                <div className="dropdownItem" onClick={() => { createNewChat(); setIsProfileOpen(false); }}>
                                    <i className="fa-solid fa-rotate"></i>
                                    <span>Reset Workspace</span>
                                </div>

                                <hr className="dropdownDivider" />
                                <div className="dropdownItem danger" onClick={() => alert("SigmisGPT v2.0 strictly powered by Google Gemini API.")}>
                                    <i className="fa-solid fa-circle-info"></i>
                                    <span>About SigmisGPT</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Error Notification Pill */}
            {errorMsg && (
                <div className="errorBanner">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span>{errorMsg}</span>
                    <i
                        className="fa-solid fa-xmark closeErrorBtn"
                        onClick={() => setErrorMsg(null)}
                    ></i>
                </div>
            )}

            {/* Main Chat Component */}
            <Chat />

            {/* Bottom Input Area */}
            <footer className="chatInputSection">
                <div className="inputContainer">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Ask SigmisGPT anything... (Shift + Enter for new line)"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />

                    <div className="inputFooterControls">
                        <div className="modelPill">
                            <i className="fa-solid fa-sparkles"></i>
                            <span>{currentModelObj.name}</span>
                        </div>

                        <button
                            className={`sendBtn ${prompt.trim() && !loading ? "active" : ""}`}
                            onClick={() => sendMessage()}
                            disabled={!prompt.trim() || loading}
                            title="Send Message"
                        >
                            {loading ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fa-solid fa-paper-plane"></i>
                            )}
                        </button>
                    </div>
                </div>

                <p className="disclaimer">
                    SigmisGPT can produce mistakes. Verify critical facts. Built with Google Gemini & React.
                </p>
            </footer>
        </main>
    );
}

export default ChatWindow;