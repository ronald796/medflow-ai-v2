"use client";

import { useState, useRef } from "react";
import { Upload, FileImage, FileText, X, CheckCircle2, Scan } from "lucide-react";
import { cn } from "@/lib/utils";
import { EcoFile } from "@/lib/types";

interface Props {
  existingFiles?: EcoFile[];
}

const CATEGORY_LABELS: Record<EcoFile["category"], string> = {
  prostata: "Próstata",
  renal: "Renal",
  vejiga: "Vejiga",
  otro: "Otro",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DicomUpload({ existingFiles = [] }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<EcoFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const processFiles = (rawFiles: File[]) => {
    setUploading(true);
    setTimeout(() => {
      const newFiles: EcoFile[] = rawFiles.map((f) => ({
        id: `E${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        type: f.type || "application/dicom",
        size: f.size,
        uploadedAt: new Date().toISOString(),
        category: f.name.toLowerCase().includes("renal") ? "renal"
          : f.name.toLowerCase().includes("vejiga") ? "vejiga"
          : "prostata",
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      setUploading(false);
    }, 1200);
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Scan className="w-4 h-4 text-urology-blue" />
        <h3 className="text-sm font-semibold text-medflow-slate">Ecografías y Estudios DICOM</h3>
        {files.length > 0 && (
          <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {files.length} archivo{files.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-8",
          isDragging
            ? "border-urology-blue bg-urology-blue-light scale-[1.01]"
            : "border-slate-200 hover:border-medflow-emerald hover:bg-medflow-emerald-light/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".dcm,.png,.jpg,.jpeg,.pdf"
          className="hidden"
          onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))}
        />

        {uploading ? (
          <>
            <div className="w-10 h-10 rounded-full border-4 border-medflow-emerald border-t-transparent animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Procesando archivo...</p>
          </>
        ) : (
          <>
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
              isDragging ? "bg-urology-blue text-white" : "bg-slate-100 text-slate-400"
            )}>
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-medflow-slate">
                Arrastra aquí o haz clic para subir
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Soporta: DICOM (.dcm), PDF, JPG, PNG — Max 50 MB
              </p>
            </div>
          </>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 group"
            >
              <div className="w-8 h-8 rounded-lg bg-urology-blue-light flex items-center justify-center flex-shrink-0">
                {file.type.includes("pdf") ? (
                  <FileText className="w-4 h-4 text-urology-blue" />
                ) : (
                  <FileImage className="w-4 h-4 text-urology-blue" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-medflow-slate truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">
                  {CATEGORY_LABELS[file.category]} · {formatBytes(file.size)}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-medflow-emerald flex-shrink-0" />
              <button
                onClick={() => removeFile(file.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
