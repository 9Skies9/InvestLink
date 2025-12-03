import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Building2, ArrowLeft, MapPin, Globe, FileText, 
  DollarSign, TrendingUp, Layers, Loader2, ThumbsUp, ThumbsDown, Check
} from "lucide-react";

export default function CompanyProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interacting, setInteracting] = useState(false);
  const [interactionDone, setInteractionDone] = useState(null); // "liked" | "disliked" | null

  // Check if an investor is viewing (passed via URL param)
  const viewerId = searchParams.get("viewer");
  const viewerType = searchParams.get("viewerType"); // "investor"

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/company/${id}`);
        if (!response.ok) throw new Error("Company not found");
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleInteraction = async (liked) => {
    if (!viewerId || viewerType !== "investor" || interacting) return;
    
    setInteracting(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/swipe/investor/${viewerId}/company/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ like: liked }),
        }
      );
      
      if (response.ok) {
        setInteractionDone(liked ? "liked" : "disliked");
      }
    } catch (err) {
      console.error("Interaction failed:", err);
    } finally {
      setInteracting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="text-orange-600 hover:text-orange-700 font-medium">
            Go back
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
            <div className="h-8 w-8 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">IL</div>
            <span className="font-semibold tracking-tight text-slate-900">InvestLink</span>
          </a>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 text-orange-600 text-sm font-medium mb-4">
          <Building2 className="h-4 w-4" />
          Startup Profile
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-6">
            {profile?.img ? (
              <img 
                src={profile.img} 
                alt={profile.name}
                className="h-24 w-24 rounded-2xl object-cover border-2 border-orange-100"
              />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 grid place-items-center text-white text-3xl font-bold">
                {profile?.name?.charAt(0) || 'C'}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{profile?.name}</h1>
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
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {profile?.funding_stage && (
                  <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-lg">
                    <TrendingUp className="h-3 w-3" />
                    {profile.funding_stage}
                  </span>
                )}
                {profile?.industry && (
                  <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-lg">
                    <Layers className="h-3 w-3" />
                    {profile.industry}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
              <FileText className="h-4 w-4 text-orange-500" />
              About
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              {profile?.desc || 'No description provided.'}
            </p>
          </div>

          {/* Funding Goal */}
          {profile?.fund_size && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                <DollarSign className="h-4 w-4 text-orange-500" />
                Funding Goal
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl px-6 py-4 inline-block">
                <p className="text-xs text-orange-600 mb-1">Target Raise</p>
                <p className="text-2xl font-bold text-orange-700">{profile.fund_size}</p>
              </div>
            </div>
          )}

          {/* Like/Dislike buttons for investors */}
          {viewerId && viewerType === "investor" && (
            <div className="mt-8 pt-6 border-t">
              {interactionDone ? (
                <div className={`flex items-center justify-center gap-2 py-4 rounded-xl ${
                  interactionDone === "liked" ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-600"
                }`}>
                  <Check className="h-5 w-5" />
                  <span className="font-medium">
                    {interactionDone === "liked" ? "Added to your liked list!" : "Added to your passed list"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => handleInteraction(true)}
                    disabled={interacting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-green-200 text-green-500 hover:bg-green-50 hover:border-green-300 transition-all disabled:opacity-50"
                  >
                    <ThumbsUp className="h-5 w-5" />
                    Like
                  </button>
                  <button
                    onClick={() => handleInteraction(false)}
                    disabled={interacting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
                  >
                    <ThumbsDown className="h-5 w-5" />
                    Pass
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
