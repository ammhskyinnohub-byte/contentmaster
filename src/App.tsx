import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import Navbar from "./components/Navbar";
import CreateContent from "./components/CreateContent";
import HistoryList from "./components/HistoryList";
import Login from "./components/Login";
import CmsAdmin from "./components/CmsAdmin";
import AITrainingSettings from "./components/AITrainingSettings";
import { Generation } from "./types";
import { Loader2, Sparkles, Clock, ShieldCheck, Brain } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'cms' | 'training'>('create');
  const [history, setHistory] = useState<Generation[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [userTokens, setUserTokens] = useState<number>(0);

  // Sync user state on auth changes and enforce active status constraints
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthError(null);
      
      if (currentUser) {
        setAuthLoading(true);
        const email = currentUser.email?.toLowerCase().trim() || "";
        
        if (email === "admin@fast.com") {
          setIsAdmin(true);
          setUser(currentUser);
          await fetchHistory(currentUser.uid);
          setAuthLoading(false);
        } else {
          // Check authorized user registry in Firestore
          try {
            const userQuery = query(collection(db, "users"), where("email", "==", email));
            const userDocSnap = await getDocs(userQuery);
            let isAllowed = false;
            let isActive = false;
            
            userDocSnap.forEach((docSnap) => {
              isAllowed = true;
              const data = docSnap.data();
              if (data.status === "active") {
                isActive = true;
              }
            });
            
            if (isAllowed && isActive) {
              setIsAdmin(false);
              setUser(currentUser);
              await fetchHistory(currentUser.uid);
            } else {
              // Reject, sign out immediately, display human-friendly Burmese & English warning
              await auth.signOut();
              setUser(null);
              setIsAdmin(false);
              setAuthError(
                isAllowed 
                  ? "သင်၏အကောင့်သုံးခွင့်အား ခေတ္တရပ်ဆိုင်းထားပါသည် (Your writer profile has been suspended by the workspace administrator)" 
                  : "ဝင်ရောက်ခွင့် မရှိပါ။ CMS တွင် စနစ်တကျ အကောင့်ဖွင့်ပေးပြီးမှသာ ဝင်ရောက်အသုံးပြုနိုင်မည် ဖြစ်ပါသည် (Access Denied. Your account must be approved by the admin in CMS)"
              );
            }
          } catch (err) {
            console.error("Status check failed:", err);
            await auth.signOut();
            setUser(null);
            setIsAdmin(false);
            setAuthError("လုံခြုံရေးအခြေအနေ စစ်ဆေးရန် မအောင်မြင်ပါ (Auth verification issues. Try registering again)");
          } finally {
            setAuthLoading(false);
          }
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setHistory([]);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to realtime token updates for standard users
  useEffect(() => {
    if (!user || isAdmin) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserTokens(data.tokens || 0);
      }
    });
    return () => unsub();
  }, [user, isAdmin]);

  // Fetch full user generations from Firestore
  const fetchHistory = async (uid: string) => {
    setDbLoading(true);
    try {
      const qGen = query(collection(db, "generations"), where("userId", "==", uid));
      
      const snapGen = await getDocs(qGen);
      const items: Generation[] = [];
      
      snapGen.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Generation);
      });

      // Sort records locally descending (newest first) with support for Firestore ServerTimestamp
      items.sort((a, b) => {
        let dateA = 0;
        let dateB = 0;

        if (a.createdAt && typeof a.createdAt.toDate === 'function') {
          dateA = a.createdAt.toDate().getTime();
        } else if (a.createdAt && typeof a.createdAt === 'object' && a.createdAt.seconds) {
          dateA = a.createdAt.seconds * 1000;
        } else if (a.createdAt) {
          dateA = new Date(a.createdAt).getTime();
        }

        if (b.createdAt && typeof b.createdAt.toDate === 'function') {
          dateB = b.createdAt.toDate().getTime();
        } else if (b.createdAt && typeof b.createdAt === 'object' && b.createdAt.seconds) {
          dateB = b.createdAt.seconds * 1000;
        } else if (b.createdAt) {
          dateB = new Date(b.createdAt).getTime();
        }

        return dateB - dateA;
      });

      setHistory(items);
    } catch (err) {
      // Wrap per Firestore integration skill specifications
      handleFirestoreError(err, OperationType.GET, "generations");
    } finally {
      setDbLoading(false);
    }
  };

  // Save generated record to user's Firestore histories
  const handleSaveGeneration = async (genData: {
    productName?: string;
    topic?: string;
    platform?: string;
    tone?: string;
    cta?: string;
    language?: string;
    imageUrl?: string;
    videoLink?: string;
    duration?: string;
    type?: 'content' | 'recap' | 'audio';
    generatedContent: string;
  }, cost: number = 10) => {
    if (!user) return;
    const pathRef = "generations";
    // Create highly descriptive randomized path-variable custom ID
    const newGenId = "gen_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    
    const payload = {
      id: newGenId,
      userId: user.uid,
      productName: genData.productName || null,
      topic: genData.topic || null,
      platform: genData.platform || null,
      tone: genData.tone || null,
      cta: genData.cta || null,
      language: genData.language || null,
      imageUrl: genData.imageUrl || null,
      videoLink: genData.videoLink || null,
      duration: genData.duration || null,
      type: genData.type || 'content',
      generatedContent: genData.generatedContent,
      createdAt: serverTimestamp() // Meets our path verification and temporal security rules tests
    };

    try {
      const docRef = doc(db, "generations", newGenId);
      await setDoc(docRef, payload);
      
      // Deduct tokens securely based on cost passed
      if (!isAdmin) {
        await updateDoc(doc(db, "users", user.uid), {
          tokens: Math.max(0, userTokens - cost)
        });
      }
      
      // Promptly reload local state
      await fetchHistory(user.uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, pathRef);
    }
  };

  // Delete generated item from user history logs
  const handleDeleteGeneration = async (id: string) => {
    if (!user) return;
    const collectionName = "generations";
    const pathRef = `${collectionName}/${id}`;
    try {
      await deleteDoc(doc(db, collectionName, id));
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, pathRef);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-[#070514] relative overflow-hidden">
        {/* Glow meshes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-600/20 blur-[100px] rounded-full animate-pulse-slow"></div>
        <div className="text-center space-y-4 z-10 bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 p-8 rounded-3xl max-w-sm shadow-2xl">
          <Loader2 className="h-10 w-10 text-black dark:text-indigo-400 animate-spin mx-auto" />
          <p className="text-sm font-bold text-black dark:text-slate-100 tracking-tight font-display">FAST Content Master</p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Initializing Frosted Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login 
        onLoginSuccess={(u) => setUser(u)} 
        authError={authError} 
        setAuthError={setAuthError} 
      />
    );
  }

  return (
    <div className="h-[100dvh] bg-white dark:bg-[#0c0a1f] font-sans text-black dark:text-slate-100 flex flex-col antialiased selection:bg-black/[0.12] dark:selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* Decorative Blur Mesh Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none"></div>
      
      {/* Navigation section */}
      <div className="flex-shrink-0 z-20">
        <Navbar 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          historyCount={history.length}
          isAdmin={isAdmin}
          userTokens={userTokens}
        />
      </div>

      {/* Main page views switcher */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 z-10">
        <div className="min-h-full flex flex-col">
          {activeTab === 'training' && isAdmin ? (
            <AITrainingSettings />
          ) : activeTab === 'cms' && isAdmin ? (
            <CmsAdmin adminEmail={user.email} />
          ) : activeTab === 'create' ? (
            <CreateContent 
              user={user} 
              onSaveGeneration={handleSaveGeneration}
              userTokens={userTokens}
              isAdmin={isAdmin}
            />
          ) : (
            <HistoryList 
              user={user} 
              history={history} 
              onDelete={handleDeleteGeneration} 
            />
          )}

          {/* Humble professional design footer */}
          <footer className="mt-auto border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-md py-6 z-10">
            <div className="mx-auto max-w-7xl flex justify-center px-4 sm:px-6 lg:px-8 text-xs font-medium text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5 justify-center text-center">
                <span className="text-black/70 dark:text-slate-300 font-bold">&copy; {new Date().getFullYear()} FAST Content Master.</span>
                <span>All rights reserved.</span>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0c0a1f]/90 backdrop-blur-xl border-t border-black/10 dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'create' 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Content</span>
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'history' 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Clock className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">History</span>
            {history.length > 0 && (
              <span className="absolute top-1 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white dark:ring-[#0c0a1f]">
                {history.length > 99 ? '99+' : history.length}
              </span>
            )}
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('cms')}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'cms' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="h-5 w-5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">CMS</span>
              </button>
              
              <button
                onClick={() => setActiveTab('training')}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'training' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <Brain className="h-5 w-5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">AI</span>
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
