export type CityWeatherResult = {
  cityId: number;
  cityName: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  cloudPercentage: number;
  visibility: number;
  pressure: number;
  weatherDescription: string;
  comfortScore: number;
  rank: number;
};