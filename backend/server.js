import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS based on environment
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : "*";

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Log Environment Status
console.log("-----------------------------------------");
console.log("🚀 Initializing SigmisGPT Backend Server");
console.log("🔑 Gemini API Key Loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");
console.log("🗄️  MongoDB URI Loaded:", process.env.MONGODB_URI ? "YES" : "NO");
console.log("-----------------------------------------");

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "SigmisGPT Backend",
        timestamp: new Date().toISOString(),
    });
});

app.get("/", (req, res) => {
    res.send("🚀 SigmisGPT Gemini API Server is running smoothly.");
});

// API Routes
app.use("/app/chat", chatRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error("❌ Unhandled Error:", err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
});

// Start Server
const start = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🌐 Server running on http://localhost:${PORT}`);
    });
};

start();