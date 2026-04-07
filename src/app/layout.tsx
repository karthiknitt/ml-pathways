import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "ML Pathways - Interactive ML Learning Platform",
  description: "Explore foundational ML problems through hands-on experimentation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased dark:bg-gray-950">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
