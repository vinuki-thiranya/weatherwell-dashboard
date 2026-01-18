using WeatherWell.Models;

namespace WeatherWell.Services;

public interface IWeatherService
{
    Task<List<CityWeatherResult>> GetAllCitiesWeatherAsync();
    string GetLastCacheStatus();
}