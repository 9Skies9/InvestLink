// app/dashboard/page.tsx
import Link from "next/link";

const DashboardPage = () => {
  return <div
    style={{
      display: "flex",
      minHeight: "100vh",
    }}
  >
    {/* LEFT SIDEBAR */}
    <aside
      style={{
        width: 260,
        backgroundColor: "#2563eb", // blue
        color: "white",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* hamburger icon */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            width: 26,
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          <span
            style={{
              height: 2,
              borderRadius: 999,
              backgroundColor: "white",
              display: "block",
            }}
          />
          <span
            style={{
              height: 2,
              borderRadius: 999,
              backgroundColor: "white",
              display: "block",
            }}
          />
          <span
            style={{
              height: 2,
              borderRadius: 999,
              backgroundColor: "white",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* menu */}
      <nav
        style={{
          marginTop: 40,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          fontSize: 18,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "white",
            textDecoration: "none",
          }}
        >
          <span style={{ width: 20, textAlign: "center" }}>🔍</span>
          <span>Find</span>
        </Link>

        <Link
          href="/dashboard/saved"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "white",
            textDecoration: "none",
          }}
        >
          <span style={{ width: 20, textAlign: "center" }}>⭐</span>
          <span>Saved</span>
        </Link>

        <Link
          href="/dashboard/me"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "white",
            textDecoration: "none",
          }}
        >
          <span style={{ width: 20, textAlign: "center" }}>👤</span>
          <span>Me</span>
        </Link>

        <Link
          href="/dashboard/chat"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "white",
            textDecoration: "none",
          }}
        >
          <span style={{ width: 20, textAlign: "center" }}>💬</span>
          <span>Chat</span>
        </Link>

        <Link
          href="/dashboard/contact"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "white",
            textDecoration: "none",
          }}
        >
          <span style={{ width: 20, textAlign: "center" }}>✉️</span>
          <span>Contact Us</span>
        </Link>
      </nav>
    </aside>

    {/* RIGHT SIDE: blank grey area */}
    <main
      style={{
        flex: 1,
        backgroundColor: "#dcdcdc",
      }}
    />
  </div>;
};

export default DashboardPage;
