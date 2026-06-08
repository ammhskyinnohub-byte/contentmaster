import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import os from "os";

dotenv.config();

function parseGeminiError(error: any, defaultMessage: string = "Internal GenAI service error occurred.") {
  let errorMessage = error?.message || defaultMessage;
  const errorString = error?.toString?.() || JSON.stringify(error) || "";
  
  if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
    errorMessage = "Rate limit exceeded or too many tokens requested. Please try again in a moment.";
  } else if (errorString.includes("503") || errorString.includes("UNAVAILABLE")) {
    errorMessage = "The AI model is currently experiencing high demand. Please wait a moment and try again.";
  } else if (errorString.includes("400") || errorString.includes("INVALID_ARGUMENT")) {
    errorMessage = "Invalid request or corrupted input. Please try again with different inputs.";
  }
  
  return errorMessage;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let Express handle json payloads up to 10MB to support base64 product image uploads
  app.use(express.json({ limit: '10mb' }));

  const uploadDir = os.tmpdir();
  const upload = multer({ dest: uploadDir });

  // Shared lazy-loaded Gemini SDK client
  let aiClient: GoogleGenAI | null = null;

  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in the server environment. Please configure it in Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  async function callGemini(ai: GoogleGenAI, params: any, retries = 3): Promise<any> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        return await ai.models.generateContent(params);
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || err?.toString() || "";
        if (msg.includes("503") || msg.includes("429") || msg.includes("UNAVAILABLE") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("high demand") || msg.includes("quota")) {
          const delayStr = Math.pow(2, i) * 3000;
          console.log(`Gemini API busy (503/429). Retrying in ${delayStr}ms... (Attempt ${i + 1} of ${retries})`);
          if (i === 0) {
            params.model = "gemini-2.5-flash";
          } else if (i === 1) {
            // fallback to a robust model if overloaded
            params.model = "gemini-2.5-flash";
          }
          await new Promise(r => setTimeout(r, delayStr));
        } else {
          throw err;
        }
      }
    }
    throw lastError;
  }

  // API endpoint to write social media creative content
  app.post("/api/content/generate", async (req: express.Request, res: express.Response) => {
    try {
      const { productName, topic, platform, tone, cta, productPhoto, language, customInstructions, contentLength, useEmojis, contentType, duration } = req.body;

      if (!productName || !topic || !tone) {
        return res.status(400).json({ error: "Product Name, Topic, and Tone are required fields." });
      }

      const ai = getGeminiClient();

      let systemInstruction = "";
      let promptText = "";

      if (contentType === "Video Script") {
        systemInstruction = `You are an expert viral video creator and digital scriptwriter.
Write EXACTLY ONE complete, highly engaging video script. Do NOT provide choices or options.
Write strictly for the brand/creator addressing the target viewing audience (NEVER target "business owners").

Rules:
1. Format: High-retention Video Script. MUST be structured with visual cues. Examples: "[Visual: description]", "[Voiceover: spoken text]". Use a clear sequence.
2. Tone: ${tone}. Be highly original and structured for maximum viewer retention.
3. Language: ${language === 'burmese' ? 'Natural, modern colloquial Burmese (conversational style, not Google translate)' : 'English'}.
4. Target Duration: ${duration}.
5. Structure:
   - 0-3s HOOK: Must be visually and audibly arresting.
   - VALUE/BODY: Keep pacing fast and engaging.
   - OUTRO: Clear, concise finish.
${customInstructions ? `\nCUSTOM RULES (Strictly enforce):\n${customInstructions}` : ''}`;

        promptText = `Produce a structured video script.
Product/Focus: ${productName}
Topic/Context: ${topic}
CTA focus: ${cta}`;
      } else {
        const lengthDirective = contentLength === "Short & Punchy" 
          ? "Keep it very concise, brief, and punchy. Avoid long paragraphs." 
          : contentLength === "Long & Detailed" 
          ? "Write a long, detailed, comprehensively structured post with deep explanation."
          : "Write a standard medium-length post.";

        const emojiDirective = useEmojis === "No"
          ? "CRITICAL: Do NOT use ANY emojis in the generated text. Keep it 100% text-only."
          : "Use relevant emojis tastefully and effectively to enhance visual engagement.";

        systemInstruction = `You are a creative digital copywriter optimizing for conversion.
Write EXACTLY ONE complete, highly creative social media post. Do NOT provide choices or options.
Write strictly from the brand's perspective to the end-consumer (NEVER target "business owners" or "ဆိုင်ရှင်တို့ရေ").

Rules:
1. Platform Format: ${platform}. ${platform === 'TikTok' ? '(Write a creative video script starting with a 3s hook, visual cues, and voiceover)' : ''}
2. Tone: ${tone}. Be highly original, engaging, and less robotic.
3. Language: ${language === 'burmese' ? 'Natural, modern colloquial Burmese (social media style, not Google translate)' : 'English'}.
4. Length: ${lengthDirective}
5. Emojis: ${emojiDirective}
6. Structure: ONE compelling hook line, body, CTA ("${cta}"), and 5-8 hashtags.
${customInstructions ? `\nCUSTOM RULES (Strictly enforce):\n${customInstructions}` : ''}`;

        promptText = `Product: ${productName}
Topic: ${topic}
CTA focus: ${cta}`;
      }

      let contentsPayload: any = [];

      // If user uploaded an image for multimodal understanding
      if (productPhoto && productPhoto.startsWith("data:")) {
        const mimeType = productPhoto.substring(productPhoto.indexOf(":") + 1, productPhoto.indexOf(";"));
        const base64Data = productPhoto.substring(productPhoto.indexOf(";base64,") + 8);

        contentsPayload.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
        promptText = `[Product photo is attached as helper context. Inspect this image to write highly tailored copy emphasizing the product's visual attributes, colors, build, package design, or features shown in the photo.]\n\n${promptText}`;
      }

      contentsPayload.push({ text: promptText });

      const response = await callGemini(ai, {
        model: "gemini-2.5-flash",
        contents: contentsPayload,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.9,
        }
      });

      res.json({ content: response.text });
    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      res.status(500).json({ error: parseGeminiError(error, "Failed to generate content.") });
    }
  });

  app.post("/api/recap/generate", async (req: express.Request, res: express.Response) => {
    try {
      const { videoLink, duration } = req.body;
      let transcriptText = "";

      // Try fetching youtube transcript
      if (videoLink.includes("youtube.com") || videoLink.includes("youtu.be")) {
        try {
          const { YoutubeTranscript } = await import("youtube-transcript");
          const transcript = await YoutubeTranscript.fetchTranscript(videoLink);
          transcriptText = transcript.map((t: any) => t.text).join(" ");
          transcriptText = transcriptText.substring(0, 15000); // Limit to ~15k chars for prompt speed
        } catch (err: any) {
          if (err?.message?.includes("Transcript is disabled") || err?.toString()?.includes("Transcript is disabled")) {
            return res.status(400).json({ success: false, error: "This video does not have closed captions/transcript enabled. Please try another video that has transcripts." });
          }
          console.error("Transcript fetch failed:", err);
          transcriptText = "Transcript could not be extracted directly. Please analyze based on the URL context if possible.";
        }
      }

      const systemInstruction = `You are an expert video content director and scriptwriter. 
Your task is to create a dynamic, engaging recap script from a provided video link or transcript.
The user wants the script perfectly timed for a ${duration} read.

Formatting Rules:
1. Organize the script with time-based sections (e.g., [0:00-0:15] Hook, [0:15-1:00] Act 1).
2. Clearly separate Audio / Voiceover from Visual directions.
3. Make it punchy, engaging, and suitable for short-form or fast-paced viewing.
4. Output language should be Burmese (မြန်မာဘာသာ) unless the context strictly requires otherwise. Make it natural and conversational!`;

      let promptText = `Please generate a Recap Script for length: ${duration}.
Source Video Link: ${videoLink}`;

      if (transcriptText) {
        promptText += `\n\nExtracted Details/Transcript:\n${transcriptText}`;
      }

      const ai = getGeminiClient();

      const response = await callGemini(ai, {
        model: "gemini-2.5-flash",
        contents: promptText,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ success: true, data: response.text });
    } catch (error: any) {
      console.error("Recap error:", error);
      res.status(500).json({ success: false, error: parseGeminiError(error, "Failed to recap video.") });
    }
  });

  app.post("/api/recap/generate-file", upload.single("videoFile"), async (req: express.Request, res: express.Response) => {
    let uploadedFileDetails: any = null;
    let localFilePath = "";
    try {
      const duration = req.body.duration;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: "No video file provided." });
      }

      localFilePath = file.path;
      const ai = getGeminiClient();

      // Upload file to Gemini
      const fileUploadRes = await ai.files.upload({
        file: localFilePath,
        config: { mimeType: file.mimetype, displayName: file.originalname }
      });
      uploadedFileDetails = fileUploadRes;

      // Poll until state is ACTIVE
      let fileInfo = await ai.files.get({ name: uploadedFileDetails.name });
      while (fileInfo.state === 'PROCESSING') {
        await new Promise(resolve => setTimeout(resolve, 5000));
        fileInfo = await ai.files.get({ name: uploadedFileDetails.name });
      }

      if (fileInfo.state === 'FAILED') {
        throw new Error("Gemini failed to process the video file.");
      }

      const systemInstruction = `You are an expert video content director and scriptwriter. 
Your task is to create a dynamic, engaging recap script from the provided video file.
The user wants the script perfectly timed for a ${duration} read.

Formatting Rules:
1. Organize the script with time-based sections (e.g., [0:00-0:15] Hook, [0:15-1:00] Act 1).
2. Clearly separate Audio / Voiceover from Visual directions.
3. Make it punchy, engaging, and suitable for short-form or fast-paced viewing.
4. Output language should be Burmese (မြန်မာဘာသာ) unless the context strictly requires otherwise. Make it natural and conversational!`;

      // Pass the uploaded file as part of the prompt
      const contentsPayload = [
        {
           fileData: {
             fileUri: fileInfo.uri,
             mimeType: fileInfo.mimeType
           }
        },
        { text: `Please generate a Recap Script for length: ${duration}.` }
      ];

      const response = await callGemini(ai, {
        model: "gemini-2.5-flash",
        contents: contentsPayload as any,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ success: true, data: response.text });
    } catch (error: any) {
      console.error("Recap from file error:", error);
      res.status(500).json({ success: false, error: parseGeminiError(error, "Failed to recap video file.") });
    } finally {
      // Clean up server local temp file
      if (localFilePath && fs.existsSync(localFilePath)) {
        try { fs.unlinkSync(localFilePath); } catch (e) {}
      }
      // Clean up Gemini uploaded file
      if (uploadedFileDetails) {
        try {
          const ai = getGeminiClient();
          await ai.files.delete({ name: uploadedFileDetails.name });
        } catch (e) {
          console.error("Failed to delete Gemini file:", e);
        }
      }
    }
  });

  app.post("/api/tts/generate", async (req: express.Request, res: express.Response) => {
    try {
      const { text, voice, pitch = 'normal', speed = 'normal' } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, error: "Missing text payload" });
      }

      const ai = getGeminiClient();
      
      const prompt = `Say in Burmese. Speed: ${speed}. Pitch: ${pitch}. Text: ${text}`;
      
      const response = await callGemini(ai, {
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice || "Kore" },
              },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ success: true, audioBase64: base64Audio });
      } else {
        throw new Error("Did not receive audio from Gemini API");
      }
    } catch (error: any) {
      console.error("TTS generation error:", error);
      let errorMessage = error?.message || "Failed to generate audio.";
      
      if (error?.status === 429 || errorMessage.includes("429") || errorMessage.includes("quota")) {
        errorMessage = "API Rate Limit Exceeded. Please wait a minute and try again (Free tier limit reached).";
      }

      res.status(error?.status === 429 ? 429 : 500).json({ success: false, error: errorMessage });
    }
  });

  // API fallback (to prevent Vite SPA from returning html for unknown API routes)
  app.all("/api/*", (req, res) => {
    res.status(404).json({ success: false, error: "API route not found: " + req.path });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler to catch express.json errors or 413s
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error:", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.type === 'entity.too.large' ? "File or content is too large." : (err.message || "Internal Server Error")
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
