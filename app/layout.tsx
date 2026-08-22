import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ADA Website Lawsuit Tracker",
  description: "Federal ADA website lawsuit filings and analytics"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
