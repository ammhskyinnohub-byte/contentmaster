import { User } from "firebase/auth";
import { loginWithGoogle, logout, db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Sparkles, LogOut, ShieldCheck, LogIn, Coins, Sun, Moon, Brain } from "lucide-react";
import { useState, useEffect } from "react";

interface NavbarProps {
  user: User | null;
  activeTab: 'create' | 'history' | 'cms' | 'training';
  setActiveTab: (tab: 'create' | 'history' | 'cms' | 'training') => void;
  historyCount: number;
  isAdmin: boolean;
  userTokens: number;
}

export default function Navbar({ user, activeTab, setActiveTab, historyCount, isAdmin, userTokens }: NavbarProps) {
  const [authLoading, setAuthLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [appLogo, setAppLogo] = useState<string | null>(null);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Fetch real-time logo from Firebase
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "branding"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().logo_base64) {
        setAppLogo(docSnap.data().logo_base64);
      } else {
        setAppLogo(null);
      }
    });
    return () => unsub();
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setAuthLoading(true);
      await logout();
      setActiveTab('create');
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0a1f]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl bg-black dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-lg shadow-black/20 dark:shadow-indigo-500/20">
            {appLogo ? (
              <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Sparkles className="h-5 w-5 text-black dark:text-white" />
            )}
          </div>
          <div>
            <span className="font-sans text-xl font-black uppercase tracking-tight text-black dark:bg-gradient-to-r dark:from-indigo-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
              FAST
            </span>
            <span className="ml-1.5 font-sans text-xs font-light uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Content Master
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            id="nav-btn-create"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15 text-black dark:text-indigo-300 shadow-md'
                : 'text-black/70 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 active:bg-black/10 dark:bg-white/10 border border-transparent'
            }`}
          >
            <Sparkles className="h-4.5 w-4.5 text-black dark:text-indigo-400" />
            Create
          </button>

          <button
            id="nav-btn-history"
            onClick={() => setActiveTab('history')}
            className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15 text-black dark:text-indigo-300 shadow-md'
                : 'text-black/70 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 active:bg-black/10 dark:bg-white/10 border border-transparent'
            }`}
          >
            History
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black dark:bg-indigo-500 px-1.5 text-[9px] font-black text-white ring-2 ring-[#0c0a1f]">
                {historyCount}
              </span>
            )}
          </button>

          {isAdmin && (
            <>
              <button
                id="nav-btn-cms"
                onClick={() => setActiveTab('cms')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'cms'
                    ? 'bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15 text-black dark:text-indigo-300 shadow-md'
                    : 'text-black/70 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 active:bg-black/10 dark:bg-white/10 border border-transparent'
                }`}
              >
                <ShieldCheck className="h-4.5 w-4.5 text-black dark:text-indigo-400" />
                CMS Portal
              </button>
              <button
                id="nav-btn-training"
                onClick={() => setActiveTab('training')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'training'
                    ? 'bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15 text-black dark:text-indigo-300 shadow-md'
                    : 'text-black/70 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 active:bg-black/10 dark:bg-white/10 border border-transparent'
                }`}
              >
                <Brain className="h-4.5 w-4.5 text-black dark:text-indigo-400" />
                Training
              </button>
            </>
          )}
        </div>

        {/* Auth / Account Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-black/70 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/15 transition-all border border-black/10 dark:border-white/10 cursor-pointer"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              {/* Token Balance display */}
              {!isAdmin && (
                <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/[0.05] dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/20 px-3 py-1.5 rounded-xl shadow-inner">
                  <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 tracking-wider">
                    {userTokens} <span className="font-medium text-[10px] text-amber-600 dark:text-amber-400/70">TOKENS</span>
                  </span>
                </div>
              )}

              {/* Profile Details */}
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-black/80 dark:text-slate-200 leading-none">
                  {isAdmin ? 'System Admin' : (user.displayName || 'Approved Writer')}
                </span>
                <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-1 ${isAdmin ? 'text-black dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  <ShieldCheck className="h-3.5 w-3.5" /> {isAdmin ? 'Admin Console' : 'Authorized'}
                </span>
              </div>
              
              {/* Profile image avatar */}
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Avatar"}
                  className="h-9 w-9 rounded-xl border border-black/15 dark:border-white/15 shadow-inner object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.08] dark:bg-indigo-500/20 text-black dark:text-indigo-300 border border-black/30 dark:border-indigo-500/30 font-bold select-none text-xs">
                  {user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0) || '?'}
                </div>
              )}

              {/* Sign Out Action Button */}
              <button
                id="btn-signout"
                onClick={handleLogout}
                disabled={authLoading}
                title="Sign Out"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-black/70 dark:text-slate-300 hover:bg-black/15 dark:bg-white/15 hover:text-black dark:text-white transition-all border border-black/10 dark:border-white/10 disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              id="btn-signin"
              onClick={handleLogin}
              disabled={authLoading}
              className="flex items-center gap-2 rounded-xl bg-black dark:bg-indigo-500 hover:bg-black/80 dark:hover:bg-indigo-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-black/10 dark:shadow-indigo-500/10 hover:shadow-black/20 dark:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              {authLoading ? 'Signing In...' : 'Sign In'}
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
