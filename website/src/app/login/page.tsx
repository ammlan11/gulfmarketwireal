"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to sign in.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        {/* GMW LOGO */}
<div style={logoWrapperStyle}>
  <Link href="/" aria-label="Go to home page">
    <Image
      src="/images/gmw black-01.svg"
      alt="GMW"
      width={300}
      height={100}
      priority
      style={logoStyle}
    />
  </Link>
</div>

        <h1 style={titleStyle}>Sign In</h1>

        <p style={subtitleStyle}>
          Continue reading GMW.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
            required
          />

          {error && (
            <p
              style={{
                margin: "0 0 14px",
                color: "#c62828",
                fontSize: "14px",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.65 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p style={registerStyle}>
          New to GMW?{" "}
          <Link href="/register">
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f5f5",
  padding: "30px",
};

const cardStyle = {
  width: "100%",
  maxWidth: "460px",
  background: "#fff",
  padding: "40px",
  border: "1px solid #ddd",
};

const logoWrapperStyle = {
  width: "100%",
  height: "90px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  overflow: "hidden",
  marginBottom: "5px",
};

const logoStyle = {
  width: "280px",
  height: "auto",
  display: "block",
};

const titleStyle = {
  margin: "0 0 8px",
  fontSize: "38px",
};

const subtitleStyle = {
  margin: "0 0 30px",
  color: "#666",
};

const inputStyle = {
  width: "100%",
  height: "48px",
  padding: "0 14px",
  marginBottom: "14px",
  border: "1px solid #ccc",
  fontSize: "15px",
};

const buttonStyle = {
  width: "100%",
  height: "48px",
  marginTop: "10px",
  border: 0,
  background: "#000",
  color: "#fff",
  fontWeight: 700,
};

const registerStyle = {
  marginTop: "22px",
  marginBottom: 0,
  textAlign: "center" as const,
};