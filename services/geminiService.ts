import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { RewriteStyle } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from process.env");
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSummary = async (text: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert editor. Provide a concise, 3-sentence summary of the following text that captures the core essence and makes me want to read more. \n\nTEXT:\n${text.substring(0, 15000)}`, // Limit context for summary to avoid huge payloads
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Failed to generate summary. Please try again.";
  }
};

export const rewriteSection = async (text: string, style: RewriteStyle): Promise<string> => {
  const ai = getAiClient();
  
  let promptPrefix = "";
  switch (style) {
    case 'simplify':
      promptPrefix = "Rewrite the following text to be easily understood by a 10-year-old. Use simple analogies.";
      break;
    case 'engaging':
      promptPrefix = "Rewrite the following text to be highly engaging, like a bestselling thriller or magazine article. Use active voice and vivid imagery.";
      break;
    case 'sarcastic':
      promptPrefix = "Rewrite the following text with a dry, witty, and slightly sarcastic tone. Make it funny but accurate.";
      break;
    case 'pirate':
      promptPrefix = "Rewrite the following text in the voice of an 18th-century pirate captain.";
      break;
    case 'concise':
      promptPrefix = "Rewrite the following text to be extremely concise. Bullet points are allowed if helpful.";
      break;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${promptPrefix}\n\nTEXT:\n${text}`,
    });
    return response.text || "Could not rewrite text.";
  } catch (error) {
    console.error("Error rewriting text:", error);
    return "Failed to rewrite text.";
  }
};

export const chatAboutDocument = async (
  documentContext: string,
  history: { role: string; content: string }[],
  newMessage: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    // We construct a chat session manually or use generateContent with history. 
    // Using generateContent with a structured prompt is often easier for RAG-lite behavior on a single doc.
    
    // Truncate context if it's massive, though Gemini Flash has a large context window.
    const safeContext = documentContext.substring(0, 30000); 
    
    const prompt = `
    You are a helpful reading assistant named Lexicon. 
    The user is reading a document. Use the document content below to answer their question.
    Keep answers conversational and helpful.
    
    DOCUMENT CONTEXT:
    ${safeContext}
    
    CHAT HISTORY:
    ${history.map(h => `${h.role}: ${h.content}`).join('\n')}
    
    USER: ${newMessage}
    MODEL:
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "I'm not sure how to answer that.";
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to my brain right now.";
  }
};

export const explainSelection = async (text: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain the following text clearly and provide one interesting fact related to it.\n\nTEXT:\n${text}`,
    });
    return response.text || "Could not explain selection.";
  } catch (error) {
    return "Error explaining text.";
  }
};
