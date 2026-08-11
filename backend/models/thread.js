import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        _id: false,
    }
);

const threadSchema = new mongoose.Schema(
    {
        threadId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        messages: {
            type: [messageSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        bufferCommands: false,
        autoIndex: false,
    }
);

export default mongoose.model("Thread", threadSchema);