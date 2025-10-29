import { GoogleGenAI, Modality } from "@google/genai";
import type { StoryFormData } from "../components/StoryForm";

// 🧠 Генерация текста сказки
export async function generateStoryPart(
  formData: StoryFormData,
  storyHistory: string,
  isFirstPart: boolean
): Promise<{ storyPart: string; choices: string[] }> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not available. Make sure it is set in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = isFirstPart
    ? `Создай начало сказки для ребенка по имени ${formData.name}. 
      Главный герой: ${formData.character}. 
      Место действия: ${formData.location}. 
      Стиль: добрый, волшебный, понятный детям. 
      Сделай текст красивым и образным.`
    : `Продолжи сказку на основе предыдущей истории:
      ${storyHistory}
      Добавь новую часть сказки. 
      Сохрани стиль и персонажей.`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ parts: [{ text: prompt }] }],
  });

  const storyPart = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

  // Если интерактивная сказка — добавляем варианты выбора
  const choices =
    formData.isInteractive && isFirstPart
      ? ["Продолжить приключение", "Изменить ход событий", "Завершить сказку"]
      : [];

  return { storyPart, choices };
}

// 🔊 Генерация озвучки сказки
export async function generateAudio(storyText: string, voiceId: string): Promise<string> {
  if (!storyText.trim()) {
    return "";
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not available. Make sure it is set in your environment variables.");
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
}
