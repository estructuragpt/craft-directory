"use client";

import { FormEvent, useState } from "react";
import { catalog, type Locale } from "../../src/lib/i18n";

export default function AuthPage({ locale = "en" }: { locale?: Locale }) {
  const copy = catalog(locale);
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

  return <main className="workspace"><p className="eyebrow">{locale === "es" ? "CUENTA" : "ACCOUNT"}</p><h1>{mode === "sign-in" ? copy.navigation.signIn : locale === "es" ? "Crear tu cuenta" : "Create your account"}</h1><p>{locale === "es" ? "Las cuentas de producción usan Better Auth." : "Production accounts use Better Auth."}</p><form className="provider-form" onSubmit={submit}>{mode === "sign-up" && <input required name="name" placeholder={locale === "es" ? "Nombre" : "Name"} autoComplete="name"/>}<input required name="email" type="email" placeholder="Email" autoComplete="email"/><input required name="password" type="password" minLength={8} placeholder={locale === "es" ? "Contraseña" : "Password"} autoComplete={mode === "sign-in" ? "current-password" : "new-password"}/><button className="primary">{mode === "sign-in" ? copy.navigation.signIn : locale === "es" ? "Crear cuenta" : "Create account"}</button></form><button className="text-button" onClick={signInWithGoogle}>{locale === "es" ? "Continuar con Google" : "Continue with Google"}</button>{notice && <p className="notice">{notice}</p>}<button className="text-button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setNotice(""); }}>{mode === "sign-in" ? locale === "es" ? "¿Necesitas una cuenta? Regístrate" : "Need an account? Sign up" : locale === "es" ? "¿Ya tienes una cuenta? Inicia sesión" : "Already have an account? Sign in"}</button></main>;
}
