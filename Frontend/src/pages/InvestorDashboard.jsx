import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Briefcase, LogOut, MapPin, Target, Building2, 
  DollarSign, Globe, User, FileText, Sparkles
} from "lucide-react";

// Parse check size string to numeric value for positioning
function parseCheckSize(sizeStr) {
  if (!sizeStr) return 0;
  const str = sizeStr.toString().toLowerCase().replace(/[,$\s]/g, '');
  let multiplier = 1;
  let numStr = str;
  
  if (str.endsWith('k')) {
    multiplier = 1000;
    numStr = str.slice(0, -1);
  } else if (str.endsWith('m')) {
    multiplier = 1000000;
    numStr = str.slice(0, -1);
  } else if (str.endsWith('b')) {
    multiplier = 1000000000;
    numStr = str.slice(0, -1);
  }
  
  const num = parseFloat(numStr);
  return isNaN(num) ? 0 : num * multiplier;
}

// Convert value to position on log scale (better for investment ranges)
function valueToPosition(value, minVal = 1000, maxVal = 100000000) {
  if (value <= minVal) return 0;
  if (value >= maxVal) return 100;
  const logMin = Math.log10(minVal);
  const logMax = Math.log10(maxVal);
  const logVal = Math.log10(value);
  return ((logVal - logMin) / (logMax - logMin)) * 100;
}

function CheckSizeRange({ min, max }) {
  const minValue = parseCheckSize(min);
  const maxValue = parseCheckSize(max);
  
  // Calculate positions on the bar (log scale: $1k to $100M)
  const minPos = valueToPosition(minValue);
  const maxPos = valueToPosition(maxValue);
  
  // Scale markers for reference
  const scaleMarkers = [
    { label: '$1k', value: 1000 },
    { label: '$10k', value: 10000 },
    { label: '$100k', value: 100000 },
    { label: '$1M', value: 1000000 },
    { label: '$10M', value: 10000000 },
    { label: '$100M', value: 100000000 },
  ];

  return (
    <div className="space-y-3">
      {/* Range display */}
      <div className="relative pt-1">
        {/* Background bar */}
        <div className="h-3 bg-slate-100 rounded-full relative overflow-visible">
          {/* Active range */}
          <div 
            className="absolute h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full shadow-sm"
            style={{ 
              left: `${minPos}%`, 
              width: `${Math.max(maxPos - minPos, 2)}%` 
            }}
          />
          
          {/* Min marker */}
          <div 
            className="absolute -top-1 transform -translate-x-1/2"
            style={{ left: `${minPos}%` }}
          >
            <div className="w-5 h-5 bg-white border-2 border-violet-500 rounded-full shadow-md" />
          </div>
          
          {/* Max marker */}
          <div 
            className="absolute -top-1 transform -translate-x-1/2"
            style={{ left: `${maxPos}%` }}
          >
            <div className="w-5 h-5 bg-white border-2 border-purple-500 rounded-full shadow-md" />
          </div>
        </div>
        
        {/* Labels above markers */}
        <div className="relative h-8 mt-2">
          {/* Min label */}
          <div 
            className="absolute transform -translate-x-1/2 text-center"
            style={{ left: `${minPos}%` }}
          >
            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
              {min || '-'}
            </span>
          </div>
          
          {/* Max label */}
          <div 
            className="absolute transform -translate-x-1/2 text-center"
            style={{ left: `${maxPos}%` }}
          >
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              {max || '-'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Scale reference */}
      <div className="relative h-4 mt-4">
        <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
        {scaleMarkers.map((marker, i) => {
          const pos = valueToPosition(marker.value);
          return (
            <div 
              key={i}
              className="absolute transform -translate-x-1/2"
              style={{ left: `${pos}%` }}
            >
              <div className="w-px h-2 bg-slate-300" />
              <span className="text-[10px] text-slate-400 mt-1 block whitespace-nowrap">
                {marker.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Summary text */}
      <div className="text-center pt-2">
        <span className="text-sm text-slate-600">
          Investing <span className="font-semibold text-violet-600">{min || '-'}</span>
          {' '}<span className="text-slate-400">to</span>{' '}
          <span className="font-semibold text-purple-600">{max || '-'}</span>
        </span>
      </div>
    </div>
  );
}

export default function InvestorDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("id");
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/investor/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, navigate]);

  const handleLogout = () => {
    navigate("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-violet-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-violet-600">
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-lg font-medium">Loading profile...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => navigate("/login")}
            className="text-violet-600 hover:text-violet-700 font-medium"
          >
            Return to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-violet-50">
      {/* Navbar */}
      <nav className="border-b border-violet-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">
              IL
            </div>
            <span className="font-semibold tracking-tight text-slate-900">
              InvestLink
            </span>
          </a>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="h-8 w-8 rounded-full bg-violet-100 grid place-items-center">
                <Briefcase className="h-4 w-4 text-violet-600" />
              </div>
              <span className="font-medium text-slate-900">{profile?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-violet-600 text-sm font-medium mb-2">
            <Briefcase className="h-4 w-4" />
            Investor Portfolio
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {profile?.name?.split(' ')[0] || 'Investor'}!
          </h1>
          <p className="mt-1 text-slate-600">
            Manage your investment profile and discover matching startups.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info */}
            <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {profile?.pic_link ? (
                  <img 
                    src={profile.pic_link} 
                    alt={profile.name}
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-violet-100"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 grid place-items-center text-white text-2xl font-bold">
                    {profile?.name?.charAt(0) || 'I'}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
                  {profile?.website && (
                    <a 
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 mt-1"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  )}
                </div>
              </div>

              {/* Investment Thesis */}
              <div className="mt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <FileText className="h-4 w-4 text-violet-500" />
                  Investment Thesis
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {profile?.invest_requirements || 'No investment thesis provided.'}
                </p>
              </div>
            </div>

            {/* Investment Preferences */}
            <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-500" />
                Investment Preferences
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Countries */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <MapPin className="h-4 w-4 text-violet-500" />
                    Target Regions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.places?.split(', ').map((place, i) => (
                      <span 
                        key={i}
                        className="inline-flex items-center rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 border border-violet-100"
                      >
                        {place}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Industries */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Building2 className="h-4 w-4 text-violet-500" />
                    Industries
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.industry?.split(', ').map((ind, i) => (
                      <span 
                        key={i}
                        className="inline-flex items-center rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 border border-purple-100"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Fund Stages */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    Fund Stages
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.fund_stage?.split(', ').map((stage, i) => (
                      <span 
                        key={i}
                        className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 border border-indigo-100"
                      >
                        {stage}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Check Size Card */}
            <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-violet-500" />
                Check Size Range
              </h3>
              <CheckSizeRange min={profile?.check_size_min} max={profile?.check_size_max} />
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-500 to-purple-600 p-6 shadow-sm text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-violet-200">User ID</span>
                  <span className="font-medium">#{profile?.user_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-violet-200">Account Type</span>
                  <span className="font-medium">Investor</span>
                </div>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-6">
              <h3 className="text-sm font-semibold text-violet-900 mb-2">
                🚀 Coming Soon
              </h3>
              <p className="text-xs text-violet-700">
                Startup matching, analytics, and direct messaging features are on the way!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} InvestLink. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-slate-900">Privacy</a>
            <a href="#terms" className="hover:text-slate-900">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

