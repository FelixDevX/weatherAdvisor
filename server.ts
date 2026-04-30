import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load local overrides first, then fall back to .env.
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
