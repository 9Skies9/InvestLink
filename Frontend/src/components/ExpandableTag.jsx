import { useState } from "react";
import { ChevronDown, ChevronUp, Layers, TrendingUp, MapPin } from "lucide-react";

// Shorten display names
const shortenName = (name) => {
  const shortenings = {
    "Industry Agnostic": "Agnostic",
    "Idea (Pre-Seed)": "Pre-Seed",
    "Prototype (Seed)": "Seed",
    "Early revenue (Series A)": "Series A",
    "Scaling (Series B)": "Series B",
    "Growth (Series C/D)": "Series C/D",
    "Pre-IPO (Series E+)": "Series E+",
  };
  return shortenings[name] || name;
};

/**
 * ExpandableTag - A collapsible tag that shows multiple values
 * 
 * Props:
 * - label: string - the label (e.g., "Industries")
 * - values: string - comma-separated values (e.g., "AI, Fintech, Healthcare")
 * - icon: "industry" | "stage" | "place" - which icon to show
 * - colorClass: string - Tailwind classes for colors (e.g., "text-violet-600 bg-violet-50")
 */
export default function ExpandableTag({ label, values, icon = "industry", colorClass = "text-violet-600 bg-violet-50" }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!values) return null;
  
  const items = values.split(',').map(v => shortenName(v.trim())).filter(v => v);
  if (items.length === 0) return null;
  
  const IconComponent = icon === "stage" ? TrendingUp : icon === "place" ? MapPin : Layers;
  
  return (
    <div className="relative">
      {/* Collapsed state - clickable header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${colorClass} hover:opacity-80`}
      >
        <IconComponent className="h-3 w-3" />
        <span>{label}</span>
        <span className="opacity-70">({items.length})</span>
        {expanded ? (
          <ChevronUp className="h-3 w-3 ml-0.5" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-0.5" />
        )}
      </button>
      
      {/* Expanded state - dropdown with all items */}
      {expanded && (
        <div className="absolute z-10 mt-1 left-0 min-w-max">
          <div className={`rounded-lg border shadow-lg p-2 bg-white`}>
            <div className="flex flex-wrap gap-1.5 max-w-xs">
              {items.map((item, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center text-xs px-2 py-1 rounded-md ${colorClass}`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

