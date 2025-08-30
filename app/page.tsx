"use client";

import Link from "next/link";
import { FileText, FileSpreadsheet, ScanText } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mb-12">
        <h1 className="text-5xl font-extrabold text-indigo-600 drop-shadow-sm">
          Maidul365
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          A powerful suite of tools to make your work easier — convert CSV
          files, edit PDFs, and perform Image OCR all in one place.
        </p>
      </section>

      {/* Tools Section */}
      <section className="grid gap-6 md:grid-cols-3 w-full max-w-5xl">
        {/* CSV to JSON */}
        <Link
          href="/csvToJson"
          className="group bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center hover:shadow-2xl transition-transform transform hover:-translate-y-1"
        >
          <FileSpreadsheet className="w-12 h-12 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold text-gray-800">
            CSV ⇄ JSON Converter
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Easily convert CSV files to JSON and back in just a click.
          </p>
        </Link>

        {/* PDF Editor */}
        <Link
          href="/pdf"
          className="group bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center hover:shadow-2xl transition-transform transform hover:-translate-y-1"
        >
          <FileText className="w-12 h-12 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold text-gray-800">PDF Editor</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Merge, split, edit, and annotate PDF files with ease.
          </p>
        </Link>

        {/* OCR Tool */}
        <Link
          href="/ocr"
          className="group bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center hover:shadow-2xl transition-transform transform hover:-translate-y-1"
        >
          <ScanText className="w-12 h-12 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold text-gray-800">Image OCR</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Extract text from images instantly with AI-powered OCR.
          </p>
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-gray-500 text-sm">
        © {new Date().getFullYear()} Maidul365. All rights reserved.
      </footer>
    </main>
  );
}
