import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "CraftDirectory", description: "A local-first professional directory demo" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
