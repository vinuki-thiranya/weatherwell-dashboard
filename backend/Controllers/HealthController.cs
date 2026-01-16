using Microsoft.AspNetCore.Mvc;

namespace WeatherWell.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(new { status = "API is running!", timestamp = DateTime.UtcNow });
    }
}