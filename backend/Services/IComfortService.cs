using WeatherWell.Models;

namespace WeatherWell.Services;

public interface IComfortService

{
    double CalculateScore(CityWeatherResult weather);
    void RankCities(List<CityWeatherResult> cities);
}