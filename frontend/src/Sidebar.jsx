import "./Sidebar.css";
import { useContext, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import hero from "./assets/hero.png";

function Sidebar() {
    const {
        allThreads,
        currThreadId,
        createNewChat,
        changeThread,
        deleteThread,
        renameThread,
        clearAllThreads,
        searchQuery,
        setSearchQuery,
        sidebarOpen,
        setSidebarOpen,
    } = useContext(MyContext);

    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");

    const filteredThreads = allThreads.filter((t) =>
        t.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStartRename = (thread, e) => {
        e.stopPropagation();
        setEditingId(thread.threadId);
        setEditTitle(thread.title);
    };

    const handleSaveRename = (threadId, e) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            renameThread(threadId, editTitle.trim());
        }
        setEditingId(null);
    };

    return (
        <>
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="sidebarBackdrop"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                {/* Brand Header & Close button for mobile */}
                <div className="sidebarHeader">
                    <div className="brandLogo">
                        <img src={hero} alt="SigmisGPT" className="logoImg" />
                        <div className="brandText">
                            <h2>Sigmis<span>GPT</span></h2>
                            <span className="badge">v2.0</span>
                        </div>
                    </div>
                    <button
                        className="closeSidebarBtn"
                        onClick={() => setSidebarOpen(false)}
                        title="Close Sidebar"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="actionContainer">
                    <button
                        className="newChatBtn"
                        onClick={() => {
                            createNewChat();
                            if (window.innerWidth <= 768) setSidebarOpen(false);
                        }}
                    >
                        <i className="fa-solid fa-plus"></i>
                        <span>New Chat</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="searchBox">
                    <i className="fa-solid fa-magnifying-glass searchIcon"></i>
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <i
                            className="fa-solid fa-xmark clearSearchIcon"
                            onClick={() => setSearchQuery("")}
                        ></i>
                    )}
                </div>

                {/* History List */}
                <div className="historyContainer">
                    <span className="historyLabel">Recents</span>
                    <ul className="historyList">
                        {filteredThreads.length === 0 ? (
                            <li className="emptyHistory">
                                {searchQuery ? "No matching chats found" : "No chats yet"}
                            </li>
                        ) : (
                            filteredThreads.map((thread) => {
                                const isActive = thread.threadId === currThreadId;
                                const isEditing = editingId === thread.threadId;

                                return (
                                    <li
                                        key={thread.threadId}
                                        onClick={() => {
                                            if (!isEditing) {
                                                changeThread(thread.threadId);
                                                if (window.innerWidth <= 768) setSidebarOpen(false);
                                            }
                                        }}
                                        className={`historyItem ${isActive ? "active" : ""}`}
                                    >
                                        <i className="fa-regular fa-message itemIcon"></i>

                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="renameInput"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSaveRename(thread.threadId, e);
                                                    if (e.key === "Escape") setEditingId(null);
                                                }}
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="threadTitle" title={thread.title}>
                                                {thread.title}
                                            </span>
                                        )}

                                        <div className="itemActions">
                                            {isEditing ? (
                                                <i
                                                    className="fa-solid fa-check saveBtn"
                                                    onClick={(e) => handleSaveRename(thread.threadId, e)}
                                                    title="Save"
                                                ></i>
                                            ) : (
                                                <>
                                                    <i
                                                        className="fa-solid fa-pen renameBtn"
                                                        onClick={(e) => handleStartRename(thread, e)}
                                                        title="Rename"
                                                    ></i>
                                                    <i
                                                        className="fa-solid fa-trash deleteBtn"
                                                        onClick={(e) => deleteThread(thread.threadId, e)}
                                                        title="Delete"
                                                    ></i>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>

                {/* Footer Section */}
                <div className="sidebarFooter">
                    {allThreads.length > 0 && (
                        <button
                            className="clearAllBtn"
                            onClick={() => {
                                if (window.confirm("Are you sure you want to clear all chat history?")) {
                                    clearAllThreads();
                                }
                            }}
                        >
                            <i className="fa-solid fa-trash-can"></i>
                            <span>Clear History</span>
                        </button>
                    )}

                    <div className="userBadge">
                        <div className="avatar">P</div>
                        <div className="userInfo">
                            <span className="userName">Piyush Pandey</span>
                            <span className="userTier">Pro Member</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;