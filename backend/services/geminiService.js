const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const generateGeminiReply = async ({
    messages,
    model = "gemini-2.5-flash",
    systemInstruction,
}) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing in backend environment configuration (.env)");
    }

    const contents = messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
    }));

    const body = { contents };
    if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const primaryModel = model || "gemini-2.5-flash";
    const availableFallbacks = ["gemini-2.5-flash-lite", "gemini-3.5-flash"].filter(
        (m) => m !== primaryModel
    );
    const modelsToTry = [primaryModel, ...availableFallbacks];

    let lastError = null;

    for (const currentModel of modelsToTry) {
        try {
            const response = await fetch(
                `${GEMINI_API_BASE}/${currentModel}:generateContent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey,
                    },
                    body: JSON.stringify(body),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.warn(`Model ${currentModel} execution failed:`, JSON.stringify(data));
                lastError = new Error(data?.error?.message || `Request failed with status ${response.status}`);
                lastError.status = response.status;
                continue;
            }

            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;

            lastError = new Error("Gemini API returned an empty response");
        } catch (err) {
            console.warn(`Model ${currentModel} execution failed:`, err.message);
            lastError = err;
        }
    }

    throw lastError || new Error("Failed to generate content from Gemini API");
};