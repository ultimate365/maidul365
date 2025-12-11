"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { readString, jsonToCSV } from "react-papaparse";
import { Tooltip } from "react-tooltip";
import * as XLSX from "xlsx";

export default function FileConverter() {
  const ref = useRef();
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [conversionData, setConversionData] = useState(null);
  const [conversionFileName, setConversionFileName] = useState("");
  const dropRef = useRef(null);
  const justDropped = useRef(false);

  // --- flatten JSON -> rows (only if it matches nested format) ---
  const flattenData = (data) => {
    if (!Array.isArray(data)) return data;

    const isNestedFormat = data.some(
      (item) => item && typeof item === "object" && Array.isArray(item.leaves)
    );

    if (!isNestedFormat) return data;

    const flattened = [];
    data.forEach((item) => {
      if (Array.isArray(item.leaves)) {
        item.leaves.forEach((leave) => {
          flattened.push({
            month: item.month,
            year: item.year,
            monthId: item.id,
            ...leave,
          });
        });
      } else {
        flattened.push(item);
      }
    });
    return flattened;
  };

  // --- group rows -> nested JSON (only if it looks flattened) ---
  const nestData = (rows) => {
    if (!Array.isArray(rows)) return rows;

    const isFlattenedFormat = rows.some(
      (row) =>
        row &&
        typeof row === "object" &&
        "month" in row &&
        "year" in row &&
        ("monthId" in row || "id" in row)
    );

    if (!isFlattenedFormat) return rows;

    const grouped = {};
    rows.forEach((row) => {
      const { month, year, monthId, id, ...leave } = row;
      const groupId = monthId || id || `${month}-${year}`;
      if (!grouped[groupId]) {
        grouped[groupId] = {
          month,
          year,
          id: groupId,
          leaves: [],
        };
      }
      grouped[groupId].leaves.push(leave);
    });

    return Object.values(grouped);
  };

  const cleanRow = (row) => {
    const cleanedRow = {};
    const sortedKeys = Object.keys(row).sort();
    for (const key of sortedKeys) {
      let value = row[key];
      if (typeof value === "number") {
        const strValue = value.toString();
        if (strValue.length >= 7 && !strValue.includes(".")) {
          value = strValue;
        }
      }
      if (typeof value === "string") {
        if (!isNaN(value) && value.trim() !== "") {
          if (value.length >= 7 && !value.includes(".")) {
            value = value.toString();
          } else {
            value = parseFloat(value);
          }
        } else if (value.toUpperCase() === "TRUE") {
          value = true;
        } else if (value.toUpperCase() === "FALSE") {
          value = false;
        }
      }
      cleanedRow[key] = value;
    }
    return cleanedRow;
  };

  const handleFiles = (files) => {
    const selectedFiles = Array.from(files);
    selectedFiles.forEach((file) => {
      const fileName = file.name;
      const extension = fileName.split(".").pop().toLowerCase();
      const fileNameWithoutExtension = fileName
        .split(".")
        .slice(0, -1)
        .join(".");

      if (!["csv", "json", "xls", "xlsx"].includes(extension)) {
        toast.error("Invalid file type");
        resetFileInput();
        return;
      }

      const reader = new FileReader();

      if (extension === "csv" || extension === "json") {
        reader.onload = () => {
          const fileContent = reader.result;
          if (extension === "json") {
            try {
              const jsonData = JSON.parse(fileContent).map(cleanRow);
              setConversionData(jsonData);
              setConversionFileName(fileNameWithoutExtension);
              setShowFormatDialog(true);
            } catch (error) {
              handleError("Invalid JSON format", error);
            }
          } else {
            processCSVFile(fileContent, fileNameWithoutExtension);
          }
        };
        reader.readAsText(file);
      } else {
        reader.onload = () => {
          const arrayBuffer = reader.result;
          processExcelFile(arrayBuffer, fileNameWithoutExtension);
        };
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleFileUpload = (event) => {
    if (!event.target.files) return;
    handleFiles(event.target.files);
  };

  const processCSVFile = (content, fileName) => {
    readString(content, {
      header: true,
      complete: (results) => {
        const cleanedData = results.data
          .filter((row) =>
            Object.values(row).some((v) => v !== null && v !== "")
          )
          .map(cleanRow);

        const nested = nestData(cleanedData);

        downloadFile(
          JSON.stringify(nested, null, 2),
          `${fileName}.json`,
          "application/json"
        );
      },
      error: (error) => handleError("CSV processing error", error),
    });
  };

  const processExcelFile = (arrayBuffer, fileName) => {
    try {
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet).map(cleanRow);

      const nested = nestData(rows);

      downloadFile(
        JSON.stringify(nested, null, 2),
        `${fileName}.json`,
        "application/json"
      );
    } catch (error) {
      handleError("Excel processing error", error);
    }
  };

  const handleFormatSelection = (format) => {
    if (!conversionData || !conversionFileName) return;

    try {
      // 🔥 flatten only if nested
      const flatData = flattenData(conversionData);

      if (format === "csv") {
        const csv = jsonToCSV(flatData);
        downloadFile(csv, `${conversionFileName}.csv`, "text/csv");
      } else if (format === "xlsx") {
        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const xlsxBuffer = XLSX.write(workbook, {
          type: "array",
          bookType: "xlsx",
        });
        downloadFile(
          xlsxBuffer,
          `${conversionFileName}.xlsx`,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
      }
    } catch (error) {
      handleError("Conversion error", error);
    } finally {
      setShowFormatDialog(false);
    }
  };

  const downloadFile = (data, fileName, fileType) => {
    try {
      const blob = new Blob([data], { type: fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      // Prevent the container's onClick from opening the file input
      // (a click may follow the drop/release and trigger the input).
      justDropped.current = true;
      setTimeout(() => {
        justDropped.current = false;
      }, 500);

      // Reset after a short delay to allow the download to start
      setTimeout(() => {
        resetFileInput();
      }, 100);
    } catch (error) {
      handleError("Download failed", error);
    }
  };

  const resetFileInput = () => {
    document.getElementById("fileInput").value = "";
    setConversionData(null);
    setConversionFileName("");
  };

  const handleError = (message, error) => {
    toast.error(message);
    console.error(error);
    resetFileInput();
  };

  const handleCancel = () => {
    setShowFormatDialog(false);
    resetFileInput();
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      justDropped.current = true;
      const dropped = Array.from(e.dataTransfer.files || []);
      handleFiles(dropped);
      setTimeout(() => {
        justDropped.current = false;
      }, 200);
    },
    [handleFiles]
  );

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
    return () => {
      el.removeEventListener("dragover", prevent);
      el.removeEventListener("dragenter", prevent);
      el.removeEventListener("drop", onDrop);
    };
  }, [onDrop]);

  return (
    <div
      ref={dropRef}
      className="max-w-6xl mx-auto my-12 px-4 py-8 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
      onClick={() => {
        if (justDropped.current) {
          return;
        }
        ref.current?.click();
      }}
    >
      <div className="container-main text-center">
        <h3 className="text-2xl font-semibold leading-relaxed mb-6">
          File Converter with Format Selection
          <br />
          (JSON → CSV/XLSX | CSV/Excel → JSON)
        </h3>
        <input
          type="file"
          id="fileInput"
          accept=".csv,.json,.xlsx,.xls"
          onChange={handleFileUpload}
          multiple
          ref={ref}
          hidden
        />
        <p className="text-gray-400 text-sm mt-4">
          Click anywhere or drag and drop files here to upload.
        </p>
      </div>

      {showFormatDialog && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h4>Select Output Format for {conversionFileName}</h4>
            <div className="modal-buttons">
              <button
                className="btn-csv"
                onClick={() => handleFormatSelection("csv")}
              >
                Download as CSV
              </button>
              <button
                className="btn-xlsx"
                onClick={() => handleFormatSelection("xlsx")}
              >
                Download as Excel
              </button>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Tooltip anchorSelect=".container-main" place="top">
        Supported formats: .json, .csv, .xlsx, .xls
      </Tooltip>
    </div>
  );
}
