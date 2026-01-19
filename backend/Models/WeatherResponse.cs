using System.Text.Json.Serialization;

namespace WeatherWell.Models;

// Main response from OpenWeatherMap API
public class WeatherResponse
{
    [JsonPropertyName("coord")]
    public Coordinates Coordinates { get; set; }

    [JsonPropertyName("weather")]
    public List<Weather> Weather { get; set; }

    [JsonPropertyName("main")]
    public MainWeatherData Main { get; set; }

    [JsonPropertyName("wind")]
    public Wind Wind { get; set; }

    [JsonPropertyName("clouds")]
    public Clouds Clouds { get; set; }

    [JsonPropertyName("visibility")]
    public int Visibility { get; set; }

    [JsonPropertyName("id")]
    public int CityId { get; set; }

    [JsonPropertyName("name")]
    public string CityName { get; set; }
}

// Latitude and Longitude
public class Coordinates
{
    [JsonPropertyName("lat")]
    public double Latitude { get; set; }

    [JsonPropertyName("lon")]
    public double Longitude { get; set; }
}

// Weather condition details
public class Weather
{
    [JsonPropertyName("main")]
    public string Main { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; }
}

// Temperature, Humidity, Pressure
public class MainWeatherData
{
    [JsonPropertyName("temp")]
    public double Temperature { get; set; }

    [JsonPropertyName("feels_like")]
    public double FeelsLike { get; set; }

    [JsonPropertyName("humidity")]
    public int Humidity { get; set; }

    [JsonPropertyName("pressure")]
    public int Pressure { get; set; }
}

// Wind speed and direction
public class Wind
{
    [JsonPropertyName("speed")]
    public double Speed { get; set; }

    [JsonPropertyName("deg")]
    public int Degree { get; set; }
}

// Cloud coverage
public class Clouds
{
    [JsonPropertyName("all")]
    public int CloudPercentage { get; set; }
}