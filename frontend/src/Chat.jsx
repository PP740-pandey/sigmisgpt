import "./Chat.css";
import { useContext, useEffect, useRef, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import hero from "./assets/hero.png";

// Code block component with copy button
const CodeBlock = ({ children, className }) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "code";

    const handleCopy = () => {
        const text = String(children).replace(/\n$/, "");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="codeBlockWrapper">
            <div className="codeBlockHeader">
                <span className="langTag">{language}</span>
                <button className="copyBtn" onClick={handleCopy}>
                    {copied ? (
                        <>
                            <i className="fa-solid fa-check"></i> Copied!
                        </>
                    ) : (
                        <>
                            <i className="fa-regular fa-copy"></i> Copy
                        </>
                    )}
                </button>
            </div>
            <pre className={className}>
                <code>{children}</code>
            </pre>
        </div>
    );
};

function Chat() {
    const { prevChats, newChat, sendMessage, loading } = useContext(MyContext);
    const messagesEndRef = useRef(null);

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [prevChats, loading]);

    const suggestions = [
        {
            icon: "fa-code",
            title: "Write Code",
            subtitle: "Create a REST API with Express & Node.js",
            prompt: "Write a clean Express.js REST API with CRUD routes for user management.",
        },
        {
            icon: "fa-lightbulb",
            title: "Explain Concept",
            subtitle: "Quantum Computing & Qubits in simple terms",
            prompt: "Explain Quantum Computing and how Qubits work using a simple analogy.",
        },
        {
            icon: "fa-pen-nib",
            title: "Content Creation",
            subtitle: "Draft a professional email for a project proposal",
            prompt: "Draft a formal email proposing a new AI feature to stakeholders.",
        },
        {
            icon: "fa-bug",
            title: "Code Debugger",
            subtitle: "Find memory leaks & optimize performance",
            prompt: "How do I diagnose and fix memory leaks in React and Node.js applications?",
        },
    ];

    const isChatEmpty = newChat && prevChats.length === 0;

    return (
        <div className="chatContentArea">
            {isChatEmpty ? (
                <div className="heroContainer">
                    <div className="heroBadge">
                        <img src={hero} alt="Gemini" className="heroLogo" />
                        <span>Powered by Gemini 2.0</span>
                    </div>

                    <h1 className="heroTitle">
                        Hello, <span className="heroGradientText">Piyush</span>
                    </h1>
                    <p className="heroSubtitle">
                        What would you like to build or explore today?
                    </p>

                    <div className="suggestionsGrid">
                        {suggestions.map((item, idx) => (
                            <div
                                key={idx}
                                className="suggestionCard"
                                onClick={() => sendMessage(item.prompt)}
                            >
                                <div className="cardHeader">
                                    <i className={`fa-solid ${item.icon} cardIcon`}></i>
                                    <i className="fa-solid fa-arrow-up-right-from-square arrowIcon"></i>
                                </div>
                                <h3 className="cardTitle">{item.title}</h3>
                                <p className="cardSubtitle">{item.subtitle}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="messagesContainer">
                    {prevChats.map((msg, index) => {
                        const isUser = msg.role === "user";

                        return (
                            <div
                                key={index}
                                className={`messageRow ${isUser ? "userRow" : "assistantRow"}`}
                            >
                                <div className="avatarWrapper">
                                    {isUser ? (
                                        <div className="userMsgAvatar">P</div>
                                    ) : (
                                        <img src={hero} alt="AI" className="aiMsgAvatar" />
                                    )}
                                </div>

                                <div className="messageBubble">
                                    {isUser ? (
                                        <div className="userTextContent">{msg.content}</div>
                                    ) : (
                                        <ReactMarkdown
                                            rehypePlugins={[rehypeHighlight]}
                                            components={{
                                                code({ inline, className, children, ...props }) {
                                                    if (inline) {
                                                        return (
                                                            <code className="inlineCode" {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                    return (
                                                        <CodeBlock className={className}>
                                                            {children}
                                                        </CodeBlock>
                                                    );
                                                },
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {loading && (
                        <div className="messageRow assistantRow loadingRow">
                            <div className="avatarWrapper">
                                <img src={hero} alt="AI" className="aiMsgAvatar pulse" />
                            </div>
                            <div className="messageBubble loadingBubble">
                                <div className="typingIndicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
}

export default Chat;