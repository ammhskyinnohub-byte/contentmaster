import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add CORS to allow requests from Firebase hosting
  app.use(cors());

  // Let Express handle json payloads up to 10MB to support base64 product image uploads
  app.use(express.json({ limit: '10mb' }));

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

  // API endpoint to write social media creative content
  app.post("/api/content/generate", async (req: express.Request, res: express.Response) => {
    try {
      const { productName, topic, platform, tone, cta, productPhoto, language, customInstructions } = req.body;

      if (!productName || !topic || !platform || !tone) {
        return res.status(400).json({ error: "Product Name, Topic, Target Platform, and Tone are required fields." });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are "FAST - Content Master", an expert branding consultant and professional digital copywriter who specializes in converting social media followers into buyers.
Your goal is to write a single, cohesive, highly creative, engaging, and high-converting copy that immediately hooks readers, builds interest, and drives clicks/leads.

CRITICAL REQUIREMENT (Output exactly ONE post):
- Do NOT provide choices, different options, or alternatives.
- Generate exactly ONE complete, premium, ready-to-use post.
- The user must be able to directly copy the whole generated content and post it immediately without editing, choosing, or deleting parts.

CRITICAL WRITING RULES:
- NEVER write phrases targeting business owners or shop owners like "ချစ်ရတဲ့ လုပ်ငန်းရှင်တို့ရေ...", "လုပ်ငန်းရှင်တို့ရေ...", "ဆိုင်ရှင်တို့ရေ...", "ချစ်ရတဲ့ ဆိုင်ရှင်တို့ရေ..." under any circumstances.
- The post must be written from the seller/brand's perspective, directed entirely and beautifully to the end-users, buyers, or final consumers who will purchase the product/service.

Strict Copywriting Guidelines:
1. Target Platform Format: Format the copywriting explicitly for ${platform}.
   - Facebook/Instagram: Use rich emoji bullet points, generous line breaks, engaging conversational style, visual formatting.
   - TikTok: Create a highly creative video script. MUST start with a brilliant, attention-grabbing 3-second (3s) Hook. Include clear visual/scene directions and voiceover text.
   - LinkedIn: Professional, clear value proposition, thought-leadership hooks, structured takeaways, fewer but professional emojis.
   - Twitter/X: High-impact short punchy micro-blog style, bold statements, threads if content is long, strong summary list.
2. Tone of Voice Rules:
   - Professional: Authoritative, polished, logical, clean, reliable.
   - Friendly/Caring: Sweet, supportive, warm, highly relational, community-driven.
   - Energetic/Fun: Bold, playful, hyped, using trending emojis, energetic slang.
   - Persuasive: Leveraging FOMO (Limited Slots!), pointing out pain points directly, explaining key value and results.
   - Educational: Actionable tips (e.g. "3 Ways to..."), informational, helpful.
   - Emotional: Relatable human stories, heart-to-heart, heartfelt empathy, sensory descriptions.
3. Target Language: ${language === 'burmese' ? 'Burmese (မြန်မာဘာသာ)' : 'English'}.
   - When writing in Burmese, make it sound incredibly natural and casual (Modern colloquial style) rather than rigid literary Google-translates. Use terms Myanmar social media consumers love (e.g., modern shopping terms, direct friendly communication like "မွေးမွေးလေး", "အတန်ဆုံးပဲနော်", etc.).
4. Formatting Structure:
   - Exactly ONE highly compelling, attention-grabbing single Hook Line at the start (no alternatives, no choices).
   - The Main Post Body, structured beautifully with bold lines, bullet points, and clean spacing.
   - A highly specific Call-to-Action (CTA) section tailored around: "${cta}".
   - Exactly 8-10 customized, relevant, trending hashtags (e.g., #${productName.replace(/[^a-zA-Z0-9]/g, '')}, #${platform}, etc.) at the very bottom.`;

      let promptText = `Generate high-converting creative copy for:
- Product/Service Name: ${productName}
- Social Media Platform: ${platform}
- Content Topic/Goal/Context: ${topic}
- Output Tone: ${tone}
- Call to Action: ${cta}
- Language: ${language === 'burmese' ? 'Burmese Only' : 'English Only'}

${customInstructions ? `=== BRAND VOICE & CUSTOM AI TRAINING GUIDELINES (STRICTLY FOLLOW THESE) ===\n${customInstructions}\n=======================\n` : ''}`;

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

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsPayload,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.9,
        }
      });

      res.json({ content: response.text });
    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      res.status(500).json({ error: error?.message || "Internal GenAI service error occurred." });
    }
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
