import { GoogleGenAI, Modality, Type } from "@google/genai";

// Fix: Initialize GoogleGenAI with process.env.API_KEY directly, assuming it's available in the execution context.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateStoryPart(prompt: string): Promise<{ story: string; choices: string[] }> {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    story: {
                        type: Type.STRING,
                        description: 'A part of a fairy tale in Russian, about 2-3 paragraphs long.'
                    },
                    choices: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Three possible continuations of the story for the user to choose from, in Russian. Each choice should be a short phrase.'
                    }
                },
                required: ['story', 'choices']
            }
        }
    });

    const jsonText = response.text?.trim();
    if (!jsonText || !jsonText.startsWith('{') || !jsonText.endsWith('}')) {
        console.error("Received non-JSON or empty response:", jsonText);
        throw new Error("API did not return valid JSON.");
    }

    const result = JSON.parse(jsonText);
    return result;
  } catch (error) {
    console.error("Error generating story part:", error);
    throw new Error("Failed to generate story part from API.");
  }
}

export async function generateAudio(storyText: string, voiceId: string): Promise<string> {
  if (!storyText.trim()) {
    // Do not call the API for empty strings.
    return "";
  }
  try {
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