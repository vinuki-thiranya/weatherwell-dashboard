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
    private readonly List<int> _cityCodes;
    private const string AlgorithmVersion = "v2"; // Increment when comfort algorithm changes
    private const string CacheKeyBase = "WeatherResults_";
    private readonly string CacheKey = CacheKeyBase + AlgorithmVersion;
    private const string CacheStatusKey = "WeatherCacheStatus";
    
    public string LastCacheStatus 
    { 
        get => _cache.Get<string>(CacheStatusKey) ?? "NONE";
        private set => _cache.Set(CacheStatusKey, value);
    }

    public WeatherService(HttpClient httpClient, IConfiguration configuration, IComfortService comfortService, IMemoryCache cache)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _comfortService = comfortService;
        _cache = cache;
        _apiKey = Environment.GetEnvironmentVariable("OPENWEATHER_API_KEY") ?? "demo-key";
        _cityCodes = LoadCityCodes();
    }

    private List<int> LoadCityCodes()
    {
        try
        {
            var jsonPath = Path.Combine(AppContext.BaseDirectory, "cities.json");
            if (!File.Exists(jsonPath))
            {
                jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "cities.json");
            }
            
            if (!File.Exists(jsonPath)) return new List<int>();
            
            var jsonContent = File.ReadAllText(jsonPath);
            var citiesData = JsonSerializer.Deserialize<CitiesData>(jsonContent);
            return citiesData?.List?.Select(c => int.Parse(c.CityCode)).ToList() ?? new List<int>();
        }
        catch
        {
            return new List<int>();
        }
    }

    public string GetLastCacheStatus() => LastCacheStatus;

    public async Task<List<CityWeatherResult>> GetAllCitiesWeatherAsync()
    {
        // Check cache first
        if (_cache.TryGetValue(CacheKey, out List<CityWeatherResult>? cachedResults))
        {
            // Set status and return cached data
            _cache.Set(CacheStatusKey, "HIT", TimeSpan.FromMinutes(10));
            return cachedResults!;
        }

        // Cache miss - fetch new data
        _cache.Set(CacheStatusKey, "MISS", TimeSpan.FromMinutes(10));
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