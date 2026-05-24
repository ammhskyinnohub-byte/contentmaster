import * as fs from 'fs';

// 1. Update CreateContent.tsx
let createContentStr = fs.readFileSync('src/components/CreateContent.tsx', 'utf8');
createContentStr = createContentStr.replace(
/        if \(docSnap\.exists\(\) && docSnap\.data\(\)\.instructions\) \{\n          customInstructions = docSnap\.data\(\)\.instructions;\n        \}/,
`        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.instructionsDo || data.instructionsDont) {
            customInstructions = \`[DO/KNOWLEDGE GUIDELINES]\\n\${data.instructionsDo || "None"}\\n\\n[RESTRICTIONS/DON'Ts]\\n\${data.instructionsDont || "None"}\`;
          } else if (data.instructions) {
            customInstructions = data.instructions;
          }
        }`
);
fs.writeFileSync('src/components/CreateContent.tsx', createContentStr);

// 2. Update AITrainingSettings.tsx
let settingsStr = fs.readFileSync('src/components/AITrainingSettings.tsx', 'utf8');

// Replacements in state
settingsStr = settingsStr.replace(
  /const \[instructions, setInstructions\] = useState\(""\);/,
  `const [instructionsDo, setInstructionsDo] = useState("");\n  const [instructionsDont, setInstructionsDont] = useState("");`
);

// Replacements in fetchTrainingData
settingsStr = settingsStr.replace(
  /        setInstructions\(docSnap\.data\(\)\.instructions \|\| ""\);/,
  `        const data = docSnap.data();
        setInstructionsDo(data.instructionsDo || data.instructions || "");
        setInstructionsDont(data.instructionsDont || "");`
);

// Replacements in handleSave
settingsStr = settingsStr.replace(
  /      await setDoc\(docRef, \{\n        instructions,\n        updatedAt: serverTimestamp\(\)\n      \}, \{ merge: true \}\);/,
  `      await setDoc(docRef, {
        instructionsDo,
        instructionsDont,
        updatedAt: serverTimestamp()
      }, { merge: true });`
);

// Form UI changes
let oldForm = `          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-black/80 dark:text-slate-300 mb-2">
              Custom System Instructions (Brand Voice & Restrictions)
            </label>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 font-medium leading-relaxed">
              Add specific rules, banned words, exact tones, or brand guidelines you want the AI to follow. These instructions are injected directly into the core AI model when generating content.
            </p>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
              </div>
            ) : (
              <textarea
                rows={12}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. NEVER use these words: 'Hello guys'. Always use 'Hi family'. Prioritize explaining the 3 key aspects... (မြန်မာလိုရေးရင် အမြဲတမ်း '...' လို့သုံးပေးပါ။)"
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/20 p-4 text-sm outline-none focus:border-black dark:focus:border-indigo-500 focus:ring-2 focus:ring-black/20 dark:focus:ring-indigo-500/20 transition-all text-black dark:text-white font-medium resize-none leading-relaxed custom-scrollbar placeholder-slate-400 dark:placeholder-slate-600"
              />
            )}
          </div>`;

let newForm = `          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </div>`;

settingsStr = settingsStr.replace(oldForm, newForm);

fs.writeFileSync('src/components/AITrainingSettings.tsx', settingsStr);
console.log('Fixed');
