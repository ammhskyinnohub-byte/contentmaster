import { User } from "firebase/auth";
import { loginWithGoogle, logout, db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Sparkles, LogOut, ShieldCheck, LogIn, Coins, Sun, Moon, Brain, X, Phone, MessageCircle } from "lucide-react";
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
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);

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
    <>
      <header className="sticky top-0 z-40 w-full border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0a1f]/75 backdrop-blur-xl">
        <div className="mx-auto flex flex-col md:flex-row md:h-16 max-w-7xl items-stretch md:items-center justify-between px-4 sm:px-6 lg:px-8 py-2 md:py-0 gap-2 md:gap-0">
          
          {/* Brand Row */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('create')}>
              <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl bg-black dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-lg shadow-black/20 dark:shadow-indigo-500/20">
                {appLogo ? (
                  <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="h-5 w-5 text-black dark:text-white" />
                )}
              </div>
              <div>
                <span className="font-sans text-lg md:text-xl font-black uppercase tracking-tight text-black dark:bg-gradient-to-r dark:from-indigo-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
                  FAST
                </span>
                <span className="ml-1.5 font-sans text-[10px] md:text-xs font-light uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden xs:inline-block">
                  Workspace
                </span>
              </div>
            </div>

            {/* Mobile Actions Header */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-black/70 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/15 transition-all border border-black/10 dark:border-white/10"
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              {user ? (
                <div className="flex items-center gap-1.5">
                  {!isAdmin && (
                    <button 
                      onClick={() => setIsCoinModalOpen(true)}
                      className="flex items-center gap-1 bg-amber-500/[0.05] dark:bg-amber-500/10 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-all border border-amber-500/20 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                        {userTokens}
                      </span>
                    </button>
                  )}
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Avatar"}
                      className="h-8 w-8 rounded-lg border border-black/15 dark:border-white/15 shadow-inner object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.08] dark:bg-indigo-500/20 text-black dark:text-indigo-300 border border-black/30 dark:border-indigo-500/30 font-bold text-xs select-none">
                      {user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0) || '?'}
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    disabled={authLoading}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 text-rose-600 dark:text-rose-450 hover:bg-rose-500/10 transition-colors border border-black/10 dark:border-white/10"
                    title="Sign Out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  disabled={authLoading}
                  className="flex items-center gap-1 rounded-xl bg-black dark:bg-indigo-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Tab Controls - Hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center gap-1 md:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            <button
              id="nav-btn-create"
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1 md:gap-1.5 rounded-lg px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15 text-black dark:text-indigo-300 shadow-md'
                  : 'text-black/70 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 active:bg-black/10 dark:bg-white/10 border border-transparent'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-black dark:text-indigo-400" />
              Content
            </button>

            <button
              id="nav-btn-history"
              onClick={() => setActiveTab('history')}
              className={`relative flex items-center gap-1 md:gap-1.5 rounded-lg px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15 text-black dark:text-indigo-300 shadow-md'
                  : 'text-black/70 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 active:bg-black/10 dark:bg-white/10 border border-transparent'
              }`}
            >
              History
              {historyCount > 0 && (
                <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black dark:bg-indigo-500 px-1.5 text-[9px] font-black text-white ring-1 ring-white/10">
                  {historyCount}
                </span>
              )}
            </button>

            {isAdmin && (
              <>
                <button
                  id="nav-btn-cms"
                  onClick={() => setActiveTab('cms')}
                  className={`flex items-center gap-1 md:gap-1.5 rounded-lg px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'cms'
                      ? 'bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15 text-black dark:text-indigo-300 shadow-md'
                      : 'text-black/70 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 active:bg-black/10 dark:bg-white/10 border border-transparent'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-black dark:text-indigo-400" />
                  CMS
                </button>
                <button
                  id="nav-btn-training"
                  onClick={() => setActiveTab('training')}
                  className={`flex items-center gap-1 md:gap-1.5 rounded-lg px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'training'
                      ? 'bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15 text-black dark:text-indigo-300 shadow-md'
                      : 'text-black/70 dark:text-slate-300 hover:bg-black/5 dark:bg-white/5 active:bg-black/10 dark:bg-white/10 border border-transparent'
                  }`}
                >
                  <Brain className="h-3.5 w-3.5 md:h-4 md:w-4 text-black dark:text-indigo-400" />
                  Training
                </button>
              </>
            )}
          </div>

          {/* Desktop-Only Auth / Account Controls */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-black/70 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/15 transition-all border border-black/10 dark:border-white/10 cursor-pointer"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                {!isAdmin && (
                  <button 
                    onClick={() => setIsCoinModalOpen(true)}
                    className="flex items-center gap-1.5 bg-amber-500/[0.05] dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/20 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 px-3 py-1.5 rounded-xl shadow-inner cursor-pointer transition-colors"
                  >
                    <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 tracking-wider">
                      {userTokens} <span className="font-medium text-[10px] text-amber-600 dark:text-amber-400/70">TOKENS</span>
                    </span>
                  </button>
                )}

                <div className="flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-black/80 dark:text-slate-200 leading-none">
                    {isAdmin ? 'System Admin' : (user.displayName || 'Approved Writer')}
                  </span>
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-1 ${isAdmin ? 'text-black dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    <ShieldCheck className="h-3.5 w-3.5" /> {isAdmin ? 'Admin Console' : 'Authorized'}
                  </span>
                </div>
                
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

      {/* Coin Top-up Details Modal */}
      {isCoinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1736] p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsCoinModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-slate-500 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex flex-col items-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 mb-4 border border-amber-500/20">
                <Coins className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white font-display">Token Balance</h3>
              <p className="text-amber-600 dark:text-amber-400 font-black text-3xl mt-1 tracking-tight">
                {userTokens} <span className="text-sm font-bold opacity-70">TOKENS</span>
              </p>
            </div>

            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 mb-6 border border-black/10 dark:border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Price Rate</h4>
              <div className="flex items-center justify-between">
                <span className="font-bold text-black dark:text-white">10 Tokens</span>
                <span className="text-slate-400 dark:text-slate-500">=</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">1000 MMK</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Top Up Contact Admin</h4>
              
              <a 
                href="tel:09756300064"
                className="flex items-center gap-3 w-full rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-3 transition-colors border border-black/5 dark:border-white/5"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone</div>
                  <div className="text-sm font-bold text-black dark:text-white">09756300064</div>
                </div>
              </a>

              <a 
                href="https://t.me/amon234234"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 w-full rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 p-3 transition-colors border border-[#0088cc]/20"
              >
                <div className="h-8 w-8 rounded-lg bg-[#0088cc]/20 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-[#0088cc]" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#0088cc]/70 uppercase tracking-widest">Telegram</div>
                  <div className="text-sm font-bold text-[#0088cc]">@amon234234</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

