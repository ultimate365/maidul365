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

  // --- Recursive sort keys ---
  const sortObjectKeys = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    } else if (obj !== null && typeof obj === "object") {
      return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
          acc[key] = sortObjectKeys(obj[key]);
          return acc;
        }, {});
    }
    return obj;
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

  // --- Serialize arrays and objects to JSON strings for XLSX export ---
  const serializeComplexTypes = (data) => {
    if (!Array.isArray(data)) return data;

    return data.map((row) => {
      const serializedRow = {};
      for (const key in row) {
        const value = row[key];
        if (
          Array.isArray(value) ||
          (value !== null && typeof value === "object")
        ) {
          serializedRow[key] = JSON.stringify(value);
        } else {
          serializedRow[key] = value;
        }
      }
      return serializedRow;
    });
  };

  // --- Deserialize JSON strings back to arrays and objects from XLSX ---
  const deserializeComplexTypes = (data) => {
    if (!Array.isArray(data)) return data;

    return data.map((row) => {
      const deserializedRow = {};
      for (const key in row) {
        let value = row[key];
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (
            (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))
          ) {
            try {
              value = JSON.parse(trimmed);
            } catch (e) {
              // Keep as string if JSON parse fails
            }
          }
        }
        deserializedRow[key] = value;
      }
      return deserializedRow;
    });
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
            Object.values(row).some((v) => v !== null && v !== ""),
          )
          .map(cleanRow);

        const sortedData = sortObjectKeys(cleanedData);

        downloadFile(
          JSON.stringify(sortedData, null, 2),
          `${fileName}.json`,
          "application/json",
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
      const deserializedRows = deserializeComplexTypes(rows);

      const sortedData = sortObjectKeys(deserializedRows);

      downloadFile(
        JSON.stringify(sortedData, null, 2),
        `${fileName}.json`,
        "application/json",
      );
    } catch (error) {
      handleError("Excel processing error", error);
    }
  };

  const handleFormatSelection = (format) => {
    if (!conversionData || !conversionFileName) return;

    try {
      let flatData = sortObjectKeys(conversionData);

      if (format === "csv") {
        const csv = jsonToCSV(flatData);
        downloadFile(csv, `${conversionFileName}.csv`, "text/csv");
      } else if (format === "xlsx") {
        const serializedData = serializeComplexTypes(flatData);
        const worksheet = XLSX.utils.json_to_sheet(serializedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const xlsxBuffer = XLSX.write(workbook, {
          type: "array",
          bookType: "xlsx",
        });
        downloadFile(
          xlsxBuffer,
          `${conversionFileName}.xlsx`,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
    [handleFiles],
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
      <div className="text-center">
        <h3 className="text-2xl font-semibold leading-relaxed mb-6 text-neutral-300 hover:text-neutral-500 transition-colors">
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
