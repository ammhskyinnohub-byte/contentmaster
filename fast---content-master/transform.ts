import * as fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.{tsx,ts}');

const replacements = [
  { p: /text-white(?![\w/-])/g, r: 'text-slate-900 dark:text-white' },
  { p: /text-slate-100(?![\w/-])/g, r: 'text-slate-900 dark:text-slate-100' },
  { p: /text-slate-200(?![\w/-])/g, r: 'text-slate-800 dark:text-slate-200' },
  { p: /text-slate-300(?![\w/-])/g, r: 'text-slate-700 dark:text-slate-300' },
  { p: /text-slate-400(?![\w/-])/g, r: 'text-slate-600 dark:text-slate-400' },
  { p: /text-slate-500(?![\w/-])/g, r: 'text-slate-500 dark:text-slate-500' },
  
  { p: /bg-white\/5(?![\w/-])/g, r: 'bg-black/5 dark:bg-white/5' },
  { p: /bg-white\/10(?![\w/-])/g, r: 'bg-black/10 dark:bg-white/10' },
  { p: /bg-white\/15(?![\w/-])/g, r: 'bg-black/15 dark:bg-white/15' },
  { p: /bg-white\/20(?![\w/-])/g, r: 'bg-black/20 dark:bg-white/20' },
  { p: /bg-white\/\[0\.01\]/g, r: 'bg-black/[0.01] dark:bg-white/[0.01]' },
  { p: /bg-white\/\[0\.02\]/g, r: 'bg-black/[0.02] dark:bg-white/[0.02]' },
  { p: /bg-white\/\[0\.03\]/g, r: 'bg-black/[0.03] dark:bg-white/[0.03]' },
  { p: /bg-transparent/g, r: 'bg-transparent' }, // no-op dummy
  
  { p: /border-white\/5(?![\w/-])/g, r: 'border-black/5 dark:border-white/5' },
  { p: /border-white\/10(?![\w/-])/g, r: 'border-black/10 dark:border-white/10' },
  { p: /border-white\/15(?![\w/-])/g, r: 'border-black/15 dark:border-white/15' },
  { p: /border-white\/20(?![\w/-])/g, r: 'border-black/20 dark:border-white/20' },
  { p: /border-white\/30(?![\w/-])/g, r: 'border-black/30 dark:border-white/30' },
  
  { p: /hover:bg-white\/5(?![\w/-])/g, r: 'hover:bg-black/5 dark:hover:bg-white/5' },
  { p: /hover:bg-white\/10(?![\w/-])/g, r: 'hover:bg-black/10 dark:hover:bg-white/10' },
  { p: /hover:bg-white\/15(?![\w/-])/g, r: 'hover:bg-black/15 dark:hover:bg-white/15' },
  { p: /hover:bg-white\/20(?![\w/-])/g, r: 'hover:bg-black/20 dark:hover:bg-white/20' },
  { p: /hover:border-white\/10(?![\w/-])/g, r: 'hover:border-black/10 dark:hover:border-white/10' },
  
  { p: /bg-\[#070514\]/g, r: 'bg-slate-50 dark:bg-[#070514]' },
  { p: /bg-\[#0c0a1f\](\/[0-9]+)?/g, r: 'bg-white dark:bg-[#0c0a1f]$1' },
  { p: /bg-\[#161233\]/g, r: 'bg-white dark:bg-[#161233]' },
  
  { p: /shadow-white\/5(?![\w/-])/g, r: 'shadow-black/5 dark:shadow-white/5' },
  { p: /text-black(?![\w/-])/g, r: 'text-slate-100 dark:text-black' },
  
  // Custom scrollbar dark/light? We'll leave index.css as is mostly, it's transparent white
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(rep => {
    content = content.replace(rep.p, rep.r);
  });
  
  // Specific fix for primary buttons that NEED `text-white` natively
  content = content.replace(/className="([^"]*(?:from-indigo-500|bg-indigo-500)[^"]*?)text-slate-900 dark:text-white([^"]*)"/g, 'className="$1text-white$2"');
  
  fs.writeFileSync(file, content);
  console.log(`Processed ${file}`);
});
