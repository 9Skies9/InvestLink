// File: app/login/page.tsx (Next.js App Router)
"use client";
import { useState } from "react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  function validateEmail(v: string) {
    return /^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(v);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) {
      alert("Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    // TODO: replace with your real login call
    // const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    // if (res.ok) router.push("/app"); else alert("Login failed");
    alert("Form OK — wire this up to your backend!");
  }

  return (
    <main className="wrap">
      <h1 className="title">Sign In</h1>
      <p className="lead">
        Don’t have an account? <a href="#" className="link">Create an Account</a>
      </p>

      <section className="card" aria-label="Login form">
        <form onSubmit={onSubmit} className="form" noValidate>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="label" htmlFor="password">Password</label>
          <div className="pwd">
            <input
              id="password"
              type={show ? "text" : "password"}
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="button"
              aria-pressed={show}
              aria-label="Toggle password visibility"
              className="eye"
              onClick={() => setShow((s) => !s)}
              title="Show/Hide password"
            >
              {/* Eye icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>

          <button type="submit" className="btnPrimary">Log In</button>

          <div className="divider">Or</div>

          <button type="button" className="btnGoogle" onClick={() => alert("Connect this to your Google OAuth flow") }>
            <svg className="gicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12  s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.088,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20  s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657  C33.64,6.053,29.088,4,24,4C15.627,4,8.597,8.671,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.088,0,9.64-2.053,12.961-5.382l-5.981-5.057C29.006,35.477,26.627,36,24,36  c-5.192,0-9.607-3.317-11.271-7.946l-6.5,5.017C8.486,39.246,15.676,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.021,5.561  c0.001-0.001,0.002-0.001,0.003-0.002l6.5,5.017C36.676,39.246,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
            Log in with Google
          </button>
        </form>
      </section>

      <style jsx>{`
        :root{ --blue: #356AE6; --blueD: #2f5fce; --card: #2567E8; --line:#e7e9ee; --text:#101214; }
        .wrap{ min-height: 100svh; display:grid; place-content:center; gap:10px; padding:40px 16px; background: radial-gradient(1200px 800px at 50% -10%, var(--blue) 0%, var(--blueD) 60%), var(--blue); }
        .title{ color: #356AE6;; text-align:center; margin:0; font-size: clamp(24px, 3.4vw, 36px); }
        .lead{ color: #356AE6; text-align:center; margin:0 0 10px; font-size:14px; }
        .link{ color: #356AE6; font-weight:600; text-decoration:underline; text-underline-offset:3px; }

        .card{ width:360px; max-width:100%; margin:0 auto; background:var(--card); border:1px solid #f2f3f7; border-radius:16px; box-shadow:0 24px 60px rgba(27,35,53,.20), 0 8px 20px rgba(27,35,53,.12); padding:22px; }
        .form{ display:grid; gap:14px; }
        .label{ font-size:14px; color:#3a4150; }
        .input{ width:100%; padding:12px 14px; border-radius:12px; outline:none; background:#f7f8fb; border:1px solid var(--line); color:var(--text); }
        .input:focus{ border-color: var(--blue); box-shadow: 0 0 0 3px rgba(53,106,230,.18); background:#fff; }

        .pwd{ position:relative; }
        .eye{ position:absolute; right:10px; top:50%; transform:translateY(-50%); border:1px solid var(--line); background:#f0f2f7; border-radius:10px; padding:6px; cursor:pointer; }

        .btnPrimary{ width:100%; padding:12px 14px; border-radius:12px; border:0; cursor:pointer; font-weight:600; color:#fff; background:linear-gradient(180deg,#3d74ff,#3365e3); box-shadow: inset 0 1px 0 rgba(255,255,255,.2); }
        .btnPrimary:active{ transform: translateY(1px); }

        .divider{ display:flex; align-items:center; gap:10px; color:#98a1b3; font-size:13px; margin:6px 0; }
        .divider::before,.divider::after{ content:""; flex:1; height:1px; background:var(--line); }

        .btnGoogle{ width:100%; padding:10px 12px; border-radius:12px; background:#fff; border:1px solid var(--line); display:flex; align-items:center; justify-content:center; gap:10px; cursor:pointer; font-weight:600; color:#202124; }
        .gicon{ width:18px; height:18px; }

        @media (max-width:480px){ .card{ padding:18px; } }
      `}</style>
    </main>

      )
}
