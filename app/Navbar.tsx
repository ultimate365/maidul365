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
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/30 shadow-lg">
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
                  text-gray-800 hover:text-indigo-600
                  after:absolute after:-bottom-1 after:left-0 after:h-[3px] after:w-0
                  after:rounded-full after:bg-gradient-to-r after:from-pink-500 after:to-indigo-500
                  after:transition-all hover:after:w-full
                  ${
                    pathname === link.href
                      ? "after:w-full text-indigo-600"
                      : "after:w-0"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-800"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gradient-to-br from-indigo-100 via-white to-pink-100 shadow-xl rounded-b-2xl border-t border-gray-200 animate-fadeIn">
          <div className="flex flex-col space-y-4 py-4 px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`font-semibold transition text-gray-700 hover:text-pink-600 ${
                  pathname === link.href ? "text-indigo-600" : ""
                }`}
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
