namespace WeatherWell.Models;

// Weather data result for a city
public class CityWeatherResult
{
    public int CityId { get; set; }
    public string CityName { get; set; }
    public double Temperature { get; set; }
    public int Humidity { get; set; }
    public double WindSpeed { get; set; }
    public int CloudPercentage { get; set; }
    public int Visibility { get; set; }
    public int Pressure { get; set; }
    public string WeatherDescription { get; set; }
    public double ComfortScore { get; set; }
    public int Rank { get; set; }
}

// City from cities.json
public class City
{
    public string CityCode { get; set; }
    public string CityName { get; set; }
}

public class CitiesData
{
    public List<City> List { get; set; } = new();
}