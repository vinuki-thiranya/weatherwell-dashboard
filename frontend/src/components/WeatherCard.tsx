import React from 'react';
import { Cloud, Droplets, Wind, Thermometer, Eye, Gauge } from 'lucide-react';
import { CityWeatherResult } from './types';

interface Props {
  city: CityWeatherResult;
}

const WeatherCard: React.FC<Props> = ({ city }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 transition-all hover:shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{city.cityName}</h2>
          <p className="text-slate-500 capitalize">{city.weatherDescription}</p>
        </div>
        <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
          Rank #{city.rank}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
            <Thermometer size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Temp</p>
            <p className="font-semibold">{city.temperature}°C</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
            <Droplets size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Humidity</p>
            <p className="font-semibold">{city.humidity}%</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg text-green-500">
            <Wind size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Wind</p>
            <p className="font-semibold">{city.windSpeed} m/s</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
            <Cloud size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Clouds</p>
            <p className="font-semibold">{city.cloudPercentage}%</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">Comfort Score</span>
          <span className={`text-lg font-bold ${
            city.comfortScore > 80 ? 'text-green-500' : 
            city.comfortScore > 60 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {city.comfortScore}/100
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              city.comfortScore > 80 ? 'bg-green-500' : 
              city.comfortScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${city.comfortScore}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;