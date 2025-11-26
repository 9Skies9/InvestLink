import { useState } from "react";
import { Building2, ArrowLeft, ChevronDown } from "lucide-react";

// Same countries as InvestorSignUp for consistency
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

// Same industries as InvestorSignUp for consistency
const INDUSTRIES = [
  "Aerospace", "AI", "Analytics", "Biotech", "Blockchain", "Climate", "Construction",
  "Consumer", "Creative Industries", "Cybersecurity", "Defense Technology",
  "Design", "DevTools", "E-commerce", "Education", "Energy", "Fintech", "Food",
  "Gaming", "Hardware", "Health & Wellness", "Healthcare", "HR & Recruiting", 
  "Infrastructure", "Legal Tech", "Logistics", "Media", "Productivity", 
  "Real Estate", "Retail", "Software", "Transportation", "Travel", "Venture Capital"
];

function Select({ label, options, value, onChange, placeholder, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors focus:outline-none focus:ring-2 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
        } ${value ? "text-slate-900" : "text-slate-400"}`}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

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
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    value === option
                      ? "bg-orange-50 text-orange-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
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

export default function CompanySignUp() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    description: "",
    country: "",
    fundingStage: "",
    industry: "",
    fundingAmount: "",
    website: "",
    logoUrl: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!formData.companyName) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.description) {
      newErrors.description = "Company description is required";
    }

    if (!formData.country) {
      newErrors.country = "Please select a country";
    }

    if (!formData.fundingStage) {
      newErrors.fundingStage = "Please select a funding stage";
    }

    if (!formData.industry) {
      newErrors.industry = "Please select an industry";
    }

    if (!formData.fundingAmount) {
      newErrors.fundingAmount = "Funding amount is required";
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
      const response = await fetch("http://localhost:8000/api/register/company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          description: formData.description,
          country: formData.country,
          fundingStage: formData.fundingStage,
          industry: formData.industry,
          fundingAmount: formData.fundingAmount,
          website: formData.website,
          logoUrl: formData.logoUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setSubmitStatus("success");
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        companyName: "",
        description: "",
        country: "",
        fundingStage: "",
        industry: "",
        fundingAmount: "",
        website: "",
        logoUrl: ""
      });
    } catch (error) {
      setSubmitStatus("error");
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50">
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
        <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-white shadow-md">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Startup Registration
                </h1>
                <p className="text-sm text-slate-600">
                  Register your company and get matched to aligned investors
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Account Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
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
                    placeholder="company@example.com"
                    className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="Your startup name"
                    className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                      errors.companyName
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
                    }`}
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>
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
                        : "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
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
                        : "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
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

            {/* Company Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                  2
                </span>
                Company Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Company Description <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Describe what your company does, the problem you're solving, and your unique value proposition.
                </p>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="e.g., We're building an AI-powered platform that helps..."
                  rows={5}
                  className={`w-full rounded-xl border px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 resize-none ${
                    errors.description
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Company Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                  3
                </span>
                Company Details
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Select
                    label={<>Country <span className="text-red-500">*</span></>}
                    options={COUNTRIES}
                    value={formData.country}
                    onChange={(val) => updateField("country", val)}
                    placeholder="Select country..."
                    error={errors.country}
                  />
                  {errors.country && (
                    <p className="mt-1 text-xs text-red-500">{errors.country}</p>
                  )}
                </div>

                <div>
                  <Select
                    label={<>Funding Stage <span className="text-red-500">*</span></>}
                    options={FUND_STAGES}
                    value={formData.fundingStage}
                    onChange={(val) => updateField("fundingStage", val)}
                    placeholder="Select stage..."
                    error={errors.fundingStage}
                  />
                  {errors.fundingStage && (
                    <p className="mt-1 text-xs text-red-500">{errors.fundingStage}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Select
                    label={<>Industry <span className="text-red-500">*</span></>}
                    options={INDUSTRIES}
                    value={formData.industry}
                    onChange={(val) => updateField("industry", val)}
                    placeholder="Select industry..."
                    error={errors.industry}
                  />
                  {errors.industry && (
                    <p className="mt-1 text-xs text-red-500">{errors.industry}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Funding Amount Seeking <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="text"
                      value={formData.fundingAmount}
                      onChange={(e) => updateField("fundingAmount", e.target.value)}
                      placeholder="e.g., 5M"
                      className={`w-full rounded-xl border pl-8 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                        errors.fundingAmount
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
                      }`}
                    />
                  </div>
                  {errors.fundingAmount && (
                    <p className="mt-1 text-xs text-red-500">{errors.fundingAmount}</p>
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
                Company Links
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
                    placeholder="https://yourcompany.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Company Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => updateField("logoUrl", e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                  <p className="mt-1">Your startup has been registered. You can now sign in.</p>
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
                className={`w-full rounded-2xl px-6 py-3.5 font-semibold text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 ${
                  isSubmitting
                    ? "bg-orange-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
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
                  "Register Startup"
                )}
              </button>
              <p className="mt-4 text-center text-xs text-slate-500">
                Already have an account?{" "}
                <a href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
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

