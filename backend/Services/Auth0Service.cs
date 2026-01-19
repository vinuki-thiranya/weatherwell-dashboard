using Auth0.ManagementApi;
using Auth0.ManagementApi.Models;
using System.Text.Json.Serialization;

namespace WeatherWell.Services;

public interface IAuth0Service
{
    Task<bool> ResendVerificationEmailAsync(string email);
}

public class Auth0Service : IAuth0Service
{
    private readonly string _domain;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly HttpClient _httpClient;
    private readonly ILogger<Auth0Service> _logger;

    public Auth0Service(HttpClient httpClient, ILogger<Auth0Service> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        
        _domain = Environment.GetEnvironmentVariable("AUTH0_DOMAIN") 
            ?? throw new InvalidOperationException("AUTH0_DOMAIN environment variable is not set");
        _clientId = Environment.GetEnvironmentVariable("AUTH0_CLIENT_ID") 
            ?? throw new InvalidOperationException("AUTH0_CLIENT_ID environment variable is not set");
        _clientSecret = Environment.GetEnvironmentVariable("AUTH0_CLIENT_SECRET") 
            ?? throw new InvalidOperationException("AUTH0_CLIENT_SECRET environment variable is not set");
    }

    public async Task<bool> ResendVerificationEmailAsync(string email)
    {
        try
        {
            _logger.LogInformation("Starting resend verification email process for {Email}", email);
            
            // Get access token for Management API
            var accessToken = await GetManagementApiTokenAsync();
            _logger.LogInformation("Successfully obtained Management API token");
            
            // Create Management API client
            var managementApiClient = new ManagementApiClient(accessToken, _domain);
            
            // Find the user by email
            _logger.LogInformation("Searching for user with email {Email}", email);
            var users = await managementApiClient.Users.GetAllAsync(new GetUsersRequest
            {
                SearchEngine = "v3",
                Query = $"email:\"{email}\""
            });

            var user = users.FirstOrDefault();
            if (user == null)
            {
                _logger.LogWarning("User with email {Email} not found", email);
                return false;
            }

            _logger.LogInformation("Found user {UserId}, sending verification email", user.UserId);
            
            // Send verification email
            await managementApiClient.Jobs.SendVerificationEmailAsync(new VerifyEmailJobRequest
            {
                UserId = user.UserId
            });

            _logger.LogInformation("Verification email sent successfully to {Email}", email);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}. Error: {ErrorMessage}", email, ex.Message);
            return false;
        }
    }

    private async Task<string> GetManagementApiTokenAsync()
    {
        try
        {
            _logger.LogInformation("Requesting Management API token from Auth0");
            
            var tokenRequest = new
            {
                client_id = _clientId,
                client_secret = _clientSecret,
                audience = $"https://{_domain}/api/v2/",
                grant_type = "client_credentials"
            };

            var tokenUrl = $"https://{_domain}/oauth/token";
            _logger.LogInformation("Making token request to {TokenUrl}", tokenUrl);
            
            var response = await _httpClient.PostAsJsonAsync(tokenUrl, tokenRequest);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Token request failed with status {StatusCode}: {ErrorContent}", response.StatusCode, errorContent);
                throw new Exception($"Failed to get access token: {response.StatusCode} - {errorContent}");
            }
            
            var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>();
            
            if (string.IsNullOrEmpty(tokenResponse?.AccessToken))
            {
                _logger.LogError("Token response is null or access token is empty");
                throw new Exception("Failed to get access token from response");
            }
            
            _logger.LogInformation("Successfully obtained Management API access token");
            return tokenResponse.AccessToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Management API token: {ErrorMessage}", ex.Message);
            throw;
        }
    }

    private class TokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }
        
        [JsonPropertyName("token_type")]
        public string? TokenType { get; set; }
    }
}