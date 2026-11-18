import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinchPay refund desk",
  description: "A three-role refund agent with a verification rule enforced in code.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
