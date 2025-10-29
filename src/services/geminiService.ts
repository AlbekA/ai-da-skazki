
import { GoogleGenAI, Modality } from "@google/genai";

export async function generateAudio(storyText: string, voiceId: string): Promise<string> {
  if (!storyText.trim()) {
    // Do not call the API for empty strings.
    return "";
  }
  try {
    // FIX: The API key must be obtained from process.env.API_KEY.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY is not available.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: storyText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceId },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Failed to generate audio from API.");
  }
}