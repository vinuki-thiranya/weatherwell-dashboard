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
        // 1. TEMPERATURE: 40 points (increased from 35), optimal 22°C
        // Temperature is the DOMINANT comfort factor
        double tempDeviation = Math.Abs(weather.Temperature - OptimalTemp);
        double tempScore;
        if (tempDeviation <= 5)
            tempScore = 40 * (1 - tempDeviation / 25);
        else if (tempDeviation <= 15)
            tempScore = 40 * (1 - tempDeviation / 20);
        else
            tempScore = Math.Max(0, 40 * (1 - tempDeviation / 30));

        // 2. HUMIDITY: Temperature-dependent weighting
        // At freezing temps, humidity matters less (people stay inside)
        // At hot temps, humidity matters more (heat+humidity = miserable)
        double humidity = weather.Humidity;
        double humidityWeight;
        if (weather.Temperature < 5)
            humidityWeight = 12; // Very cold: humidity less relevant
        else if (weather.Temperature < 15)
            humidityWeight = 18; // Cold: humidity less relevant
        else if (weather.Temperature > 28)
            humidityWeight = 28; // Hot: humidity very relevant
        else
            humidityWeight = 23; // Moderate: standard importance

        double humidityScore;
        if (humidity <= 30)
            humidityScore = humidityWeight * (0.8 + 0.2 * (humidity / 30));
        else if (humidity <= 70)
            humidityScore = humidityWeight * (1 - Math.Abs(humidity - 50) / 40);
        else
            humidityScore = Math.Max(0, humidityWeight * (1 - (humidity - 70) / 25));

        // 3. WIND: 15 points (reduced from 20)
        double windSpeed = weather.WindSpeed;
        double windScore;
        double tempAdjustedOptimal = weather.Temperature < 15 ? 1.0 : 4.0;
        windScore = Math.Max(0, 15 * (1 - Math.Abs(windSpeed - tempAdjustedOptimal) / 8));

        // 4. VISIBILITY: 12 points (increased from 10)
        double visibilityScore = weather.Visibility == 0 ? 0 : Math.Min(12, weather.Visibility * 1.2);

        // 5. CLOUDS: 8 points (reduced from 10), less important than temperature
        double cloudScore = weather.WeatherDescription.ToLower().Contains("snow") ? 0 : 
                           8 * (1 - Math.Abs(weather.CloudPercentage - 30) / 100);

        double totalScore = tempScore + humidityScore + windScore + visibilityScore + cloudScore;
        
        // STRONG penalties for extreme conditions
        bool isFreezing = weather.Temperature <= 0;
        bool isVeryHot = weather.Temperature > 32;
        bool isSnowing = weather.WeatherDescription.ToLower().Contains("snow");
        bool isHighWind = windSpeed > 10;
        
        if (isFreezing) totalScore *= 0.65; // Freezing is VERY uncomfortable
        if (isVeryHot) totalScore *= 0.70; // Extreme heat is very uncomfortable
        if (isSnowing) totalScore *= 0.50; // Snow is dangerous and miserable
        if (isHighWind && weather.Temperature < 10) totalScore *= 0.75; // Cold + windy is brutal

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
