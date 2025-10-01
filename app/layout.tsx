import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./Navbar";

export const metadata: Metadata = {
  title: "Maidul365",
  description: "Tools like CSV to JSON, PDF Editor, and OCR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="antialiased h-full overflow-auto bg-gray-900 text-gray-100">
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
