import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { config } from "@/lib/config";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${config.app.name} | Home services in Hyderabad`,
    template: `%s | ${config.app.name}`,
  },
  description:
    "Book verified electricians, AC repair technicians, and plumbers in Hyderabad with transparent quotes and reliable support.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
      style={{ ["--font-heading" as string]: "var(--font-sans)" }}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
