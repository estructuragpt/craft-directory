"use client";

import { FormEvent, useState } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = { email: String(data.get("email")), password: String(data.get("password")), ...(mode === "sign-up" ? { name: String(data.get("name")) } : {}) };
    const response = await fetch(`/api/auth/${mode}/email`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) return setNotice((await response.json().catch(() => null))?.message ?? "Authentication is unavailable. Configure Better Auth to continue.");
    window.location.assign("/");
  }
  async function signInWithGoogle() {
    setNotice("");
    const response = await fetch("/api/auth/sign-in/social", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider: "google", callbackURL: "/" }) });
    const result = await response.json().catch(() => null) as { url?: string; message?: string } | null;
    if (!response.ok || !result?.url) return setNotice(result?.message ?? "Google sign-in is unavailable. Configure the server-side Google OAuth credentials.");
    window.location.assign(result.url);
  }

  return <main className="workspace"><p className="eyebrow">ACCOUNT</p><h1>{mode === "sign-in" ? "Sign in" : "Create your account"}</h1><p>Production accounts use Better Auth. The demo role switch is not a sign-in method.</p><form className="provider-form" onSubmit={submit}>{mode === "sign-up" && <input required name="name" placeholder="Name" autoComplete="name"/>}<input required name="email" type="email" placeholder="Email" autoComplete="email"/><input required name="password" type="password" minLength={8} placeholder="Password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"}/><button className="primary">{mode === "sign-in" ? "Sign in" : "Create account"}</button></form><button className="text-button" onClick={signInWithGoogle}>Continue with Google</button>{notice && <p className="notice">{notice}</p>}<button className="text-button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setNotice(""); }}>{mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button></main>;
}
