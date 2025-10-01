"use client";

import Link from "next/link";
import {
  FileText,
  FileSpreadsheet,
  ScanText,
  Calendar,
  Table2,
  Boxes,
  Code2,
  ArrowRightLeft,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-6">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mb-12">
        <h1 className="text-5xl font-extrabold text-indigo-400 drop-shadow-sm">
          Maidul365
        </h1>
        <p className="mt-4 text-lg text-gray-300">
          A comprehensive suite of productivity tools for developers and
          professionals — from file conversions and OCR to specialized utilities
          for dates, tables, and more.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <span className="px-3 py-1 bg-indigo-900 text-indigo-300 rounded-full text-sm">
            File Processing
          </span>
          <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm">
            Data Conversion
          </span>
          <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm">
            OCR & Text Extraction
          </span>
          <span className="px-3 py-1 bg-purple-900 text-purple-300 rounded-full text-sm">
            Developer Tools
          </span>
        </div>
      </section>

      {/* Tools Section */}
      <section className="grid gap-6 md:grid-cols-4 w-full max-w-7xl">
        <Link
          href="/pdf"
          className="group bg-gray-800 shadow-lg rounded-2xl p-4 flex flex-col items-center justify-between hover:shadow-2xl transition-transform transform hover:-translate-y-1 border border-gray-700 h-[200px]"
        >
          <FileText className="w-10 h-10 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-gray-300 mb-2 text-center">
            PDF Tools
          </h2>
          <p className="text-sm text-gray-400 text-center">
            View, edit, and manipulate PDF files directly in your browser.
          </p>
        </Link>

        <Link
          href="/ocr"
          className="group bg-gray-800 shadow-lg rounded-2xl p-4 flex flex-col items-center justify-between hover:shadow-2xl transition-transform transform hover:-translate-y-1 border border-gray-700 h-[200px]"
        >
          <ScanText className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-gray-300 mb-2 text-center">
            OCR
          </h2>
          <p className="text-sm text-gray-400 text-center">
            Extract text from images using Optical Character Recognition.
          </p>
        </Link>

        {/* File Conversion Tools */}
        <Link
          href="/csvToJson"
          className="group bg-gray-800 shadow-lg rounded-2xl p-4 flex flex-col items-center justify-between hover:shadow-2xl transition-transform transform hover:-translate-y-1 border border-gray-700 h-[200px]"
        >
          <FileSpreadsheet className="w-10 h-10 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-gray-300 mb-2 text-center">
            CSV ⇄ JSON
          </h2>
          <p className="text-sm text-gray-400 text-center">
            Convert between CSV and JSON formats with ease.
          </p>
        </Link>
        {/* Next to React Converter */}
        <Link
          href="/nextToReact"
          className="group bg-gray-800 shadow-lg rounded-2xl p-4 flex flex-col items-center justify-between hover:shadow-2xl transition-transform transform hover:-translate-y-1 border border-gray-700 h-[200px]"
        >
          <ArrowRightLeft className="min-w-10 min-h-10 text-indigo-500 mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-gray-300 mb-2 text-center">
            Next.js Converter
          </h2>
          <p className="text-sm text-gray-400 text-center">
            Convert Next.js to React components with automatic code
            transformation.
          </p>
        </Link>
        <Link
          href="/table"
          className="group bg-gray-800 shadow-lg rounded-2xl p-4 flex flex-col items-center justify-between hover:shadow-2xl transition-transform transform hover:-translate-y-1 border border-gray-700 h-[200px]"
        >
          <Table2 className="w-10 h-10 text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-gray-300 mb-2 text-center">
            Table Tools
          </h2>
          <p className="text-sm text-gray-400 text-center">
            Create, edit, and export tables with advanced formatting options.
          </p>
        </Link>

        <Link
          href="/milli"
          className="group bg-gray-800 shadow-lg rounded-2xl p-4 flex flex-col items-center justify-between hover:shadow-2xl transition-transform transform hover:-translate-y-1 border border-gray-700 h-[200px]"
        >
          <Calendar className="w-10 h-10 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-gray-300 mb-2 text-center">
            Date Utilities
          </h2>
          <p className="text-sm text-gray-400 text-center">
            Convert and manipulate dates in various formats.
          </p>
        </Link>
        <Link
          href="/cuber"
          className="group bg-gray-800 shadow-lg rounded-2xl p-4 flex flex-col items-center justify-between hover:shadow-2xl transition-transform transform hover:-translate-y-1 border border-gray-700 h-[200px]"
        >
          <Boxes className="w-10 h-10 text-indigo-500 mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-bold text-gray-300 mb-2 text-center">
            Cube Solver
          </h2>
          <p className="text-sm text-gray-400 text-center">
            Interactive 3D cube visualization and solver tool.
          </p>
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-gray-400 text-sm">
        © {new Date().getFullYear()} Maidul365. All rights reserved.
      </footer>
    </main>
  );
}
