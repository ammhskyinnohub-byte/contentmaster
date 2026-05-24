import * as fs from 'fs';

// 1. Fix types.ts
let typesContent = fs.readFileSync('src/types.ts', 'utf8');
typesContent = typesContent.replace(/export type PlatformType = [^;]+;/, "export type PlatformType = 'Facebook' | 'TikTok' | 'Instagram' | 'LinkedIn' | 'Twitter/X';");

let platformsIndex = typesContent.indexOf('export const PLATFORMS');
let platformsEnd = typesContent.indexOf('];', platformsIndex) + 2;
let newPlatforms = `export const PLATFORMS: { value: PlatformType; label: string; icon: string; desc: string }[] = [
  { value: 'Facebook', label: 'Facebook', icon: 'facebook', desc: 'Rich formatting, engagement hooks & bullet points' },
  { value: 'Instagram', label: 'Instagram', icon: 'instagram', desc: 'Aesthetic hooks, visual cues & clean spacing' },
  { value: 'TikTok', label: 'TikTok', icon: 'video', desc: 'Creative Script with a strong 3s Hook' },
  { value: 'LinkedIn', label: 'LinkedIn', icon: 'linkedin', desc: 'Professional, strategic value props & business tone' },
  { value: 'Twitter/X', label: 'Twitter / X', icon: 'twitter', desc: 'Punchy micro-blogs, threads & bold statements' }
];`;
typesContent = typesContent.substring(0, platformsIndex) + newPlatforms + typesContent.substring(platformsEnd);

let langIndex = typesContent.indexOf('export const LANGUAGES');
let langEnd = typesContent.indexOf('];', langIndex) + 2;
let newLangs = `export const LANGUAGES = [
  { value: 'burmese', label: 'Burmese (မြန်မာဘာသာ)', flag: '🇲🇲' },
  { value: 'english', label: 'English Only', flag: '🇬🇧' }
];`;
typesContent = typesContent.substring(0, langIndex) + newLangs + typesContent.substring(langEnd);
fs.writeFileSync('src/types.ts', typesContent);

// 2. Fix server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(
  /- TikTok\/Reels: Write as a clear, high-energy, concise script with visual scene directions \[like this\] and speaker voice annotations\./,
  '- TikTok: Create a highly creative video script. MUST start with a brilliant, attention-grabbing 3-second (3s) Hook. Include clear visual/scene directions and voiceover text.'
);
serverContent = serverContent.replace(
  /   - Lemon8 \/ Carousel slides: Write it as high-retention slide-by-slide brief content cards with eye-catching slide headers and details\.\n/,
  ''
);
serverContent = serverContent.replace(
  /\$\{language === 'burmese' \? 'Burmese \(မြန်မာဘာသာ\)' : language === 'english' \? 'English' : 'Dual Language \(Provide both Burmese and English versions clearly labeled\)'\}/g,
  "${language === 'burmese' ? 'Burmese (မြန်မာဘာသာ)' : 'English'}"
);
serverContent = serverContent.replace(
  /\$\{language === 'burmese' \? 'Burmese Only' : language === 'english' \? 'English Only' : 'Dual Language \(Burmese and English\)'\}/g,
  "${language === 'burmese' ? 'Burmese Only' : 'English Only'}"
);
fs.writeFileSync('server.ts', serverContent);

// 3. Fix CreateContent.tsx
let createContentStr = fs.readFileSync('src/components/CreateContent.tsx', 'utf8');

// Remove suggestions array and rendering
createContentStr = createContentStr.replace(/  \/\/ Suggested ideas helper[\s\S]*?];\n\n/, '');
createContentStr = createContentStr.replace(/              \{\/\* Context Suggestions Quick Insert \*\/\}[\s\S]*?<\/div>\n              <\/div>/, '');

fs.writeFileSync('src/components/CreateContent.tsx', createContentStr);
console.log('Fixed');
