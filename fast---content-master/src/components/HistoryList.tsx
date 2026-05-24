import React, { useState } from "react";
import { User } from "firebase/auth";
import { Generation } from "../types";
import { 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Calendar, 
  Share2,
  Filter, 
  ExternalLink,
  Sparkles,
  Inbox,
  AlertCircle
} from "lucide-react";

interface HistoryListProps {
  user: User | null;
  history: Generation[];
  onDelete: (id: string) => Promise<void>;
}

export default function HistoryList({ user, history, onDelete }: HistoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center animate-fade-in relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-black/[0.04] dark:bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-indigo-400 mb-6 shadow-xl relative z-10">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-black dark:text-white relative z-10 font-display">Sign In to See History</h2>
        <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed relative z-10">
          Google ဖြင့် ဆော့ဂ်အင်ဝင်ထားပါက သင်ရေးခဲ့သော ဖန်တီးမှုအဟောင်းများကို ဤနေရာတွင် စနစ်တကျ ပြန်လည်ကြည့်ရှုနိုင်၊ ကူးယူနိုင်ပါသည်။
        </p>
      </div>
    );
  }

  // Filter history
  const filteredHistory = history.filter((item) => {
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.generatedContent.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesPlatform = 
      selectedPlatform === "All" || item.platform === selectedPlatform;

    return matchesSearch && matchesPlatform;
  });

  // Copy to clipboard helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Safe markdown style parser (regex-based for dark layout)
  const renderMarkdown = (text: string) => {
    if (!text) return "";
    
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-xs font-bold text-black/80 dark:text-slate-200 mt-3 mb-1 uppercase tracking-wider">{content.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-sm font-extrabold text-black dark:text-indigo-300 mt-4 mb-1.5 font-display">{content.replace("## ", "")}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={idx} className="text-base font-black text-black dark:text-white mt-5 mb-2 font-display">{content.replace("# ", "")}</h2>;
      }
      if (line === "---" || line === "___") {
        return <div key={idx} className="my-3 border-t border-black/10 dark:border-white/10 h-px" />;
      }
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const cleaned = line.replace(/^(\s*[-*]\s*)/, "");
        return (
          <li key={idx} className="list-disc ml-3 text-[11px] text-black/70 dark:text-slate-300 leading-relaxed mb-1 flex items-start gap-1">
            <span className="text-black dark:text-indigo-400 mt-1 select-none">•</span>
            <span>{processLineForBold(cleaned)}</span>
          </li>
        );
      }
      if (line.trim().length === 0) {
        return <div key={idx} className="h-1.5" />;
      }
      return <p key={idx} className="text-[11px] text-black/70 dark:text-slate-300 leading-relaxed mb-1.5">{processLineForBold(content)}</p>;
    });
  };

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

  const getPlatformClass = (plat: string) => {
    switch (plat) {
      case 'Facebook': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      case 'Instagram': return 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20';
      case 'TikTok': return 'bg-slate-100/10 text-black/80 dark:text-slate-200 border-black/10 dark:border-white/10';
      case 'LinkedIn': return 'bg-sky-500/[0.05] dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 dark:border-sky-500/20';
      case 'Twitter/X': return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20 dark:border-slate-500/20';
      default: return 'bg-black/[0.04] dark:bg-indigo-500/10 text-black dark:text-indigo-300 border-black/20 dark:border-indigo-500/20';
    }
  };

  const formatFirebaseDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    
    // Convert Firestore Timestamp or String date to JS Date
    let dateObj: Date;
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      dateObj = timestamp.toDate();
    } else {
      dateObj = new Date(timestamp);
    }

    if (isNaN(dateObj.getTime())) return "Recent";

    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Title */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-black dark:text-white font-display">
            Generation Histories
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Browse and manage all your copywriting deliverables written by FAST.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Seek Input */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search product, topics, content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 pl-9 pr-4 py-2 text-xs outline-none focus:border-black dark:border-indigo-500 focus:ring-2 focus:ring-black/20 dark:ring-indigo-500/20 transition-all font-medium text-black/80 dark:text-slate-200"
            />
          </div>

          {/* Social filter selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["All", "Facebook", "TikTok", "Instagram", "LinkedIn", "Lemon8"].map((platName) => (
              <button
                key={platName}
                onClick={() => setSelectedPlatform(platName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border select-none ${
                  selectedPlatform === platName
                    ? "bg-black/10 dark:bg-white/10 text-black dark:text-indigo-300 border-black/20 dark:border-white/20"
                    : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10 hover:bg-black/10 dark:bg-white/10 dark:hover:text-white hover:text-black"
                }`}
              >
                {platName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container list */}
      {filteredHistory.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 mb-4">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-black/70 dark:text-slate-300">No copywriting logs found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-500 max-w-xs mt-1 leading-normal">
            {searchTerm || selectedPlatform !== "All"
              ? "ဇကာတင်စစ်ထုတ်ချက်နှင့်ကိုက်ညီသော မှတ်တမ်းမတွေ့ပါ။ အခြားစကားလုံးများဖြင့် ထပ်မံရှာဖွေကြည့်ပါ။"
              : "အသစ်စက်စက် အကြောင်းအရာများ ရေးသားပြီးလျှင် ဤနေရာတွင် လာရောက်သိမ်းဆည်းပေးမည် ဖြစ်ပါသည်။"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {filteredHistory.map((node) => (
            <div
              key={node.id}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden relative group"
            >
              
              {/* Card Meta Header */}
              <div className="px-4.5 py-3.5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPlatformClass(node.platform)}`}>
                    {node.platform}
                  </span>
                  <span className="text-[10px] font-bold text-black dark:text-indigo-300 bg-black/[0.04] dark:bg-indigo-500/10 border border-black/20 dark:border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                    {node.tone}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{formatFirebaseDate(node.createdAt)}</span>
                </div>
              </div>

              {/* Card Details / Topic */}
              <div className="p-5 space-y-3.5 flex-1 select-text">
                <div className="flex gap-3">
                  {node.imageUrl && (
                    <img
                      src={node.imageUrl}
                      alt="Ref product context"
                      className="h-14 w-14 shrink-0 rounded-lg object-cover border border-black/10 dark:border-white/10 shadow-inner"
                    />
                  )}
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-black dark:text-white leading-tight">
                      {node.productName}
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium line-clamp-2 leading-normal">
                      <strong>Goal:</strong> {node.topic}
                    </p>
                  </div>
                </div>

                {/* Generated Content Box */}
                <div className="rounded-xl bg-black/[0.01] dark:bg-white/[0.01] p-4 border border-black/5 dark:border-white/5 max-h-[180px] overflow-y-auto text-xs custom-scrollbar">
                  {renderMarkdown(node.generatedContent)}
                </div>
              </div>

              {/* Action Toolbar Footer */}
              <div className="px-4 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                
                {/* Delete button action */}
                {deleteConfirmId === node.id ? (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                      <AlertCircle className="h-3 w-3" /> Sure?
                    </span>
                    <button
                      onClick={() => {
                        onDelete(node.id);
                        setDeleteConfirmId(null);
                      }}
                      className="text-black dark:text-white bg-rose-600 hover:bg-rose-750 px-2.5 py-1 rounded text-[10px] font-extrabold cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:bg-white/10 px-2.5 py-1 rounded text-[10px] font-extrabold cursor-pointer border border-black/10 dark:border-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(node.id)}
                    className="flex items-center gap-1 rounded px-2 py-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-semibold cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                {/* Copy content button */}
                <button
                  onClick={() => handleCopy(node.id, node.generatedContent)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold bg-black/5 dark:bg-white/5 text-black/70 dark:text-slate-300 border border-black/10 dark:border-white/10 shadow-sm dark:hover:text-white hover:text-black hover:border-black/20 dark:border-white/20 active:bg-black/10 dark:bg-white/10 transition-all cursor-pointer"
                >
                  {copiedId === node.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
