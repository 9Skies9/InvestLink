"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("✅ handleSubmit ran");
    router.push("/dashboard");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "320px",
          padding: "24px",
          borderRadius: "16px",
          background: "white",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h1 style={{ fontSize: "24px", marginBottom: "8px", textAlign: "center" }}>
          Sign In
        </h1>

        <label style={{ fontSize: "14px" }}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              marginTop: "4px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
            }}
          />
        </label>

        <label style={{ fontSize: "14px" }}>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              marginTop: "4px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            marginTop: "8px",
            padding: "10px",
            borderRadius: "999px",
            border: "none",
            background: "#1d4ed8",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Log In
        </button>
      </form>
    </main>
  );
}
