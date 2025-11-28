import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData, getAudioContext } from "./audioUtils";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned. Check API Key.");
    }

    const audioContext = getAudioContext();
    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
    
    return audioBuffer;

  } catch (error: any) {
    console.error("Error generating speech:", error);
    // Provide a more user-friendly error if possible
    if (error.message?.includes('API key')) {
      throw new Error("Invalid or missing API Key.");
    }
    throw error;
  }
};