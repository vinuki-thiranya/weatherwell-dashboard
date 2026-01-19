using WeatherWell.Models;

namespace WeatherWell.Services;

public class ComfortService : IComfortService
{
    private const double OptimalTemp = 22.0;
    private const double OptimalHumidity = 50.0;
    private const double OptimalWind = 3.0;
    private const double OptimalClouds = 30.0;

    public double CalculateScore(CityWeatherResult weather)
    {
        // 1. TEMPERATURE: 35 points, optimal 22°C
        double tempDeviation = Math.Abs(weather.Temperature - OptimalTemp);
        double tempScore;
        if (tempDeviation <= 5)
            tempScore = 35 * (1 - tempDeviation / 25); // Stricter penalty
        else if (tempDeviation <= 15)
            tempScore = 35 * (1 - tempDeviation / 20); // Harsher for extreme temps
        else
            tempScore = Math.Max(0, 35 * (1 - tempDeviation / 30)); // Very harsh for extreme

        // 2. HUMIDITY: 25 points, optimal 50%
        double humidity = weather.Humidity;
        double humidityScore;
        if (humidity <= 30)
            humidityScore = 25 * (0.8 + 0.2 * (humidity / 30));
        else if (humidity <= 70)
            humidityScore = 25 * (1 - Math.Abs(humidity - 50) / 40);
        else
            humidityScore = Math.Max(0, 25 * (1 - (humidity - 70) / 25)); // Harsher high humidity penalty

        // 3. WIND: 20 points, context-dependent optimal
        double windSpeed = weather.WindSpeed;
        double windScore;
        // Cold weather: prefer less wind, hot weather: prefer more wind
        double tempAdjustedOptimal = weather.Temperature < 15 ? 1.0 : 4.0;
        windScore = Math.Max(0, 20 * (1 - Math.Abs(windSpeed - tempAdjustedOptimal) / 8));

        // 4. VISIBILITY: 10 points - CRITICAL for safety
        double visibilityScore = weather.Visibility == 0 ? 0 : Math.Min(10, weather.Visibility);

        // 5. CLOUDS: 10 points, but penalize snow heavily
        double cloudScore = weather.WeatherDescription.ToLower().Contains("snow") ? 0 : 
                           10 * (1 - Math.Abs(weather.CloudPercentage - 30) / 100);

        double totalScore = tempScore + humidityScore + windScore + visibilityScore + cloudScore;
        
        // Extreme weather penalties
        bool isFreezingHumid = weather.Temperature <= 2 && humidity > 90;
        bool isHotHumid = weather.Temperature > 28 && humidity > 75;
        bool isSnowing = weather.WeatherDescription.ToLower().Contains("snow");
        
        if (isFreezingHumid || isHotHumid) totalScore *= 0.7;
        if (isSnowing) totalScore *= 0.6;

        return Math.Round(Math.Max(0, Math.Min(100, totalScore)), 1);
    }

    public void RankCities(List<CityWeatherResult> cities)
    {
        // Sort and assign ranks based on comfort scores
        var ranked = cities.OrderByDescending(c => c.ComfortScore).ToList();
        for (int i = 0; i < ranked.Count; i++)
        {
            ranked[i].Rank = i + 1;
        }
    }
}
