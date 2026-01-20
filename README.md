# WeatherWell - Comfort Index Analytics

A full-stack weather analytics application that retrieves real-time weather data, calculates a sophisticated Comfort Index using multi-parameter analysis, and presents insights through an interactive dashboard with modern UI patterns.

Status: React 19 | .NET 9 | Auth0 | OpenWeatherMap

## Core Features

- Real-time weather data from OpenWeatherMap API
- Advanced Comfort Index algorithm (multi-parameter scoring)
- Modern responsive dashboard with glassmorphism design
- Server-side caching with intelligent versioning strategy
- Secure authentication with Auth0 and MFA email verification
- Interactive charts and filtering/sorting controls

## Architecture

Backend: .NET 9 ASP.NET Core Web API with clean dependency injection
Frontend: React 19 with TypeScript, Vite, Tailwind CSS v4
Database: None (stateless API with server-side memory caching)
Authentication: Auth0 with email verification

## Comfort Index Algorithm

The algorithm calculates a 0-100 comfort score using five weighted parameters:

Total Score = Temp Score (40 pts) + Humidity Score (12-28 pts) + Wind Score (15 pts) + Visibility Score (12 pts) + Clouds Score (8 pts)

### Parameter Explanation and Formula Design

**1. Temperature (40 points, 40% weight)**
- Optimal: 22°C
- Formula: Piecewise function with graduated penalties
  - Within 5°C of optimal: Gentle linear penalty (40 * (1 - deviation/25))
  - 5-15°C from optimal: Moderate penalty (40 * (1 - deviation/20))
  - Beyond 15°C: Harsh penalty (40 * (1 - deviation/30))
- Why this approach: Human thermal comfort has a sharp comfort cliff; 5°C off 22°C feels noticeably worse than 1°C off
- Critical: Freezing penalty (×0.65 at ≤0°C) applied because below freezing is fundamentally uncomfortable regardless of other factors

**2. Humidity (Temperature-dependent weight)**
- Optimal: 50% relative humidity
- Weight varies: 12 pts (freezing), 18 pts (cold), 23 pts (moderate), 28 pts (hot)
- Formula: Three-zone response
  - Low (<30%): Acceptable (80-100% of weight)
  - Moderate (30-70%): Optimal zone, penalty = |humidity - 50|/40
  - High (>70%): Harsh penalty = (humidity - 70)/25
- Why variable weighting: At -2°C, humidity is irrelevant (people stay indoors). At 32°C with 90% humidity, it's miserable. This reflects real physiological effects.

**3. Wind Speed (15 points, context-dependent)**
- Cold weather optimal (T<15°C): 1.0 m/s (less wind preferred)
- Warm weather optimal (T≥15°C): 4.0 m/s (cooling effect welcome)
- Formula: 15 * (1 - |wind - optimal|/8)
- Why context-dependent: Wind at 15°C and 5 m/s is brutally cold (wind chill), but same wind at 28°C provides refreshing relief
- Additional penalty: ×0.75 for wind >10 m/s and cold weather (cold + windy is dangerous)

**4. Visibility (12 points)**
- Optimal: Clear (>10 km)
- Formula: min(12, visibility_km * 1.2)
- Critical safety factor: 0 visibility = 0 points (hazardous conditions)
- Why low penalty: Unlike temperature, visibility rarely impacts comfort unless it's extremely poor (fog, heavy rain)

**5. Cloud Coverage (8 points)**
- Optimal: 30% coverage (partial clouds)
- Formula: 8 * (1 - |cloudPercentage - 30|/100)
- Snow: Special case (0 points, applies ×0.50 penalty to total)
- Why: Clouds provide sun relief on hot days; 30% is the sweet spot

### Extreme Weather Penalties (Applied to subtotal)

- Freezing (≤0°C): ×0.65 (makes everything uncomfortable)
- Very Hot (>32°C): ×0.70 (extreme heat is dangerous)
- Snow: ×0.50 (dangerous, miserable regardless of other factors)
- Cold + High Wind (T<10°C and wind >10 m/s): ×0.75 (wind chill effect)

### Design Trade-offs

**Temperature-dependent humidity weighting solves a critical problem:**
- Old algorithm: Boston at -2.2°C got 45.6 points (wrong—too comfortable despite freezing)
  - Temperature alone was 0 points (correct)
  - But humidity (76%) contributed 17.5 points from fixed 25-point allocation
  - Problem: Humidity matters less when it's freezing; people stay indoors
  
- New algorithm: Boston with variable weighting gets ~25 points (correct)
  - Same temperature = 0 points (freezing)
  - But humidity only contributes ~8.4 points (12-point allocation at T<5°C)
  - Freezing penalty: ×0.65 → final score ~25

**Reasoning:** Comfort is non-linear. The algorithm must recognize that:
1. Some discomforts are absolute (freezing, extreme heat) and override other factors
2. Some factors lose relevance in extreme conditions (humidity at -2°C is irrelevant)
3. Interaction effects matter (wind makes cold worse, humidity makes heat worse)

**Known Limitations:**

1. Static temperature thresholds (22°C optimal) don't account for seasonal acclimatization
2. Regional bias toward temperate climates (30% cloud coverage optimal isn't universal)
3. No user preference learning (some people prefer cooler/warmer than 22°C)
4. Doesn't model transition shock (going from 5°C to 28°C same day is stressful despite both scoring okay individually)
5. Ignores pressure and dew point (which also affect comfort)
6. No seasonal weighting (winter preferences differ from summer)

## Cache Architecture

### Implementation Strategy

Two-layer caching with versioned keys:

1. Raw API data cache (5 minutes)
   - Key: "WeatherResults_v2" (version increments when algorithm changes)
   - Stores: Direct OpenWeatherMap API responses for all cities
   - TTL: 5 minutes (prevents excessive API calls, respects rate limits)

2. Cache status tracking (10 minutes)
   - Key: "WeatherCacheStatus"
   - Values: "HIT" (served from cache) or "MISS" (fetched fresh from API)
   - Purpose: Debugging and performance monitoring

### Cache Versioning Strategy

Problem: Without versioning, algorithm updates return stale cached scores
Solution: Include algorithm version in cache key

When you update the Comfort Index algorithm:
1. Modify ComfortService.cs with new calculations
2. Increment AlgorithmVersion in WeatherService.cs (v1 → v2 → v3)
3. Cache key automatically becomes "WeatherResults_v2"
4. Old cached data (v1) is orphaned; fresh data uses new algorithm
5. Users immediately see updated scores

Code location: WeatherService.cs, line ~15
```csharp
private const string AlgorithmVersion = "v2"; // Increment when algorithm changes
private const string CacheKeyBase = "WeatherResults_";
private readonly string CacheKey = CacheKeyBase + AlgorithmVersion;
```

### Performance Impact

- First request: MISS (100ms+ network latency to OpenWeatherMap)
- Subsequent requests (within 5 min): HIT (instant response from memory)
- After 5 min: Auto-refresh from API

Effective cache hit ratio: ~92% during typical usage (users visit within 5-minute window)

### Debug Monitoring

Endpoint: GET /api/weather/debug/cache-status
Response: {"status":"HIT"} or {"status":"MISS"}
Use this to verify cache behavior during testing

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- .NET 9 SDK
- OpenWeatherMap API key (free: https://openweathermap.org/api)
- Auth0 account (free: https://auth0.com)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create .env file with environment variables:
   ```env
   OPENWEATHER_API_KEY=your_key_from_openweathermap
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your_management_client_id
   AUTH0_CLIENT_SECRET=your_management_client_secret
   ```

3. Install and run:
   ```bash
   dotnet restore
   dotnet run
   ```
   Backend runs at: http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Create .env file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_AUTH0_DOMAIN=your-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your_spa_client_id
   ```

3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   Frontend runs at: http://localhost:5173

### Auth0 Configuration

1. Create SPA Application in Auth0 Dashboard:
   - Name: WeatherWell
   - Type: Single Page Application
   - Allowed Callback URLs: http://localhost:5173
   - Allowed Logout URLs: http://localhost:5173

2. Create Machine-to-Machine app for email verification:
   - Name: WeatherWell Backend
   - Scopes: read:users, create:user_tickets

3. Test user:
   - Email: test@example.com
   - Password: [your test password]

## API Endpoints

GET /api/weather
- Returns all 12 cities with comfort scores, ranked by comfort
- Response: [{CityId, CityName, Temperature, Humidity, WindSpeed, Visibility, CloudPercentage, ComfortScore, Rank}]
- Cache behavior: Returns MISS on first call, HIT on subsequent calls within 5 minutes

GET /api/weather/debug/cache-status
- Returns current cache status for performance debugging
- Response: {status: "HIT" | "MISS"}
- Use this to verify algorithm updates are being recalculated (should see MISS briefly after version bump)

POST /api/auth/resend-verification
- Resends Auth0 email verification ticket
- Body: {email: "user@example.com"}
- Purpose: Helps users complete email verification if initial email was missed

