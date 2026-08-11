import mongoose from "mongoose";

let mongoConnected = false;

// Disable Mongoose command buffering so queries fail immediately if not connected
mongoose.set("bufferCommands", false);

export const isMongoConnected = () => mongoConnected;

export const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
        console.warn("⚠️ MONGODB_URI is not set. Operating in In-Memory Mode.");
        mongoConnected = false;
        return false;
    }

    try {
        mongoose.connection.on("connected", () => {
            console.log("✅ MongoDB Connected successfully");
            mongoConnected = true;
        });

        mongoose.connection.on("error", (err) => {
            console.error("⚠️ MongoDB connection error:", err.message);
            mongoConnected = false;
        });

        mongoose.connection.on("disconnected", () => {
            console.log("⚠️ MongoDB Disconnected. Switching to In-Memory store fallback.");
            mongoConnected = false;
        });

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 3000,
        });

        mongoConnected = true;
        return true;
    } catch (err) {
        console.warn(`⚠️ MongoDB Connection Failed (${err.message}). Using In-Memory Store Fallback!`);
        mongoConnected = false;
        return false;
    }
};
