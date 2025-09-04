"use client";
import React, { useState } from "react";

export default function DateToMilliseconds() {
  const [date, setDate] = useState("");
  const [milliseconds, setMilliseconds] = useState("");
  const [copied, setCopied] = useState(false);

  const handleDateChange = (e) => {
    const inputDate = e.target.value;
    setDate(inputDate);

    if (inputDate) {
      const ms = new Date(inputDate).getTime();
      setMilliseconds(ms);
    } else {
      setMilliseconds("");
    }
  };

  const handleCopy = () => {
    if (milliseconds) {
      navigator.clipboard.writeText(milliseconds.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-full max-w-md p-4 shadow-lg rounded-2xl bg-white dark:bg-gray-800 transition-colors">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100">
            Date to Milliseconds
          </h2>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          />

          {milliseconds && (
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
              <span className="truncate text-gray-900 dark:text-gray-100">
                {milliseconds}
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {copied ? "✔ Copied" : "📋 Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
