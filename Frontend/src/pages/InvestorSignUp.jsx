import { useState } from "react";
import { Briefcase, ArrowLeft, Check, X } from "lucide-react";

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

function MultiSelect({ label, options, selected, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

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
        className="min-h-[42px] w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 transition-colors hover:border-indigo-300 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100"
      >
        {selected.length === 0 ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selected.map(item => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-700"
              >
                {item}
                <button
                  type="button"
                  onClick={(e) => removeItem(item, e)}
                  className="hover:text-indigo-900"
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
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                    selected.includes(option)
                      ? "border-indigo-600 bg-indigo-600"
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

export default function InvestorSignUp() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    investRequirements: "",
    countries: [],
    fundStages: [],
    industries: [],
    checkSizeMin: "",
    checkSizeMax: "",
    website: "",
    profilePic: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.fullName) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.investRequirements) {
      newErrors.investRequirements = "Investment requirements are required";
    }

    if (formData.countries.length === 0) {
      newErrors.countries = "Please select at least one country";
    }

    if (formData.fundStages.length === 0) {
      newErrors.fundStages = "Please select at least one fund stage";
    }

    if (formData.industries.length === 0) {
      newErrors.industries = "Please select at least one industry";
    }

    if (!formData.checkSizeMin) {
      newErrors.checkSizeMin = "Minimum check size is required";
    }

    if (!formData.checkSizeMax) {
      newErrors.checkSizeMax = "Maximum check size is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("http://localhost:8000/api/register/investor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          investRequirements: formData.investRequirements,
          countries: formData.countries,
          fundStages: formData.fundStages,
          industries: formData.industries,
          checkSizeMin: formData.checkSizeMin,
          checkSizeMax: formData.checkSizeMax,
          website: formData.website,
          profilePic: formData.profilePic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setSubmitStatus("success");
      // Reset form on success
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        investRequirements: "",
        countries: [],
        fundStages: [],
        industries: [],
        checkSizeMin: "",
        checkSizeMax: "",
        website: "",
        profilePic: ""
      });
    } catch (error) {
      setSubmitStatus("error");
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-violet-50">
      {/* Navbar */}
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <a href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">
            IL
          </div>
          <span className="font-semibold tracking-tight text-slate-900">
            InvestLink
          </span>
        </a>
        <a
          href="/"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </a>
      </nav>

      {/* Sign Up Form */}
      <section className="mx-auto w-full max-w-2xl px-6 pb-20">
        <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white shadow-md">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Investor Registration
                </h1>
                <p className="text-sm text-slate-600">
                  Set your thesis and discover curated startups
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Account Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                  1
                </span>
                Account Details
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Your name or fund name"
                    className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                      errors.fullName
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                      errors.password
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    placeholder="Confirm your password"
                    className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                      errors.confirmPassword
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Investment Thesis */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                  2
                </span>
                Investment Thesis
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Investment Requirements <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Describe your investment thesis, what types of companies you look for, and what value you bring to founders.
                </p>
                <textarea
                  value={formData.investRequirements}
                  onChange={(e) => updateField("investRequirements", e.target.value)}
                  placeholder="e.g., We invest in early-stage B2B SaaS companies with strong founder-market fit..."
                  rows={5}
                  className={`w-full rounded-xl border px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 resize-none ${
                    errors.investRequirements
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                  }`}
                />
                {errors.investRequirements && (
                  <p className="mt-1 text-xs text-red-500">{errors.investRequirements}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Preferences */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                  3
                </span>
                Investment Preferences
              </h2>

              <div className="space-y-4">
                <div>
                  <MultiSelect
                    label={<>Countries to Invest In <span className="text-red-500">*</span></>}
                    options={COUNTRIES}
                    selected={formData.countries}
                    onChange={(val) => updateField("countries", val)}
                    placeholder="Select countries..."
                  />
                  {errors.countries && (
                    <p className="mt-1 text-xs text-red-500">{errors.countries}</p>
                  )}
                </div>

                <div>
                  <MultiSelect
                    label={<>Fund Stages <span className="text-red-500">*</span></>}
                    options={FUND_STAGES}
                    selected={formData.fundStages}
                    onChange={(val) => updateField("fundStages", val)}
                    placeholder="Select fund stages..."
                  />
                  {errors.fundStages && (
                    <p className="mt-1 text-xs text-red-500">{errors.fundStages}</p>
                  )}
                </div>

                <div>
                  <MultiSelect
                    label={<>Industries <span className="text-red-500">*</span></>}
                    options={INDUSTRIES}
                    selected={formData.industries}
                    onChange={(val) => updateField("industries", val)}
                    placeholder="Select industries..."
                  />
                  {errors.industries && (
                    <p className="mt-1 text-xs text-red-500">{errors.industries}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Min Check Size <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="text"
                      value={formData.checkSizeMin}
                      onChange={(e) => updateField("checkSizeMin", e.target.value)}
                      placeholder="e.g., 50k"
                      className={`w-full rounded-xl border pl-8 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                        errors.checkSizeMin
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                      }`}
                    />
                  </div>
                  {errors.checkSizeMin && (
                    <p className="mt-1 text-xs text-red-500">{errors.checkSizeMin}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Max Check Size <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="text"
                      value={formData.checkSizeMax}
                      onChange={(e) => updateField("checkSizeMax", e.target.value)}
                      placeholder="e.g., 1M"
                      className={`w-full rounded-xl border pl-8 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                        errors.checkSizeMax
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                      }`}
                    />
                  </div>
                  {errors.checkSizeMax && (
                    <p className="mt-1 text-xs text-red-500">{errors.checkSizeMax}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Optional Links */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                  4
                </span>
                <span className="text-slate-500 font-normal">Optional</span>
                Profile Links
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://yourfund.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    value={formData.profilePic}
                    onChange={(e) => updateField("profilePic", e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              {/* Success message */}
              {submitStatus === "success" && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  <p className="font-medium">🎉 Registration successful!</p>
                  <p className="mt-1">Your investor account has been created. You can now sign in.</p>
                </div>
              )}

              {/* Error message */}
              {submitStatus === "error" && errors.submit && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-medium">Registration failed</p>
                  <p className="mt-1">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-2xl px-6 py-3.5 font-semibold text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 ${
                  isSubmitting
                    ? "bg-violet-400 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  "Create Investor Account"
                )}
              </button>
              <p className="mt-4 text-center text-xs text-slate-500">
                Already have an account?{" "}
                <a href="/login" className="text-violet-600 hover:text-violet-700 font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span>🔒 Your data is encrypted</span>
          <span>•</span>
          <span>No spam, ever</span>
          <span>•</span>
          <span>Cancel anytime</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} InvestLink. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-slate-900">
              Privacy
            </a>
            <a href="#terms" className="hover:text-slate-900">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

