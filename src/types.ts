export interface UserDoc {
  uid: string;
  email: string;
  fullName: string;
  status: "active" | "inactive";
  tokens: number;
  createdAt: any;
  totalGeneratedCount?: number;
}

export interface Generation {
  id: string;
  userId: string;
  productName?: string; // Made optional for Recap
  topic?: string;       // Made optional for Recap
  platform?: string;    // Made optional for Recap
  tone?: string;        // Made optional for Recap
  cta?: string;         // Made optional for Recap
  imageUrl?: string;
  language?: string;    // Made optional for Recap
  videoLink?: string;   // Added for Recap
  duration?: string;    // Added for Recap
  type?: 'content' | 'recap' | 'audio' | 'calendar'; // Differentiate apps
  generatedContent: string;
  createdAt: any; // Firestore server timestamp or string date
}

export interface ContentFormData {
  productName: string;
  topic: string;
  platform: string;
  tone: string;
  cta: string;
  language: string;
  productPhoto: string; // Base64 representation of optional photo
}

export type PlatformType = 'Facebook' | 'TikTok' | 'Instagram' | 'LinkedIn' | 'Twitter/X';

export const PLATFORMS: { value: PlatformType; label: string; icon: string; desc: string }[] = [
  { value: 'Facebook', label: 'Facebook', icon: 'facebook', desc: 'Rich formatting, engagement hooks & bullet points' },
  { value: 'Instagram', label: 'Instagram', icon: 'instagram', desc: 'Aesthetic hooks, visual cues & clean spacing' },
  { value: 'TikTok', label: 'TikTok', icon: 'video', desc: 'Creative Script with a strong 3s Hook' },
  { value: 'LinkedIn', label: 'LinkedIn', icon: 'linkedin', desc: 'Professional, strategic value props & business tone' },
  { value: 'Twitter/X', label: 'Twitter / X', icon: 'twitter', desc: 'Punchy micro-blogs, threads & bold statements' }
];

export const TONES = [
  { value: 'Professional', label: 'Professional (စီးပွားရေးဆန်ဆန်)', description: 'Authoritative, clear, corporate, reassuring.' },
  { value: 'Friendly/Caring', label: 'Friendly & Caring (ရင်းနှီးဖော်ရွေသော)', description: 'Warm, trustworthiness, helpful, conversational.' },
  { value: 'Energetic/Fun', label: 'Energetic & Fun (ပျော်စရာ/သွက်သွက်လက်လက်)', description: 'Hyped, trending emojis, modern youth slangs.' },
  { value: 'Persuasive', label: 'Persuasive (ဆွဲဆောင်မှုရှိသော)', description: 'Pain points focused, strong USP details, creates FOMO.' },
  { value: 'Educational', label: 'Educational (ဗဟုသုတပေးသော)', description: 'Tip-themed, values-driven, clear takeaways.' },
  { value: 'Emotional', label: 'Emotional (ခံစားချက်ကိုထိမိသော)', description: 'Storytelling, heartfelt empathy, relatable experiences.' }
];

export const CTAS = [
  { value: 'ကွန်းမန့်မန့်ဖို့', label: 'ကွန်းမန့်မန့်ဖို့' },
  { value: 'Messenger ကိုလာဖို့', label: 'Messenger ကိုလာဖို့' },
  { value: 'ဖုန်းခေါ်ဖို့', label: 'ဖုန်းခေါ်ဖို့' },
  { value: 'Video ကိုကြည့်ဖို့', label: 'Video ကိုကြည့်ဖို့' },
  { value: 'လာဝယ်ဖို့', label: 'လာဝယ်ဖို့' }
];

export const LANGUAGES = [
  { value: 'burmese', label: 'Burmese (မြန်မာဘာသာ)', flag: '🇲🇲' },
  { value: 'english', label: 'English Only', flag: '🇬🇧' }
];
