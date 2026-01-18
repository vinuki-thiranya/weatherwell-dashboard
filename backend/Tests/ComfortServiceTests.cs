using Xunit;
using WeatherWell.Services;
using WeatherWell.Models;

namespace WeatherWell.Tests;

public class ComfortServiceTests
{
    private readonly ComfortService _comfortService = new();

    [Fact]
    public void CalculateScore_PerfectWeather_ReturnsMaximumScore()
    {


        // Arrange
        var perfectWeather = new CityWeatherResult
        {
            CityName = "Test",
            WeatherDescription = "Clear",

            Temperature = 22.0, Humidity = 50, WindSpeed = 3.0, CloudPercentage = 30
        };

        // Act & Assert
        var score = _comfortService.CalculateScore(perfectWeather);
        Assert.True(score >= 95.0 && score <= 100.0, $"Perfect weather should score 95-100, got {score}");
    }

    [Fact]
    public void CalculateScore_ExtremeConditions_ReturnsLowScore()
    {
        // Arrange - Extreme Tropical Heat (Hot + Humid)
        var extremeWeather = new CityWeatherResult
        {
            CityName = "Extreme",
            WeatherDescription = "Extreme",
            Temperature = 35.0, Humidity = 90, WindSpeed = 1.0, CloudPercentage = 0
        };

        // Act & Assert
        var score = _comfortService.CalculateScore(extremeWeather);
        Assert.True(score < 55.0 && score >= 0.0, $"Extreme conditions should score low, got {score}");
    }

    [Fact]
    public void CalculateScore_HotHumidCombo_AppliesExtraPenalty()
    {
        // Arrange
        var hotHumid = new CityWeatherResult
        {
            CityName = "HotHumid",
            WeatherDescription = "Muggy",
            Temperature = 30.0, Humidity = 80, WindSpeed = 2.0, CloudPercentage = 50
        };
        var normalWeather = new CityWeatherResult
        {
            CityName = "Normal",
            WeatherDescription = "Fine",
            Temperature = 27.0, Humidity = 65, WindSpeed = 2.0, CloudPercentage = 50
        };

        // Act
        var hotHumidScore = _comfortService.CalculateScore(hotHumid);

        var normalScore = _comfortService.CalculateScore(normalWeather);

        // Assert
        Assert.True(hotHumidScore < normalScore, 
            $"Hot+humid combo should score lower. Got {hotHumidScore} vs {normalScore}");
    }



    [Fact]
    public void CalculateScore_DryVsHumidAir_PrefersDry()
    {
        // Arrange - Same conditions except humidity
        var dryAir = new CityWeatherResult
        {
            CityName = "Dry",
            WeatherDescription = "Dry",
            Temperature = 22.0, Humidity = 25, WindSpeed = 3.0, CloudPercentage = 30
        };
        var humidAir = new CityWeatherResult
        {
            CityName = "Humid",
            WeatherDescription = "Humid",
            Temperature = 22.0, Humidity = 75, WindSpeed = 3.0, CloudPercentage = 30
        };

        // Act & Assert
        var dryScore = _comfortService.CalculateScore(dryAir);
        var humidScore = _comfortService.CalculateScore(humidAir);
        Assert.True(dryScore > humidScore, $"Dry air should score better: {dryScore} vs {humidScore}");
    }

    [Theory]
    [InlineData(-10, 90, 15, 100)]  // Extreme cold, high humidity, strong wind, overcast
    [InlineData(50, 10, 0, 0)]      // Extreme heat, dry, no wind, clear
    public void CalculateScore_ExtremeInputs_ProducesValidRange(double temp, int humidity, double wind, int clouds)
    {
        // Arrange
        var weather = new CityWeatherResult
        {
            CityName = "Test",
            WeatherDescription = "Test",
            Temperature = temp, Humidity = humidity, WindSpeed = wind, CloudPercentage = clouds
        };

        // Act & Assert
        var score = _comfortService.CalculateScore(weather);
        Assert.True(score >= 0.0 && score <= 100.0, $"Score must be 0-100, got {score}");
    }

    [Fact]
    public void RankCities_MultipleCities_AssignsCorrectRanks()
    {
        // Arrange
        var cities = new List<CityWeatherResult>
        {
            new() { CityName = "Best", WeatherDescription = "Clear", ComfortScore = 95.5 },
            new() { CityName = "Good", WeatherDescription = "Clear", ComfortScore = 78.2 },  
            new() { CityName = "Poor", WeatherDescription = "Clear", ComfortScore = 45.1 }
        };

        // Act
        _comfortService.RankCities(cities);

        // Assert
        Assert.Equal(1, cities.First(c => c.CityName == "Best").Rank);
        Assert.Equal(2, cities.First(c => c.CityName == "Good").Rank);//
        Assert.Equal(3, cities.First(c => c.CityName == "Poor").Rank);
    }
}
