import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beesz — Founder Onboarding",
  description: "Conversational onboarding for Beesz, the founder operating system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
