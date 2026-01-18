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
        // Use piecewise scoring: gentle penalty near optimal, steeper farther away
        double tempDeviation = Math.Abs(weather.Temperature - OptimalTemp);
        double tempScore;
        if (tempDeviation <= 5)
            tempScore = 35 * (1 - tempDeviation / 15); // Gentle penalty
        else if (tempDeviation <= 15)
            tempScore = 35 * (1 - tempDeviation / 25); // Moderate penalty
        else
            tempScore = 35 * (1 - tempDeviation / 35); // Steep penalty
        
        tempScore = Math.Max(0, tempScore);

        // 2. HUMIDITY: 30 points, optimal 50%
        // More forgiving for low humidity than high humidity
        double humidity = weather.Humidity;
        double humidityScore;
        if (humidity <= 30)
            humidityScore = 30 * (0.7 + 0.3 * (humidity / 30)); // Dry is okay
        else if (humidity <= 70)
            humidityScore = 30 * (1 - Math.Abs(humidity - 50) / 50); // Moderate range
        else
            humidityScore = 30 * (1 - (humidity - 70) / 30); // High humidity penalty
        humidityScore = Math.Max(0, humidityScore);

        // 3. WIND: 20 points, optimal 3 m/s
        // Calm is better than strong wind, but some breeze is good
        double windSpeed = weather.WindSpeed;
        double windScore;
        if (windSpeed <= 8)
            windScore = 20 * (1 - Math.Abs(windSpeed - 3) / 10);
        else
            windScore = 20 * (1 - (windSpeed - 8) / 20); // Heavy penalty for strong wind
        windScore = Math.Max(0, windScore);

        // 4. CLOUDS: 15 points, optimal 30%
        // Clear sky (0%) is actually better than overcast (100%)
        double clouds = weather.CloudPercentage;
        double cloudScore = 15 * (1 - Math.Abs(clouds - 30) / 100);
        cloudScore = Math.Max(0, cloudScore);

        // 5. COMBINE (with small adjustments for extreme combinations)
        double totalScore = tempScore + humidityScore + windScore + cloudScore;
        
        // Penalty for extreme combos: hot+humid or cold+windy
        bool isHotHumid = weather.Temperature > 28 && humidity > 70;
        bool isColdWindy = weather.Temperature < 10 && windSpeed > 6;
        
        if (isHotHumid || isColdWindy)
            totalScore *= 0.85; // 15% penalty for extreme discomfort combos

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
