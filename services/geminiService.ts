
import { GoogleGenAI, Modality } from "@google/genai";
import { NewsArticle, CategoryType } from "../types.ts";

export const fetchNewsArticles = async (category: CategoryType, userLocation: string = "the world"): Promise<NewsArticle[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let dynamicContext = `Provide news for the category: ${category}.`;
  if (category === 'Home Politics') {
    dynamicContext = `Provide political news specifically relevant to ${userLocation}. Focus on local governance, elections, and national policy within ${userLocation}. Use reliable local news sources.`;
  } else if (category === 'Inter Politics') {
    dynamicContext = `Provide international political news, focusing on global relations, diplomacy between nations, and major world summits.`;
  }

  const prompt = `Act as a senior news editor. ${dynamicContext} Provide the 6 most recent (last 24-48 hours) and significant stories.
  For each story, I need:
  1. A compelling title.
  2. A "Gist": A concise 2-3 sentence summary that captures the core facts. 
     CRITICAL: If the story involves key figures, experts, or stakeholders, incorporate a direct or indirect quote into the gist to provide primary perspective.
  3. The primary news source name.
  4. The ACTUAL CANONICAL URL of the news article. DO NOT use shortened links or social media links. Ensure the URL is valid and links directly to the news report.
  
  Format the response exactly as a JSON array of objects with these keys: title, gist, source, url. 
  Do not include any markdown formatting blocks like \`\`\`json. Just the raw array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;

    try {
      const parsed: any[] = JSON.parse(jsonStr);
      return parsed.map((item, index) => ({
        id: `news-${Date.now()}-${index}`,
        title: item.title || "Untitled",
        gist: item.gist || "No summary available.",
        source: item.source || "Unknown Source",
        url: item.url || "#",
        publishedAt: new Date().toISOString(),
        category: category,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.title)}/800/450`
      }));
    } catch (parseError) {
      console.error("Failed to parse news JSON", parseError, text);
      return [];
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

export const getGistAudioBuffer = async (title: string, gist: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ 
        parts: [{ 
          text: `Read this news report. First, read the title: "${title}". Then, pause for a brief second, and read the summary: "${gist}"` 
        }] 
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
      return { audioBuffer, audioContext };
    }
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const getDeepAnalysis = async (title: string, gist: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Perform a deep analysis of this news story based on the title and summary provided. 
  Title: ${title}
  Summary: ${gist}
  
  Provide:
  1. Historical context or background explaining why this is happening.
  2. Potential global or local implications of this specific news.
  3. A thoughtful conclusion on where this leads next.
  
  Format as JSON with keys: context, implications, conclusion.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json"
    },
  });

  return JSON.parse(response.text);
};

// Audio Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
