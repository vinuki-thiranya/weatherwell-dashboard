import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CityWeatherResult } from '../types';

interface TemperatureChartProps {
  data: CityWeatherResult[];
}

const TemperatureChart = ({ data }: TemperatureChartProps) => {
  const chartData = data.map(city => ({
    name: city.cityName,
    temperature: city.temperature,
    comfortScore: city.comfortScore,
    humidity: city.humidity,
    windSpeed: city.windSpeed
  })).sort((a, b) => b.temperature - a.temperature);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
            stroke="#64748b"
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: any, name: string) => {
              if (name === 'temperature') return [`${value}°C`, 'Temperature'];
              if (name === 'comfortScore') return [`${value}`, 'Comfort Score'];
              if (name === 'humidity') return [`${value}%`, 'Humidity'];
              if (name === 'windSpeed') return [`${value} m/s`, 'Wind Speed'];
              return [value, name];
            }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px'
            }}
          />
          <Bar 
            dataKey="temperature" 
            fill="#a65858"
            name="Temperature"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="comfortScore" 
            fill="#4d6b9a"
            name="Comfort Score"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TemperatureChart;