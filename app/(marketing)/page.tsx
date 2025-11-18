import Link from "next/link";

import styles from "./landing.module.css";

const highlights = [
  {
    title: "Investor CRM",
    body: "Consolidate conversations, intros, and follow-ups so your team never drops the ball.",
  },
  {
    title: "Updates that ship",
    body: "Publish investor-ready updates with metrics, milestones, and calls to action in minutes.",
  },
  {
    title: "Visibility you control",
    body: "Share the right data with the right people using roles, permissions, and audit trails.",
  },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.logo}>InvestLink</div>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.link}>
            Log in
          </Link>
          <Link href="/login" className={styles.cta}>
            Get started
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Raise smarter. Report faster.</p>
          <h1 className={styles.title}>
            Keep investors aligned while you close your next round.
          </h1>
          <p className={styles.subtitle}>
            InvestLink is the workspace for founders to orchestrate fundraising, share
            updates, and keep stakeholders confident.
          </p>
          <div className={styles.actions}>
            <Link href="/login" className={styles.primaryCta}>
              Go to login
            </Link>
            <Link href="#features" className={styles.secondaryCta}>
              See how it works
            </Link>
          </div>
          <div className={styles.trustBar}>
            <span className={styles.trustLabel}>Built for teams raising today</span>
            <div className={styles.trustDots}>
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>Pipeline overview</p>
              <h2 className={styles.cardTitle}>Active conversations</h2>
            </div>
            <span className={styles.badge}>Live</span>
          </div>
          <dl className={styles.metrics}>
            <div className={styles.metric}>
              <dt>Warm intros</dt>
              <dd>14</dd>
            </div>
            <div className={styles.metric}>
              <dt>Partner meetings</dt>
              <dd>6</dd>
            </div>
            <div className={styles.metric}>
              <dt>Committed</dt>
              <dd>$2.1M</dd>
            </div>
          </dl>
          <div className={styles.footerNote}>View full detail after you sign in.</div>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>What you get</p>
          <h2 className={styles.sectionTitle}>Purpose-built for modern investor relations</h2>
          <p className={styles.sectionSubtitle}>
            Designed to keep your team, advisors, and investors marching in the same
            direction.
          </p>
        </div>
        <div className={styles.grid}>
          {highlights.map((item) => (
            <article key={item.title} className={styles.card}>
              <h3 className={styles.cardHeading}>{item.title}</h3>
              <p className={styles.cardBody}>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
