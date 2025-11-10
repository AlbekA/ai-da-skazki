// FIX: Removed non-existent 'ResponseSchema' from import.
import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

// FIX: Removed 'ResponseSchema' type annotation. TypeScript will infer the type.
const interactiveSchema = {
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
};

// FIX: Removed 'ResponseSchema' type annotation. TypeScript will infer the type.
const nonInteractiveSchema = {
    type: Type.OBJECT,
    properties: {
        story: {
            type: Type.STRING,
            description: 'A complete, self-contained fairy tale in Russian, about 5-6 paragraphs long.'
        }
    },
    required: ['story']
};


export async function generateStoryPart(prompt: string, isInteractive: boolean): Promise<{ story: string; choices?: string[] }> {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: isInteractive ? interactiveSchema : nonInteractiveSchema,
        }
    });
    
    const jsonText = response.text;
    if (!jsonText) {
        console.error("Received empty text response from API.");
        throw new Error("API did not return any text.");
    }

    const trimmedText = jsonText.trim();
    
    // FIX: Removed brittle check for JSON format. `JSON.parse` will throw an error on invalid JSON, which will be caught.
    const result = JSON.parse(trimmedText);
    return result;
  } catch (error) {
    console.error("Error generating story part:", error);
    throw new Error("Failed to generate story part from API.");
  }
}

export async function generateAudio(storyText: string, voiceId: string): Promise<string> {
  if (!storyText.trim()) {
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