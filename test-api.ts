import fs from 'fs';
import { GoogleGenAI } from "@google/genai";

const path = './dummy.mp4';
fs.writeFileSync(path, Buffer.alloc(1024 * 1024));

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const file = await ai.files.upload({ file: path, config: { mimeType: 'video/mp4' } });
  console.log(file);
  fs.unlinkSync(path);
  console.log('getting:', await ai.files.get({ name: file.name }));
  await ai.files.delete({ name: file.name });
  console.log('deleted');
}
test();
