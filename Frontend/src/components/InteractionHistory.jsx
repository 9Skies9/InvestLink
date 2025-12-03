import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, X, Building2, Briefcase, MapPin, Loader2, ThumbsUp, ThumbsDown, TrendingUp, Layers, ExternalLink } from "lucide-react";
import ExpandableTag from "./ExpandableTag";

/**
 * InteractionHistory - View and manage liked/disliked entities
 * 
 * Props:
 * - type: "investor" | "company" - who is viewing
 * - userId: number - the viewer's ID
 * - accentColor: "violet" | "orange" - theme color
 */
export default function InteractionHistory({ type, userId, accentColor = "violet" }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState([]);
  const [disliked, setDisliked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeList, setActiveList] = useState("liked"); // "liked" | "disliked"
  const [updating, setUpdating] = useState(null); // ID of item being updated

  const isInvestor = type === "investor";

  // Navigate to profile page
  const viewProfile = (item) => {
    const targetId = isInvestor ? item.company_id : item.user_id;
    const viewerParams = `?viewer=${userId}&viewerType=${type}`;
    if (isInvestor) {
      navigate(`/profile/company/${targetId}${viewerParams}`);
    } else {
      navigate(`/profile/investor/${targetId}${viewerParams}`);
    }
  };
  const colors = accentColor === "violet" 
    ? { bg: "bg-violet-600", hover: "hover:bg-violet-700", light: "bg-violet-50", border: "border-violet-200", text: "text-violet-600" }
    : { bg: "bg-orange-500", hover: "hover:bg-orange-600", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-600" };

  // Fetch interaction history
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const endpoint = isInvestor
        ? `http://localhost:8000/api/interactions/investor/${userId}`
        : `http://localhost:8000/api/interactions/company/${userId}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      setLiked(data.liked || []);
      setDisliked(data.disliked || []);
    } catch (err) {
      console.error("Failed to fetch interactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId, type]);

  // Update interaction
  const updateInteraction = async (targetId, newStatus) => {
    setUpdating(targetId);
    try {
      const endpoint = isInvestor
        ? `http://localhost:8000/api/interactions/investor/${userId}/company/${targetId}`
        : `http://localhost:8000/api/interactions/company/${userId}/investor/${targetId}`;
      
      await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_status: newStatus }),
      });
      
      // Refresh the list
      await fetchHistory();
    } catch (err) {
      console.error("Failed to update interaction:", err);
    } finally {
      setUpdating(null);
    }
  };

  const currentList = activeList === "liked" ? liked : disliked;
  const entityName = isInvestor ? "companies" : "investors";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className={`h-10 w-10 animate-spin ${colors.text}`} />
        <p className="mt-4 text-slate-500">Loading history...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toggle between liked/disliked */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
        <button
          onClick={() => setActiveList("liked")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeList === "liked"
              ? "bg-white text-green-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
          Liked ({liked.length})
        </button>
        <button
          onClick={() => setActiveList("disliked")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeList === "disliked"
              ? "bg-white text-red-500 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ThumbsDown className="h-4 w-4" />
          Passed ({disliked.length})
        </button>
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <div className="text-center py-12">
          <div className={`h-16 w-16 rounded-full ${colors.light} flex items-center justify-center mx-auto mb-4`}>
            {activeList === "liked" ? (
              <Heart className="h-8 w-8 text-slate-300" />
            ) : (
              <X className="h-8 w-8 text-slate-300" />
            )}
          </div>
          <p className="text-slate-500">
            No {activeList} {entityName} yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((item) => {
            const id = isInvestor ? item.company_id : item.user_id;
            const isUpdating = updating === id;
            
            return (
              <div
                key={id}
                className={`rounded-xl border ${colors.border} bg-white p-4 transition-all ${isUpdating ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar/Image - Clickable */}
                  <button
                    onClick={() => viewProfile(item)}
                    className={`h-12 w-12 rounded-xl ${colors.light} flex items-center justify-center flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-offset-1 ${isInvestor ? 'hover:ring-violet-300' : 'hover:ring-orange-300'} transition-all`}
                  >
                    {(isInvestor ? item.img : item.pic_link) ? (
                      <img
                        src={isInvestor ? item.img : item.pic_link}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      isInvestor ? (
                        <Building2 className={`h-6 w-6 ${colors.text}`} />
                      ) : (
                        <Briefcase className={`h-6 w-6 ${colors.text}`} />
                      )
                    )}
                  </button>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => viewProfile(item)}
                      className={`font-semibold text-slate-900 truncate hover:${colors.text} transition-colors text-left`}
                    >
                      {item.name}
                    </button>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.place && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {item.place?.split(',')[0]}
                        </span>
                      )}
                      {isInvestor ? (
                        /* Companies (viewed by investor) - simple tags */
                        <>
                          {item.industry && (
                            <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                              <Layers className="h-3 w-3" />
                              {item.industry}
                            </span>
                          )}
                          {item.funding_stage && (
                            <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                              <TrendingUp className="h-3 w-3" />
                              {item.funding_stage}
                            </span>
                          )}
                        </>
                      ) : (
                        /* Investors (viewed by company) - expandable tags */
                        <>
                          {item.fund_stage && (
                            <ExpandableTag
                              label="Stages"
                              values={item.fund_stage}
                              icon="stage"
                              colorClass="text-orange-600 bg-orange-50"
                            />
                          )}
                          {item.industry && (
                            <ExpandableTag
                              label="Industries"
                              values={item.industry}
                              icon="industry"
                              colorClass="text-orange-600 bg-orange-50"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* View Profile */}
                    <button
                      onClick={() => viewProfile(item)}
                      className={`p-2 rounded-lg ${colors.text} hover:${colors.light} transition-colors`}
                      title="View profile"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    
                    {activeList === "liked" ? (
                      <>
                        {/* Flip to dislike */}
                        <button
                          onClick={() => updateInteraction(id, 0)}
                          disabled={isUpdating}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Change to pass"
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                        {/* Remove from list */}
                        <button
                          onClick={() => updateInteraction(id, -1)}
                          disabled={isUpdating}
                          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          title="Remove from list"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Flip to like */}
                        <button
                          onClick={() => updateInteraction(id, 1)}
                          disabled={isUpdating}
                          className="p-2 rounded-lg text-green-400 hover:bg-green-50 hover:text-green-500 transition-colors"
                          title="Change to like"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        {/* Remove from list */}
                        <button
                          onClick={() => updateInteraction(id, -1)}
                          disabled={isUpdating}
                          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          title="Remove from list"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

