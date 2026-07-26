import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    const names = [];
    for await (const m of response) {
      names.push(m.name);
    }
    console.log(names);
  } catch (e) {
    console.error(e);
  }
}
test();
