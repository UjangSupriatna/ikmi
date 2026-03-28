import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/layout/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IKMI SOCIAL - Campus Social Network",
  description: "Connect with fellow students, join groups, and stay updated with campus life at STMIK IKMI Cirebon.",
  keywords: ["IKMI", "campus", "social network", "students", "university", "college", "Cirebon", "STMIK"],
  authors: [{ name: "IKMI SOCIAL Team" }],
  icons: {
    icon: "/logo-ikmi.png",
    apple: "/logo-ikmi.png",
  },
  openGraph: {
    title: "IKMI SOCIAL",
    description: "Sekolah Tinggi Manajemen Informatika dan Komputer - Your campus social network",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IKMI SOCIAL",
    description: "Sekolah Tinggi Manajemen Informatika dan Komputer - Your campus social network",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
