import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ Never hard‑code API keys in source! Use an env var instead:
const API_KEY = process.env.GOOGLE_AI_API_KEY!;
if (!API_KEY) {
  throw new Error("Please set the GOOGLE_AI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/*
  === Gemini 2.0 Integration Notes ===

  1. Create an API key in Google AI Studio and set it
     as GOOGLE_AI_API_KEY in your env (e.g. .env file).
  2. Install the SDK:
     npm install @google/generative-ai
  3. For function‑calling or tool usage, refer to:
     https://cloud.google.com/ai‑studio/docs/generative/introduction
*/

export async function getAiResponse(prompt: string): Promise<string> {
  try {
    // pick the model you need:
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // call the API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "Sorry, I couldn't process your request at the moment.";
  }
}
