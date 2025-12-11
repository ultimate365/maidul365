"use client";
import React, { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { readString, jsonToCSV } from "react-papaparse";
import { Tooltip } from "react-tooltip";
import * as XLSX from "xlsx";

export default function CSV2JSON() {
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  const justDropped = useRef(false);
  const onPickFiles = (event) => {
    const selectedFiles = Array.from(event.target.files);
    handleFile(selectedFiles);
  };
  const handleFile = (files) => {
    files.forEach((file) => {
      const fileNameWithoutExtension = file.name
        .split(".")
        .slice(0, -1)
        .join(".");
      const extension = file.name.split(".").pop().toLowerCase();

      if (["csv", "json", "xlsx", "xls"].includes(extension)) {
        const reader = new FileReader();

        if (extension === "csv" || extension === "json") {
          reader.onload = () => {
            const fileContent = reader.result;
            convertFile(fileContent, fileNameWithoutExtension, extension);
          };
          reader.readAsText(file);
        } else {
          // Excel → JSON
          reader.onload = () => {
            try {
              const data = new Uint8Array(reader.result);
              const workbook = XLSX.read(data, { type: "array" });
              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
              const jsonData = XLSX.utils.sheet_to_json(worksheet);
              const json = JSON.stringify(jsonData, null, 2);
              downloadFile(
                json,
                `${fileNameWithoutExtension}.json`,
                "application/json"
              );
            } catch (err) {
              toast.error("Error reading Excel file");
              console.error(err);
            }
          };
          reader.readAsArrayBuffer(file);
        }
      } else {
        toast.error("Invalid file uploaded");
        resetFileInput();
      }
    });
  };
  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = Array.from(e.dataTransfer.files || []);
    justDropped.current = true;
    handleFile(dropped);
    setTimeout(() => {
      justDropped.current = false;
    }, 200);
  };
  const onPaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = Array.from(items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile());
    handleFile(files);
  }, []);

  const downloadFile = (data, fileName, fileType) => {
    try {
      const blob = new Blob([data], { type: fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setTimeout(() => resetFileInput(), 100);
    } catch (error) {
      toast.error("Download failed.");
      console.error(error);
    }
  };

  const convertFile = (fileContent, fileName, extension) => {
    if (extension === "json" || isJson(fileContent)) {
      // JSON → CSV
      const data = JSON.parse(fileContent).map((row) => {
        for (const key in row) {
          if (typeof row[key] === "number" && row[key].toString().length >= 7) {
            row[key] = row[key].toString();
          }
        }
        return row;
      });
      const csv = jsonToCSV(data);
      downloadFile(csv, `${fileName}.csv`, "text/csv");
    } else {
      // CSV → JSON
      readString(fileContent, {
        complete: (results) => {
          const data = results.data
            .filter((row) =>
              Object.values(row).some((value) => value !== null && value !== "")
            )
            .map((row) => {
              const cleanedRow = {};
              const sortedKeys = Object.keys(row).sort();
              for (const key of sortedKeys) {
                if (
                  !isNaN(row[key]) &&
                  row[key].length >= 7 &&
                  !row[key].includes(".")
                ) {
                  cleanedRow[key] = row[key].toString();
                } else if (!isNaN(row[key])) {
                  cleanedRow[key] = parseFloat(row[key]);
                } else if (row[key] === "TRUE") {
                  cleanedRow[key] = true;
                } else if (row[key] === "FALSE") {
                  cleanedRow[key] = false;
                } else {
                  cleanedRow[key] = row[key];
                }
              }
              return cleanedRow;
            });
          const json = JSON.stringify(data, null, 2);
          downloadFile(json, `${fileName}.json`, "application/json");
        },
        header: true,
      });
    }
  };

  const resetFileInput = () => {
    if (typeof window !== "undefined") {
      document.getElementById("fileInput").value = "";
    }
  };

  const isJson = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

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
  return (
    <div className="container my-5">
      <div
        ref={dropRef}
        className="container-main text-center p-8 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        onClick={() => {
          if (justDropped.current) {
            return;
          }
          inputRef.current?.click();
        }}
      >
        <h3 className="text-lg font-semibold mb-4 text-center">
          CSV / Excel To JSON <br /> OR <br /> JSON To CSV <br /> File Converter
        </h3>
        <input
          type="file"
          id="fileInput"
          accept=".csv,.json,.xlsx,.xls"
          onChange={onPickFiles}
          multiple
          ref={inputRef}
          hidden
        />
        <p className="text-gray-400 text-sm mt-4">
          Click anywhere or drag and drop files here to upload.
        </p>
      </div>
      <Tooltip anchorSelect=".container-main" place="top">
        Please upload or drag & drop only .csv, .json, or .xlsx/.xls files
      </Tooltip>
    </div>
  );
}
