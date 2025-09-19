"use client";
import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function Autoresult() {
  const [data, setData] = useState([]);
  const [columsArray, setColumsArray] = useState([]);
  const [values, setValues] = useState([]);
  const [type, setType] = useState(null);
  const [selectedCols, setSelectedCols] = useState([]);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setType(file.type);

    if (file.type === "text/csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data;
          setData(parsedData);
          setColumsArray(Object.keys(parsedData[0]));
          setValues(parsedData);
          setSelectedCols(Object.keys(parsedData[0]));
        },
      });
    } else if (file.type === "application/json") {
      let reader = new FileReader();
      reader.onload = function (e) {
        const parsedData = JSON.parse(e.target.result);
        setData(parsedData);
        setColumsArray(Object.keys(parsedData[0]));
        setValues(parsedData);
        setSelectedCols(Object.keys(parsedData[0]));
      };
      reader.readAsText(file);
    } else if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"
    ) {
      let reader = new FileReader();
      reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        setData(worksheet);
        setColumsArray(Object.keys(worksheet[0]));
        setValues(worksheet);
        setSelectedCols(Object.keys(worksheet[0]));
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Invalid file type. Please upload a CSV, JSON, or XLSX file.");
    }
  };

  const toggleColumn = (col) => {
    if (selectedCols.includes(col)) {
      setSelectedCols(selectedCols.filter((c) => c !== col));
    } else {
      setSelectedCols([...selectedCols, col]);
    }
  };

  return (
    <div className="w-screen h-screen p-6 mx-auto bg-white">
      {/* File Upload */}
      <div className="flex items-center justify-center w-full noprint">
        <label
          htmlFor="inputGroupFile02"
          className="flex flex-col items-center justify-center w-full max-w-md p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
        >
          <svg
            className="w-10 h-10 mb-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5.5 5.5 0 1115.9 6h.6a5.5 5.5 0 011.1 10.897M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-400">CSV, JSON, or XLSX (max 5MB)</p>
          <input
            id="inputGroupFile02"
            type="file"
            className="hidden"
            accept=".csv,.json,.xlsx"
            onChange={handleChange}
          />
        </label>
      </div>

      {/* Action Buttons */}
      {data.length !== 0 && (
        <div className="flex gap-3 mb-6 noprint">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            onClick={() => {
              setData([]);
              setColumsArray([]);
              setValues([]);
              setSelectedCols([]);
              if (typeof window !== "undefined") {
                document.getElementById("inputGroupFile02").value = "";
              }
            }}
            type="button"
          >
            Reset
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition noprint"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.print();
              }
            }}
            type="button"
          >
            Print
          </button>
        </div>
      )}

      {/* Column filter checkboxes */}
      {columsArray.length > 0 && (
        <div className="mb-6 noprint">
          <h5 className="text-lg font-semibold mb-2 text-black">
            Choose Columns:
          </h5>
          <div className="flex flex-wrap gap-4">
            {columsArray.map((col) => (
              <label key={col} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedCols.includes(col)}
                  onChange={() => toggleColumn(col)}
                />
                <span className="text-gray-700">{col}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Data table */}
      <div className="overflow-x-auto">
        {data.length > 0 && (
          <table className="w-full border border-gray-300 text-sm text-gray-800">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2">Sl</th>
                {selectedCols.map((col) => (
                  <th key={col} className="border border-gray-300 px-3 py-2">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {values.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2">
                    {index + 1}
                  </td>
                  {selectedCols.map((col, i) => (
                    <td key={i} className="border border-gray-300 px-3 py-2">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
