import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import type { CityWeatherResult } from './types';
import TemperatureChart from './components/TemperatureChart';
import { CloudSun, RefreshCw, LogOut, Filter, SortAsc, BarChart3, Sun, Moon, Cloud, Eye, Gauge, AlertCircle, ArrowRight } from 'lucide-react';

type SortOption = 'rank' | 'temperature' | 'comfort' | 'humidity' | 'name';
type FilterOption = 'all' | 'excellent' | 'good' | 'moderate' | 'poor';

function App() {
  const { 
    loginWithRedirect, 
    logout, 
    isAuthenticated, 
    user, 
    isLoading: authLoading, 
    getAccessTokenSilently,
    error: authError 
  } = useAuth0();
  const [weatherData, setWeatherData] = useState<CityWeatherResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string>('UNKNOWN');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rank');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showChart, setShowChart] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  // Initialize dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const resendVerificationEmailWithEmail = async (email: string) => {
    console.log('Starting resend verification for email:', email);
    setResendingEmail(true);
    
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      console.log('Making request to:', `${baseUrl}/auth/resend-verification`);
      
      const response = await axios.post(`${baseUrl}/auth/resend-verification`, {
        email: email
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Resend response:', response);
      
      if (response.status === 200) {
        alert("Verification email sent successfully! Please check your inbox.");
      } else {
        alert("Failed to send verification email. Please try again later.");
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to send verification email: ${error.response?.data?.error || error.message}`);
    } finally {
      setResendingEmail(false);
    }
  };

  // Filtering and sorting logic
  const getFilteredAndSortedData = () => {
    let filtered = weatherData;
    
    // Apply filter
    if (filterBy !== 'all') {
      filtered = weatherData.filter(city => {
        const score = city.comfortScore;
        switch (filterBy) {
          case 'excellent': return score >= 80;
          case 'good': return score >= 60 && score < 80;
          case 'moderate': return score >= 40 && score < 60;
          case 'poor': return score < 40;
          default: return true;
        }
      });
    }
    
    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rank': return a.rank - b.rank;
        case 'temperature': return b.temperature - a.temperature;
        case 'comfort': return b.comfortScore - a.comfortScore;
        case 'humidity': return a.humidity - b.humidity;
        case 'name': return a.cityName.localeCompare(b.cityName);
        default: return 0;
      }
    });
    
    return sorted;
  };

  const filteredAndSortedData = getFilteredAndSortedData();

  // Get selected city or default to top performing city for sidebar display
  const selectedCity = weatherData.find(c => c.cityId === selectedCityId) || (weatherData.length > 0 ? weatherData.reduce((prev, current) => 
    (prev.comfortScore > current.comfortScore) ? prev : current
  ) : null);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${baseUrl}/weather`);
      setWeatherData(response.data);
      
      const debugResponse = await axios.get(`${baseUrl}/weather/debug/cache-status`);
      setCacheStatus(debugResponse.data.status);
    } catch (err: any) {
      setError('Failed to fetch weather data. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
    
    // Clear URL error parameters if they exist
    if (authError) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('error')) {
        url.searchParams.delete('error');
        url.searchParams.delete('error_description');
        window.history.replaceState({}, document.title, url.pathname);
      }
    }
  }, [isAuthenticated, getAccessTokenSilently, authError]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-sky-300/30 rounded-full mb-4 animate-pulse"></div>
            <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-300 font-medium mt-4">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-x-hidden ${isDark ? 'dark' : ''}`}>
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300 min-h-screen flex relative overflow-x-hidden">
        {/* Mobile Menu Overlay */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Logout</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to log out? You'll need to sign in again to access your dashboard.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        {isAuthenticated && (
          <aside className={`fixed left-0 top-0 z-40 w-80 h-screen overflow-y-auto bg-gradient-to-b from-sky-800/95 to-sky-500/30 dark:from-slate-950/95 dark:to-slate-900/95 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 p-8 flex flex-col justify-between transform transition-transform duration-300 lg:relative lg:h-auto lg:overflow-visible lg:top-auto lg:left-auto lg:w-80 lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}>
            {/* Top Section */}
            <div>
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <CloudSun className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-white text-xl">WeatherWell</h1>
                    <p className="text-white/70 text-sm">Comfort Analytics</p>
                  </div>
                </div>
              </div>

              {/* Current Weather (Selected City) */}
              {selectedCity && (
                <div className="mb-12">
                  <h2 className="text-white/80 text-sm font-semibold mb-2">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                  </h2>
                  <p className="text-white/70 text-xs mb-6">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {selectedCity?.rank === 1 && (
                    <div className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                      Most Comfortable Place
                    </div>
                  )}
                  <div className="text-6xl font-bold text-white mb-2">{selectedCity.temperature}°C</div>
                  
                  <p className="text-white/90 text-sm flex items-center gap-2 mb-4">
                    <Cloud className="w-4 h-4" />
                    {selectedCity.weatherDescription}
                  </p>
                  <p className="text-white/80 text-lg font-semibold mb-6">{selectedCity.cityName}</p>
                  
                  <div className="bg-white/20 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-4 mb-6 border border-white/30 dark:border-white/20 shadow-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white/80 text-xs font-medium">Comfort Score</p>
                        <p className="text-white text-2xl font-bold">{selectedCity.comfortScore}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-xs font-medium">Rank</p>
                        <p className="text-white text-2xl font-bold">#{selectedCity.rank}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                {/* Quick Stats */}
              {selectedCity && (
                <div>
                  <h3 className="text-white/80 text-xs font-semibold uppercase mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="bg-white/20 dark:bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/30 dark:border-white/20 shadow-md hover:bg-white/25 dark:hover:bg-white/15 transition-colors">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-white/90" />
                        <div>
                          <p className="text-white/80 text-xs font-medium">Visibility</p>
                          <p className="text-white text-sm font-semibold">{selectedCity.visibility} km</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/20 dark:bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/30 dark:border-white/20 shadow-md hover:bg-white/25 dark:hover:bg-white/15 transition-colors">
                      <div className="flex items-center gap-3">
                        <Gauge className="w-5 h-5 text-white/90" />
                        <div>
                          <p className="text-white/80 text-xs font-medium">Pressure</p>
                          <p className="text-white text-sm font-semibold">{selectedCity.pressure} hPa</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Section */}
            <div>
              <div className="bg-white/5 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-4 mb-6 border border-white/30 dark:border-white/20 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold border backdrop-blur-sm ${
                      cacheStatus === 'HIT' ? 'bg-green-900/30 border-green-500/50 text-green-300' : 'bg-amber-900/30 border-amber-500/50 text-amber-300'
                    }`}>
                      Cache: {cacheStatus}
                    </div>
                  </div>
                  <button 
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2 bg-white/20 backdrop-blur-xl rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 border border-white/30 shadow-md"
                  >
                    <RefreshCw size={16} className={`text-white ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30">
                    <img src={user?.picture} alt={user?.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-blue/10 text-xs">Welcome back</p>
                    <p className="text-blue font-semibold text-sm">{user?.name}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  <LogOut size={16} className="text-white" />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 bg-slate-50 dark:bg-slate-900 overflow-auto transition-all duration-300 ${isAuthenticated ? 'lg:ml-5' : ''}`}>
          <div className="">
            {!isAuthenticated ? (
              // Modern Login Screen with Dark Blue Theme
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25px_25px,_rgba(56,189,248,0.1)_1px,_transparent_1px)] bg-[length:50px_50px] animate-[pulse_20s_ease-in-out_infinite]"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-900/10 via-blue-900/10 to-indigo-900/10"></div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
                
                <div className="relative z-10 w-full max-w-6xl px-4">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column - Brand & Features */}
                    <div className="space-y-10 pt-10 lg:pt-0">
                      <div className="space-y-6 ">
                        <div className="flex items-center gap-4">
                          
                          <div>
                            <h1 className="text-5xl font-bold text-white mb-2">WeatherWell</h1>
                            <p className="text-sky-600/80 text-xl font-medium">Comfort Index Analytics</p>
                          </div>
                        </div>
                        
                        <p className="text-slate-300/80 text-lg leading-relaxed max-w-lg">
                          Advanced weather analytics platform that evaluates city comfort levels based on real-time climate data, helping you find the most pleasant locations worldwide.
                        </p>
                      </div>

                      {/* Features Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-sky-500/30 transition-all duration-300 group">
                         
                          <h3 className="text-white font-semibold mb-2">Real-time Analytics</h3>
                          <p className="text-slate-400 text-sm">Live weather data from cities worldwide with comfort scoring</p>
                        </div>
                        
                        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-sky-500/30 transition-all duration-300 group">
                          
                          <h3 className="text-white font-semibold mb-2">Secure Access</h3>
                          <p className="text-slate-400 text-sm">Enterprise-grade authentication with data protection</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Login Card */}
                    <div className="relative">
                      <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-10 shadow-2xl">
                        <div className="text-center mb-10">
                          <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
                          <p className="text-slate-400">Sign in to access your weather dashboard</p>
                        </div>
                        
                        {authError && (
                          <div className="mb-8 p-6 bg-gradient-to-r from-red-900/20 to-red-800/20 backdrop-blur-sm border border-red-700/30 rounded-2xl">
                            <div className="flex flex-col items-center gap-4">
                              <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <p className="font-semibold text-red-300 text-center">
                                  {authError.message && (authError.message.includes("email_not_verified") || authError.message.includes("verification"))
                                    ? "Please verify your email address before logging in." 
                                    : "Authentication error occurred"}
                                </p>
                              </div>
                              
                              <div className="w-full">
                                <div className="flex flex-col gap-3">
                                  <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    className="px-4 py-3 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                    id="resendEmail"
                                  />
                                  <button 
                                    onClick={() => {
                                      console.log('Resend button clicked!');
                                      const emailInput = document.getElementById('resendEmail') as HTMLInputElement;
                                      const email = emailInput?.value || user?.email;
                                      if (email) {
                                        resendVerificationEmailWithEmail(email);
                                      } else {
                                        alert('Please enter your email address');
                                      }
                                    }}
                                    disabled={resendingEmail}
                                    className="text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-4 rounded-xl transition-all border border-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {resendingEmail ? 'Sending Verification Email...' : 'Resend Verification Email'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mb-10">
                          <p className="text-slate-300/80 text-center text-lg mb-8 leading-relaxed">
                            Access real-time weather insights, city comfort rankings, and advanced climate analytics.
                          </p>
                          
                          <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-300">- Real-time weather data from 100+ cities</span>
                            </div>
                      
                            <div className="flex items-center gap-3">
                              <span className="text-slate-300">- Comfort score calculations with AI insights</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-300">- Interactive charts and data visualization</span>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => {
                            console.log('Login button clicked (main)');
                            loginWithRedirect({
                              authorizationParams: {
                                prompt: 'login',
                              }
                            });
                          }}
                          className="group w-full bg-gradient-to-r from-sky-900 to-blue-600 hover:from-sky-900 hover:to-blue-700 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 flex items-center justify-center gap-3"
                        >
                          <span>Get Started Now</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        
                        <p className="text-slate-500 text-xs text-center mt-6">
                          By signing in, you agree to our Terms of Service and Privacy Policy
                        </p>
                      </div>
                      
                      {/* Decorative Accent */}
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-sky-500/20 to-blue-600/20 rounded-2xl blur-xl"></div>
                      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Info */}
                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <p className="text-slate-500/60 text-sm">
                    © {new Date().getFullYear()} WeatherWell Analytics. All rights reserved.
                  </p>
                </div>
              </div>
            ) : authLoading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white/10 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-white/20 dark:border-slate-700/50">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full mx-auto mb-4 animate-pulse"></div>
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-center">Loading dashboard...</p>
                </div>
              </div>
            ) : loading && weatherData.length === 0 ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-12 border border-white/20 dark:border-slate-700/50 text-center">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full mx-auto mb-4 animate-pulse"></div>
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">Retrieving weather insights...</p>
                </div>
              </div>
            ) : error ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-50/80 dark:bg-red-900/50 backdrop-blur-xl border border-red-200 dark:border-red-700 p-8 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
                  </div>
                  <button 
                    onClick={fetchData} 
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-6"> {/* Added pt-8 for top padding */}
                {/* Header with Dark Mode Toggle */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                      onClick={() => setMobileMenuOpen(true)}
                      className="lg:hidden p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-lg"
                    >
                      <CloudSun className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                    
                    <div>
                      <h1 className="text-3xl font-bold text-slate-600 dark:text-white">
                        Weather Dashboard
                      </h1>
                      <p className="text-slate-600 dark:text-slate-400">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-lg"
                  >
                    {isDark ? (
                      <Sun className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <Moon className="w-6 h-6 text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Controls with Glassmorphism */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 p-4 shadow-lg">
                  <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      {/* Sort Controls */}
                      <div className="flex items-center gap-2 flex-1">
                        <SortAsc size={16} className="text-slate-500 dark:text-slate-400" />
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sort by:</label>
                        <select 
                          value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-300/50 dark:border-slate-600/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-300 w-full max-w-[180px]"
                        >
                          <option value="rank">Rank</option>
                          <option value="comfort">Comfort Score</option>
                          <option value="temperature">Temperature</option>
                          <option value="humidity">Humidity</option>
                          <option value="name">City Name</option>
                        </select>
                      </div>
                      
                      {/* Filter Controls */}
                      <div className="flex items-center gap-2 flex-1">
                        <Filter size={16} className="text-slate-500 dark:text-slate-400" />
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filter:</label>
                        <select 
                          value={filterBy} 
                          onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                          className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-300/50 dark:border-slate-600/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-300 w-full max-w-[180px]"
                        >
                          <option value="all">All Cities</option>
                          <option value="excellent">Excellent (80+)</option>
                          <option value="good">Good (60-79)</option>
                          <option value="moderate">Moderate (40-59)</option>
                          <option value="poor">Poor (&lt;40)</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Chart Toggle */}
                    <button
                      onClick={() => setShowChart(!showChart)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all backdrop-blur-sm border text-sm whitespace-nowrap ${
                        showChart 
                          ? 'bg-blue-900/70 text-white border-blue-400/50 shadow-lg shadow-blue-500/25' 
                          : 'bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-600/50 border-slate-300/50 dark:border-slate-600/50'
                      }`}
                    >
                      <BarChart3 size={16} />
                      {showChart ? 'Hide Climate Analytics' : 'Climate Analytics'}
                    </button>
                  </div>
                  
                  <div className="mt-3 text-xs text-slate-900 dark:text-slate-400">
                    Showing {filteredAndSortedData.length} of {weatherData.length} cities
                  </div>
                </div>

                {/* Charts Section */}
                {showChart && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Temperature Trends Chart */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 p-4 shadow-lg lg:col-span-2">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <BarChart3 size={20} className="text-blue-500" />
                        Temperature Trends
                      </h3>
                      <TemperatureChart data={filteredAndSortedData} />
                    </div>

                    {/* Comfort Score Distribution Chart */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 p-4 shadow-lg">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <BarChart3 size={20} className="text-emerald-500" />
                        Comfort Distribution
                      </h3>
                      <div className="space-y-3">
                        {[
                          { range: 'Excellent (80+)', count: filteredAndSortedData.filter(c => c.comfortScore >= 80).length, color: 'bg-gradient-to-br from-green-100 to-green-300', textColor: 'text-green-700 dark:text-green-400' },
                          { range: 'Good (60-79)', count: filteredAndSortedData.filter(c => c.comfortScore >= 60 && c.comfortScore < 80).length, color: 'bg-gradient-to-br from-blue-100 to-blue-300', textColor: 'text-blue-700 dark:text-blue-400' },
                          { range: 'Moderate (40-59)', count: filteredAndSortedData.filter(c => c.comfortScore >= 40 && c.comfortScore < 60).length, color: 'bg-gradient-to-br from-orange-100 to-orange-300', textColor: 'text-yellow-700 dark:text-yellow-400' },
                          { range: 'Fair (0-39)', count: filteredAndSortedData.filter(c => c.comfortScore < 40).length, color: 'bg-gradient-to-br from-blue-100 to-blue-300', textColor: 'text-orange-700 dark:text-orange-400' }
                        ].map((item) => (
                          <div key={item.range}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className={`text-sm font-semibold ${item.textColor}`}>{item.range}</span>
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.count} cities</span>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${item.color} transition-all duration-500`}
                                style={{ width: `${(item.count / Math.max(filteredAndSortedData.length, 1)) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Climate Parameters Summary */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 p-4 shadow-lg">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <Gauge size={20} className="text-purple-400" />
                        Climate Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {filteredAndSortedData.length > 0 ? (
                          <>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/10 p-3 rounded-xl border border-blue-100/50 dark:border-blue-700/50">
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Avg Humidity</p>
                              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{(filteredAndSortedData.reduce((sum, c) => sum + c.humidity, 0) / filteredAndSortedData.length).toFixed(1)}%</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/10 p-3 rounded-xl border border-purple-100/50 dark:border-purple-700/50">
                              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">Avg Wind</p>
                              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{(filteredAndSortedData.reduce((sum, c) => sum + c.windSpeed, 0) / filteredAndSortedData.length).toFixed(1)} m/s</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/10 dark:to-emerald-800/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-700/50">
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Avg Visibility</p>
                              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{(filteredAndSortedData.reduce((sum, c) => sum + c.visibility, 0) / filteredAndSortedData.length).toFixed(1)} km</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/10 dark:to-amber-800/10 p-3 rounded-xl border border-amber-100/50 dark:border-amber-700/50">
                              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">Avg Pressure</p>
                              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{(filteredAndSortedData.reduce((sum, c) => sum + c.pressure, 0) / filteredAndSortedData.length).toFixed(0)} hPa</p>
                            </div>
                          </>
                        ) : (
                          <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cities List */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 p-4 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 dark:text-white">City Rankings</h3>
                    <CloudSun className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>

                  <div className="space-y-2">
                    {filteredAndSortedData.map((city) => (
                      <div
                        key={city.cityId}
                        onClick={() => setSelectedCityId(selectedCityId === city.cityId ? null : city.cityId)}
                        className={`group flex flex-col p-3 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                          selectedCityId === city.cityId 
                            ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-300 shadow-lg' 
                            : 'border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/20 hover:bg-slate-100/80 dark:hover:bg-slate-700/40 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs shadow-inner flex-shrink-0 ${
                              city.rank === 1 ? 'bg-gradient-to-br from-yellow-200 to-yellow-400 text-yellow-900 shadow-yellow-200/50' :
                              city.rank === 2 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-900 shadow-gray-200/50' :
                              city.rank === 3 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 shadow-amber-200/50' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              <span>#{city.rank}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {city.cityName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {city.weatherDescription}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center gap-1">
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {Math.round(city.temperature)}°C
                                </p>
                                <ArrowRight size={12} className={`text-slate-400 transition-transform duration-300 lg:hidden ${selectedCityId === city.cityId ? 'rotate-90' : ''}`} />
                              </div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                                Temp
                              </p>
                            </div>

                            <div className={`px-3 py-1.5 rounded-lg font-bold text-sm shadow-sm flex items-center gap-1.5 flex-shrink-0 ${
                              city.comfortScore >= 80 ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                              city.comfortScore >= 60 ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                              city.comfortScore >= 40 ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20' :
                              'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            }`}>
                              <span className="text-xs font-semibold opacity-90 mr-2">Score</span>
                              <span>{city.comfortScore}</span>
                            </div>
                          </div>
                        </div>

                        {/* Details (Expanded on Click or Hover) */}
                        <div className={`grid transition-all duration-500 ease-in-out ${
                          selectedCityId === city.cityId ? 'grid-rows-[1fr] mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50' : 'grid-rows-[0fr] group-hover:grid-rows-[1fr] lg:group-hover:mt-3 lg:group-hover:pt-3 lg:group-hover:border-t lg:group-hover:border-slate-200/50 lg:group-hover:dark:border-slate-700/50'
                        }`}>
                          <div className="overflow-hidden">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {/* Detail metrics */}
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Humidity</p>
                                <div className="flex items-center gap-1.5">
                                  <Gauge size={14} className="text-blue-500" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{city.humidity}%</span>
                                </div>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Wind</p>
                                <div className="flex items-center gap-1.5">
                                  <Cloud size={14} className="text-purple-500" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{city.windSpeed} m/s</span>
                                </div>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Visibility</p>
                                <div className="flex items-center gap-1.5">
                                  <Eye size={14} className="text-green-500" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{city.visibility} km</span>
                                </div>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Pressure</p>
                                <div className="flex items-center gap-1.5">
                                  <Gauge size={14} className="text-orange-500" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{city.pressure} hPa</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {filteredAndSortedData.length === 0 && weatherData.length > 0 && (
                  <div className="text-center py-8">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 p-6 inline-block">
                      <p className="text-slate-500 dark:text-slate-400 font-medium mb-3">No cities match your current filter.</p>
                      <button 
                        onClick={() => setFilterBy('all')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-1.5 rounded-lg font-semibold transition-colors text-sm"
                      >
                        Clear filter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );    
}

export default App;