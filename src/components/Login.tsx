import React, { useState } from "react";
import { 
  auth, 
  signInWithEmailAndPassword 
} from "../lib/firebase";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  KeyRound
} from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

export default function Login({ onLoginSuccess, authError, setAuthError }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("အီးမေးလ်နှင့် စကားဝှက်ကို ဖြည့်စွက်ပေးပါ (Please enter email & password)");
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess(userCredential.user);
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      let errorMsg = "အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည် (Invalid email or password)";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errorMsg = "အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည် (Invalid credentials)";
      } else if (err.code === "auth/invalid-email") {
        errorMsg = "အီးမေးလ် ပုံစံမမှန်ကန်ပါ (Invalid email format)";
      } else if (err.code === "auth/too-many-requests") {
        errorMsg = "အကြိမ်ရေများလွန်းသဖြင့် အကောင့်ခေတ္တပိတ်ထားပါသည်။ ခေတ္တစောင့်ပြီးမှ ပြန်လည်ကြိုးစားပါ (Too many failed attempts. Temporary locked)";
      }
      setAuthError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#070514] font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden text-black dark:text-slate-100">
      
      {/* Dynamic Background Mesh Globs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/20 blur-[130px] rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-600/15 blur-[160px] rounded-full"></div>

      {/* Main Login Frame */}
      <div className="w-full max-w-md z-10 transition-all duration-300">
        
        {/* Logo Title section */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-xl shadow-black/20 dark:shadow-indigo-500/20 mb-4 animate-bounce-slow">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2.5xl font-black tracking-tight uppercase font-display text-black dark:bg-gradient-to-r dark:from-indigo-300 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
            FAST <span className="text-black dark:text-indigo-400 font-light lowercase">Content Master</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-display uppercase tracking-widest">
            Brand copywriting powered by AI
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-[120px] h-[60px] bg-black/[0.04] dark:bg-indigo-500/10 blur-[30px] rounded-full pointer-events-none"></div>
          
          <h2 className="text-lg font-bold text-center mb-6 tracking-wide text-black/80 dark:text-slate-200">
            Sign In to Workspace
          </h2>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-black dark:text-indigo-300 mb-1.5 pl-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email || ""}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 pl-10 pr-4 py-3 outline-none focus:border-black dark:border-indigo-500 focus:ring-2 focus:ring-black/20 dark:ring-indigo-500/20 text-black dark:text-slate-100 placeholder-slate-500 font-semibold"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-black dark:text-indigo-300 mb-1.5 pl-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password || ""}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 pl-10 pr-4 py-3 outline-none focus:border-black dark:border-indigo-500 focus:ring-2 focus:ring-black/20 dark:ring-indigo-500/20 text-black dark:text-slate-100 placeholder-slate-500 font-semibold"
                />
              </div>
            </div>

            {/* Error Message Block */}
            {authError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300 border border-rose-500/20 animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <span className="leading-snug">{authError}</span>
              </div>
            )}

            {/* Submit Email Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-black dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-500 py-3.5 text-white font-bold uppercase tracking-widest text-white shadow-xl shadow-black/10 dark:shadow-indigo-500/10 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? "Verifying Credentials..." : "Access Workspace"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
