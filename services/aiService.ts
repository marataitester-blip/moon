import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Note: This relies on process.env.API_KEY being set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTextResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are LUNA, an ethereal, slightly enigmatic AI assistant living in a digital void. You speak with elegance, brevity, and a touch of mystery. You are helpful but atmospheric. Keep responses concise.",
      }
    });
    return response.text || "...";
  } catch (error) {
    console.error("AI Text Error:", error);
    return "The void is silent right now.";
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    // Using Gemini 2.5 Flash Image for fast generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Fast image generation
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        // Note: For Gemini 2.5 Flash Image, we use generateContent but it returns base64 in inlineData
        // We'll interpret the response to find the image.
      }
    });

    // Check for image in response parts
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
       for (const part of response.candidates[0].content.parts) {
         if (part.inlineData) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
         }
       }
    }
    
    // Fallback: If the model decided to return text instead of an image
    return null;
  } catch (error) {
    console.error("AI Image Error:", error);
    return null;
  }
};
