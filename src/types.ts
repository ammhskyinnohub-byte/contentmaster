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
  productName: string;
  topic: string;
  platform: string;
  tone: string;
  cta: string;
  imageUrl?: string;
  language: string;
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
  { value: 'Shop Now (အခုပဲ ဝယ်ယူလိုက်ပါ)', label: 'Shop Now (အခုပဲ ဝယ်ယူလိုက်ပါ)' },
  { value: 'Learn More (အသေးစိတ် ထပ်မံဖတ်ရှုရန်)', label: 'Learn More (အသေးစိတ် ထပ်မံဖတ်ရှုရန်)' },
  { value: 'Sign Up (စာရင်းသွင်းရန်)', label: 'Sign Up (စာရင်းသွင်းရန်)' },
  { value: 'PM us to order (မက်ဆေ့ခ်ျ - Chat Box ကနေမှာယူပါ)', label: 'PM us to order (မက်ဆေ့ခ်ျ - Chat Box ကနေမှာယူပါ)' },
  { value: 'Leave a comment below (အောက်မှာမေးခဲ့ပေးပါ)', label: 'Leave a comment below (အောက်မှာမေးခဲ့ပေးပါ)' },
  { value: 'Contact us now (အမြန်ဆက်သွယ်လိုက်ပါ)', label: 'Contact us now (အမြန်ဆက်သွယ်လိုက်ပါ)' }
];

export const LANGUAGES = [
  { value: 'burmese', label: 'Burmese (မြန်မာဘာသာ)', flag: '🇲🇲' },
  { value: 'english', label: 'English Only', flag: '🇬🇧' }
];
