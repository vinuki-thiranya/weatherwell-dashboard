using Microsoft.AspNetCore.Mvc;
using WeatherWell.Services;

namespace WeatherWell.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuth0Service _auth0Service;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuth0Service auth0Service, ILogger<AuthController> logger)
    {
        _auth0Service = auth0Service;
        _logger = logger;
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { error = "Email is required" });
        }

        try
        {
            var success = await _auth0Service.ResendVerificationEmailAsync(request.Email);
            
            if (success)
            {
                return Ok(new { message = "Verification email sent successfully" });
            }
            
            return BadRequest(new { error = "Failed to send verification email. User may not exist." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending verification email for {Email}", request.Email);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}

public class ResendVerificationRequest
{
    public string Email { get; set; } = string.Empty;
}