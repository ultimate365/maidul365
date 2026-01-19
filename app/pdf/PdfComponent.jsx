"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs`;

const PageThumb = ({
  page,
  i,
  selected,
  rotation,
  onToggle,
  onRotate,
  onDragStart,
  onDragOver,
  onDrop,
  onRunOcr,
}) => {
  return (
    <div
      className="group relative flex flex-col items-center rounded-2xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm bg-white/70 dark:bg-gray-900/60 backdrop-blur cursor-grab active:cursor-grabbing transition-colors"
      draggable
      onDragStart={(e) => onDragStart(e, i)}
      onDragOver={(e) => onDragOver(e, i)}
      onDrop={(e) => onDrop(e, i)}
    >
      <div className="absolute left-2 top-2 z-10 flex gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(i)}
          className="h-5 w-5 accent-indigo-600"
          title="Select page"
        />
      </div>
      <button
        type="button"
        onClick={() => onRotate(i)}
        className="absolute right-2 top-2 z-10 rounded-full px-3 py-1 text-xs bg-gray-900/80 dark:bg-gray-700/90 text-white opacity-0 group-hover:opacity-100 transition"
        title="Rotate 90°"
      >
        ⟳ 90°
      </button>
      <div
        className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors"
        style={{ aspectRatio: "3/4" }}
      >
        {page.thumbUrl ? (
          <img
            src={page.thumbUrl}
            alt={`Page ${i + 1}`}
            className="h-full w-full object-contain"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-gray-500 dark:text-gray-400">
            Rendering…
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
        <div>Page {i + 1}</div>
        <button
          type="button"
          onClick={() => onRunOcr && onRunOcr(i)}
          className="ml-2 px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700"
          title={`Run OCR on page ${i + 1}`}
        >
          OCR
        </button>
      </div>
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        ⋮⋮
      </div>
    </div>
  );
};

function bytesToSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

const PdfComponent = () => {
  const fileRef = useRef();
  const [activeTool, setActiveTool] = useState("edit"); // 'edit', 'merge', 'images'
  const [file, setFile] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [pages, setPages] = useState([]); // {thumbUrl, width, height}
  const [order, setOrder] = useState([]); // indices
  const [selected, setSelected] = useState(new Set());
  const [rotations, setRotations] = useState({}); // index -> deg (0/90/180/270)
  const [dragIndex, setDragIndex] = useState(null);
  const [quality, setQuality] = useState(0.6); // 0.2 – 1.0
  const [scale, setScale] = useState(1.0); // 0.5 – 2.0 (render DPI scale for compression)
  const [status, setStatus] = useState("");
  const [origSize, setOrigSize] = useState(0);
  // OCR states
  const [ocrLang, setOcrLang] = useState("eng");
  const [ocrPsm, setOcrPsm] = useState("3");
  const [ocrText, setOcrText] = useState("");
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrError, setOcrError] = useState("");

  // Load the PDF & thumbnails
  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setStatus("Loading PDF…");
        const typedarray = new Uint8Array(reader.result);
        setOrigSize(typedarray.byteLength);
        const loadingTask = pdfjsLib.getDocument({ data: typedarray });
        const _pdf = await loadingTask.promise;
        setPdf(_pdf);
        const numPages = _pdf.numPages;

        const newPages = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await _pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.25 }); // small thumb
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          const thumbUrl = canvas.toDataURL("image/jpeg", 0.6);
          newPages.push({
            thumbUrl,
            width: page.view[2],
            height: page.view[3],
          });
        }
        setPages(newPages);
        setOrder([...Array(numPages).keys()]);
        setSelected(new Set());
        setRotations({});
        setStatus("Loaded ✔");
      } catch (err) {
        console.error(err);
        setStatus("Failed to load PDF");
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  const onToggle = (i) => {
    const s = new Set(selected);
    s.has(i) ? s.delete(i) : s.add(i);
    setSelected(s);
  };

  const onRotate = (i) => {
    setRotations((r) => ({ ...r, [i]: ((r[i] || 0) + 90) % 360 }));
  };

  const onDragStart = (e, i) => {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, overIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === overIndex) return;
  };

  const onDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;

    // reorder using order array
    setOrder((prev) => {
      const arr = [...prev];
      const from = arr.indexOf(dragIndex);
      const to = arr.indexOf(dropIndex);
      arr.splice(to, 0, arr.splice(from, 1)[0]);
      return arr;
    });
    setDragIndex(null);
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    const keep = order.filter((i) => !selected.has(i));
    setOrder(keep);
    setSelected(new Set());
  };

  const rotateSelected = () => {
    if (selected.size === 0) return;
    const r = { ...rotations };
    selected.forEach((i) => {
      r[i] = ((r[i] || 0) + 90) % 360;
    });
    setRotations(r);
  };
  const time = Date.now();
  const selectAll = () => setSelected(new Set(order));
  const clearSel = () => setSelected(new Set());

  const buildPdf = async (onlyRange = null) => {
    if (!pdf) return;
    setStatus("Rendering & compressing…");

    const out = await PDFDocument.create();

    const indices = (onlyRange ? onlyRange : order).filter(
      (i) => pages[i] !== undefined,
    );

    for (const i of indices) {
      const page = await pdf.getPage(i + 1);
      const rot = rotations[i] || 0;

      // Render with pdf.js at chosen scale
      const viewport = page.getViewport({ scale: scale * 2.0 }); // bump for better quality
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Apply rotation on raster if needed
      const rotated = document.createElement("canvas");
      const rctx = rotated.getContext("2d");
      if (rot % 180 === 0) {
        rotated.width = canvas.width;
        rotated.height = canvas.height;
      } else {
        rotated.width = canvas.height;
        rotated.height = canvas.width;
      }
      rctx.save();
      rctx.translate(rotated.width / 2, rotated.height / 2);
      rctx.rotate((rot * Math.PI) / 180);
      rctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      rctx.restore();

      const dataUrl = rotated.toDataURL("image/jpeg", quality);
      const jpgBytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) =>
        c.charCodeAt(0),
      );
      const jpg = await out.embedJpg(jpgBytes);
      const pageOut = out.addPage([rotated.width, rotated.height]);
      pageOut.drawImage(jpg, {
        x: 0,
        y: 0,
        width: rotated.width,
        height: rotated.height,
      });
    }

    // Add a small footer meta page (optional) — can be removed
    // const font = await out.embedFont(StandardFonts.Helvetica);
    // const info = out.addPage([500, 80]);
    // info.drawText("Created with React PDF Tool", { x: 20, y: 40, size: 12, font, color: rgb(0.2,0.2,0.2) });

    const bytes = await out.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    setStatus(`Done. Output size ~ ${bytesToSize(bytes.byteLength)}`);
    return blob;
  };

  // OCR helpers
  const renderPageToDataUrl = async (pageIndex) => {
    if (!pdf) return null;
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: scale * 2.0 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png");
  };

  const runOcrOnPages = async (pageIndices = null) => {
    if (!pdf) return;
    setOcrError("");
    setOcrText("");
    setIsRunningOcr(true);
    setOcrProgress(0);
    setOcrStatus("Initializing OCR...");

    try {
      const indices = (pageIndices || order).filter(
        (i) => pages[i] !== undefined,
      );
      const results = [];
      let completed = 0;
      for (const i of indices) {
        setOcrStatus(`Rendering page ${i + 1}...`);
        const dataUrl = await renderPageToDataUrl(i);
        if (!dataUrl) continue;

        setOcrStatus(`Running OCR on page ${i + 1}...`);
        const res = await Tesseract.recognize(dataUrl, ocrLang, {
          tessedit_pageseg_mode: ocrPsm,
          logger: (m) => {
            if (m.status)
              setOcrStatus(
                m.status +
                  (m.progress ? ` (${Math.round(m.progress * 100)}%)` : ""),
              );
            if (typeof m.progress === "number") {
              // weigh page progress into overall
              const pageProgress = m.progress;
              const overall = Math.round(
                ((completed + pageProgress) / indices.length) * 100,
              );
              setOcrProgress(overall);
            }
          },
        });

        const text = res?.data?.text || "";
        results.push({ page: i + 1, text });
        completed += 1;
        setOcrProgress(Math.round((completed / indices.length) * 100));
      }

      const joined = results
        .map((r) => `--- Page ${r.page} ---\n${r.text}`)
        .join("\n\n");
      setOcrText(joined);
      setOcrStatus("Done");
      setOcrProgress(100);
    } catch (err) {
      console.error(err);
      setOcrError(err?.message || "OCR failed");
      setOcrStatus("Failed");
    } finally {
      setIsRunningOcr(false);
    }
  };

  // Normalize OCR text: collapse multiple blank lines, trim trailing/leading spaces
  const normalizeText = (raw) => {
    if (!raw) return "";
    // Replace CR with LF, normalize multiple empty lines to a single empty line
    let t = raw.replace(/\r\n?/g, "\n");
    // Trim spaces at line ends
    t = t
      .split("\n")
      .map((ln) => ln.replace(/[ \t]+$/u, ""))
      .join("\n");
    // Collapse 3+ newlines to 2 (i.e., keep single blank line separator)
    t = t.replace(/\n{3,}/g, "\n\n");
    // Trim leading/trailing whitespace
    return t.trim();
  };

  const runOcrOnPage = async (pageIndex) => {
    if (!pdf) return;
    setOcrError("");
    setIsRunningOcr(true);
    setOcrProgress(0);
    setOcrStatus(`Initializing OCR for page ${pageIndex + 1}...`);

    try {
      setOcrStatus(`Rendering page ${pageIndex + 1}...`);
      const dataUrl = await renderPageToDataUrl(pageIndex);
      if (!dataUrl) throw new Error("Failed to render page");

      setOcrStatus(`Running OCR on page ${pageIndex + 1}...`);
      const res = await Tesseract.recognize(dataUrl, ocrLang, {
        tessedit_pageseg_mode: ocrPsm,
        logger: (m) => {
          if (m.status) setOcrStatus(m.status);
          if (typeof m.progress === "number")
            setOcrProgress(Math.round(m.progress * 100));
        },
      });

      const raw = res?.data?.text || "";
      const cleaned = normalizeText(raw);
      // append with page header
      const header = `--- Page ${pageIndex + 1} ---\n`;
      setOcrText((prev) => {
        const parts = prev
          ? `${prev}\n\n${header}${cleaned}`
          : `${header}${cleaned}`;
        return parts;
      });
      setOcrStatus("Done");
      setOcrProgress(100);
    } catch (err) {
      console.error(err);
      setOcrError(err?.message || "OCR failed");
      setOcrStatus("Failed");
    } finally {
      setIsRunningOcr(false);
    }
  };

  const copyOcrText = async () => {
    try {
      await navigator.clipboard.writeText(ocrText || "");
    } catch {}
  };

  const downloadOcrText = () => {
    const blob = new Blob([ocrText || ""], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocr-pdf-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const download = async (blob, name = `output-${time}.pdf`) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const clearFile = () => {
    setFile(null);
    setPdf(null);
    setPages([]);
    setOrder([]);
    setSelected(new Set());
    setRotations({});
    setDragIndex(null);
    setQuality(0.6);
    setScale(1.0);
    setStatus("");
    setOrigSize(0);
    if (fileRef.current) {
      fileRef.current.value = null;
    }
  };

  const onDownloadAll = async () => {
    const blob = await buildPdf();
    if (blob) download(blob, `edited-${time}.pdf`);
  };

  const onExtractRange = async () => {
    const input = prompt(
      "Enter page range to extract (e.g., 1-3,5,7). Uses current order.",
      "1-3",
    );
    if (!input) return;

    // parse simple ranges
    const nums = new Set();
    const parts = input.split(",");
    for (const part of parts) {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map((x) => parseInt(x.trim(), 10));
        if (!isNaN(a) && !isNaN(b)) {
          for (let n = Math.min(a, b); n <= Math.max(a, b); n++) nums.add(n);
        }
      } else {
        const n = parseInt(part.trim(), 10);
        if (!isNaN(n)) nums.add(n);
      }
    }

    const zeroIdx = [...nums]
      .map((n) => order[n - 1])
      .filter((v) => v !== undefined);
    const blob = await buildPdf(zeroIdx);
    if (blob) download(blob, `extracted-${time}.pdf`);
  };

  const onDeleteSelected = () => deleteSelected();
  const onRotateSelected = () => rotateSelected();
  // Inside App component
  const [mergeFiles, setMergeFiles] = useState([]); // each: { file, name, index, thumbUrl }
  const [mergeOrder, setMergeOrder] = useState([]);
  const [mergeDragIndex, setMergeDragIndex] = useState(null);
  const mergeRef = useRef();
  const onMergeUpload = async (files) => {
    const arr = [];
    for (const f of Array.from(files)) {
      let thumbUrl = "";
      try {
        const buf = await f.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buf }).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbUrl = canvas.toDataURL("image/jpeg", 0.6);
      } catch (err) {
        console.error("Thumb gen failed", err);
      }

      arr.push({
        file: f,
        name: f.name,
        index: Date.now() + Math.random(),
        thumbUrl,
      });
    }

    setMergeFiles(arr);
    setMergeOrder(arr.map((f) => f.index));
  };

  const mergePdfs = async () => {
    if (mergeFiles.length === 0) return;
    try {
      setStatus("Merging PDFs…");
      const merged = await PDFDocument.create();

      for (const id of mergeOrder) {
        const f = mergeFiles.find((mf) => mf.index === id);
        if (!f) continue;
        const buf = await f.file.arrayBuffer();
        const doc = await PDFDocument.load(buf);
        const copied = await merged.copyPages(doc, doc.getPageIndices());
        copied.forEach((p) => merged.addPage(p));
      }

      const bytes = await merged.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setStatus(`Merged ✔ Size ~ ${bytesToSize(bytes.byteLength)}`);
      download(blob, `merged-${time}.pdf`);
    } catch (err) {
      console.error(err);
      setStatus("Merge failed ❌");
    }
  };

  const onDownloadSelected = async () => {
    if (selected.size === 0) {
      alert("No pages selected!");
      return;
    }
    const zeroIdx = order.filter((i) => selected.has(i));
    const blob = await buildPdf(zeroIdx);
    if (blob) download(blob, `selected-${time}.pdf`);
  };

  const onMergeDragStart = (e, id) => {
    setMergeDragIndex(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onMergeDrop = (e, dropId) => {
    e.preventDefault();
    if (mergeDragIndex === null || mergeDragIndex === dropId) return;

    setMergeOrder((prev) => {
      const arr = [...prev];
      const from = arr.indexOf(mergeDragIndex);
      const to = arr.indexOf(dropId);
      arr.splice(to, 0, arr.splice(from, 1)[0]);
      return arr;
    });
    setMergeDragIndex(null);
  };
  const clearMergeList = () => {
    setMergeFiles([]);
    setMergeOrder([]);
    setMergeDragIndex(null);
    setStatus("");
    if (mergeRef.current) {
      mergeRef.current.value = null;
    }
  };

  // Image to PDF Logic
  const [imageFiles, setImageFiles] = useState([]);
  const imageInputRef = useRef();

  const onImagesUpload = (e) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newImages = files.map((f) => ({
      file: f,
      id: Math.random().toString(36).substr(2, 9),
      previewUrl: URL.createObjectURL(f),
      name: f.name,
    }));
    setImageFiles((prev) => [...prev, ...newImages]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeImage = (id) => {
    setImageFiles((prev) => prev.filter((img) => img.id !== id));
  };

  const clearImages = () => {
    setImageFiles([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setStatus("");
  };

  const convertImagesToPdf = async (merge) => {
    if (imageFiles.length === 0) return;
    setStatus("Converting images...");
    try {
      const processImage = async (doc, img) => {
        const buffer = await img.file.arrayBuffer();
        let image;
        try {
          if (img.file.type === "image/png") image = await doc.embedPng(buffer);
          else image = await doc.embedJpg(buffer);
        } catch (e) {
          // Fallback: try the other format if type detection failed or was wrong
          try {
            image = await doc.embedJpg(buffer);
          } catch (e2) {
            try {
              image = await doc.embedPng(buffer);
            } catch (e3) {
              return null;
            }
          }
        }
        return image;
      };

      if (merge) {
        const doc = await PDFDocument.create();
        for (const img of imageFiles) {
          const image = await processImage(doc, img);
          if (!image) continue;
          const { width, height } = image.scale(1);
          const page = doc.addPage([width, height]);
          page.drawImage(image, { x: 0, y: 0, width, height });
        }
        const pdfBytes = await doc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        download(blob, `images-merged-${Date.now()}.pdf`);
      } else {
        for (const img of imageFiles) {
          const doc = await PDFDocument.create();
          const image = await processImage(doc, img);
          if (!image) continue;
          const { width, height } = image.scale(1);
          const page = doc.addPage([width, height]);
          page.drawImage(image, { x: 0, y: 0, width, height });
          const pdfBytes = await doc.save();
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          download(blob, `${img.name.replace(/\.[^/.]+$/, "")}.pdf`);
        }
      }
      setStatus("Done.");
    } catch (err) {
      console.error(err);
      setStatus("Error converting images.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-6xl mx-auto p-4 gap-4">
        <div className="mt-20 flex items-center justify-between bg-gray-800 rounded-xl shadow-md p-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            PDF Compressor & Editor
          </h1>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setActiveTool("edit")}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTool === "edit"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Edit PDF
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("merge")}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTool === "merge"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Merge PDF
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("images")}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTool === "images"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              JPG to PDF
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Left controls */}
          <section className="md:col-span-1 space-y-4">
            {activeTool === "edit" && (
              <>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm transition-colors">
                  <h2 className="font-semibold mb-2 dark:text-gray-100">
                    1) Load a PDF
                  </h2>
                  <input
                    type="file"
                    ref={fileRef}
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="cursor-pointer block w-full text-sm file:mr-4 file:rounded-xl file:border file:border-gray-200 file:bg-gray-100 file:px-4 file:py-2 file:text-sm hover:file:bg-blue-700 dark:text-gray-300 dark:file:bg-gray-800 dark:file:border-gray-700 dark:file:text-gray-300"
                  />
                  {origSize > 0 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Original size: {bytesToSize(origSize)}
                    </div>
                  )}
                  {order.length > 0 && (
                    <div className="col-span-full flex justify-center">
                      <button
                        type="button"
                        onClick={clearFile}
                        className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-800"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {pdf && pages.length > 0 && (
                  <>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm transition-colors">
                      <h2 className="font-semibold mb-3 dark:text-gray-100">
                        2) Compression
                      </h2>
                      <label className="block text-sm mb-1 dark:text-gray-300">
                        JPEG Quality: {quality.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min={0.2}
                        max={1}
                        step={0.05}
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full cursor-grabbing dark:accent-indigo-500"
                      />
                      <label className="block text-sm mt-3 mb-1 dark:text-gray-300">
                        Render Scale (DPI): {scale.toFixed(2)}×
                      </label>
                      <input
                        type="range"
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full cursor-grabbing dark:accent-indigo-500"
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Lower quality/scale ⇒ smaller file, but lower clarity.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm space-y-2">
                      <h2 className="font-semibold">3) Page Actions</h2>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={selectAll}
                          className="cursor-pointer px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-blue-700"
                        >
                          Select all
                        </button>
                        {selected.size > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={clearSel}
                              className="cursor-pointer px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-blue-700"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={onRotateSelected}
                              className="cursor-pointer px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-blue-700"
                            >
                              Rotate selected
                            </button>
                            <button
                              type="button"
                              onClick={onDeleteSelected}
                              className="cursor-pointer px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-red-900"
                            >
                              Delete selected
                            </button>

                            <button
                              type="button"
                              onClick={onDownloadSelected}
                              className="cursor-pointer px-3 py-2 rounded-xl bg-indigo-700 text-white hover:bg-blue-700"
                            >
                              Download selected
                            </button>

                            <button
                              type="button"
                              onClick={onDownloadAll}
                              className="cursor-pointer px-3 py-2 rounded-xl bg-black text-white hover:bg-blue-700"
                            >
                              Download edited (compress)
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={onExtractRange}
                          className="cursor-pointer px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-blue-700"
                        >
                          Cut / Extract range…
                        </button>
                      </div>

                      {status && (
                        <div className="text-xs text-gray-500 pt-2">
                          {status}
                        </div>
                      )}
                    </div>
                    {/* OCR Panel */}
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm space-y-2">
                      <h2 className="font-semibold">PDF OCR</h2>
                      <label className="block text-sm">Language</label>
                      <select
                        value={ocrLang}
                        onChange={(e) => setOcrLang(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"
                      >
                        {LANG_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <label className="block text-sm mt-2">
                        Page Segmentation Mode
                      </label>
                      <select
                        value={ocrPsm}
                        onChange={(e) => setOcrPsm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"
                      >
                        {PSM_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            runOcrOnPages(
                              Array.from(selected).length
                                ? order.filter((i) => selected.has(i))
                                : null,
                            )
                          }
                          disabled={!pdf || isRunningOcr || pages.length === 0}
                          className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {isRunningOcr
                            ? `Running OCR (${ocrProgress}%)…`
                            : "Run OCR (selected / all)"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOcrText("");
                            setOcrError("");
                          }}
                          className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-800"
                        >
                          Clear OCR
                        </button>
                      </div>

                      {ocrStatus && (
                        <div className="text-xs text-gray-500 pt-2">
                          {ocrStatus} — {ocrProgress}%
                        </div>
                      )}
                      {ocrError && (
                        <div className="text-xs text-rose-500">{ocrError}</div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
            {activeTool === "merge" && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm">
                {/* Merge tool */}

                <div className="mt-4">
                  <h2 className="font-semibold mb-2">Merge multiple PDFs</h2>

                  <input
                    type="file"
                    accept="application/pdf"
                    ref={mergeRef}
                    multiple
                    onChange={(e) => onMergeUpload(e.target.files)}
                    className="cursor-pointer block w-full text-sm file:mr-4 file:rounded-xl file:border file:border-gray-200 file:bg-gray-100 file:px-4 file:py-2 file:text-sm hover:file:bg-blue-700 dark:file:bg-gray-800 dark:file:border-gray-700"
                  />
                </div>
              </div>
            )}
            {activeTool === "images" && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm">
                <h2 className="font-semibold mb-2">Images to PDF</h2>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/jpg"
                  ref={imageInputRef}
                  multiple
                  onChange={onImagesUpload}
                  className="cursor-pointer block w-full text-sm file:mr-4 file:rounded-xl file:border file:border-gray-200 file:bg-gray-100 file:px-4 file:py-2 file:text-sm hover:file:bg-blue-700 dark:file:bg-gray-800 dark:file:border-gray-700"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Supports JPG and PNG.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-xs text-gray-500">
              <p className="font-medium mb-1">Tips</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Drag pages to reorder.</li>
                <li>Select pages then use Rotate/Delete.</li>
                <li>
                  "Download edited" rebuilds the PDF using JPEG images ⇒ best
                  for compressing scanned/image‑heavy PDFs.
                </li>
                <li>
                  For vector/text‑heavy PDFs, this approach may reduce
                  sharpness.
                </li>
              </ul>
            </div>
          </section>

          {/* Thumbnails */}
          <section className="md:col-span-2">
            {activeTool === "merge" &&
              (mergeFiles.length > 0 ? (
                <div className="grid place-items-center h-64 rounded-2xl  text-gray-500 my-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {mergeOrder.map((id) => {
                      const f = mergeFiles.find((mf) => mf.index === id);
                      if (!f) return null;
                      return (
                        <div
                          key={id}
                          draggable
                          onDragStart={(e) => onMergeDragStart(e, id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => onMergeDrop(e, id)}
                          className="flex flex-col items-center gap-3 rounded-lg border px-3 py-2 bg-gray-100 dark:bg-gray-800 cursor-grab active:cursor-grabbing"
                        >
                          {f.thumbUrl ? (
                            <img
                              src={f.thumbUrl}
                              alt="thumb"
                              className="w-12 h-16 object-contain border rounded"
                            />
                          ) : (
                            <div className="w-12 h-16 flex items-center justify-center border rounded text-xs text-gray-400">
                              PDF
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <p className="text-sm flex-1 text-center">
                              {f.name}
                            </p>
                            <p className="text-xs text-gray-500">⋮⋮ drag</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={mergePdfs}
                      className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Merge in this order
                    </button>
                    <button
                      type="button"
                      onClick={clearMergeList}
                      className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-800"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid place-items-center h-64 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                  Load a PDF to begin.
                </div>
              ))}

            {activeTool === "images" &&
              (imageFiles.length > 0 ? (
                <div className="my-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imageFiles.map((img) => (
                      <div
                        key={img.id}
                        className="relative flex flex-col items-center gap-2 rounded-lg border px-2 py-2 bg-gray-100 dark:bg-gray-800"
                      >
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          title="Remove"
                        >
                          ×
                        </button>
                        <img
                          src={img.previewUrl}
                          alt="preview"
                          className="w-full h-32 object-contain rounded bg-white dark:bg-gray-900"
                        />
                        <p className="text-xs text-center truncate w-full px-1">
                          {img.name}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-6 justify-center">
                    {imageFiles.length > 1 ? (
                      <>
                        <button
                          onClick={() => convertImagesToPdf(true)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Merge all into one PDF
                        </button>
                        <button
                          onClick={() => convertImagesToPdf(false)}
                          className="px-4 py-2 rounded-xl bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600"
                        >
                          Download each as PDF
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => convertImagesToPdf(false)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Download PDF
                      </button>
                    )}
                    <button
                      onClick={clearImages}
                      className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                    >
                      {imageFiles.length > 1 ? "Clear All" : "Clear"}
                    </button>
                  </div>
                  {status && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                      {status}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid place-items-center h-64 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                  Select images to begin.
                </div>
              ))}

            {activeTool === "edit" &&
              (!pdf ? (
                <div className="grid place-items-center h-64 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                  Load a PDF to begin.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {order.map((i) => (
                    <PageThumb
                      key={i}
                      page={pages[i]}
                      i={i}
                      selected={selected.has(i)}
                      rotation={rotations[i] || 0}
                      onToggle={onToggle}
                      onRotate={onRotate}
                      onDragStart={onDragStart}
                      onDragOver={onDragOver}
                      onDrop={onDrop}
                      onRunOcr={runOcrOnPage}
                    />
                  ))}
                  {order.length > 0 && (
                    <div className="col-span-full flex justify-center">
                      <button
                        type="button"
                        onClick={clearFile}
                        className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-800"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              ))}
            {/* OCR Results */}
            {ocrText.trim() && (
              <div className="col-span-full mt-6 p-4 rounded-2xl border bg-white dark:bg-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">OCR Results</h3>
                    <pre className="whitespace-pre-wrap text-sm mt-2 text-gray-800 dark:text-gray-100 max-h-64 overflow-auto p-2 bg-gray-50 dark:bg-gray-900 rounded">
                      {ocrText}
                    </pre>
                  </div>
                  <div className="w-40 flex flex-col gap-2">
                    <button
                      onClick={copyOcrText}
                      className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-700"
                    >
                      Copy
                    </button>
                    <button
                      onClick={downloadOcrText}
                      className="px-3 py-2 rounded-xl bg-indigo-600 text-white"
                    >
                      Download text
                    </button>
                    <button
                      onClick={() => {
                        setOcrText("");
                        setOcrError("");
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-600 text-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-8 text-xs text-gray-500">
          <p>
            Privacy: All processing happens in your browser. No files are
            uploaded to a server.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PdfComponent;
