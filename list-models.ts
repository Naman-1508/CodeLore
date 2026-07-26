import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const models = await ai.models.list();
    for await (const model of models) {
      console.log(model.name, model.supportedGenerationMethods);
    }
  } catch (e) {
    console.error("Error fetching models:", e);
  }
}
run();
