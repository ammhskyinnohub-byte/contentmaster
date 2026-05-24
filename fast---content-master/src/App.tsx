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
import { Loader2 } from "lucide-react";

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
    const pathRef = "generations";
    try {
      const q = query(
        collection(db, pathRef),
        where("userId", "==", uid)
      );
      
      const snapshot = await getDocs(q);
      const items: Generation[] = [];
      
      snapshot.forEach((docSnap) => {
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
      handleFirestoreError(err, OperationType.GET, pathRef);
    } finally {
      setDbLoading(false);
    }
  };

  // Save generated record to user's Firestore histories
  const handleSaveGeneration = async (genData: {
    productName: string;
    topic: string;
    platform: string;
    tone: string;
    cta: string;
    language: string;
    imageUrl?: string;
    generatedContent: string;
  }) => {
    if (!user) return;
    const pathRef = "generations";
    // Create highly descriptive randomized path-variable custom ID
    const newGenId = "gen_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    
    const payload = {
      id: newGenId,
      userId: user.uid,
      productName: genData.productName,
      topic: genData.topic,
      platform: genData.platform,
      tone: genData.tone,
      cta: genData.cta,
      language: genData.language,
      imageUrl: genData.imageUrl || null,
      generatedContent: genData.generatedContent,
      createdAt: serverTimestamp() // Meets our path verification and temporal security rules tests
    };

    try {
      const docRef = doc(db, "generations", newGenId);
      await setDoc(docRef, payload);
      
      // Deduct 10 tokens securely
      if (!isAdmin) {
        await updateDoc(doc(db, "users", user.uid), {
          tokens: Math.max(0, userTokens - 10)
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
    const pathRef = `generations/${id}`;
    try {
      await deleteDoc(doc(db, "generations", id));
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
    <div className="min-h-screen bg-white dark:bg-[#0c0a1f] font-sans text-black dark:text-slate-100 flex flex-col antialiased selection:bg-black/[0.12] dark:selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* Decorative Blur Mesh Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none"></div>
      
      {/* Navigation section */}
      <Navbar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        historyCount={history.length}
        isAdmin={isAdmin}
        userTokens={userTokens}
      />

      {/* Main page views switcher */}
      <main className="flex-grow z-10">
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
      </main>

      {/* Humble professional design footer */}
      <footer className="mt-auto border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-md py-6 z-10">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 text-xs font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 justify-center">
            <span className="text-black/70 dark:text-slate-300 font-bold">&copy; {new Date().getFullYear()} FAST Content Master.</span>
            <span>All rights reserved.</span>
          </div>
          <div className="mt-2 sm:mt-0 flex gap-4 text-slate-500 dark:text-slate-500">
            <span className="hover:text-black dark:text-indigo-400 transition-colors">Frosted Glass Theme</span>
            <span>&bull;</span>
            <span>Google Gemini AI</span>
            <span>&bull;</span>
            <span>Secure Persistence</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
