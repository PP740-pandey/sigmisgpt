import { randomUUID } from "crypto";
import Thread from "../models/thread.js";
import { generateGeminiReply } from "../services/geminiService.js";
import { isMongoConnected } from "../config/db.js";

// In-Memory Fallback Storage
const memoryThreads = new Map();

// Helper: Get thread list
const getThreadsList = async () => {
    if (isMongoConnected()) {
        try {
            return await Thread.find({}, { threadId: 1, title: 1, updatedAt: 1, createdAt: 1 })
                .sort({ updatedAt: -1 });
        } catch (err) {
            console.warn("MongoDB query failed, falling back to memory store:", err.message);
        }
    }
    // Fallback: Memory
    return Array.from(memoryThreads.values())
        .map((t) => ({
            threadId: t.threadId,
            title: t.title,
            updatedAt: t.updatedAt || new Date(),
            createdAt: t.createdAt || new Date(),
        }))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

// Helper: Get single thread
const getSingleThread = async (threadId) => {
    if (isMongoConnected()) {
        try {
            const doc = await Thread.findOne({ threadId });
            if (doc) return doc;
        } catch (err) {
            console.warn("MongoDB findOne failed, checking memory store:", err.message);
        }
    }
    return memoryThreads.get(threadId) || null;
};

// Helper: Save thread
const saveSingleThread = async (threadData) => {
    // Always store in memory
    memoryThreads.set(threadData.threadId, threadData);

    if (isMongoConnected()) {
        try {
            let doc = await Thread.findOne({ threadId: threadData.threadId });
            if (!doc) {
                doc = new Thread(threadData);
            } else {
                doc.title = threadData.title;
                doc.messages = threadData.messages;
                doc.updatedAt = new Date();
            }
            await doc.save();
            return doc;
        } catch (err) {
            console.warn("MongoDB save failed, stored in memory store:", err.message);
        }
    }
    return threadData;
};

// --- CONTROLLERS ---

// Fetch all threads
export const getAllThreads = async (req, res, next) => {
    try {
        const threads = await getThreadsList();
        return res.json({
            success: true,
            data: threads,
        });
    } catch (err) {
        next(err);
    }
};

// Fetch single thread by ID
export const getThreadById = async (req, res, next) => {
    try {
        const { threadId } = req.params;
        const thread = await getSingleThread(threadId);

        if (!thread) {
            return res.status(404).json({
                success: false,
                error: "Thread not found",
            });
        }

        return res.json({
            success: true,
            threadId: thread.threadId,
            title: thread.title,
            messages: thread.messages || [],
        });
    } catch (err) {
        next(err);
    }
};

// Send message to thread & generate AI response
export const postMessageToThread = async (req, res, next) => {
    try {
        const { threadId } = req.params;
        const { message, model = "gemini-2.0-flash" } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: "Message prompt is required",
            });
        }

        let thread = await getSingleThread(threadId);
        const isNewThread = !thread;

        if (!thread) {
            const cleanTitle = message.trim().split("\n")[0].substring(0, 45);
            thread = {
                threadId: threadId || randomUUID(),
                title: cleanTitle || "New Conversation",
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        // Add user message
        thread.messages.push({
            role: "user",
            content: message.trim(),
        });

        let replyText = "";
        try {
            // Call Gemini Service
            replyText = await generateGeminiReply({
                messages: thread.messages,
                model,
            });
        } catch (geminiErr) {
            console.error("Gemini API Error:", geminiErr.message);

            // Craft user friendly error message if quota exceeded
            if (geminiErr.message && (geminiErr.message.includes("quota") || geminiErr.message.includes("429"))) {
                replyText = `⚠️ **Gemini API Quota Exceeded**: The model \`${model}\` has reached its current API request quota. Please wait a minute or switch to another model (e.g. **Gemini 1.5 Flash**) in the top menu.`;
            } else {
                replyText = `⚠️ **Gemini Service Error**: ${geminiErr.message || "Failed to generate response."}`;
            }
        }

        // Add assistant reply
        thread.messages.push({
            role: "assistant",
            content: replyText,
        });

        thread.updatedAt = new Date();

        // Save to DB / Memory
        await saveSingleThread(thread);

        return res.json({
            success: true,
            threadId: thread.threadId,
            title: thread.title,
            reply: replyText,
            messages: thread.messages,
            isNewThread,
        });
    } catch (err) {
        next(err);
    }
};

// Update thread title
export const updateThreadTitle = async (req, res, next) => {
    try {
        const { threadId } = req.params;
        const { title } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                error: "Title is required",
            });
        }

        const thread = await getSingleThread(threadId);

        if (!thread) {
            return res.status(404).json({
                success: false,
                error: "Thread not found",
            });
        }

        thread.title = title.trim();
        thread.updatedAt = new Date();
        await saveSingleThread(thread);

        return res.json({
            success: true,
            data: thread,
        });
    } catch (err) {
        next(err);
    }
};

// Delete single thread
export const deleteThread = async (req, res, next) => {
    try {
        const { threadId } = req.params;
        memoryThreads.delete(threadId);

        if (isMongoConnected()) {
            try {
                await Thread.findOneAndDelete({ threadId });
            } catch (err) {
                console.warn("MongoDB delete error:", err.message);
            }
        }

        return res.json({
            success: true,
            message: "Thread successfully deleted",
            threadId,
        });
    } catch (err) {
        next(err);
    }
};

// Clear all threads
export const clearAllThreads = async (req, res, next) => {
    try {
        memoryThreads.clear();

        if (isMongoConnected()) {
            try {
                await Thread.deleteMany({});
            } catch (err) {
                console.warn("MongoDB deleteMany error:", err.message);
            }
        }

        return res.json({
            success: true,
            message: "All threads cleared successfully",
        });
    } catch (err) {
        next(err);
    }
};
