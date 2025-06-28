import { GoogleGenerativeAI } from "@google/generative-ai";

// WARNING: Storing API keys directly in the code is a security risk.
// It is highly recommended to use environment variables to store sensitive data.
const API_KEY = "AIzaSyD31zsNJ9pra2OwC-3CKpGnI_-FGR9AB0I";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function getAiResponse(prompt: string): Promise<string> {
  try {
    To call the Gemini 2.0 API, you'll first need an API key from Google AI Studio. You can then integrate the API into your project using the Google Generative AI SDK for Python, Node.js, or Go. For more complex interactions, such as function calling or using tools like Google Search, you'll need to define function declarations or enable specific tools within your API calls. 
Here's a breakdown of the process:
1. Get an API Key:
Go to Google AI Studio.
Create a new API key.
Store the API key securely (e.g., as an environment variable). 
2. Install the Google Generative AI SDK:
Use pip for Python: pip install -q -U google-generativeai.
Use npm for Node.js: npm install @google/generative-ai.
Use go get for Go: go get google.golang.org/genai. 
3. Basic API Usage (Python example):
Python

import google.generativeai as genai
import os

# Configure the API with your API key
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Choose a model
model = genai.GenerativeModel('gemini-2.0-flash-experimental')

# Create a prompt
prompt = "Write a short story about a robot who learns to appreciate nature."

# Generate content
response = model.generate_content(prompt)

# Print the response
print(response.text)
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "Sorry, I couldn't process your request at the moment.";
  }
}