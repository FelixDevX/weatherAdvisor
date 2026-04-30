export interface WeatherData {
  current: {
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
      pressure: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
    name: string;
    sys: {
      country: string;
    };
  };
  forecast: {
    list: Array<{
      dt: number;
      main: {
        temp: number;
        temp_min: number;
        temp_max: number;
      };
      weather: Array<{
        main: string;
        description: string;
        icon: string;
      }>;
    }>;
  };
}

export interface FavoriteCity {
  id: string;
  name: string;
  country: string;
}
