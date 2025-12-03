import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Building2, ArrowLeft, Mail, Lock } from "lucide-react";

export default function SignIn() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("investor"); // 'investor' or 'company'
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrors(prev => ({ ...prev, submit: null }));

    try {
      const endpoint = accountType === "investor" 
        ? "http://localhost:8000/api/login/investor"
        : "http://localhost:8000/api/login/company";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      setSubmitStatus("success");
      
      // Redirect to appropriate dashboard
      if (accountType === "investor") {
        navigate(`/dashboard/investor?id=${data.user_id}`);
      } else {
        navigate(`/dashboard/company?id=${data.company_id}`);
      }
      
    } catch (error) {
      setSubmitStatus("error");
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic theme colors based on account type
  const theme = accountType === "investor" 
    ? {
        gradient: "from-violet-50 via-white to-violet-50",
        border: "border-violet-200",
        focusBorder: "focus:border-violet-400",
        focusRing: "focus:ring-violet-100",
        btnBg: "bg-violet-600 hover:bg-violet-700",
        btnDisabled: "bg-violet-400",
        btnRing: "focus:ring-violet-300",
        link: "text-violet-600 hover:text-violet-700",
      }
    : {
        gradient: "from-orange-50 via-white to-orange-50",
        border: "border-orange-200",
        focusBorder: "focus:border-orange-400",
        focusRing: "focus:ring-orange-100",
        btnBg: "bg-orange-500 hover:bg-orange-600",
        btnDisabled: "bg-orange-400",
        btnRing: "focus:ring-orange-300",
        link: "text-orange-600 hover:text-orange-700",
      };

  return (
    <main className={`min-h-screen bg-gradient-to-b ${theme.gradient} transition-colors duration-300`}>
      {/* Navbar */}
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <a href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">
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

      {/* Sign In Form */}
      <section className="mx-auto w-full max-w-md px-6 pb-20 pt-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className={`border-b px-8 py-6 text-center ${
            accountType === "investor" 
              ? "border-violet-100 bg-gradient-to-r from-slate-50 to-violet-50" 
              : "border-orange-100 bg-gradient-to-r from-slate-50 to-orange-50"
          }`}>
            <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white shadow-md ${
              accountType === "investor" ? "bg-violet-600" : "bg-orange-500"
            }`}>
              {accountType === "investor" ? (
                <Briefcase className="h-7 w-7" />
              ) : (
                <Building2 className="h-7 w-7" />
              )}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Sign in to your InvestLink account
            </p>
          </div>

          {/* Account Type Toggle */}
          <div className="px-8 pt-6">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAccountType("company")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  accountType === "company"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Startup
              </button>
              <button
                type="button"
                onClick={() => setAccountType("investor")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  accountType === "investor"
                    ? "bg-white text-violet-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Investor
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : `border-slate-200 ${theme.focusBorder} ${theme.focusRing}`
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : `border-slate-200 ${theme.focusBorder} ${theme.focusRing}`
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Success message */}
            {submitStatus === "success" && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <p className="font-medium">✓ Login successful!</p>
                <p className="mt-1">Welcome back to InvestLink.</p>
              </div>
            )}

            {/* Error message */}
            {submitStatus === "error" && errors.submit && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-medium">Login failed</p>
                <p className="mt-1">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl px-6 py-3 font-semibold text-white shadow-md transition-all focus:outline-none focus:ring-2 ${theme.btnRing} focus:ring-offset-2 ${
                isSubmitting
                  ? `${theme.btnDisabled} cursor-not-allowed`
                  : theme.btnBg
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-500">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <a 
                href={accountType === "investor" ? "/register/investor" : "/register/company"} 
                className={`${theme.link} font-medium`}
              >
                Create one
              </a>
            </p>
          </form>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span>🔒 Secure login</span>
          <span>•</span>
          <span>256-bit encryption</span>
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

