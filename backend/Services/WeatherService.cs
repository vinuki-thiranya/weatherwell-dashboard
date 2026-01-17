using System.Text.Json;
using WeatherWell.Models;

namespace WeatherWell.Services;

public class WeatherService : IWeatherService
{

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly string _apiKey;
    
    // Sample city codes - replace later
    private readonly List<int> _cityCodes = new List<int>
    {
        2172797, // Cairns, Australia
        1835848, // Seoul, South Korea  
        2988507, // Paris, France
        2643743, // London, UK
        5128581, // New York, US
        1850147, // Tokyo, Japan
        1273294, // Delhi, India
        3451190, // Rio de Janeiro, Brazil
        2147714, // Sydney, Australia
        993800   // Johannesburg, South Africa
    };

    public WeatherService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _apiKey = _configuration["OpenWeatherMap:ApiKey"] ?? "demo-key";
    }

    public async Task<List<CityWeatherResult>> GetAllCitiesWeatherAsync()
    {
        var results = new List<CityWeatherResult>();

        foreach (var cityCode in _cityCodes)
        {
            try
            {
                var weatherData = await FetchWeatherDataAsync(cityCode);
                if (weatherData != null)
                {
                    var result = MapToResult(weatherData);
                    results.Add(result);
                }
            }
            catch (Exception ex)
            {
                // Log error but continue with other cities
                Console.WriteLine($"Error fetching weather for city {cityCode}: {ex.Message}");
            }
        }


        return results;
    }

    private async Task<WeatherResponse?> FetchWeatherDataAsync(int cityId)
    {
        var url = $"https://api.openweathermap.org/data/2.5/weather?id={cityId}&appid={_apiKey}&units=metric";
        
        var response = await _httpClient.GetAsync(url);
        
        if (response.IsSuccessStatusCode)
        {
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<WeatherResponse>(json);
        }

        return null;
    }

    private CityWeatherResult MapToResult(WeatherResponse weather)
    {
        return new CityWeatherResult
        {
            CityId = weather.CityId,
            CityName = weather.CityName,
            Temperature = Math.Round(weather.Main.Temperature, 1),
            Humidity = weather.Main.Humidity,
            WindSpeed = Math.Round(weather.Wind.Speed, 1),

            CloudPercentage = weather.Clouds.CloudPercentage,
            Visibility = weather.Visibility / 1000, // Convert to km
            Pressure = weather.Main.Pressure,
            WeatherDescription = weather.Weather.FirstOrDefault()?.Description ?? "Unknown",
            ComfortScore = 0, // Will calculate this next
            Rank = 0          // Will calculate this after sorting
        };
    }
}