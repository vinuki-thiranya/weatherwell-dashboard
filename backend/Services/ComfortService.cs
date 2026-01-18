using WeatherWell.Models;

namespace WeatherWell.Services;

public class ComfortService : IComfortService
{
    private const double OptimalTemp = 22.0;
    private const double OptimalHumidity = 50.0;
    private const double OptimalWind = 3.0;

    public double CalculateScore(CityWeatherResult weather)
    {
        // Temperature Score (40%)- 22°C is treated as the ideal temperature. For every 1°C above or below this value, 4 points are deducted from the comfort score.
        double tempPenalty = Math.Abs(weather.Temperature - OptimalTemp) * 4;
        double tempScore = Math.Max(0, 40 - tempPenalty);

        // 2. Humidity Score (30%)-  Deduct 1 point for every 2% away from 50%
        double humidityPenalty = Math.Abs(weather.Humidity - OptimalHumidity) * 0.5;
        double humidityScore = Math.Max(0, 30 - humidityPenalty);

        // 3. Wind speed Score (30%)- Deduct 10 points for every 1m/s away from 3m/s
        double windPenalty = Math.Abs(weather.WindSpeed - OptimalWind) * 10;
        double windScore = Math.Max(0, 30 - windPenalty);

        // Total Score(0-100)
        return Math.Round(tempScore + humidityScore + windScore, 1);
    }

    public void RankCities(List<CityWeatherResult> cities)
    {
        var ranked = cities.OrderByDescending(c => c.ComfortScore).ToList();
        for (int i = 0; i < ranked.Count; i++)
        {
            var city = cities.First(c => c.CityId == ranked[i].CityId);
            city.Rank = i + 1;
        }
        
    }
}