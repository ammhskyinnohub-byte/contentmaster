import React, { useState, useRef } from "react";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle,
  Clock, 
  HelpCircle,
  FileText,
  Volume2
} from "lucide-react";
import { 
  PLATFORMS, 
  TONES, 
  CTAS, 
  LANGUAGES, 
  ContentFormData, 
  PlatformType 
} from "../types";

interface CreateContentProps {
  user: User | null;
  onSaveGeneration: (generationData: {
    productName: string;
    topic: string;
    platform: string;
    tone: string;
    cta: string;
    language: string;
    imageUrl?: string;
    generatedContent: string;
  }) => Promise<void>;
  userTokens: number;
  isAdmin: boolean;
}

export default function CreateContent({ user, onSaveGeneration, userTokens, isAdmin }: CreateContentProps) {
  // Form values
  const [productName, setProductName] = useState("");
  const [platform, setPlatform] = useState<PlatformType>("Facebook");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Persuasive");
  const [cta, setCta] = useState("Shop Now (အခုပဲ ဝယ်ယူလိုက်ပါ)");
  const [language, setLanguage] = useState("burmese");
  const [productPhoto, setProductPhoto] = useState<string>("");
  
  // UI and operations state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image conversion to Base64
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProductPhoto(reader.result);
      }
    };
    reader.onerror = () => {
      setError("Unable to read the image file.");
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const removePhoto = () => {
    setProductPhoto("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Generator action
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      setError("Please provide a product name.");
      return;
    }
    if (!topic.trim()) {
      setError("Please describe details or a topic for the content.");
      return;
    }
    
    if (user && !isAdmin && userTokens < 10) {
      setError("Not enough tokens! You need at least 10 tokens to generate a post. Please ask the Admin to refill your balance.");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedContent(null);

    try {
      // Fetch custom AI training instructions if they exist
      let customInstructions = "";
      try {
        const docRef = doc(db, "settings", "ai_training");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.instructionsDo || data.instructionsDont) {
            customInstructions = `[DO/KNOWLEDGE GUIDELINES]\n${data.instructionsDo || "None"}\n\n[RESTRICTIONS/DON'Ts]\n${data.instructionsDont || "None"}`;
          } else if (data.instructions) {
            customInstructions = data.instructions;
          }
        }
      } catch (e) {
        console.warn("Could not fetch custom rules", e);
      }

      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          topic,
          platform,
          tone,
          cta,
          language,
          productPhoto: productPhoto || undefined,
          customInstructions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content.");
      }

      const data = await response.json();
      setGeneratedContent(data.content);

      // Auto-save to Firebase history if authenticated
      if (user) {
        try {
          await onSaveGeneration({
            productName,
            topic,
            platform,
            tone,
            cta,
            language,
            imageUrl: productPhoto || undefined,
            generatedContent: data.content,
          });
        } catch (dbErr: any) {
          console.error("Failed to save generation in history DB:", dbErr);
          // Don't fail the generator itself, just display warning or log
        }
      }

    } catch (err: any) {
      setError(err?.message || "Something went wrong while communicating with the writer service.");
    } finally {
      setLoading(false);
    }
  };

  // Copy copywriting helper
  const copyToClipboard = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Safe markdown style render parser for dark glassmorphism
  const renderMarkdown = (text: string) => {
    if (!text) return "";
    
    // Split into lines to render safely
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      
      // Headers
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-sm font-bold text-black/80 dark:text-slate-200 mt-4 mb-2 first:mt-0 uppercase tracking-wider">{content.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-base font-extrabold text-black dark:text-indigo-300 mt-5 mb-2 first:mt-0 font-display">{content.replace("## ", "")}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={idx} className="text-lg font-black text-black dark:text-white mt-6 mb-3 first:mt-0 font-display">{content.replace("# ", "")}</h2>;
      }

      // Horizontal lines
      if (line === "---" || line === "___") {
        return <div key={idx} className="my-5 border-t border-black/10 dark:border-white/10 h-px w-full" />;
      }

      // Check bullet list items
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const cleaned = line.replace(/^(\s*[-*]\s*)/, "");
        return (
          <li key={idx} className="ml-4 text-xs text-black/70 dark:text-slate-300 leading-relaxed mb-1.5 list-none flex items-start gap-2">
            <span className="text-black dark:text-indigo-400 mt-1 select-none">•</span>
            <span>{processLineForBold(cleaned)}</span>
          </li>
        );
      }

      // Standard text line
      if (line.trim().length === 0) {
        return <div key={idx} className="h-2.5" />;
      }

      return <p key={idx} className="text-xs text-black/70 dark:text-slate-300 leading-relaxed mb-2">{processLineForBold(content)}</p>;
    });
  };

  // Parses simple bold words (**bold**) within lines
  const processLineForBold = (lineText: string) => {
    const regex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(lineText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(lineText.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-extrabold text-black dark:text-white">{match[1]}</strong>);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < lineText.length) {
      parts.push(lineText.substring(lastIndex));
    }

    return parts.length > 0 ? parts : lineText;
  };

  const wordCount = generatedContent ? generatedContent.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 3.5)); // calculated seconds

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        
        {/* INPUT PANEL SECTION */}
        <div className="lg:col-span-5 space-y-6">
          <form id="content-generation-form" onSubmit={handleGenerate} className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <Sparkles className="h-4.5 w-4.5 text-black dark:text-indigo-400 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-black/80 dark:text-slate-200">Content Configuration</h2>
            </div>

            {/* Product Name */}
            <div>
              <label htmlFor="productName" className="block text-[10px] font-bold uppercase tracking-widest text-black dark:text-indigo-300 mb-2">
                Product or Service Name <span className="text-red-400">*</span>
              </label>
              <input
                id="productName"
                type="text"
                required
                maxLength={200}
                placeholder="ဥပမာ - Glow Up Organics Serum"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3.5 py-3 text-sm outline-none focus:border-black dark:border-indigo-500 focus:ring-2 focus:ring-black/20 dark:ring-indigo-500/20 transition-all text-black dark:text-white font-medium placeholder-slate-500"
              />
            </div>

            {/* Target Social Platform (Visual Interactive Buttons) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black dark:text-indigo-300 mb-2">
                Target Platform <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map((node) => (
                  <button
                    key={node.value}
                    type="button"
                    onClick={() => setPlatform(node.value)}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 border text-center transition-all cursor-pointer ${
                      platform === node.value
                        ? "border-black dark:border-indigo-500 bg-black/[0.04] dark:bg-indigo-500/10 text-black dark:text-indigo-300 font-bold shadow-md"
                        : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:bg-white/10 hover:text-black/80 dark:text-slate-200"
                    }`}
                  >
                    <span className="text-xs font-medium tracking-tight">{node.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Tone Dropdown */}
            <div>
              <label htmlFor="tone-select" className="block text-[10px] font-bold uppercase tracking-widest text-black dark:text-indigo-300 mb-2">
                Content Tone <span className="text-red-400">*</span>
              </label>
              <select
                id="tone-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161233] px-3.5 py-3 text-sm outline-none focus:border-black dark:border-indigo-500 focus:ring-2 focus:ring-black/20 dark:ring-indigo-500/20 transition-all text-black/80 dark:text-slate-200 font-medium cursor-pointer"
              >
                {TONES.map((item) => (
                  <option key={item.value} value={item.value} className="bg-white dark:bg-[#161233] text-black/80 dark:text-slate-200">
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[10.5px] text-slate-600 dark:text-slate-400 font-medium leading-normal">
                {TONES.find(t => t.value === tone)?.description}
              </p>
            </div>

            {/* CTA Option Dropdown */}
            <div>
              <label htmlFor="cta-select" className="block text-[10px] font-bold uppercase tracking-widest text-black dark:text-indigo-300 mb-2">
                Call to Action (CTA)
              </label>
              <select
                id="cta-select"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161233] px-3.5 py-3 text-sm outline-none focus:border-black dark:border-indigo-500 focus:ring-2 focus:ring-black/20 dark:ring-indigo-500/20 transition-all text-black/80 dark:text-slate-200 font-medium cursor-pointer"
              >
                {CTAS.map((item) => (
                  <option key={item.value} value={item.value} className="bg-white dark:bg-[#161233] text-black/80 dark:text-slate-200">
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Switcher */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black dark:text-indigo-300 mb-2">
                Output Language
              </label>
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguage(lang.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 border text-xs font-semibold transition-all cursor-pointer ${
                      language === lang.value
                        ? "border-black dark:border-indigo-500 bg-black/[0.04] dark:bg-indigo-500/10 text-black dark:text-indigo-300 shadow-md"
                        : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:bg-white/10"
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Details / Topic */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="topic" className="block text-[10px] font-bold uppercase tracking-widest text-black dark:text-indigo-300">
                  Topic / Context details <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500">{topic.length}/1000</span>
              </div>
              <textarea
                id="topic"
                required
                rows={4}
                maxLength={1000}
                placeholder="ရေးသားစေချင်သော အချက်အလက်များ - ပရိုမိုးရှင်းအသေးစိတ်၊ သုံးစွဲပုံနည်းလမ်းများ နှင့် အကျိုးကျေးဇူးများကို ဖော်ပြပေးပါ"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3.5 py-3 text-sm outline-none focus:border-black dark:border-indigo-500 focus:ring-2 focus:ring-black/20 dark:ring-indigo-500/20 transition-all text-black dark:text-white font-medium resize-none leading-relaxed placeholder-slate-500"
              />
              

            </div>

            {/* Product Photo drag and drop */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black dark:text-indigo-300 mb-2">
                Product Photo (Optional - Multi-modal context)
              </label>
              
              {!productPhoto ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`flex flex-col items-center justify-center border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? "border-black dark:border-indigo-500 bg-black/[0.04] dark:bg-indigo-500/10" 
                      : "border-black/15 dark:border-white/15 hover:border-indigo-400/50 hover:bg-black/5 dark:bg-white/5"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="h-7 w-7 text-slate-600 dark:text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-black/70 dark:text-slate-300">
                    Drag and drop your image here, or <span className="text-black dark:text-indigo-400">Browse</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">Supports PNG, JPG, WEBP formats</p>
                </div>
              ) : (
                <div className="relative rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={productPhoto}
                      alt="Thumbnail product"
                      className="h-12 w-12 rounded-lg object-cover border border-black/10 dark:border-white/10"
                    />
                    <div>
                      <span className="text-xs font-semibold text-black/80 dark:text-slate-200 flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5 text-black dark:text-indigo-400" /> Image uploaded
                      </span>
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Used as visual reference in writing</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Generate Action Button */}
            <button
              id="btn-generate-submit"
              type="submit"
              disabled={loading || (!!user && !isAdmin && userTokens < 10)}
              className="w-full flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-black dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-500 py-3 text-white font-bold uppercase tracking-widest text-white shadow-xl shadow-black/20 dark:shadow-indigo-500/20 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5" />
                <span>{loading ? "Wielding AI Content Master..." : "Generate Magic Content"}</span>
              </div>
              {!isAdmin && (
                <span className="text-[9px] text-slate-400 dark:text-indigo-200 font-medium tracking-normal bg-black/20 px-2 py-0.5 rounded-md">
                  Cost: 10 Tokens
                </span>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300 border border-rose-500/20 animate-fadeIn">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Anonymous user heads-up display */}
            {!user && (
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-300 border border-amber-500/15">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Heads up:</strong> Saving content and writing history is disabled. Sign In at the top to secure your historic generations.
                </span>
              </div>
            )}

          </form>
        </div>

        {/* OUTPUT DISPLAY & STATS SECTION */}
        <div className="lg:col-span-7 space-y-5">
          {loading ? (
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] backdrop-blur-xl p-12 text-center shadow-2xl flex flex-col items-center justify-center min-h-[440px] relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-black/[0.04] dark:bg-purple-500/10 blur-[80px] rounded-full animate-pulse"></div>
              {/* Spinner loader design */}
              <div className="relative flex h-16 w-16 z-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20"></span>
                <span className="relative inline-flex rounded-full h-16 w-16 bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 items-center justify-center">
                  <Sparkles className="h-8 w-8 text-black dark:text-indigo-400 animate-spin" />
                </span>
              </div>
              <h3 className="mt-5 text-base font-bold text-black dark:text-white z-10 font-display">Crafting high-converting copywriting...</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed z-10">
                Our AI content specialist is scanning your target platform ({platform}), tailoring to the &ldquo;{tone}&rdquo; tone, and preparing your copywriting in မြန်မာဘာသာ.
              </p>
            </div>
          ) : generatedContent ? (
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
              
              {/* Output Header */}
              <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-black/30 dark:border-indigo-500/30 p-0.5 max-w-max flex items-center justify-center bg-black/[0.04] dark:bg-indigo-500/10">
                    <div className="w-8 h-8 rounded-full bg-black dark:bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">AI</div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">AI Content Preview</h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-tighter">Optimized for {platform} Feed &bull; {tone}</p>
                  </div>
                </div>

                <button
                  id="btn-copy-output"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-400 dark:text-indigo-200 hover:text-black dark:text-white bg-black/[0.06] dark:bg-indigo-500/15 hover:bg-black/[0.08] dark:bg-indigo-500/20 border border-black/30 dark:border-indigo-500/30 shadow-sm transition-all cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-black dark:text-indigo-300" />
                      <span>Copy content</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Content Field */}
              <div className="p-6 md:p-8 space-y-1 select-text bg-black/[0.01] dark:bg-white/[0.01] max-h-[480px] overflow-y-auto custom-scrollbar relative border-b border-black/5 dark:border-white/5">
                <div className="absolute top-4 right-4 z-10">
                  <span className="text-[10px] bg-black/[0.08] dark:bg-indigo-500/20 text-black dark:text-indigo-300 border border-black/30 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">High Engagement</span>
                </div>
                {renderMarkdown(generatedContent)}
              </div>

              {/* Dynamic Reading stats metrics display */}
              <div className="p-5 grid grid-cols-3 gap-4 border-b border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 text-center">
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 uppercase font-bold mb-1">Reading Time</p>
                  <p className="text-sm font-bold text-black dark:text-white">{readingTime}s</p>
                </div>
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 text-center">
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 uppercase font-bold mb-1">Word Count</p>
                  <p className="text-sm font-bold text-black dark:text-white">{wordCount}</p>
                </div>
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 text-center">
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 uppercase font-bold mb-1">AI Confidence</p>
                  <p className="text-sm font-bold text-green-400">98%</p>
                </div>
              </div>

              {/* Action Footer banner */}
              {user && (
                <div className="px-5 py-3 bg-black/[0.02] dark:bg-indigo-500/[0.03] text-center text-[10.5px] font-medium text-black dark:text-indigo-300">
                  ✨ Stored securely to your personal Firebase history logs.
                </div>
              )}

            </div>
          ) : (
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-12 text-center border-dashed flex flex-col items-center justify-center min-h-[440px]">
              <div className="h-12 w-12 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-black/80 dark:text-slate-200">Ready to draft amazing copies</h3>
              <p className="text-xs text-slate-500 dark:text-slate-500 max-w-xs mt-1 leading-relaxed">
                Fill the configuration form, add details, and click &ldquo;Generate&rdquo; to experience the writing speed of FAST.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
