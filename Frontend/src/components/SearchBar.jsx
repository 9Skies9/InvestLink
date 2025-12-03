import { useState, useEffect, useRef } from "react";
import { Search, X, Building2, Briefcase, MapPin, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * SearchBar - Search for investors or companies
 * 
 * Props:
 * - searchType: "investors" | "companies" - what to search for
 * - accentColor: "violet" | "orange"
 * - placeholder: string
 * - viewerId: number - ID of the user viewing (for like/dislike on profile)
 * - viewerType: "investor" | "company" - type of the viewer
 */
export default function SearchBar({ searchType = "companies", accentColor = "violet", placeholder, viewerId, viewerType }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef(null);

  const isSearchingCompanies = searchType === "companies";
  const colors = accentColor === "violet"
    ? { light: "bg-violet-50", border: "border-violet-200", text: "text-violet-600", focus: "focus:ring-violet-500" }
    : { light: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", focus: "focus:ring-orange-500" };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const endpoint = isSearchingCompanies
        ? `http://localhost:8000/api/search/companies?q=${encodeURIComponent(searchQuery)}&limit=10`
        : `http://localhost:8000/api/search/investors?q=${encodeURIComponent(searchQuery)}&limit=10`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      setResults(data.results || []);
      setShowResults(true);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    setShowResults(false);
    setQuery("");
    // Navigate to profile view with viewer info for like/dislike
    const viewerParams = viewerId && viewerType ? `?viewer=${viewerId}&viewerType=${viewerType}` : "";
    if (isSearchingCompanies) {
      navigate(`/profile/company/${item.id}${viewerParams}`);
    } else {
      navigate(`/profile/investor/${item.id}${viewerParams}`);
    }
  };

  const defaultPlaceholder = isSearchingCompanies
    ? "Search companies by name, industry..."
    : "Search investors by name, industry...";

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          placeholder={placeholder || defaultPlaceholder}
          className={`w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent transition-all`}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (query || loading) && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl border shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className={`h-5 w-5 animate-spin ${colors.text}`} />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left border-b last:border-0"
                >
                  {/* Avatar */}
                  <div className={`h-10 w-10 rounded-lg ${colors.light} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                    {item.img ? (
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                    ) : isSearchingCompanies ? (
                      <Building2 className={`h-5 w-5 ${colors.text}`} />
                    ) : (
                      <Briefcase className={`h-5 w-5 ${colors.text}`} />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.place && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {item.place.split(',')[0]}
                        </span>
                      )}
                      {item.industry && (
                        <span className={`text-xs ${colors.text}`}>
                          {item.industry.split(',')[0]}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

