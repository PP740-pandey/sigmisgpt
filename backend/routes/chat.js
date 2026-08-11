import express from "express";
import {
    getAllThreads,
    getThreadById,
    postMessageToThread,
    updateThreadTitle,
    deleteThread,
    clearAllThreads,
} from "../controllers/chatController.js";

const router = express.Router();

// Thread listing & management
router.get("/thread", getAllThreads);
router.delete("/thread/all", clearAllThreads);
router.get("/thread/:threadId", getThreadById);
router.patch("/thread/:threadId", updateThreadTitle);
router.delete("/thread/:threadId", deleteThread);

// Send message to thread
router.post("/thread/:threadId/message", postMessageToThread);

export default router;