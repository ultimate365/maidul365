"use client";
import dynamic from "next/dynamic";

const PDF = dynamic(() => import("./PdfComponent"), { ssr: false });

export default PDF;
