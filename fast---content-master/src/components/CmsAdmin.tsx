import React, { useState, useEffect } from "react";
import { 
  db, 
  secondaryAuth, 
  createUserWithEmailAndPassword 
} from "../lib/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getCountFromServer
} from "firebase/firestore";
import { UserDoc } from "../types";
import { 
  Users, 
  UserPlus, 
  ShieldAlert, 
  Trash2, 
  Power, 
  ArrowRight,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  CheckCircle,
  Coins,
  Plus,
  X
} from "lucide-react";

interface CmsAdminProps {
  adminEmail: string | null;
}

export default function CmsAdmin({ adminEmail }: CmsAdminProps) {
  const [users, setUsers] = useState<UserDoc[]>([]);
  
  // Create state variables
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Token Modal
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [tokenAmountInput, setTokenAmountInput] = useState("100");
  const [selectedUserForTokens, setSelectedUserForTokens] = useState<UserDoc | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorCode(null);
    try {
      // 1. Fetch Users
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);
      const usersList: UserDoc[] = [];
      const statsPromises: Promise<void>[] = [];

      usersSnap.forEach((docSnap) => {
        const userData = { uid: docSnap.id, ...docSnap.data() } as UserDoc;
        usersList.push(userData);

        const q = query(collection(db, "generations"), where("userId", "==", docSnap.id));
        const countPromise = getCountFromServer(q).then((countSnap) => {
          userData.totalGeneratedCount = countSnap.data().count;
        });
        statsPromises.push(countPromise);
      });

      await Promise.all(statsPromises);
      setUsers(usersList);
    } catch (err) {
      console.error("Failed fetching CMS information:", err);
      setErrorCode("ဒေတာများ ဆွဲယူရန် မအောင်မြင်ပါ (Failed loading administrative intelligence data)");
    } finally {
      setLoading(false);
    }
  };

  // Add standard authorized user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName) {
      setErrorCode("အချက်အလက်အားလုံး ပြည့်စုံအောင် ဖြည့်စွက်ပေးပါ (Please fill all fields)");
      return;
    }
    
    if (newPassword.length < 6) {
      setErrorCode("စကားဝှက်မှာ အနည်းဆုံး ၆ လုံး ရှိရပါမည် (Password must be at least 6 characters)");
      return;
    }

    setAddLoading(true);
    setErrorCode(null);
    setSuccessMsg(null);

    try {
      // Create user credential on secondary instance
      const credential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const createdUid = credential.user.uid;

      // Log out of the secondary system to keep primary user context clean
      await secondaryAuth.signOut();

      // Put metadata reference in Firestore
      const userPayload = {
        uid: createdUid,
        email: newEmail.toLowerCase().trim(),
        fullName: newName,
        status: "active",
        tokens: 50, // default tokens
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "users", createdUid), userPayload);

      setSuccessMsg(`အကောင့်သစ်ဖွင့်ပေးခြင်း အောင်မြင်ပါသည်။ Email: ${newEmail}`);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      
      // Reload lists
      fetchDashboardData();
    } catch (err: any) {
      console.error("User registration issue:", err);
      let msg = "အကောင့်ဖွင့်ရန် မအောင်မြင်ပါ (Failed to register user)";
      if (err.code === "auth/email-already-in-use") {
        msg = "ဤ Email သည် အသုံးပြုပြီးသား ဖြစ်နေပါသည်။ (This email is already in use)";
      } else if (err.code === "auth/invalid-email") {
        msg = "မှန်ကန်သော Email ဖြစ်ရန် လိုအပ်ပါသည် (Invalid email layout)";
      }
      setErrorCode(msg);
    } finally {
      setAddLoading(false);
    }
  };

  // Toggle activation status
  const handleToggleStatus = async (userDoc: UserDoc) => {
    setActionId(userDoc.uid);
    try {
      const nextStatus = userDoc.status === "active" ? "inactive" : "active";
      await updateDoc(doc(db, "users", userDoc.uid), {
        status: nextStatus
      });
      setUsers(prev => prev.map(u => u.uid === userDoc.uid ? { ...u, status: nextStatus } : u));
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setActionId(null);
    }
  };

  // Delete User completely from Firestore records list
  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("ဤအသုံးပြုသူကို စာရင်းမှ ဖျက်ပစ်ရန် သေချာပါသလား?")) return;
    setActionId(uid);
    try {
      await deleteDoc(doc(db, "users", uid));
      setUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (err) {
      console.error("Delete issue:", err);
    } finally {
      setActionId(null);
    }
  };

  const openTokenModal = (user: UserDoc) => {
    setSelectedUserForTokens(user);
    setTokenAmountInput("100");
    setTokenModalOpen(true);
  };

  const handleAddTokensConfirm = async () => {
    if (!selectedUserForTokens) return;
    const amount = parseInt(tokenAmountInput, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid token amount. Must be a positive number.");
      return;
    }
    
    setActionId(selectedUserForTokens.uid);
    setTokenModalOpen(false);
    
    try {
      const newBalance = (selectedUserForTokens.tokens || 0) + amount;
      await updateDoc(doc(db, "users", selectedUserForTokens.uid), {
        tokens: newBalance
      });
      setUsers(prev => prev.map(u => u.uid === selectedUserForTokens.uid ? { ...u, tokens: newBalance } : u));
    } catch (err) {
      console.error("Add tokens error:", err);
    } finally {
      setActionId(null);
      setSelectedUserForTokens(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in text-black/80 dark:text-slate-200">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Workspace Control Unit</span>
          <h1 className="text-2.5xl font-black tracking-tight text-black dark:text-white uppercase font-display mt-1">
            CMS Portal
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Manage user authorization files and allocate tokens for AI processing.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4.5 py-2.5 rounded-2xl">
          <ShieldAlert className="h-5 w-5 text-black/70 dark:text-slate-300" />
          <div className="text-left leading-none">
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none">Admin Profile</p>
            <p className="text-xs font-bold text-black/80 dark:text-slate-200 mt-1">{adminEmail}</p>
          </div>
        </div>
      </div>

      {/* Analytics widgets grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total Registered Users */}
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-5 rounded-3xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 flex items-center justify-center text-black dark:text-white">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Approved Writers</p>
            <p className="text-2xl font-black text-black dark:text-white font-display mt-0.5">{users.length}</p>
          </div>
        </div>
      </div>

      {/* Main Panel Content split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ADD USER FORM (Lg:span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
              <UserPlus className="h-5 w-5 text-black dark:text-white" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-black dark:text-slate-100">Add Allowed User</h2>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., Maung Maung"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-black/20 dark:border-white/20 bg-transparent pl-9.5 pr-4 py-2.5 outline-none focus:border-white focus:ring-1 focus:ring-white/20 text-black dark:text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="user@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full text-xs rounded-xl border border-black/20 dark:border-white/20 bg-transparent pl-9.5 pr-4 py-2.5 outline-none focus:border-white focus:ring-1 focus:ring-white/20 text-black dark:text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-1.5">
                  Set Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs rounded-xl border border-black/20 dark:border-white/20 bg-transparent pl-9.5 pr-4 py-2.5 outline-none focus:border-white focus:ring-1 focus:ring-white/20 text-black dark:text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Status Alert displays */}
              {errorCode && (
                <div className="rounded-xl bg-black/10 dark:bg-white/10 p-3.5 text-xs text-black dark:text-white border border-black/20 dark:border-white/20">
                  <p>{errorCode}</p>
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl bg-black/10 dark:bg-white/10 p-3.5 text-xs text-black dark:text-white border border-black/20 dark:border-white/20 flex gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-black dark:text-white" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={addLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-black dark:bg-white py-3 text-xs font-bold uppercase tracking-widest text-white dark:text-black hover:bg-black/90 dark:hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{addLoading ? "Authorizing User..." : "Enable Account"}</span>
                {!addLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* USERS LIST TABLE (Lg:span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* User management block */}
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-black dark:text-white" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-black dark:text-slate-100">Writers Status Registry</h2>
              </div>
              <button
                onClick={fetchDashboardData}
                className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 px-3 py-1 rounded-lg cursor-pointer transition-colors"
              >
                Refresh Board
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-10 w-10 text-black dark:text-white animate-spin" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-500">Retrieving system accounts list...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-500">
                အသုံးပြုသူစာရင်း မရှိသေးပါ။ (No users added to directory yet)
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                      <th className="py-3 px-2">Account</th>
                      <th className="py-3 px-2">Credential Email</th>
                      <th className="py-3 px-2 text-center">Live Usage</th>
                      <th className="py-3 px-2 text-center">Tokens</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((item) => (
                      <tr key={item.uid} className="hover:bg-black/[0.02] dark:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-2">
                          <p className="font-bold text-black/80 dark:text-slate-200">{item.fullName}</p>
                        </td>
                        <td className="py-3 px-2 text-black/70 dark:text-slate-300 font-mono text-[11px]">
                          {item.email}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center justify-center px-1.5 py-0 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-widest whitespace-nowrap" title="Posts Written">
                              {item.totalGeneratedCount || 0} Written
                            </span>
                            <span className="inline-flex items-center justify-center px-1.5 py-0 rounded text-[9px] font-bold bg-black/5 dark:bg-white/10 text-black/70 dark:text-slate-300 border border-black/10 dark:border-white/10 uppercase tracking-widest whitespace-nowrap" title="Posts Left (Based on Tokens)">
                              {Math.floor((item.tokens !== undefined ? item.tokens : 0) / 10)} Left
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-flex items-center gap-1 bg-black/10 dark:bg-white/10 text-black/80 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold border border-black/20 dark:border-white/20">
                            <Coins className="h-3 w-3" />
                            {item.tokens !== undefined ? item.tokens : 0}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                            item.status === 'active' 
                              ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white border-black/20 dark:border-white/20' 
                              : 'bg-transparent text-slate-500 dark:text-slate-500 border-slate-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Add Tokens (Admin function) */}
                            <button
                              onClick={() => openTokenModal(item)}
                              disabled={actionId === item.uid}
                              className="p-1.5 flex items-center justify-center gap-1 rounded-lg bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/20 dark:border-white/20 hover:bg-black/20 dark:bg-white/20 transition-all cursor-pointer font-bold text-[9px] uppercase tracking-wider"
                              title="Add Tokens"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <Coins className="h-3.5 w-3.5" />
                            </button>

                            {/* Toggle active / inactive status */}
                            <button
                              onClick={() => handleToggleStatus(item)}
                              disabled={actionId === item.uid}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                item.status === 'active'
                                  ? 'bg-transparent text-black/70 dark:text-slate-300 border-black/20 dark:border-white/20 hover:bg-black/10 dark:bg-white/10'
                                  : 'bg-black/10 dark:bg-white/10 text-black dark:text-white border-black/30 dark:border-white/30 hover:bg-black/20 dark:bg-white/20'
                              }`}
                              title={item.status === 'active' ? 'Block Account' : 'Activate Account'}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => handleDeleteUser(item.uid)}
                              disabled={actionId === item.uid}
                              className="p-1.5 rounded-lg bg-transparent text-slate-600 dark:text-slate-400 border border-slate-700 hover:bg-black/10 dark:bg-white/10 hover:text-black dark:text-white transition-all cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Token Overay Modal */}
      {tokenModalOpen && selectedUserForTokens && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#0c0a1f] border border-black/20 dark:border-white/20 rounded-3xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setTokenModalOpen(false)}
              className="absolute top-4 right-4 text-slate-600 dark:text-slate-400 hover:text-black dark:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-bold text-black dark:text-white mb-1 uppercase tracking-wider">Add Tokens</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-5">
              Refill account balance for <span className="text-black dark:text-white font-semibold">{selectedUserForTokens.fullName}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-1.5">Amount to Add</label>
                <div className="relative">
                  <Coins className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-500" />
                  <input 
                    type="number"
                    min="1"
                    value={tokenAmountInput}
                    onChange={(e) => setTokenAmountInput(e.target.value)}
                    className="w-full text-sm rounded-xl border border-black/20 dark:border-white/20 bg-transparent pl-10 pr-4 py-3 outline-none focus:border-white text-black dark:text-white font-semibold"
                  />
                </div>
              </div>
              <button
                onClick={handleAddTokensConfirm}
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-black/90 dark:hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Confirm Add Tokens
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
