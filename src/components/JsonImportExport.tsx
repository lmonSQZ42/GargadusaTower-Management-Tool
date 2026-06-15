import React, { useState, useEffect } from "react";
import { Upload, CheckCircle2, ShieldAlert } from "lucide-react";
import { extractRosterRobust } from "../parser";
import { RosterMember } from "../types";

interface JsonImportExportProps {
  onImportSuccess: (roster: RosterMember[], originalFullData: any, guildName?: string | null) => void;
}

export const JsonImportExport: React.FC<JsonImportExportProps> = ({ onImportSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [parseStatus, setParseStatus] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    details?: string;
  }>({ status: "idle", message: "" });

  useEffect(() => {
    if (parseStatus.status !== "idle") {
      const timer = setTimeout(() => {
        setParseStatus({ status: "idle", message: "" });
      }, parseStatus.status === "success" ? 4000 : 5000);
      return () => clearTimeout(timer);
    }
  }, [parseStatus.status]);

  const handleImport = (content: string) => {
    try {
      if (!content.trim()) {
        throw new Error("Content is empty.");
      }

      const result = extractRosterRobust(content);
      if (result.roster.length === 0) {
        throw new Error("Found 0 adventurers.");
      }

      onImportSuccess(result.roster, result.fullData, result.guildName);
      setParseStatus({
        status: "success",
        message: "Import Success!",
        details: `${result.roster.length} members loaded`,
      });
    } catch (err: any) {
      setParseStatus({
        status: "error",
        message: "Import Failed",
        details: err.message || "Invalid syntax",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleImport(text);
      };
      reader.onerror = () => {
        setParseStatus({ status: "error", message: "Import Failed", details: "Failed to read file." });
      };
      reader.readAsText(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleImport(text);
      };
      reader.readAsText(file);
    }
  };

  // Render different visual states within a compact button dimension
  const renderContent = () => {
    if (dragActive) {
      return (
        <>
          <Upload className="w-4 h-4 text-indigo-400 animate-bounce" />
          <div className="text-left font-sans">
            <span className="block font-bold text-[10px] uppercase tracking-wider text-indigo-400">Release File</span>
            <span className="block text-[8px] text-indigo-300/80 leading-none mt-0.5">Drop to Import</span>
          </div>
        </>
      );
    }

    if (parseStatus.status === "success") {
      return (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div className="text-left font-sans">
            <span className="block font-bold text-[10px] uppercase tracking-wider text-emerald-400">{parseStatus.message}</span>
            <span className="block text-[8px] text-emerald-500/80 leading-none mt-0.5">{parseStatus.details}</span>
          </div>
        </>
      );
    }

    if (parseStatus.status === "error") {
      return (
        <>
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <div className="text-left font-sans" title={parseStatus.details}>
            <span className="block font-bold text-[10px] uppercase tracking-wider text-rose-400">{parseStatus.message}</span>
            <span className="block text-[8px] text-rose-500/80 leading-none mt-0.5 max-w-[200px] truncate">{parseStatus.details}</span>
          </div>
        </>
      );
    }

    return (
      <>
        <Upload className="w-4 h-4 text-indigo-400" />
        <div className="text-left font-sans">
          <span className="block font-bold text-[10px] uppercase tracking-wider text-slate-200">Import Guild JSON</span>
          <span className="block text-[8px] text-slate-500 leading-none mt-0.5">Drop here or Click</span>
        </div>
      </>
    );
  };

  const borderStateClass = () => {
    if (dragActive) return "border-indigo-505 bg-indigo-500/10 text-indigo-300 scale-[1.02] shadow-[0_0_10px_rgba(99,102,241,0.1)]";
    if (parseStatus.status === "success") return "border-emerald-500/30 bg-emerald-500/5 text-emerald-450 shadow-[0_0_10px_rgba(16,185,129,0.05)]";
    if (parseStatus.status === "error") return "border-rose-500/30 bg-rose-500/5 text-rose-450";
    return "border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30 text-slate-300";
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative border border-dashed rounded px-3.5 py-1.5 flex items-center gap-2.5 h-[38px] w-[260px] transition-all cursor-pointer select-none ${borderStateClass()}`}
    >
      <input
        type="file"
        id="header-roster-file-upload"
        accept=".json"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 font-sans"
      />
      {renderContent()}
    </div>
  );
};
