import { createContext, useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

export const MyContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/app/chat";

export const ContextProvider = ({ children }) => {
    const [allThreads, setAllThreads] = useState([]);
    const [currThreadId, setCurrThreadId] = useState(() => uuidv4());
    const [prevChats, setPrevChats] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [newChat, setNewChat] = useState(true);
    const [model, setModel] = useState("gemini-2.0-flash");
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // Clear error auto-dismiss
    useEffect(() => {
        if (errorMsg) {
            const timer = setTimeout(() => setErrorMsg(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMsg]);

    // Fetch all threads from backend
    const getAllThreads = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/thread`);
            const res = await response.json().catch(() => null);

            if (!response.ok || !res?.success) {
                console.warn("Could not load threads from server");
                return;
            }

            setAllThreads(res.data || []);
        } catch (err) {
            console.error("Error fetching threads:", err);
        }
    }, []);

    useEffect(() => {
        getAllThreads();
    }, [getAllThreads]);

    // Create New Chat
    const createNewChat = useCallback(() => {
        const newId = uuidv4();
        setCurrThreadId(newId);
        setPrevChats([]);
        setPrompt("");
        setNewChat(true);
        setLoading(false);
    }, []);

    // Change / Select active thread
    const changeThread = useCallback(async (threadId) => {
        if (!threadId) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/thread/${threadId}`);
            const res = await response.json().catch(() => null);

            if (!response.ok || !res?.success) {
                throw new Error(res?.error || "Failed to load thread");
            }

            setCurrThreadId(threadId);
            setPrevChats(res.messages || []);
            setNewChat(false);
            setPrompt("");
        } catch (err) {
            console.error("Error changing thread:", err);
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Send Message to Gemini AI
    const sendMessage = useCallback(async (customPrompt) => {
        const textToSend = customPrompt || prompt;
        if (!textToSend || !textToSend.trim() || loading) return;

        const userMessage = textToSend.trim();
        setPrompt("");
        setLoading(true);
        setNewChat(false);

        // Optimistically update UI with user message
        setPrevChats((prev) => [
            ...prev,
            { role: "user", content: userMessage },
        ]);

        try {
            const response = await fetch(
                `${API_BASE_URL}/thread/${currThreadId}/message`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: userMessage, model }),
                }
            );

            const res = await response.json().catch(() => null);

            if (!response.ok || !res?.success) {
                throw new Error(res?.error || "Server error while reaching Gemini API");
            }

            // Append Assistant Reply
            setPrevChats((prev) => [
                ...prev,
                { role: "assistant", content: res.reply },
            ]);

            // Refresh thread list if it was a new thread
            if (res.isNewThread) {
                getAllThreads();
            }
        } catch (err) {
            console.error("Send message error:", err);
            setErrorMsg(err.message || "Failed to generate reply");
            // Remove optimistic user message on failure if needed or show error pill
            setPrevChats((prev) => [
                ...prev,
                { role: "assistant", content: `⚠️ **Error**: ${err.message}` },
            ]);
        } finally {
            setLoading(false);
        }
    }, [prompt, loading, currThreadId, model, getAllThreads]);

    // Delete Thread
    const deleteThread = useCallback(async (threadId, e) => {
        if (e) e.stopPropagation();
        try {
            const response = await fetch(`${API_BASE_URL}/thread/${threadId}`, {
                method: "DELETE",
            });
            const res = await response.json().catch(() => null);

            if (!response.ok || !res?.success) {
                throw new Error(res?.error || "Failed to delete thread");
            }

            setAllThreads((prev) => prev.filter((t) => t.threadId !== threadId));

            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.error("Delete thread error:", err);
            setErrorMsg(err.message);
        }
    }, [currThreadId, createNewChat]);

    // Clear All Threads
    const clearAllThreads = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/thread/all`, {
                method: "DELETE",
            });
            const res = await response.json().catch(() => null);

            if (!response.ok || !res?.success) {
                throw new Error(res?.error || "Failed to clear history");
            }

            setAllThreads([]);
            createNewChat();
        } catch (err) {
            console.error("Clear threads error:", err);
            setErrorMsg(err.message);
        }
    }, [createNewChat]);

    // Rename Thread Title
    const renameThread = useCallback(async (threadId, newTitle) => {
        try {
            const response = await fetch(`${API_BASE_URL}/thread/${threadId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle }),
            });
            const res = await response.json().catch(() => null);

            if (!response.ok || !res?.success) {
                throw new Error(res?.error || "Failed to rename thread");
            }

            setAllThreads((prev) =>
                prev.map((t) => (t.threadId === threadId ? { ...t, title: newTitle } : t))
            );
        } catch (err) {
            console.error("Rename thread error:", err);
            setErrorMsg(err.message);
        }
    }, []);

    const value = {
        allThreads,
        currThreadId,
        prevChats,
        prompt,
        setPrompt,
        loading,
        newChat,
        model,
        setModel,
        searchQuery,
        setSearchQuery,
        sidebarOpen,
        setSidebarOpen,
        errorMsg,
        setErrorMsg,
        createNewChat,
        changeThread,
        sendMessage,
        deleteThread,
        clearAllThreads,
        renameThread,
    };

    return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};