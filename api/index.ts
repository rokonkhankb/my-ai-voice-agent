import express, { Request, Response } from "express";
import { GoogleGenAI, Modality } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

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

function isWav(buffer: Buffer): boolean {
  return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF";
}

const VOICES = [
  { id: "Kore", name: "Kore", gender: "Female" },
  { id: "Puck", name: "Puck", gender: "Male" },
  { id: "Charon", name: "Charon", gender: "Male" },
  { id: "Fenrir", name: "Fenrir", gender: "Male" },
  { id: "Zephyr", name: "Zephyr", gender: "Female" },
  { id: "Aoede", name: "Aoede", gender: "Female" },
];

const app = express();
app.use(express.json({ limit: "10mb" }));

// 1. Health Check Endpoint
app.get(["/api/health", "/health"], (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  return res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasClaudeKey: Boolean(process.env.ANTHROPIC_API_KEY),
    providers: {
      claude: Boolean(process.env.ANTHROPIC_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
    },
  });
});

// 2. Voices List Endpoint
app.get(["/api/tts/voices", "/tts/voices"], (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  return res.json({ voices: VOICES });
});

// 3. Claude API Script Generator Endpoint
app.post(["/api/claude/generate", "/claude/generate"], async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "ANTHROPIC_API_KEY is not set in Vercel Environment Variables. Please add ANTHROPIC_API_KEY in Vercel Settings > Environment Variables and redeploy.",
      });
    }

    const { prompt, text, mode = "optimize", model = "claude-3-7-sonnet-20250219" } = req.body;
    const anthropic = new Anthropic({ apiKey });

    let systemPrompt = "You are a professional voice actor scriptwriter. Polish this text so it flows naturally when spoken aloud. Return ONLY the spoken text.";
    let userMessage = prompt || text || "";

    const response = await anthropic.messages.create({
      model: model || "claude-3-7-sonnet-20250219",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const firstBlock = response.content[0];
    const generatedText = firstBlock && firstBlock.type === "text" ? firstBlock.text.trim() : "";

    return res.json({
      success: true,
      provider: "claude",
      result: generatedText,
    });
  } catch (error: any) {
    console.error("Claude API error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process request with Claude API.",
    });
  }
});

// 4. Script Optimizer Endpoint (Claude or Gemini)
app.post(["/api/tts/optimize-text", "/tts/optimize-text"], async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const { text, goal = "clarity", provider = "auto" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required." });
    }

    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const goalInstructions: Record<string, string> = {
      clarity: "Rewrite the text for natural spoken clarity, rhythm, and smooth vocal delivery. Add appropriate punctuation for pauses.",
      story: "Enhance this text to sound more vivid, immersive, and captivating when read aloud like an audiobook.",
      podcast: "Transform this text into an engaging, conversational podcast script with vocal hooks and lively pacing.",
      concise: "Condense this text into a punchy, easy-to-digest voiceover script.",
    };

    const instruction = goalInstructions[goal] || goalInstructions.clarity;

    // Use Claude if requested or if only Claude Key is present
    if ((provider === "claude" || !geminiKey) && claudeKey) {
      const anthropic = new Anthropic({ apiKey: claudeKey });
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1200,
        system: `You are a professional voiceover director and speech scriptwriter. ${instruction} Only return the polished text ready for text-to-speech without meta-commentary, markdown backticks, or introductions.`,
        messages: [{ role: "user", content: `Text to polish:\n${text}` }],
      });

      const firstBlock = response.content[0];
      const resultText = firstBlock && firstBlock.type === "text" ? firstBlock.text.trim() : text;

      return res.json({
        success: true,
        provider: "claude",
        optimizedText: resultText,
      });
    }

    // Otherwise use Gemini if available
    if (geminiKey) {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `You are a professional voiceover director and speech scriptwriter. ${instruction}
Only return the polished text ready for text-to-speech without meta-commentary, markdown backticks, or introductions.

Text to polish:
${text}`,
      });

      return res.json({
        success: true,
        provider: "gemini",
        optimizedText: response.text?.trim() || text,
      });
    }

    return res.status(400).json({
      error: "Neither ANTHROPIC_API_KEY nor GEMINI_API_KEY found in Vercel environment variables.",
    });
  } catch (error: any) {
    console.error("Text optimization error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to optimize text for speech.",
    });
  }
});

// 5. Speech Synthesis Endpoint
app.post(["/api/tts/synthesize", "/tts/synthesize"], async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { text, voice = "Kore", style = "natural", customPrompt } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required." });
    }

    // If Gemini key is not configured, inform client cleanly
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured in Vercel for Neural Voice generation. Please set GEMINI_API_KEY in Vercel Environment Variables or switch to Device / Browser Speech mode.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

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
      const responseText = response.text || "No audio returned by speech model.";
      return res.status(500).json({
        error: `Audio synthesis failed: ${responseText}`,
      });
    }

    let rawBuffer = Buffer.from(rawAudioBase64, "base64");
    let finalWavBase64 = rawAudioBase64;
    let sampleRate = 24000;

    const rateMatch = incomingMime.match(/rate=(\d+)/);
    if (rateMatch && rateMatch[1]) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    if (!isWav(rawBuffer)) {
      const wavBuffer = pcmToWav(rawBuffer, sampleRate, 1, 16);
      finalWavBase64 = wavBuffer.toString("base64");
    }

    const audioDurationSec = Math.round((rawBuffer.length / (sampleRate * 2)) * 10) / 10;

    return res.json({
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
    return res.status(500).json({
      error: error?.message || "An unexpected error occurred during speech generation.",
    });
  }
});

// Fallback error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Vercel API error:", err);
  res.status(500).json({
    error: err?.message || "Internal server error occurred in Vercel function.",
  });
});

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
