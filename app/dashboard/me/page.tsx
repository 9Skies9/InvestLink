// app/dashboard/me/page.tsx
import Link from "next/link";

export default function MePage() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      {/* LEFT SIDEBAR */}
      <aside
        style={{
          width: 260,
          backgroundColor: "#2563eb",
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

      {/* RIGHT SIDE: avatar + profile card */}
      <main
        style={{
          flex: 1,
          backgroundColor: "#dcdcdc",
          padding: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 40,
          gap: 32,
        }}
      >
        {/* avatar */}
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            backgroundColor: "#e5e5e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "70%",
              height: "70%",
              borderRadius: "50%",
              backgroundColor: "white",
            }}
          />
        </div>

        {/* profile card */}
        <div
          style={{
            width: "70%",
            maxWidth: 720,
            backgroundColor: "white",
            borderRadius: 20,
            padding: "26px 32px",
            boxShadow: "0 18px 40px rgba(0, 0, 0, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 20,
              top: 18,
              color: "#2563eb",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✏️
          </div>

          <input
            style={{
              width: "100%",
              borderRadius: 18,
              border: "none",
              backgroundColor: "#f5f5f5",
              padding: "10px 16px",
              fontSize: 14,
              outline: "none",
            }}
            placeholder="Your Company Name"
            type="text"
          />
          <input
            style={{
              width: "100%",
              borderRadius: 18,
              border: "none",
              backgroundColor: "#f5f5f5",
              padding: "10px 16px",
              fontSize: 14,
              outline: "none",
            }}
            placeholder="Email"
            type="email"
          />
          <input
            style={{
              width: "100%",
              borderRadius: 18,
              border: "none",
              backgroundColor: "#f5f5f5",
              padding: "10px 16px",
              fontSize: 14,
              outline: "none",
            }}
            placeholder="Contact Number"
            type="tel"
          />
          <input
            style={{
              width: "100%",
              borderRadius: 18,
              border: "none",
              backgroundColor: "#f5f5f5",
              padding: "10px 16px",
              fontSize: 14,
              outline: "none",
            }}
            placeholder="Region/Area"
            type="text"
          />
        </div>
      </main>
    </div>
  );
}
