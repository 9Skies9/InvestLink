import { Briefcase, Building2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  const goTo = (path) => () => navigate(path);

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-orange-50">
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
        <div className="flex items-center gap-3">
          <a
            href="#how-it-works"
            className="text-slate-600 hover:text-slate-900 text-sm"
          >
            How it works
          </a>
          <a href="#faq" className="text-slate-600 hover:text-slate-900 text-sm">
            FAQ
          </a>
          <a
            href="/login"
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Sign in
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-6 pt-6 pb-10">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-8 md:p-12 shadow-sm">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                Smart matching for fundraising
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Meet the right investors & startups — faster.
              </h1>
              <p className="mt-4 max-w-prose text-slate-600">
                InvestLink pairs founders with investors using a transparent,
                data-driven matching algorithm. Create a profile and get curated
                matches in minutes.
              </p>

              {/* CTA Buttons (no blurry backgrounds) */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={goTo("/register/company")}
                  aria-label="Register as a startup"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 px-5 py-3 text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <Building2 className="h-5 w-5" aria-hidden />
                  <span>I'm a Startup</span>
                  <ArrowRight
                    className="h-4 w-4 translate-x-0 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </button>

                <button
                  onClick={goTo("/register/investor")}
                  aria-label="Register as an investor"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-700 px-5 py-3 text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <Briefcase className="h-5 w-5" aria-hidden />
                  <span>I'm an Investor</span>
                  <ArrowRight
                    className="h-4 w-4 translate-x-0 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                No spam. No cold emailing. Just relevant intros when there’s
                mutual interest.
              </p>
            </div>

            {/* Feature preview grid */}
            <div className="order-first md:order-last">
              <div className="grid gap-4 md:grid-cols-2">
                <FeatureCard
                  title="Profile setup"
                  desc="Create a transparent profile with metrics that matter."
                />
                <FeatureCard
                  title="Algorithmic matches"
                  desc="We score compatibility using sector, stage, and traction."
                />
                <FeatureCard
                  title="Mutual opt-in"
                  desc="Intros only happen when both sides want to connect."
                />
                <FeatureCard
                  title="Analytics"
                  desc="See what’s resonating to improve your outreach."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choice Cards */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Choose how you want to get started
        </h2>
        <p className="mt-2 text-center text-slate-600">
          Pick a path below to create your account.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <ChoiceCard
            icon={<Building2 className="h-6 w-6" aria-hidden />}
            label="I'm a Startup"
            description="Register your company, highlight traction, and get matched to aligned investors."
            actionLabel="Register as Startup"
            onClick={goTo("/register/company")}
            ariaLabel="Register as a startup"
            accent="orange"
          />
          <ChoiceCard
            icon={<Briefcase className="h-6 w-6" aria-hidden />}
            label="I'm an Investor"
            description="Set your thesis, ticket size, and preferences to discover curated startups."
            actionLabel="Register as Investor"
            onClick={goTo("/register/investor")}
            ariaLabel="Register as an investor"
            accent="violet"
          />
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

function FeatureCard({ title, desc }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm transition-colors hover:bg-indigo-100">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-700">{desc}</p>
    </div>
  );
}

function ChoiceCard({
  icon,
  label,
  description,
  actionLabel,
  onClick,
  ariaLabel,
  accent = "indigo",
}) {
  const accents = {
    orange: {
      ring: "focus:ring-orange-300",
      border: "border-orange-100",
      bg: "bg-white",
      hover: "hover:shadow-md",
      btn: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300",
      text: "text-orange-700",
      chip: "bg-orange-50 text-orange-700 border border-orange-200",
    },
    violet: {
      ring: "focus:ring-violet-300",
      border: "border-violet-100",
      bg: "bg-white",
      hover: "hover:shadow-md",
      btn: "bg-violet-600 hover:bg-violet-700 focus:ring-violet-300",
      text: "text-violet-700",
      chip: "bg-violet-50 text-violet-700 border border-violet-200",
    },
  };
  const c = accents[accent];

  return (
    <div
      className={`rounded-3xl border ${c.border} ${c.bg} p-6 shadow-sm transition-shadow ${c.hover}`}
    >
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border bg-white shadow-sm">
          {icon}
        </div>
        <div className="flex-1">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.chip}`}
          >
            Quick start
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{label}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
          <button
            onClick={onClick}
            aria-label={ariaLabel}
            className={`group mt-4 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-white shadow ${c.btn} focus:outline-none ${c.ring}`}
          >
            {actionLabel}
            <ArrowRight
              className="h-4 w-4 translate-x-0 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </button>
        </div>
      </div>
    </div>
  );
}
