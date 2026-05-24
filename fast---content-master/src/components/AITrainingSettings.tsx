import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Sparkles, Save, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function AITrainingSettings() {
  const [instructionsDo, setInstructionsDo] = useState("");
  const [instructionsDont, setInstructionsDont] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "ai_training");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setInstructionsDo(data.instructionsDo || data.instructions || "");
        setInstructionsDont(data.instructionsDont || "");
      }
    } catch (err) {
      console.error("Failed to fetch AI training settings:", err);
      setMessage({ type: "error", text: "Failed to load settings." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const docRef = doc(db, "settings", "ai_training");
      await setDoc(docRef, {
        instructionsDo,
        instructionsDont,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setMessage({ type: "success", text: "AI Training instructions successfully updated!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Failed to save AI training settings:", err);
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-4">
          <Sparkles className="h-5 w-5 text-black dark:text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">
            AI Training & Guidelines
          </h2>
        </div>

        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold border ${
            message.type === 'error' 
              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' 
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
          }`}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DO block view */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black dark:text-indigo-300 mb-1">
                  DO (Knowledge & Guidelines)
                </label>
                <p className="text-[10.5px] text-slate-500 font-medium">Add product knowledge, brand voice, and positive instructions you want AI to follow.</p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center p-12 h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
                </div>
              ) : (
                <textarea
                  rows={12}
                  value={instructionsDo}
                  onChange={(e) => setInstructionsDo(e.target.value)}
                  placeholder="e.g. Always use formal corporate tone. Explain the 3 key benefits of GlowUp serum..."
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-sm outline-none focus:border-black dark:focus:border-indigo-500 focus:ring-2 focus:ring-black/20 dark:focus:ring-indigo-500/20 transition-all text-black dark:text-white font-medium resize-none leading-relaxed custom-scrollbar placeholder-slate-400 dark:placeholder-slate-600"
                />
              )}
            </div>

            {/* DON'T block view */}
            <div className="space-y-3">
               <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black dark:text-rose-400 mb-1">
                  DON'T (Restrictions)
                </label>
                <p className="text-[10.5px] text-slate-500 font-medium">Specify the banned words, unwanted topics, or tones you want AI to strictly avoid.</p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center p-12 h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
                </div>
              ) : (
                <textarea
                  rows={12}
                  value={instructionsDont}
                  onChange={(e) => setInstructionsDont(e.target.value)}
                  placeholder="e.g. NEVER use 'Hello guys'. NEVER mention competitors like XYZ Brand..."
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-sm outline-none focus:border-black dark:focus:border-rose-500 focus:ring-2 focus:ring-black/20 dark:focus:ring-rose-500/20 transition-all text-black dark:text-white font-medium resize-none leading-relaxed custom-scrollbar placeholder-slate-400 dark:placeholder-slate-600"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || loading}
              className="px-6 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs hover:bg-black/80 dark:hover:bg-slate-200 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Instructions
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
