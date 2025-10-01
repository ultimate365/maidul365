"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/csvToJson", label: "CSV ⇄ JSON" },
    { href: "/pdf", label: "PDF" },
    { href: "/ocr", label: "OCR" },
    { href: "/nextToReact", label: "Next to React" },
    { href: "/milli", label: "Date" },
    { href: "/cuber", label: "Cube" },
    { href: "/table", label: "Table" },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/90 shadow-lg shadow-gray-800/30 border-b border-gray-800 noprint">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <Link
            href="/"
            className="text-2xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent animate-gradient-x"
          >
            Maidul365
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative font-semibold transition
                  text-gray-200 hover:text-indigo-400
                  after:absolute after:-bottom-1 after:left-0 after:h-[3px] after:w-0
                  after:rounded-full after:bg-gradient-to-r after:from-pink-500 after:to-indigo-500
                  after:transition-all hover:after:w-full
                  ${
                    pathname === link.href
                      ? "after:w-full text-indigo-400"
                      : "after:w-0"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-gray-300 hover:text-indigo-400 focus:outline-none"
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden animate-fadeIn">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900 shadow-lg shadow-gray-800/30">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition
                  ${
                    pathname === link.href
                      ? "bg-indigo-900/30 text-indigo-400"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
