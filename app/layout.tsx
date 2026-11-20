import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Knowledge Base",
  description: "Internal articles and documentation for our team",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
