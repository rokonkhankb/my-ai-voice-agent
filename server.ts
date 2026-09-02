import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to convert raw PCM audio buffer to standard WAV format
function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF chunk
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  // fmt subchunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Check if buffer starts with 'RIFF'
function isWav(buffer: Buffer): boolean {
  return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF";
}

const VOICES = [
  {
    id: "Kore",
    name: "Kore",
    gender: "Female",
    trait: "Warm, balanced, and articulate",
    recommendedFor: "General narration, tutorials, audiobooks, and daily reading",
    color: "from-amber-500 to-rose-500",
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "Male",
    trait: "Lively, energetic, and playful",
    recommendedFor: "Podcasts, dynamic storytelling, advertising, and cheerful guides",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "Male",
    trait: "Deep, cinematic, and authoritative",
    recommendedFor: "Documentaries, dramatic trailers, mystery, and serious speeches",
    color: "from-indigo-500 to-violet-600",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "Male",
    trait: "Bold, resonant, and confident",
    recommendedFor: "Keynotes, gaming character voice, motivational talks, and trailers",
    color: "from-orange-500 to-red-600",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "Female",
    trait: "Gentle, calm, and soothing",
    recommendedFor: "Meditation, bedtime stories, mindfulness, and relaxed listening",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "Aoede",
    name: "Aoede",
    gender: "Female",
    trait: "Expressive, melodic, and engaging",
    recommendedFor: "Literary fiction, creative poetry, education, and theatrical reads",
    color: "from-fuchsia-500 to-pink-500",
  },
];

// Health Check
app.get(["/api/health", "/health"], (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// List Voices
app.get(["/api/tts/voices", "/tts/voices"], (req, res) => {
  res.json({
    voices: VOICES,
  });
});

// Synthesize Speech with Gemini TTS
app.post(["/api/tts/synthesize", "/tts/synthesize"], async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured in environment variables.",
      });
    }

    const { text, voice = "Kore", style = "natural", customPrompt } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required." });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: "Text exceeds maximum 5000 character limit." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Construct stylistic instruction if selected
    let promptWithStyle = text.trim();
    if (customPrompt && customPrompt.trim()) {
      promptWithStyle = `Say ${customPrompt.trim()}: ${text.trim()}`;
    } else if (style && style !== "natural") {
      const styleDirectives: Record<string, string> = {
        cheerful: "cheerfully and with infectious optimism",
        dramatic: "dramatically with emotional cinematic pauses",
        calm: "in a gentle, soothing, calm whisper-like cadence",
        news: "in a clear, authoritative, professional broadcast tone",
        mysterious: "in a quiet, suspenseful, intriguing voice",
        excited: "with high energy, enthusiasm, and vivid excitement",
        storyteller: "like a seasoned, captivating fairytale and audiobook narrator",
        empathetic: "with deep warmth, understanding, and heartfelt empathy",
        robotic: "in a crisp, precise, futuristic cadence",
      };

      const directive = styleDirectives[style];
      if (directive) {
        promptWithStyle = `Say ${directive}: ${text.trim()}`;
      }
    }

    const validVoice = VOICES.some((v) => v.id === voice) ? voice : "Kore";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: promptWithStyle }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: validVoice },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const rawAudioBase64 = part?.inlineData?.data;
    const incomingMime = part?.inlineData?.mimeType || "audio/pcm;rate=24000";

    if (!rawAudioBase64) {
      // If the model returned text explanation instead of audio
      const responseText = response.text || "No audio returned by speech model.";
      return res.status(500).json({
        error: `Audio synthesis failed: ${responseText}`,
      });
    }

    let rawBuffer = Buffer.from(rawAudioBase64, "base64");
    let finalWavBase64 = rawAudioBase64;
    let sampleRate = 24000;

    // Detect sample rate from mimeType if available (e.g. rate=24000)
    const rateMatch = incomingMime.match(/rate=(\d+)/);
    if (rateMatch && rateMatch[1]) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    // If not already a formatted WAV file, convert PCM to WAV container
    if (!isWav(rawBuffer)) {
      const wavBuffer = pcmToWav(rawBuffer, sampleRate, 1, 16);
      finalWavBase64 = wavBuffer.toString("base64");
    }

    // Calculate approximate duration in seconds
    const audioDurationSec = Math.round((rawBuffer.length / (sampleRate * 2)) * 10) / 10;

    res.json({
      success: true,
      audioBase64: finalWavBase64,
      mimeType: "audio/wav",
      sampleRate,
      voice: validVoice,
      style,
      duration: audioDurationSec,
      characterCount: text.length,
      wordCount: text.trim().split(/\s+/).length,
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    res.status(500).json({
      error: error?.message || "An unexpected error occurred during speech generation.",
    });
  }
});

// Text Enhancer / Speech Script Optimizer using Gemini 3.7 Flash
app.post(["/api/tts/optimize-text", "/tts/optimize-text"], async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "GEMINI_API_KEY is missing." });
    }

    const { text, goal = "clarity" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    const goalInstructions: Record<string, string> = {
      clarity: "Rewrite the text for natural spoken clarity, rhythm, and smooth vocal delivery. Add appropriate punctuation for pauses.",
      story: "Enhance this text to sound more vivid, immersive, and captivating when read aloud like an audiobook.",
      podcast: "Transform this text into an engaging, conversational podcast script with vocal hooks and lively pacing.",
      concise: "Condense this text into a punchy, easy-to-digest voiceover script.",
    };

    const instruction = goalInstructions[goal] || goalInstructions.clarity;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `You are a professional voiceover director and speech scriptwriter. ${instruction}
Only return the polished text ready for text-to-speech without meta-commentary, markdown backticks, or introductions.

Text to polish:
${text}`,
    });

    res.json({
      success: true,
      optimizedText: response.text?.trim() || text,
    });
  } catch (error: any) {
    console.error("Text optimization error:", error);
    res.status(500).json({
      error: error?.message || "Failed to optimize text for speech.",
    });
  }
});

// Boot server with Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only auto-start when not in a serverless environment (like Vercel)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
