"use client";
import React, { useRef } from "react";
import toast from "react-hot-toast";
import { readString, jsonToCSV } from "react-papaparse";
import { Tooltip } from "react-tooltip";

export default function CSV2JSON() {
  const ref = useRef();
  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    selectedFiles.forEach((file) => {
      const fileNameWithoutExtension = file.name
        .split(".")
        .slice(0, -1)
        .join(".");
      if (file.type === "text/csv" || file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = () => {
          const fileContent = reader.result;
          convertFile(fileContent, fileNameWithoutExtension);
        };
        reader.readAsText(file);
      } else {
        toast.error("Invalid file uploaded");
        if (typeof window !== "undefined") {
          document.getElementById("fileInput").value = "";
        }
      }
    });
  };

  const downloadFile = (data, fileName, fileType) => {
    const blob = new Blob([data], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    a.remove();
    ref.current.value = "";
  };

  const convertFile = (fileContent, fileName) => {
    if (isJson(fileContent)) {
      // Convert JSON to CSV
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
      // Convert CSV to JSON
      readString(fileContent, {
        complete: (results) => {
          // Fix number values being parsed as strings for length >= 7
          const data = results.data
            .filter((row) => {
              return Object.values(row).some(
                (value) => value !== null && value !== ""
              );
            })
            .map((row) => {
              const cleanedRow = {};
              for (const key in row) {
                if (
                  !isNaN(row[key]) &&
                  row[key].length >= 7 &&
                  !row[key].includes(".")
                ) {
                  cleanedRow[key] = row[key].toString();
                } else if (!isNaN(row[key])) {
                  cleanedRow[key] = parseFloat(row[key]);
                } else if (row[key] === "TRUE") {
                  cleanedRow[key] = row[key] === true;
                } else if (row[key] === "FALSE") {
                  cleanedRow[key] = row[key] === false;
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
    // Clear file input and reset state
    // if (typeof window !== "undefined") {
    //   document.getElementById("fileInput").value = "";
    // }
  };

  const isJson = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-12 px-4">
      <div className="container-main text-center">
        <h3 className="text-2xl font-semibold leading-relaxed mb-6">
          CSV To JSON
          <br /> OR
          <br /> JSON To CSV
          <br />
          File Converter
        </h3>

        <input
          type="file"
          id="fileInput"
          accept=".csv,.json"
          onChange={handleFileUpload}
          multiple
          ref={ref}
          className="block w-full rounded-md border border-gray-600 bg-gray-900 p-2 text-sm text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-400"
        />

        {/* <button 
      onClick={convertFile}
      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Convert and Download
    </button> */}
      </div>

      <Tooltip anchorSelect=".container-main" place="top">
        Please Upload only .csv or .json files
      </Tooltip>
    </div>
  );
}
