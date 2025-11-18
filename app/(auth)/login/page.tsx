"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "./login.module.css";

function validateEmail(v: string) {
  return /^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(v);
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

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
    alert("Form OK — wire this up to your backend!");
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          InvestLink
        </Link>
        <Link href="/" className={styles.backLink}>
          Back to home
        </Link>
      </header>

      <section className={styles.card} aria-label="Login form">
        <div className={styles.cardHeader}>
          <p className={styles.kicker}>Welcome back</p>
          <h1 className={styles.title}>Sign in to continue</h1>
          <p className={styles.lead}>
            Access your deal flow, investor updates, and portfolio dashboard.
          </p>
        </div>

        <form onSubmit={onSubmit} className={styles.form} noValidate>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            placeholder="you@example.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <div className={styles.pwd}>
            <input
              id="password"
              type={show ? "text" : "password"}
              className={styles.input}
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
              className={styles.eye}
              onClick={() => setShow((s) => !s)}
              title="Show/Hide password"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#667085"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          <button type="submit" className={styles.btnPrimary}>
            Log In
          </button>

          <div className={styles.divider}>Or</div>

          <button
            type="button"
            className={styles.btnGoogle}
            onClick={() => alert("Connect this to your Google OAuth flow")}
          >
            <svg
              className={styles.gicon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              aria-hidden
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12  s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.088,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20  s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657  C33.64,6.053,29.088,4,24,4C15.627,4,8.597,8.671,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.088,0,9.64-2.053,12.961-5.382l-5.981-5.057C29.006,35.477,26.627,36,24,36  c-5.192,0-9.607-3.317-11.271-7.946l-6.5,5.017C8.486,39.246,15.676,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.021,5.561  c0.001-0.001,0.002-0.001,0.003-0.002l6.5,5.017C36.676,39.246,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Log in with Google
          </button>
        </form>
      </section>

      <aside className={styles.sideCard}>
        <p className={styles.sideKicker}>Why founders choose us</p>
        <h2 className={styles.sideTitle}>Keep investors close and deals closer</h2>
        <ul className={styles.sideList}>
          <li>Track conversations, intros, and timelines in one place.</li>
          <li>Share investor-ready updates without juggling spreadsheets.</li>
          <li>Coordinate with your team using secure workspaces.</li>
        </ul>
      </aside>
    </main>
  );
}
