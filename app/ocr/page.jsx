"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Tesseract from "tesseract.js";
import dynamic from "next/dynamic";

// We'll initialize PDF.js only on the client side
let pdfjsLib = null;

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

const LANG_OPTIONS = [
  { label: "English (eng)", value: "eng" },
  { label: "Hindi (hin)", value: "hin" },
  { label: "Bengali (ben)", value: "ben" },
  { label: "Arabic (ara)", value: "ara" },
  { label: "Chinese Simplified (chi_sim)", value: "chi_sim" },
  { label: "French (fra)", value: "fra" },
  { label: "German (deu)", value: "deu" },
];

const PSM_OPTIONS = [
  { label: "Auto (blocks) — psm 3", value: "3" },
  { label: "Single uniform block — psm 6", value: "6" },
  { label: "Single text line — psm 7", value: "7" },
  { label: "Sparse text — psm 11", value: "11" },
];

export default function OCR() {
  const [files, setFiles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageURL, setImageURL] = useState("");
  const [lang, setLang] = useState("eng");
  const [psm, setPsm] = useState("3");
  const [ocrText, setOcrText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);
  const [isPdf, setIsPdf] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);

  const inputRef = useRef(null);
  const dropRef = useRef(null);

  // Initialize PDF.js on the client side only
  useEffect(() => {
    const loadPdfJs = async () => {
      if (typeof window === "undefined") return;

      try {
        pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs`;
        setPdfJsLoaded(true);
      } catch (error) {
        console.error("Error loading PDF.js:", error);
        setError("Failed to load PDF library. Please try again later.");
      }
    };

    loadPdfJs();
  }, []);

  const activeFile = files[activeIndex] || null;
  const activeSrc = useMemo(() => {
    if (!activeFile) return "";
    return URL.createObjectURL(activeFile);
  }, [activeFile]);

  // Update PDF preview when page changes
  useEffect(() => {
    if (isPdf && activeFile && pdfjsLib && pdfJsLoaded) {
      (async () => {
        try {
          const pdf = await pdfjsLib.getDocument(await activeFile.arrayBuffer())
            .promise;
          const dataUrl = await renderPdfPageToImage(pdf, currentPdfPage);
          setPdfPreviewUrl(dataUrl);
        } catch (err) {
          console.error("Error rendering PDF preview:", err);
          setError("Failed to render PDF preview");
        }
      })();
    }
  }, [isPdf, activeFile, currentPdfPage, pdfjsLib, pdfJsLoaded]);

  useEffect(() => {
    return () => {
      if (activeSrc) URL.revokeObjectURL(activeSrc);
    };
  }, [activeSrc]);

  const handlePdfFile = async (file) => {
    if (!pdfjsLib || !pdfJsLoaded) {
      setError("PDF library is still loading. Please try again in a moment.");
      return null;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfPageCount(pdf.numPages);
      setIsPdf(true);
      setCurrentPdfPage(1);

      // Generate preview for the first page
      const dataUrl = await renderPdfPageToImage(pdf, 1);
      setPdfPreviewUrl(dataUrl);

      return pdf;
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError("Failed to load PDF file. Make sure it's a valid PDF.");
      return null;
    }
  };

  const onPickFiles = async (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;

    setError("");
    setIsPdf(false);
    setPdfPageCount(0);

    // Handle first file (for now we process one file at a time)
    const file = list[0];
    if (file.type === "application/pdf") {
      const pdf = await handlePdfFile(file);
      if (pdf) {
        setFiles([file]);
        setActiveIndex(0);
      }
    } else if (file.type.startsWith("image/")) {
      setFiles([file]);
      setActiveIndex(0);
    }
  };

  const onDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = Array.from(e.dataTransfer.files || []);

    // Handle first dropped file
    if (dropped.length > 0) {
      const file = dropped[0];
      setError("");
      setIsPdf(false);
      setPdfPageCount(0);

      if (file.type === "application/pdf") {
        const pdf = await handlePdfFile(file);
        if (pdf) {
          setFiles([file]);
          setActiveIndex(0);
        }
      } else if (file.type.startsWith("image/")) {
        setFiles([file]);
        setActiveIndex(0);
      }
    }
  }, []);

  const onPaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith("image/")) {
        const blob = it.getAsFile();
        if (blob) setFiles((prev) => [...prev, blob]);
      }
    }
  }, []);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    el.addEventListener("dragover", prevent);
    el.addEventListener("dragenter", prevent);
    el.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      el.removeEventListener("dragover", prevent);
      el.removeEventListener("dragenter", prevent);
      el.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, [onDrop, onPaste]);

  const addByUrl = async () => {
    setError("");
    try {
      if (!imageURL.trim()) return;
      const res = await fetch(imageURL, { mode: "cors" });
      const blob = await res.blob();
      const file = new File([blob], `url-image-${Date.now()}.png`, {
        type: blob.type || "image/png",
      });
      setFiles((prev) => [...prev, file]);
      setImageURL("");
      if (!files.length) setActiveIndex(0);
    } catch (e) {
      setError("Failed to fetch image from URL. Check CORS and the URL.");
    }
  };

  const renderPdfPageToImage = async (pdf, pageNumber) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;

      return canvas.toDataURL("image/png");
    } catch (err) {
      console.error("Error rendering PDF page:", err);
      throw new Error("Failed to render PDF page");
    }
  };

  const runOCR = async () => {
    if (!activeFile) return;
    setIsRunning(true);
    setProgress(0);
    setStatus("Initializing...");
    setError("");
    setOcrText("");

    try {
      let imageToProcess;

      if (isPdf) {
        if (!pdfjsLib || !pdfJsLoaded) {
          setError(
            "PDF library is still loading. Please try again in a moment."
          );
          setIsRunning(false);
          return;
        }
        setStatus("Loading PDF...");
        const pdf = await pdfjsLib.getDocument(await activeFile.arrayBuffer())
          .promise;
        setStatus(`Rendering page ${currentPdfPage}...`);
        imageToProcess = await renderPdfPageToImage(pdf, currentPdfPage);
      } else {
        imageToProcess = activeSrc;
      }

      setStatus("Running OCR...");
      const result = await Tesseract.recognize(imageToProcess, lang, {
        tessedit_pageseg_mode: psm,
        imageColor: true,
        logger: (m) => {
          if (m.status) setStatus(m.status);
          if (typeof m.progress === "number")
            setProgress(Math.round(m.progress * 100));
        },
      });

      const text = result?.data?.text || "";
      setOcrText(text);
      setStatus("Done");
      setProgress(100);
    } catch (e) {
      console.error(e);
      setError(e?.message || "OCR failed");
    } finally {
      setIsRunning(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setActiveIndex(0);
    setOcrText("");
    setStatus("Idle");
    setProgress(0);
    setError("");
    setImageURL("");
  };

  const removeAt = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    if (activeIndex === idx) setActiveIndex(0);
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(ocrText || "");
    } catch {}
  };

  const downloadText = () => {
    const blob = new Blob([ocrText || ""], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocr-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-3 flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Image & PDF OCR</h1>
          {(files.length > 0 || imageURL.trim() || ocrText.trim()) && (
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                className="px-3 py-2 rounded-xl border border-gray-600 hover:bg-gray-700"
                title="Reset all"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <section className="lg:col-span-1 space-y-4">
          <div className="p-4 bg-gray-800 rounded-2xl shadow">
            <h2 className="font-semibold mb-3">1) Add images</h2>
            <div
              ref={dropRef}
              className="border-2 border-dashed border-gray-600 rounded-2xl p-6 text-center bg-gray-900"
            >
              <p className="mb-2 font-medium">
                Drag & drop images or PDF files here
              </p>
              <p className="text-sm text-gray-400 mb-3">or</p>
              <div className="flex items-center justify-center gap-2">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={onPickFiles}
                  className="hidden"
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  className="px-3 py-2 rounded-xl border border-gray-600 bg-gray-700 hover:bg-gray-600"
                >
                  Choose file
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Supports images (PNG, JPG, etc.) and PDF files.
                {!isPdf &&
                  " You can also paste (Ctrl/Cmd+V) screenshots directly."}
              </p>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageURL}
                onChange={(e) => setImageURL(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-600 bg-gray-700 rounded-xl"
              />
              <button
                onClick={addByUrl}
                className="px-3 py-2 rounded-xl border border-gray-600 bg-gray-700 hover:bg-gray-600"
              >
                Add URL
              </button>
            </div>

            {files.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Queue ({files.length})</h3>
                  <span className="text-xs text-gray-400">
                    Click a thumbnail to select
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-auto pr-1">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className={classNames(
                        "relative border border-gray-600 rounded-xl overflow-hidden cursor-pointer group",
                        i === activeIndex ? "ring-2 ring-blue-500" : ""
                      )}
                      onClick={() => setActiveIndex(i)}
                    >
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="h-16 w-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAt(i);
                        }}
                        className="absolute top-1 right-1 text-xs bg-gray-800/90 hover:bg-gray-700 px-1.5 py-0.5 rounded"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-800 rounded-2xl shadow space-y-3">
            <h2 className="font-semibold">2) Settings</h2>
            <label className="block text-sm">Language</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-xl"
            >
              {LANG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className="block text-sm mt-2">Page Segmentation Mode</label>
            <select
              value={psm}
              onChange={(e) => setPsm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-xl"
            >
              {PSM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 mt-2 text-sm">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
              />
              Auto-rotate & detect orientation
            </label>

            <button
              onClick={runOCR}
              disabled={!activeFile || isRunning}
              className={classNames(
                "w-full mt-3 px-4 py-2 rounded-xl text-white",
                isRunning ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isRunning ? "Running OCR…" : "Run OCR on Selected Image"}
            </button>

            <div className="mt-3">
              <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                <span>{status}</span>
                <span>{progress}%</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          </div>
        </section>

        <section className="lg:col-span-2 space-y-4">
          <div className="p-3 bg-gray-800 rounded-2xl shadow">
            <div className="flex items-center justify-between px-1 pt-1">
              <h2 className="font-semibold">Preview</h2>
              {isPdf && pdfPageCount > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPdfPage((p) => Math.max(1, p - 1))}
                    disabled={currentPdfPage <= 1}
                    className="px-3 py-1.5 rounded-xl border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm">
                    Page {currentPdfPage} of {pdfPageCount}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPdfPage((p) => Math.min(pdfPageCount, p + 1))
                    }
                    disabled={currentPdfPage >= pdfPageCount}
                    className="px-3 py-1.5 rounded-xl border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            <div className="mt-2 border border-gray-600 rounded-xl overflow-hidden bg-gray-900">
              {activeSrc ? (
                <div className="max-h-[60vh] grid place-items-center overflow-auto">
                  <img
                    src={isPdf ? pdfPreviewUrl : activeSrc}
                    alt={isPdf ? `PDF Page ${currentPdfPage}` : "preview"}
                    className="object-contain max-h-[60vh]"
                  />
                </div>
              ) : (
                <div className="p-10 text-center text-gray-500">
                  No file selected.
                </div>
              )}
            </div>
          </div>

          {ocrText.trim() && (
            <div className="p-3 bg-gray-800 rounded-2xl shadow">
              <div className="flex items-center justify-between px-1 pt-1">
                <h2 className="font-semibold">Recognized Text</h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyText}
                    className="px-3 py-1.5 rounded-xl border border-gray-600 hover:bg-gray-700"
                  >
                    Copy
                  </button>
                  <button
                    onClick={downloadText}
                    className="px-3 py-1.5 rounded-xl border border-gray-600 hover:bg-gray-700"
                  >
                    Download .txt
                  </button>
                </div>
              </div>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="OCR output will appear here…"
                className="mt-2 w-full min-h-[240px] max-h-[50vh] p-3 border border-gray-600 bg-gray-900 rounded-xl font-mono text-sm text-gray-100"
              />
            </div>
          )}

          <div className="text-xs text-gray-400 px-1">
            <p>
              Accuracy tips: Prefer sharp images, good lighting, and high
              contrast. Choose the correct language. Try different PSM modes if
              the layout is unusual.
            </p>
          </div>
        </section>
        <footer className="py-8 text-center text-xs text-gray-500">
          <p>
            Built with React & Tesseract.js — runs entirely in your browser.
          </p>
        </footer>
      </div>
    </div>
  );
}
