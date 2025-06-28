import { GoogleGenerativeAI } from "@google/generative-ai";

// WARNING: Storing API keys directly in the code is a security risk.
// It is highly recommended to use environment variables to store sensitive data.
const API_KEY = "AIzaSyD31zsNJ9pra2OwC-3CKpGnI_-FGR9AB0I";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function getAiResponse(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "Sorry, I couldn't process your request at the moment.";
  }
}