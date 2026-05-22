import OpenAI from "openai";

/**
 * ==============================
 * 🔐 SAFE OPENAI INIT (FIX)
 * ==============================
 */
let openai = null;

if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} else {
    console.warn("⚠️ OpenAI API key missing → Running in fallback mode");
}

/**
 * Default fallback (safe AI response)
 */
const DEFAULT_RESPONSE = {
    severity: "MEDIUM",
    priority: 5,
    summary: "Fallback: AI not available",
};

/**
 * Normalize severity → internal system
 */
const normalizeSeverity = (severity) => {
    const map = {
        LOW: "LOW",
        MEDIUM: "MEDIUM",
        HIGH: "HIGH",
        CRITICAL: "CRITICAL",
    };

    return map[severity] || "MEDIUM";
};

/**
 * Validate AI response structure
 */
const validateAIResponse = (data) => {
    const allowedSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

    if (!data) return false;
    if (!allowedSeverities.includes(data.severity)) return false;
    if (typeof data.priority !== "number") return false;
    if (data.priority < 1 || data.priority > 10) return false;
    if (typeof data.summary !== "string") return false;

    return true;
};

/**
 * Build AI Prompt
 */
const buildPrompt = ({ emergencyType, description }) => {
    return `
You are an AI emergency triage system.

Analyze the emergency and classify severity.

Emergency Type: ${emergencyType}
Description: ${description}

Rules:
- Life-threatening → CRITICAL (9–10)
- Severe → HIGH (7–8)
- Moderate → MEDIUM (4–6)
- Minor → LOW (1–3)

Return ONLY JSON:
{
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "priority": number,
  "summary": "short summary"
}
`;
};

/**
 * 🧠 MAIN AI FUNCTION (FIXED)
 */
export const analyzeEmergency = async ({ emergencyType, description }) => {
    try {
        if (!emergencyType || !description) {
            throw new Error("Missing required fields");
        }

        // 🔥 FIX: fallback if no API key
        if (!openai) {
            return DEFAULT_RESPONSE;
        }

        const prompt = buildPrompt({ emergencyType, description });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.2,
        });

        const rawOutput = response?.choices?.[0]?.message?.content;

        if (!rawOutput) {
            throw new Error("Empty AI response");
        }

        let parsed;

        try {
            parsed = JSON.parse(rawOutput);
        } catch (err) {
            console.error("❌ JSON Parse Error:", rawOutput);
            throw new Error("Invalid JSON from AI");
        }

        if (!validateAIResponse(parsed)) {
            console.error("❌ Invalid AI format:", parsed);
            throw new Error("Validation failed");
        }

        return {
            severity: normalizeSeverity(parsed.severity),
            priority: parsed.priority,
            summary: parsed.summary,
        };

    } catch (error) {
        console.error("🚨 AI SERVICE ERROR:", error.message);
        return DEFAULT_RESPONSE;
    }
};

/**
 * 🚀 ETA PREDICTION FUNCTION
 */
export const predictETA = (distanceKm) => {
    try {
        const baseSpeed = 40; // km/h

        let eta = (distanceKm / baseSpeed) * 60;

        let trafficFactor = 0;
        const hour = new Date().getHours();

        if (hour >= 8 && hour <= 11) {
            trafficFactor = 5;
        } else if (hour >= 17 && hour <= 21) {
            trafficFactor = 7;
        } else {
            trafficFactor = 2;
        }

        return Math.round(eta + trafficFactor);

    } catch (err) {
        console.error("ETA Error:", err);
        return 10;
    }
};