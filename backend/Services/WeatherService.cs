using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using WeatherWell.Models;

namespace WeatherWell.Services;

public class WeatherService : IWeatherService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IComfortService _comfortService;
    private readonly IMemoryCache _cache;
    private readonly string _apiKey;
    private const string CacheKey = "WeatherResults";
    
    public string LastCacheStatus { get; private set; } = "NONE";

    public WeatherService(HttpClient httpClient, IConfiguration configuration, IComfortService comfortService, IMemoryCache cache)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _comfortService = comfortService;
        _cache = cache;
        _apiKey = _configuration["OpenWeatherMap:ApiKey"] ?? "demo-key";
    }

    public string GetLastCacheStatus() => LastCacheStatus;

    public async Task<List<CityWeatherResult>> GetAllCitiesWeatherAsync()
    {
        if (_cache.TryGetValue(CacheKey, out List<CityWeatherResult>? cachedResults))
        {
            LastCacheStatus = "HIT";
            return cachedResults!;
        }

        LastCacheStatus = "MISS";
        var results = new List<CityWeatherResult>();
        // fetching logic remains same 
        // (the actual fetch logic inside the method below)
        
        foreach (var cityCode in _cityCodes)
        {
            try
            {
                var weatherData = await FetchWeatherDataAsync(cityCode);
                if (weatherData != null)
                {
                    var result = MapToResult(weatherData);
                    result.ComfortScore = _comfortService.CalculateScore(result);
                    results.Add(result);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching weather for city {cityCode}: {ex.Message}");
            }
        }
        
        _comfortService.RankCities(results);

        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));

        _cache.Set(CacheKey, results, cacheOptions);

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