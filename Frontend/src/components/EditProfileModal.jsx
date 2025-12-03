import { useState, useEffect } from "react";
import { X, Save, Loader2, Check } from "lucide-react";

// Full list of options
const COUNTRIES = [
  "USA", "UK", "Canada", "Germany", "France", "Spain", "Italy", "Netherlands",
  "Switzerland", "Sweden", "Norway", "Denmark", "Finland", "Belgium", "Austria",
  "Poland", "Czech Republic", "Ireland", "Portugal", "Israel", "UAE", "Saudi Arabia",
  "Qatar", "India", "China", "Japan", "South Korea", "Singapore", "Australia",
  "New Zealand", "Brazil", "Argentina", "Mexico", "Nigeria", "Kenya", "South Africa",
  "Egypt", "Indonesia", "Malaysia", "Vietnam", "Philippines", "Thailand", "Taiwan",
  "Hong Kong", "Luxembourg", "Estonia", "Latvia", "Lithuania", "Romania", "Bulgaria",
  "Croatia", "Slovenia", "Hungary", "Greece", "Turkey", "Ukraine", "Kazakhstan"
];

const FUND_STAGES = [
  "Idea (Pre-Seed)",
  "Prototype (Seed)",
  "Early revenue (Series A)",
  "Scaling (Series B)",
  "Growth (Series C/D)",
  "Pre-IPO (Series E+)"
];

const INDUSTRIES = [
  "AI", "Analytics", "Biotech", "Blockchain", "Climate", "Construction",
  "Consumer", "Creative Industries", "Cybersecurity", "Defense Technology",
  "DevTools", "E-commerce", "Education", "Energy", "Fintech", "Food",
  "Gaming", "Hardware", "Healthcare", "HR & Recruiting", "Infrastructure",
  "Legal Tech", "Logistics", "Media", "Productivity", "Real Estate",
  "Retail", "Software", "Venture Capital", "Industry Agnostic"
];

// Multi-select dropdown component
function MultiSelect({ label, options, selected, onChange, placeholder, accentColor = "violet" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const colors = accentColor === "violet"
    ? { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", check: "border-violet-600 bg-violet-600", focus: "focus:border-violet-400 focus:ring-violet-100", hover: "hover:border-violet-300" }
    : { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", check: "border-orange-600 bg-orange-600", focus: "focus:border-orange-400 focus:ring-orange-100", hover: "hover:border-orange-300" };

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeItem = (option, e) => {
    e.stopPropagation();
    onChange(selected.filter(s => s !== option));
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`min-h-[42px] w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 transition-colors ${colors.hover}`}
      >
        {selected.length === 0 ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selected.map(item => (
              <span
                key={item}
                className={`inline-flex items-center gap-1 rounded-lg ${colors.bg} ${colors.border} border px-2 py-0.5 text-xs font-medium ${colors.text}`}
              >
                {item}
                <button
                  type="button"
                  onClick={(e) => removeItem(item, e)}
                  className="hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="p-2 border-b border-slate-100">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className={`w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm ${colors.focus} focus:outline-none focus:ring-2`}
              />
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(option);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selected.includes(option)
                      ? `${colors.bg} ${colors.text}`
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                    selected.includes(option)
                      ? colors.check
                      : "border-slate-300"
                  }`}>
                    {selected.includes(option) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * EditProfileModal - Modal for editing user/company profiles
 */
export default function EditProfileModal({ type, profile, onClose, onSave, accentColor = "violet" }) {
  const isInvestor = type === "investor";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const colors = accentColor === "violet"
    ? { bg: "bg-violet-600", hover: "hover:bg-violet-700", light: "bg-violet-50", border: "border-violet-200", text: "text-violet-600", focus: "focus:ring-violet-500" }
    : { bg: "bg-orange-500", hover: "hover:bg-orange-600", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", focus: "focus:ring-orange-500" };

  // Form state
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isInvestor) {
      setFormData({
        fullName: profile?.name || "",
        investRequirements: profile?.invest_requirements || "",
        countries: profile?.places?.split(", ").filter(Boolean) || [],
        fundStages: profile?.fund_stage?.split(", ").filter(Boolean) || [],
        industries: profile?.industry?.split(", ").filter(Boolean) || [],
        checkSizeMin: profile?.check_size_min || "",
        checkSizeMax: profile?.check_size_max || "",
        website: profile?.website || "",
        profilePic: profile?.pic_link || "",
      });
    } else {
      setFormData({
        companyName: profile?.name || "",
        description: profile?.desc || "",
        country: profile?.place || "",
        fundingStage: profile?.funding_stage || "",
        industry: profile?.industry || "",
        fundingAmount: profile?.fund_size || "",
        website: profile?.link || "",
        logoUrl: profile?.img || "",
      });
    }
  }, [profile, isInvestor]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const userId = isInvestor ? profile?.user_id : profile?.company_id;
      const endpoint = isInvestor
        ? `http://localhost:8000/api/investor/${userId}/profile`
        : `http://localhost:8000/api/company/${userId}/profile`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to update profile");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`${colors.light} px-6 py-4 border-b ${colors.border} flex items-center justify-between`}>
          <h2 className="text-lg font-semibold text-slate-900">Edit Profile</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/50 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {isInvestor ? (
              <>
                {/* Investor Fields */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Investment Thesis</label>
                  <textarea
                    rows={4}
                    value={formData.investRequirements || ""}
                    onChange={(e) => handleChange("investRequirements", e.target.value)}
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  />
                </div>

                <MultiSelect
                  label="Target Countries"
                  options={COUNTRIES}
                  selected={formData.countries || []}
                  onChange={(val) => handleChange("countries", val)}
                  placeholder="Select countries..."
                  accentColor={accentColor}
                />

                <MultiSelect
                  label="Fund Stages"
                  options={FUND_STAGES}
                  selected={formData.fundStages || []}
                  onChange={(val) => handleChange("fundStages", val)}
                  placeholder="Select fund stages..."
                  accentColor={accentColor}
                />

                <MultiSelect
                  label="Industries"
                  options={INDUSTRIES}
                  selected={formData.industries || []}
                  onChange={(val) => handleChange("industries", val)}
                  placeholder="Select industries..."
                  accentColor={accentColor}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Min Check Size</label>
                    <input
                      type="text"
                      value={formData.checkSizeMin || ""}
                      onChange={(e) => handleChange("checkSizeMin", e.target.value)}
                      placeholder="e.g., $50k"
                      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Check Size</label>
                    <input
                      type="text"
                      value={formData.checkSizeMax || ""}
                      onChange={(e) => handleChange("checkSizeMax", e.target.value)}
                      placeholder="e.g., $5M"
                      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={formData.website || ""}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://..."
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Profile Picture URL</label>
                  <input
                    type="url"
                    value={formData.profilePic || ""}
                    onChange={(e) => handleChange("profilePic", e.target.value)}
                    placeholder="https://..."
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Company Fields */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName || ""}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <select
                    value={formData.country || ""}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Funding Stage</label>
                  <select
                    value={formData.fundingStage || ""}
                    onChange={(e) => handleChange("fundingStage", e.target.value)}
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  >
                    <option value="">Select stage...</option>
                    {FUND_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                  <select
                    value={formData.industry || ""}
                    onChange={(e) => handleChange("industry", e.target.value)}
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Funding Goal</label>
                  <input
                    type="text"
                    value={formData.fundingAmount || ""}
                    onChange={(e) => handleChange("fundingAmount", e.target.value)}
                    placeholder="e.g., $500k"
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={formData.website || ""}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://..."
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logoUrl || ""}
                    onChange={(e) => handleChange("logoUrl", e.target.value)}
                    placeholder="https://..."
                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
                  />
                </div>
              </>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${colors.bg} ${colors.hover} transition-colors flex items-center gap-2 disabled:opacity-50`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
