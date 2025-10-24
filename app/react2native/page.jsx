"use client";

import React, { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import {
  Download,
  RefreshCw,
  Clipboard,
  Code,
  Zap,
  Loader2,
  Check,
  X,
  FileJson,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TailwindToReactNativeConverter = () => {
  const [inputCode, setInputCode] = useState("");
  const [outputCode, setOutputCode] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [hasConverted, setHasConverted] = useState(false);
  const [conversionStats, setConversionStats] = useState({
    tailwindClasses: 0,
    bootstrapClasses: 0,
    unconvertedClasses: 0,
    componentsConverted: 0,
  });
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [error, setError] = useState(null);

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: "on",
    theme: "vs-dark",
  };

  // Clipboard function
  const copyToClipboard = useCallback(() => {
    if (!navigator.clipboard) {
      alert("Clipboard API not supported in this browser");
      return;
    }

    navigator.clipboard.writeText(outputCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [outputCode]);

  // Download output as file
  const downloadCode = useCallback(() => {
    const element = document.createElement("a");
    const file = new Blob([outputCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "converted-react-native-code.js";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [outputCode]);

  // Main convert handler
  const handleConvert = useCallback(() => {
    setIsConverting(true);
    setError(null);

    setTimeout(() => {
      try {
        const { convertedCode, stats } = convertCode(inputCode);
        setOutputCode(convertedCode);
        setConversionStats(stats);
        setHasConverted(true);
        setShowStats(true);
      } catch (err) {
        console.error("Conversion Error:", err);
        setError(err.message);
      } finally {
        setIsConverting(false);
      }
    }, 500);
  }, [inputCode]);

  // Reset all
  const resetAll = useCallback(() => {
    setInputCode("");
    setOutputCode("");
    setHasConverted(false);
    setShowStats(false);
    setConversionStats({
      tailwindClasses: 0,
      bootstrapClasses: 0,
      unconvertedClasses: 0,
      componentsConverted: 0,
    });
    setError(null);
  }, []);

  // Auto example on load
  useEffect(() => {
    setInputCode(
      `<div className="bg-blue-500 text-white p-4 rounded-lg">
  <h1 className="text-xl font-bold mb-2">Welcome</h1>
  <p className="text-sm">This is a Tailwind example.</p>
</div>`
    );
  }, []);

  // Convert className to style
  const convertClassNameToStyle = (className) => {
    if (!className) return {};

    const classMap = {
      "bg-blue-500": "backgroundColor: '#3B82F6'",
      "text-white": "color: 'white'",
      "p-4": "padding: 16",
      "rounded-lg": "borderRadius: 12",
      "text-xl": "fontSize: 20",
      "font-bold": "fontWeight: 'bold'",
      "mb-2": "marginBottom: 8",
      "text-sm": "fontSize: 14",
    };

    const classes = className.trim().split(/\s+/);
    const styleEntries = classes.map((cls) => classMap[cls]).filter(Boolean);

    return {
      styleString: `{ ${styleEntries.join(", ")} }`,
      stats: {
        tailwindClasses: classes.length,
        bootstrapClasses: 0,
        unconvertedClasses: classes.length - styleEntries.length,
      },
    };
  };

  // Convert HTML to React Native JSX
  const convertCode = (code) => {
    let convertedCode = code;
    const stats = {
      tailwindClasses: 0,
      bootstrapClasses: 0,
      unconvertedClasses: 0,
      componentsConverted: 0,
    };

    convertedCode = convertedCode.replace(/<div/g, "<View");
    convertedCode = convertedCode.replace(/<\/div>/g, "</View>");
    convertedCode = convertedCode.replace(/<h1/g, "<Text");
    convertedCode = convertedCode.replace(/<\/h1>/g, "</Text>");
    convertedCode = convertedCode.replace(/<p/g, "<Text");
    convertedCode = convertedCode.replace(/<\/p>/g, "</Text>");

    const classNameRegex = /className=["']([^"']+)["']/g;
    let match;
    const styleReplacements = [];

    while ((match = classNameRegex.exec(convertedCode)) !== null) {
      const { styleString, stats: styleStats } = convertClassNameToStyle(
        match[1]
      );

      stats.tailwindClasses += styleStats.tailwindClasses;
      stats.bootstrapClasses += styleStats.bootstrapClasses;
      stats.unconvertedClasses += styleStats.unconvertedClasses;

      styleReplacements.push({
        fullMatch: match[0],
        replacement: `style=${styleString}`,
      });
    }

    styleReplacements.reverse().forEach(({ fullMatch, replacement }) => {
      convertedCode = convertedCode.replace(fullMatch, replacement);
    });

    const importRegex = /import[\s\S]+?from\s+['"][^'"]+['"];?\s*\n/g;
    const importMatch = convertedCode.match(importRegex);

    const reactNativeImports = `import { View, Text } from 'react-native';\n`;
    if (importMatch) {
      convertedCode = convertedCode.replace(
        importRegex,
        importMatch[0] + reactNativeImports
      );
    } else {
      convertedCode = reactNativeImports + convertedCode;
    }

    // Inject StyleSheet import correctly
    if (
      convertedCode.includes("style={") &&
      !convertedCode.includes("StyleSheet")
    ) {
      convertedCode = convertedCode.replace(
        /import\s*{\s*([^}]*)}\s*from\s*['"]react-native['"]/,
        "import { $1, StyleSheet } from 'react-native'"
      );
    }

    stats.componentsConverted =
      (convertedCode.match(/<View/g) || []).length +
      (convertedCode.match(/<Text/g) || []).length;

    return { convertedCode, stats };
  };

  // Animated Stat Card
  const StatCard = ({ label, value, color }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`bg-gray-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg border border-gray-700`}
    >
      <div className={`text-${color}-400 text-2xl font-bold`}>{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </motion.div>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 text-gray-200">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Code className="text-blue-400" size={22} />
          <h1 className="text-lg font-semibold text-white">
            Tailwind → React Native Converter
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          {hasConverted && (
            <>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg transition"
              >
                {copied ? <Check size={16} /> : <Clipboard size={16} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={downloadCode}
                className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded-lg transition"
              >
                <Download size={16} /> Download
              </button>
            </>
          )}
          <button
            onClick={resetAll}
            className="flex items-center gap-1 bg-red-700 hover:bg-red-600 px-3 py-1 rounded-lg transition"
          >
            <RefreshCw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Editors */}
      <div className="flex flex-1">
        <div className="w-1/2 border-r border-gray-700 relative">
          <div className="absolute top-2 left-2 text-xs text-gray-400">
            Input Code
          </div>
          {typeof window !== "undefined" ? (
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={inputCode}
              onChange={setInputCode}
              theme="vs-dark"
              options={editorOptions}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-blue-400">Loading Editor...</div>
            </div>
          )}
        </div>

        <div className="w-1/2 relative">
          <div className="absolute top-2 left-2 text-xs text-gray-400">
            Output Code
          </div>
          {typeof window !== "undefined" ? (
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={outputCode}
              theme="vs-dark"
              options={editorOptions}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-blue-400">Loading Editor...</div>
            </div>
          )}
        </div>
      </div>

      {/* Convert button */}
      <div className="bg-gray-800 p-4 flex justify-center items-center border-t border-gray-700">
        <button
          onClick={handleConvert}
          disabled={isConverting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-semibold transition disabled:opacity-60"
        >
          {isConverting ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Converting...
            </>
          ) : (
            <>
              <Zap size={18} /> Convert Now
            </>
          )}
        </button>
      </div>

      {/* Conversion Stats */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-xl flex space-x-4"
          >
            <StatCard label="Tailwind Classes" value={conversionStats.tailwindClasses} color="blue" />
            <StatCard label="Bootstrap Classes" value={conversionStats.bootstrapClasses} color="green" />
            <StatCard label="Unconverted" value={conversionStats.unconvertedClasses} color="red" />
            <StatCard label="Components" value={conversionStats.componentsConverted} color="yellow" />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="bg-red-800 text-white p-3 text-center text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default TailwindToReactNativeConverter;