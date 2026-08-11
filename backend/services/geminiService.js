import { GoogleGenAI } from "@google/genai";

export const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing in backend environment configuration (.env)");
    }
    return new GoogleGenAI({ apiKey, vertexai: false });
};

/**
 * Generate AI content using Google Gemini SDK with fallback model execution
 * @param {Object} options
 * @param {Array} options.messages Array of { role: 'user'|'assistant', content: string }
 * @param {string} [options.model='gemini-2.0-flash'] Target Gemini Model
 * @param {string} [options.systemInstruction] Optional system instruction
 */
export const generateGeminiReply = async ({
    messages,
    model = "gemini-2.0-flash",
    systemInstruction,
}) => {
    const ai = getGeminiClient();

    // Map conversation history into Gemini format
    const contents = messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
    }));

    const config = {};
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }

    const primaryModel = model || "gemini-2.0-flash";
    const availableFallbacks = ["gemini-2.0-flash-lite", "gemini-flash-latest", "gemini-2.0-flash"].filter((m) => m !== primaryModel);

    const modelsToTry = [primaryModel, ...availableFallbacks];

    let lastError = null;

    for (const currentModel of modelsToTry) {
        try {
            const response = await ai.models.generateContent({
                model: currentModel,
                contents,
                config,
            });

            if (response && response.text) {
                return response.text;
            }
        } catch (err) {
            console.warn(`Model ${currentModel} execution failed:`, err.message);
            lastError = err;

            // If 429 quota error, try next fallback immediately
            if (err.status === 429 || (err.message && err.message.includes("quota"))) {
                continue;
            }
        }
    }

    throw lastError || new Error("Failed to generate content from Gemini API");
};
