import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, ShieldAlert, FileCode } from "lucide-react";
import { extractRosterRobust } from "../parser";
import { RosterMember } from "../types";

interface JsonImportExportProps {
  onImportSuccess: (roster: RosterMember[], originalFullData: any) => void;
}

export const JsonImportExport: React.FC<JsonImportExportProps> = ({ onImportSuccess }) => {
  const [pasteText, setPasteText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [parseStatus, setParseStatus] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const handleImport = (content: string) => {
    try {
      if (!content.trim()) {
        throw new Error("Content is empty.");
      }

      const result = extractRosterRobust(content);
      if (result.roster.length === 0) {
        throw new Error("Parsed successfully but found 0 adventurers.");
      }

      onImportSuccess(result.roster, result.fullData);
      setParseStatus({
        status: "success",
        message: `Guild accepted! Loaded ${result.roster.length} members successfully.`,
      });
      setPasteText("");
    } catch (err: any) {
      setParseStatus({
        status: "error",
        message: err.message || "Failed to parse. Please check JSON syntax.",
      });
    }
  };

  // Drag and drop events handlers
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
         setParseStatus({ status: "error", message: "Failed to read file." });
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

  const loadDemoPayload = (type: "standard" | "dirty") => {
    if (type === "standard") {
      const demo = {
        gameState: {
          roster: [
            {
              name: "Soren Dragonheart",
              type: "adventurer",
              class: "Imperial",
              classRarity: "Epic",
              level: 48,
              age: 27,
              potential: 82,
              potentialCeiling: 90,
              roles: ["attacker", "defender"],
              retiredAt: null,
              categoryCeilings: { physical: 90, vitality: 80, combat: 90 },
              stats: { str: 84, vit: 78, atk: 88, def: 80 }
            },
            {
              name: "Elder Garl",
              type: "adventurer",
              class: "Bushi",
              classRarity: "Rare",
              level: 30,
              age: 58,
              potential: 60,
              potentialCeiling: 70,
              roles: ["attacker"],
              retiredAt: { age: 50 }, // Retired!
              categoryCeilings: { physical: 80, heroic: 70 },
              stats: { str: 72, hro: 65 }
            }
          ]
        }
      };
      setPasteText(JSON.stringify(demo, null, 2));
    } else {
      // Dirty JSON with debugging headers and a trailing comma! Excellent test of Attempt 2 matching
      const dirtyDemo = `--- COLOG GAME ENGINE DEBUG LOGS START ---
START OF FILE: edf-edited2.json
{
  "gameState": {
    "saveSlot": 4,
    "roster": [
      {
        "name": "Eldrin the Poisoner",
        "type": "adventurer",
        "class": "Nightseeker",
        "classRarity": "Legendary",
        "level": 55,
        "age": 22,
        "potential": 94,
        "potentialCeiling": 100,
        "roles": ["attacker", "disabler"],
        "retiredAt": null,
        "categoryCeilings": {
          "physical": 95,
          "vitality": 70,
          "mental": 80
        },
        "stats": {
          "str": 90,
          "dex": 94,
          "spd": 92
        }
      },
    ]
  }
}
END OF FILE --- WRITTEN OK ---`;
      setPasteText(dirtyDemo);
    }
  };

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-lg p-4 shadow-lg space-y-4">
      <div className="flex items-center space-x-2">
        <Upload className="w-4 h-4 text-indigo-400" />
        <h4 className="text-slate-200 font-bold font-sans text-xs uppercase tracking-widest">
          Import Guild Roster File (.json)
        </h4>
      </div>

      <p className="text-slate-400 text-xs leading-relaxed">
        Upload or paste your <code className="font-mono text-slate-300 bg-black/50 border border-white/5 px-1 py-0.5 rounded text-[10px]">edf-edited2.json</code>. The robust parser automatically extracts roster vectors, bypassing game engine logs and patching minor trailing comma inconsistencies.
      </p>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border border-dashed rounded p-6 text-center transition-all cursor-pointer relative ${
          dragActive
            ? "border-indigo-500 bg-indigo-505/5 text-indigo-300 scale-[1.01]"
            : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30 text-slate-400"
        }`}
      >
        <input
          type="file"
          id="file-upload-input"
          accept=".json"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center space-y-2 pointer-events-none">
          <FileText className="w-8 h-8 text-slate-500" />
          <div>
            <span className="text-indigo-450 hover:text-indigo-400 font-semibold text-xs">
              Click to choose a JSON roster file
            </span>
            <span className="text-slate-500 text-xs"> or drag & drop it here</span>
          </div>
          <p className="text-[10px] text-slate-600">JSON syntax format</p>
        </div>
      </div>

      {/* Paste Area Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#8c8c8c]">
          <span>OR PASTE RAW DATA:</span>
          <div className="space-x-1.5 flex select-none font-bold">
            <button
              type="button"
              onClick={() => loadDemoPayload("standard")}
              className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              [Demo Roster]
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={() => loadDemoPayload("dirty")}
              className="text-rose-400 hover:text-rose-350 transition-colors cursor-pointer"
              title="Test the robust bracket-matching regex fallback!"
            >
              [Dirty Log Demo]
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste roster state or raw logs here..."
          className="w-full bg-[#0a0a0a] text-slate-305 font-mono text-[11px] border border-white/10 hover:border-white/20 focus:outline-none focus:border-indigo-500 p-2.5 rounded focus:ring-1 focus:ring-indigo-500 placeholder-slate-600 h-28 resize-y"
        />

        <button
          type="button"
          onClick={() => handleImport(pasteText)}
          disabled={!pasteText.trim()}
          className="w-full py-2 bg-white/5 hover:bg-white/10 disabled:opacity-45 disabled:hover:bg-white/5 text-slate-200 font-bold font-sans text-xs rounded border border-white/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <FileCode className="w-4 h-4 text-indigo-400" />
          Parse & Lock Roster
        </button>
      </div>

      {/* Feedbacks */}
      {parseStatus.status !== "idle" && (
        <div
          className={`p-3 rounded border flex items-start space-x-2 text-xs leading-normal animate-fade-in ${
            parseStatus.status === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {parseStatus.status === "success" ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 min-w-[16px]" />
          ) : (
            <ShieldAlert className="w-4 h-4 mt-0.5 min-w-[16px]" />
          )}
          <span>{parseStatus.message}</span>
        </div>
      )}
    </div>
  );
};
