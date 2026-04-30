import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { city, country, temp, description } = req.body ?? {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!city || !country || temp === undefined || !description) {
    return res.status(400).json({ error: 'city, country, temp, and description are required' });
  }

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing or invalid' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Act as a luxury travel advisor. Given the weather in ${city} (${country}):
Temp: ${temp}°C, Weather: ${description}.
Provide concise, elegant travel advice including what to wear, top 2 activities (indoor/outdoor based on rain), and a "vibe" description. Keep it under 120 words. Format with simple markdown headers. Focus on high-end luxury tone.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return res.status(200).json({ advice: response.text || 'Unable to generate advice.' });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to get AI advice at this time.' });
  }
}
