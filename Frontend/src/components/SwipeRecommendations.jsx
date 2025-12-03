import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Building2, Briefcase, MapPin, DollarSign, Sparkles, ChevronRight, Loader2, Layers, TrendingUp } from "lucide-react";
import ExpandableTag from "./ExpandableTag";

/**
 * SwipeRecommendations - Tinder-like swipe interface for recommendations
 * 
 * Props:
 * - type: "investor" | "company" - who is viewing
 * - userId: number - the viewer's ID
 * - accentColor: "violet" | "orange" - theme color
 */
export default function SwipeRecommendations({ type, userId, accentColor = "violet" }) {
  const [recommendations, setRecommendations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [swiping, setSwiping] = useState(null); // "left" | "right" | null
  const [noMore, setNoMore] = useState(false);
  const [error, setError] = useState(null);

  const isInvestor = type === "investor";
  const colors = accentColor === "violet" 
    ? { bg: "bg-violet-600", hover: "hover:bg-violet-700", light: "bg-violet-50", border: "border-violet-200", text: "text-violet-600" }
    : { bg: "bg-orange-500", hover: "hover:bg-orange-600", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-600" };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isInvestor
        ? `http://localhost:8000/api/recommendations/investor/${userId}?num=5`
        : `http://localhost:8000/api/recommendations/company/${userId}?num=5`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setCurrentIndex(0);
        setNoMore(false);
      } else {
        setNoMore(true);
      }
    } catch (err) {
      setError("Failed to load recommendations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, type]);

  // Handle swipe action
  const handleSwipe = async (liked) => {
    if (swiping || currentIndex >= recommendations.length) return;
    
    const current = recommendations[currentIndex];
    const targetId = isInvestor ? current.company_id : current.user_id;
    
    setSwiping(liked ? "right" : "left");
    
    try {
      const endpoint = isInvestor
        ? `http://localhost:8000/api/swipe/investor/${userId}/company/${targetId}`
        : `http://localhost:8000/api/swipe/company/${userId}/investor/${targetId}`;
      
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ like: liked }),
      });
      
      // Animate and move to next
      setTimeout(() => {
        setSwiping(null);
        if (currentIndex + 1 >= recommendations.length) {
          // Done with current batch - show completion state
          setNoMore(true);
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      }, 300);
      
    } catch (err) {
      console.error("Swipe failed:", err);
      setSwiping(null);
    }
  };

  const current = recommendations[currentIndex];

  // Loading state
  if (loading && recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className={`h-10 w-10 animate-spin ${colors.text}`} />
        <p className="mt-4 text-slate-500">Finding matches...</p>
      </div>
    );
  }

  // No more recommendations / batch complete
  if (noMore || !current) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className={`h-16 w-16 rounded-full ${colors.light} flex items-center justify-center mb-4`}>
          <Sparkles className={`h-8 w-8 ${colors.text}`} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-xs">
          You've reviewed all current recommendations.
        </p>
        <button
          onClick={fetchRecommendations}
          className={`mt-4 px-4 py-2 rounded-xl ${colors.bg} ${colors.hover} text-white text-sm font-medium transition-colors`}
        >
          Load More
        </button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
        <span>{currentIndex + 1} of {recommendations.length}</span>
      </div>

      {/* Card */}
      <div
        className={`relative w-full max-w-sm bg-white rounded-3xl shadow-lg border ${colors.border} overflow-hidden transition-all duration-300 ${
          swiping === "left" ? "-translate-x-full opacity-0 rotate-[-10deg]" :
          swiping === "right" ? "translate-x-full opacity-0 rotate-[10deg]" : ""
        }`}
      >
        {/* Image/Header */}
        <div className={`h-48 ${colors.light} relative flex items-center justify-center`}>
          {(isInvestor ? current.img : current.pic_link) ? (
            <img
              src={isInvestor ? current.img : current.pic_link}
              alt={current.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className={`h-20 w-20 rounded-full ${colors.bg} text-white flex items-center justify-center`}>
              {isInvestor ? <Building2 className="h-10 w-10" /> : <Briefcase className="h-10 w-10" />}
            </div>
          )}
          {/* Match probability badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold shadow">
            <span className={colors.text}>{current.match_probability}%</span> match
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-bold text-slate-900">{current.name}</h3>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3 items-start">
            {current.place && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                <MapPin className="h-3 w-3" />
                {current.place?.split(',')[0]}
              </span>
            )}
            {isInvestor ? (
              /* Company card (viewed by investor) - simple tags */
              <>
                {current.funding_stage && (
                  <span className={`inline-flex items-center gap-1 text-xs ${colors.light} ${colors.text} px-2 py-1 rounded-lg`}>
                    <TrendingUp className="h-3 w-3" />
                    {current.funding_stage}
                  </span>
                )}
                {current.industry && (
                  <span className={`inline-flex items-center gap-1 text-xs ${colors.light} ${colors.text} px-2 py-1 rounded-lg`}>
                    <Layers className="h-3 w-3" />
                    {current.industry}
                  </span>
                )}
              </>
            ) : (
              /* Investor card (viewed by company) - expandable tags */
              <>
                {current.fund_stage && (
                  <ExpandableTag
                    label="Stages"
                    values={current.fund_stage}
                    icon="stage"
                    colorClass={`${colors.light} ${colors.text}`}
                  />
                )}
                {current.industry && (
                  <ExpandableTag
                    label="Industries"
                    values={current.industry}
                    icon="industry"
                    colorClass={`${colors.light} ${colors.text}`}
                  />
                )}
              </>
            )}
          </div>

          {/* Description */}
          <p className="mt-3 text-sm text-slate-600 line-clamp-3">
            {isInvestor ? current.description : current.invest_requirements}
          </p>

          {/* Fund size / Check size */}
          {(isInvestor ? current.fund_size : (current.check_size_min || current.check_size_max)) && (
            <div className="mt-3 flex items-center gap-1 text-sm text-slate-500">
              <DollarSign className="h-4 w-4" />
              {isInvestor 
                ? `Raising: ${current.fund_size}`
                : `Check: ${current.check_size_min || '?'} - ${current.check_size_max || '?'}`
              }
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={() => handleSwipe(true)}
          disabled={swiping}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-green-200 text-green-500 hover:bg-green-50 hover:border-green-300 transition-all disabled:opacity-50"
          aria-label="Like"
        >
          <ThumbsUp className="h-5 w-5" />
          Like
        </button>
        
        <button
          onClick={() => handleSwipe(false)}
          disabled={swiping}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
          aria-label="Pass"
        >
          <ThumbsDown className="h-5 w-5" />
          Pass
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-4 text-xs text-slate-400">
        Press ← to like, → to pass
      </p>
    </div>
  );
}

