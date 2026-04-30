/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Search as SearchIcon, 
  MapPin, 
  Wind, 
  Droplets, 
  Thermometer, 
  Sun, 
  Moon, 
  Heart, 
  ArrowRightLeft,
  Sparkles,
  RefreshCw,
  Compass,
  Zap,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { WeatherData, FavoriteCity } from './types';

const SUGGESTED_CITIES = [
  { name: 'Tokyo', country: 'JP', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=400' },
  { name: 'Paris', country: 'FR', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=400' },
  { name: 'New York', country: 'US', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=400' },
  { name: 'Zurich', country: 'CH', image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&q=80&w=400' }
];

export default function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState('');
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
     if (typeof window !== 'undefined') {
       return localStorage.getItem('theme') === 'dark';
     }
     return false;
  });

  // Comparison State
  const [compareMode, setCompareMode] = useState(false);
  const [compareCity1, setCompareCity1] = useState<WeatherData | null>(null);
  const [compareCity2, setCompareCity2] = useState<WeatherData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchWeather = async (cityName: string, target: 'main' | 'compare1' | 'compare2' = 'main') => {
    if (!cityName) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get<WeatherData>(`/api/weather?city=${cityName}`);
      if (target === 'main') {
        setWeather(data);
        generateAdvice(data);
      } else if (target === 'compare1') {
        setCompareCity1(data);
      } else if (target === 'compare2') {
        setCompareCity2(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not find city');
    } finally {
      setLoading(false);
    }
  };

  const generateAdvice = async (data: WeatherData) => {
    setAdviceLoading(true);
    try {
      const { data: adviceData } = await axios.post('/api/advice', {
        city: data.current.name,
        country: data.current.sys.country,
        temp: data.current.main.temp,
        description: data.current.weather[0].description,
      });

      setAdvice(adviceData?.advice || 'Unable to generate advice.');
    } catch (err: any) {
      setAdvice(err.response?.data?.error || 'Unable to get AI advice at this time.');
    } finally {
      setAdviceLoading(false);
    }
  };

  const toggleFavorite = (cityName: string, country: string) => {
    const exists = favorites.find(f => f.name === cityName);
    if (exists) {
      setFavorites(favorites.filter(f => f.name !== cityName));
    } else {
      setFavorites([...favorites, { id: Date.now().toString(), name: cityName, country }]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather(city);
  };

  return (
    <div className="min-h-screen px-4 py-8 md:p-12 max-w-7xl mx-auto space-y-8 flex flex-col h-full overflow-x-hidden">
      {/* Header / Nav */}
      <nav className="flex flex-col md:flex-row justify-between items-center gap-6 animate-in">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setWeather(null); setCity(''); setCompareMode(false);}}>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">WeatherAdvisor</h1>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-[340px] group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <SearchIcon className={cn("w-4 h-4 transition-colors", loading ? "animate-spin text-blue-500" : "text-apple-secondary")} />
          </div>
          <input 
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search for a city..."
            className="w-full pl-12 pr-6 py-2.5 rounded-full glass text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-apple-secondary shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]"
          />
        </form>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCompareMode(!compareMode)}
            className={cn(
              "p-2 rounded-full glass hover:scale-110 active:scale-95 transition-all text-apple-secondary",
              compareMode && "bg-blue-500 text-white"
            )}
            title="Compare Cities"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
             <span className="hidden md:inline text-[13px] font-medium text-apple-secondary">Appearance</span>
             <button 
              onClick={() => setDarkMode(!darkMode)}
              className="relative w-10 h-[22px] bg-slate-200 dark:bg-slate-700 rounded-full transition-colors flex items-center px-0.5 group"
            >
              <div className={cn(
                "w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center",
                darkMode ? "translate-x-4.5" : "translate-x-0"
              )}>
                {darkMode ? <Moon className="w-2.5 h-2.5 text-blue-500" /> : <Sun className="w-2.5 h-2.5 text-yellow-500" />}
              </div>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3 text-sm"
          >
            <div className="bg-red-500 text-white rounded px-2 py-0.5 text-[10px] font-bold uppercase">Alert</div>
            <p className="font-medium">{error}</p>
          </motion.div>
        )}

        {compareMode ? (
          <ComparisonView 
            city1={compareCity1}
            city2={compareCity2}
            onSearch1={(c) => fetchWeather(c, 'compare1')}
            onSearch2={(c) => fetchWeather(c, 'compare2')}
            loading={loading}
          />
        ) : weather ? (
          <motion.div 
            key={weather.current.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 flex-grow"
          >
            {/* Main Weather Panel */}
            <div className="main-card-gradient p-8 md:p-12 flex flex-col justify-between min-h-[500px]">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-apple-secondary" />
                    {weather.current.name}, {weather.current.sys.country}
                  </h1>
                  <p className="text-xl font-medium text-apple-secondary mt-1 capitalize">
                    {weather.current.weather[0].description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-apple-secondary">{format(new Date(), 'EEEE, d MMM')}</p>
                  <p className="text-sm font-semibold text-blue-500 mt-1">Live Update</p>
                </div>
              </div>

              <div className="my-10">
                <div className="flex items-start gap-1">
                  <span className="text-[110px] font-bold leading-none tracking-[-4px] tabular-nums">
                    {Math.round(weather.current.main.temp)}°
                  </span>
                </div>
                
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
                  <button 
                    onClick={() => toggleFavorite(weather.current.name, weather.current.sys.country)}
                    className={cn(
                      "px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium text-sm shadow-sm",
                      favorites.find(f => f.name === weather.current.name) 
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                        : "bg-white/40 border border-white/50 hover:bg-white/60 dark:bg-slate-800/40"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", favorites.find(f => f.name === weather.current.name) && "fill-current")} />
                    {favorites.find(f => f.name === weather.current.name) ? "Saved" : "Save City"}
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-white/40 border border-white/50 dark:bg-slate-800/40 text-apple-secondary text-sm font-medium shadow-sm hover:bg-white/60 transition-all flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </div>

              {/* Internal Forecast Section */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {weather.forecast.list.filter((_, i) => i % 8 === 0).map((f, i) => (
                  <div key={f.dt} className="flex-1 min-w-[100px] bg-white/40 dark:bg-white/5 border border-white/50 p-4 rounded-[18px] flex flex-col items-center gap-1 group overflow-hidden shadow-sm backdrop-blur-md">
                    <span className="text-[11px] font-bold text-apple-secondary tracking-widest uppercase">
                      {i === 0 ? 'TODAY' : format(new Date(f.dt * 1000), 'EEE')}
                    </span>
                    <img 
                      src={`https://openweathermap.org/img/wn/${f.weather[0].icon}@2x.png`} 
                      alt=""
                      className="w-10 h-10 grayscale group-hover:grayscale-0 transition-all"
                    />
                    <div className="text-lg font-bold">{Math.round(f.main.temp)}°</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side Panel */}
            <aside className="side-panel flex flex-col gap-6">
              {/* Travel Advisor Card */}
              <div className="glass-card p-6 flex flex-col min-h-[280px]">
                <h2 className="text-[13px] font-semibold uppercase tracking-[1px] text-apple-secondary mb-4 flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  Travel Advisor
                </h2>
                <div className="flex-grow overflow-auto max-h-[300px] scrollbar-none">
                  {adviceLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                    </div>
                  ) : (
                    <div className="text-[15px] leading-relaxed prose prose-sm prose-slate dark:prose-invert">
                      <ReactMarkdown>{advice}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="inline-flex items-center px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-semibold">
                    <Zap className="w-3 h-3 mr-1" />
                    AI Dynamic Advice
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="glass-card p-6">
                <h2 className="text-[13px] font-semibold uppercase tracking-[1px] text-apple-secondary mb-4">Conditions & Stats</h2>
                <div className="space-y-4">
                  <StatRow label="Feels Like" value={`${Math.round(weather.current.main.feels_like)}°C`} />
                  <StatRow label="Humidity" value={`${weather.current.main.humidity}%`} />
                  <StatRow label="Wind" value={`${weather.current.wind.speed} m/s`} />
                  <StatRow label="Pressure" value={`${weather.current.main.pressure} hPa`} />
                  <StatRow label="Air Quality" value="Excellent" isAccent />
                </div>
              </div>

              {/* Favorites List */}
              {favorites.length > 0 && (
                <div className="glass-card p-6 flex-grow">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[1px] text-apple-secondary mb-4">Saved Locations</h2>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-none">
                    {favorites.map(fav => (
                      <button 
                        key={fav.id}
                        onClick={() => { setCity(fav.name); fetchWeather(fav.name); }}
                        className="w-full text-left p-3 rounded-xl bg-white/30 dark:bg-white/5 hover:bg-white/50 transition-colors text-sm font-medium flex items-center justify-between group border border-transparent hover:border-white/40"
                      >
                        {fav.name}
                        <ArrowRightLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -rotate-45" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </motion.div>
        ) : (
          /* Landing Page / Suggested Destinations */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-grow flex flex-col justify-center max-w-5xl mx-auto w-full py-12"
          >
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight">Weather Advisor</h2>
              <p className="text-apple-secondary text-xl font-medium max-w-2xl mx-auto">
                Intuitive weather insights for the modern traveler.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {SUGGESTED_CITIES.map((dest) => (
                <button 
                  key={dest.name}
                  onClick={() => { setCity(dest.name); fetchWeather(dest.name); }}
                  className="group relative h-72 rounded-[28px] overflow-hidden shadow-2xl shadow-blue-500/5 hover:-translate-y-2 transition-all duration-500 text-left"
                >
                  <img 
                    src={dest.image} 
                    alt={dest.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div>
                      <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">{dest.country}</p>
                      <h3 className="text-white text-2xl font-bold">{dest.name}</h3>
                    </div>
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
                      <ArrowRightLeft className="w-4 h-4 rotate-45" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ label, value, isAccent }: { label: string, value: string, isAccent?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-apple-secondary">{label}</span>
      <span className={cn("font-semibold", isAccent && "text-green-500")}>{value}</span>
    </div>
  )
}

function ComparisonView({ city1, city2, onSearch1, onSearch2, loading }: any) {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 max-w-6xl mx-auto w-full pt-4"
    >
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Comparison Card 1 */}
          <div className="space-y-4">
             <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input 
                  type="text" 
                  value={q1} 
                  onChange={e => setQ1(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onSearch1(q1)}
                  placeholder="Compare city one..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl glass-card focus:outline-none focus:ring-1 focus:ring-blue-500/50 bg-white/30"
                />
             </div>
             {city1 ? (
                <div className="main-card-gradient p-8 space-y-6">
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-2xl font-bold">{city1.current.name}</h4>
                        <p className="text-sm text-apple-secondary font-medium">{city1.current.sys.country}</p>
                      </div>
                      <div className="text-5xl font-bold tracking-tight">{Math.round(city1.current.main.temp)}°</div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/50 backdrop-blur-md">
                        <p className="text-[10px] font-bold text-apple-secondary uppercase mb-1">Feels Like</p>
                        <p className="font-bold">{Math.round(city1.current.main.feels_like)}°C</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/50 backdrop-blur-md">
                        <p className="text-[10px] font-bold text-apple-secondary uppercase mb-1">Humidity</p>
                        <p className="font-bold">{city1.current.main.humidity}%</p>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="h-48 rounded-[28px] border-2 border-dashed border-apple-secondary/20 flex flex-col items-center justify-center text-apple-secondary/40 animate-pulse">
                   <Compass className="w-8 h-8 mb-2 opacity-20" />
                   <p className="font-medium">Enter destination</p>
                </div>
             )}
          </div>

          {/* Comparison Card 2 */}
          <div className="space-y-4">
             <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input 
                  type="text" 
                  value={q2} 
                  onChange={e => setQ2(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onSearch2(q2)}
                  placeholder="Compare city two..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl glass-card focus:outline-none focus:ring-1 focus:ring-blue-500/50 bg-white/30"
                />
             </div>
             {city2 ? (
                <div className="main-card-gradient p-8 space-y-6">
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-2xl font-bold">{city2.current.name}</h4>
                        <p className="text-sm text-apple-secondary font-medium">{city2.current.sys.country}</p>
                      </div>
                      <div className="text-5xl font-bold tracking-tight">{Math.round(city2.current.main.temp)}°</div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/50 backdrop-blur-md">
                        <p className="text-[10px] font-bold text-apple-secondary uppercase mb-1">Feels Like</p>
                        <p className="font-bold">{Math.round(city2.current.main.feels_like)}°C</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/50 backdrop-blur-md">
                        <p className="text-[10px] font-bold text-apple-secondary uppercase mb-1">Humidity</p>
                        <p className="font-bold">{city2.current.main.humidity}%</p>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="h-48 rounded-[28px] border-2 border-dashed border-apple-secondary/20 flex flex-col items-center justify-center text-apple-secondary/40 animate-pulse">
                   <Compass className="w-8 h-8 mb-2 opacity-20" />
                   <p className="font-medium">Enter destination</p>
                </div>
             )}
          </div>
       </div>

       {city1 && city2 && (
          <div className="glass-card p-8 text-center bg-blue-500/5 border-blue-500/10">
             <h4 className="text-xs font-bold uppercase tracking-[2px] text-blue-500 mb-3">Climate Verdict</h4>
             <p className="text-2xl font-medium tracking-tight">
                <span className="font-bold text-blue-500">{city1.current.name}</span> is {Math.round(Math.abs(city1.current.main.temp - city2.current.main.temp))}° {city1.current.main.temp > city2.current.main.temp ? 'warmer' : 'cooler'} than <span className="font-bold text-blue-500">{city2.current.name}</span> right now.
             </p>
          </div>
       )}
    </motion.div>
  );
}
