import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RiskLens — Environmental Risk Intelligence",
  description:
    "RiskLens brings environmental risk maps, future forecasts, and trusted information together to help people understand and prepare for changing environmental conditions.",
  keywords: [
    "environmental risk",
    "climate risk maps",
    "flood forecasting",
    "hazard predictions",
    "RAG AI assistant",
    "climate intelligence",
  ],
  authors: [{ name: "RiskLens Team" }],
  openGraph: {
    title: "RiskLens — See Risk Before It Reaches You",
    description:
      "Understand environmental risk through high-resolution risk maps, multi-day forecasting, and trusted RAG guidance.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FAFAF9] text-[#0F172A]">
        {children}
      </body>
    </html>
  );
}
