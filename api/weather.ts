import axios from 'axios';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const city = req.query?.city;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY' || apiKey === 'MY_OPENWEATHER_API_KEY') {
    return res.status(500).json({ error: 'OPENWEATHER_API_KEY is missing or invalid' });
  }

  try {
    const currentResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: city, appid: apiKey, units: 'metric' },
    });

    const forecastResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { q: city, appid: apiKey, units: 'metric' },
    });

    return res.status(200).json({
      current: currentResponse.data,
      forecast: forecastResponse.data,
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error fetching weather data';
    return res.status(status).json({ error: message });
  }
}
