using Microsoft.AspNetCore.Mvc;
using WeatherWell.Services;

namespace WeatherWell.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeatherController : ControllerBase
{

    private readonly IWeatherService _weatherService;

    public WeatherController(IWeatherService weatherService)
    {

        _weatherService = weatherService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllWeather()
    {
        try
        {
            var results = await _weatherService.GetAllCitiesWeatherAsync();
            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to fetch weather data", details = ex.Message });
        }
    }


    [HttpGet("debug/cache-status")]
    public IActionResult GetCacheStatus()
    {
        return Ok(new { status = _weatherService.GetLastCacheStatus() });
    }







}