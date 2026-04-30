import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load local overrides first, then fall back to .env.
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

app.use(express.json());

// API Route for weather
app.get('/api/weather', async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  if (
    !OPENWEATHER_API_KEY ||
    OPENWEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY' ||
    OPENWEATHER_API_KEY === 'MY_OPENWEATHER_API_KEY'
  ) {
    return res.status(500).json({
      error: 'OPENWEATHER_API_KEY is missing or invalid in .env.local',
    });
  }

  try {
    const currentResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: { q: city, appid: OPENWEATHER_API_KEY, units: 'metric' }
    });

    const forecastResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: { q: city, appid: OPENWEATHER_API_KEY, units: 'metric' }
    });

    res.json({
      current: currentResponse.data,
      forecast: forecastResponse.data
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error fetching weather data';
    res.status(status).json({ error: message });
  }
});

// API Route for AI travel advice
app.post('/api/advice', async (req, res) => {
  const { city, country, temp, description } = req.body ?? {};

  if (!city || !country || temp === undefined || !description) {
    return res.status(400).json({ error: 'city, country, temp, and description are required' });
  }

  if (!ai || !GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing or invalid on server' });
  }

  try {
    const prompt = `Act as a luxury travel advisor. Given the weather in ${city} (${country}):
Temp: ${temp}°C, Weather: ${description}.
Provide concise, elegant travel advice including what to wear, top 2 activities (indoor/outdoor based on rain), and a "vibe" description. Keep it under 120 words. Format with simple markdown headers. Focus on high-end luxury tone.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    res.json({ advice: response.text || 'Unable to generate advice.' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to get AI advice at this time.' });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
