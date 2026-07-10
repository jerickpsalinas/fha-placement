import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FHA Student Placement & Schedule Builder",
  description: "Father's H.A.R.B.O.R. Academy — staff placement, graduation, and scheduling tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
