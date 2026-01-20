import React from "react";
import { Cloud, Droplets, Wind, Thermometer, Eye, Gauge } from "lucide-react";
import type { CityWeatherResult } from "../types";

interface Props {
  city: CityWeatherResult;
}

const WeatherCard: React.FC<Props> = ({ city }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-100";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition-all hover:shadow-md hover:border-blue-100 group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-slate-800">{city.cityName}</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              Rank #{city.rank}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 capitalize">{city.weatherDescription}</p>
        </div>
        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border ${getScoreColor(city.comfortScore)} transition-transform group-hover:scale-110`}>
          <span className="text-[10px] font-semibold opacity-90">Score</span>
          <span className="text-lg font-black leading-none">{Math.round(city.comfortScore)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
            <Thermometer size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temp</p>
            <p className="text-sm font-bold text-slate-700">{city.temperature}C</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
            <Droplets size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Humidity</p>
            <p className="text-sm font-bold text-slate-700">{city.humidity}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-50 text-slate-500 rounded-xl">
            <Wind size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wind</p>
            <p className="text-sm font-bold text-slate-700">{city.windSpeed} m/s</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
            <Cloud size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clouds</p>
            <p className="text-sm font-bold text-slate-700">{city.cloudPercentage}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-50 text-cyan-500 rounded-xl">
            <Eye size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visibility</p>
            <p className="text-sm font-bold text-slate-700">{(city.visibility / 1000).toFixed(1)} km</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
            <Gauge size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pressure</p>
            <p className="text-sm font-bold text-slate-700">{city.pressure} hPa</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
