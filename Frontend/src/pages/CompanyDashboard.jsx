import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Building2, LogOut, MapPin, Target, Briefcase, 
  DollarSign, Globe, FileText, Sparkles, TrendingUp
} from "lucide-react";

export default function CompanyDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyId = searchParams.get("id");
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companyId) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/company/${companyId}`);
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
  }, [companyId, navigate]);

  const handleLogout = () => {
    navigate("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-orange-600">
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
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => navigate("/login")}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Return to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50">
      {/* Navbar */}
      <nav className="border-b border-orange-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
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
              <div className="h-8 w-8 rounded-full bg-orange-100 grid place-items-center">
                <Building2 className="h-4 w-4 text-orange-600" />
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
          <div className="flex items-center gap-2 text-orange-600 text-sm font-medium mb-2">
            <Building2 className="h-4 w-4" />
            Startup Portfolio
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {profile?.name?.split(' ')[0] || 'Startup'}!
          </h1>
          <p className="mt-1 text-slate-600">
            Manage your company profile and connect with investors.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info */}
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {profile?.img ? (
                  <img 
                    src={profile.img} 
                    alt={profile.name}
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-orange-100"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 grid place-items-center text-white text-2xl font-bold">
                    {profile?.name?.charAt(0) || 'C'}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    {profile?.link && (
                      <a 
                        href={profile.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Website
                      </a>
                    )}
                    {profile?.place && (
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.place}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Description */}
              <div className="mt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  About the Company
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {profile?.desc || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Company Details */}
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Company Details
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Industry */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Building2 className="h-4 w-4 text-orange-500" />
                    Industry
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 border border-orange-100">
                    {profile?.industry || 'Not specified'}
                  </span>
                </div>

                {/* Location */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    Location
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 border border-amber-100">
                    {profile?.place || 'Not specified'}
                  </span>
                </div>

                {/* Funding Stage */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    Funding Stage
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-1.5 text-sm font-medium text-orange-700 border border-orange-100">
                    <TrendingUp className="h-4 w-4 mr-1.5" />
                    {profile?.funding_stage || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Funding Goal Card */}
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                Funding Goal
              </h3>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-orange-600">
                  {profile?.fund_size || '-'}
                </div>
                <p className="text-sm text-slate-500 mt-1">Target raise amount</p>
              </div>
              <div className="h-2 bg-orange-100 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-1/3 rounded-full" />
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">Seeking investors</p>
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-500 to-amber-500 p-6 shadow-sm text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Account Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-orange-200">Company ID</span>
                  <span className="font-medium">#{profile?.company_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-200">Account Type</span>
                  <span className="font-medium">Startup</span>
                </div>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-6">
              <h3 className="text-sm font-semibold text-orange-900 mb-2">
                🚀 Coming Soon
              </h3>
              <p className="text-xs text-orange-700">
                Investor matching, pitch deck uploads, and meeting scheduling are on the way!
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

