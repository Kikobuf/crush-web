import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "crush-web",
  description: "A local browser UI for charmbracelet/crush",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">{children}</body>
    </html>
  );
}
