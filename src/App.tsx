import React, { useState, useEffect } from "react";
import { RosterMember } from "./types";
import { DEFAULT_ROSTER } from "./mockData";
import { repackageJson } from "./parser";
import { RosterSummary } from "./components/RosterSummary";
import { RosterTable } from "./components/RosterTable";
import { RosterEditor } from "./components/RosterEditor";
import { JsonImportExport } from "./components/JsonImportExport";
import { PotentialDifferenceAnalyzer } from "./components/PotentialDifferenceAnalyzer";
import { PartyTab } from "./components/PartyTab";
import { Top10Potential } from "./components/Top10Potential";
import { ListPartyDifference } from "./components/ListPartyDifference";
import { 
  Download, 
  FileSpreadsheet, 
  RefreshCw, 
  Save, 
  Shield, 
  Users, 
  Trash2, 
  PlusCircle, 
  HelpCircle,
  Clock
} from "lucide-react";
import * as XLSX from "xlsx";

const LOCAL_STORAGE_KEY = "etrian_roster_vector_state";
const METADATA_KEY = "etrian_parent_json_state";
const GUILD_NAME_KEY = "etrian_guild_name_state";

export default function App() {
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<RosterMember | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [originalFullData, setOriginalFullData] = useState<any>(null);
  const [guildName, setGuildName] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [statusBarMsg, setStatusBarMsg] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [activeTab, setActiveTab] = useState<"roster" | "potentialDiff" | "party" | "top10" | "listPartyDiff">("roster");

  // Compute active roster: strictly filters active roster list.
  // Only adventurers with "type": "adventurer" and excludes any who have a designated "retiredAt" status.
  const activeRoster = React.useMemo(() => {
    return roster.filter(member => {
      if (member.type !== "adventurer") return false;
      if (member.retiredAt !== null && member.retiredAt !== undefined) return false;
      return true;
    });
  }, [roster]);

  // Initialize roster state from localStorage or mock data
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const savedMeta = localStorage.getItem(METADATA_KEY);
    
    if (saved) {
      try {
        setRoster(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local storage, loading default", e);
        setRoster(DEFAULT_ROSTER);
      }
    } else {
      setRoster(DEFAULT_ROSTER);
    }

    if (savedMeta) {
      try {
        setOriginalFullData(JSON.parse(savedMeta));
      } catch (e) {
        setOriginalFullData(null);
      }
    }

    const savedGuildName = localStorage.getItem(GUILD_NAME_KEY);
    if (savedGuildName) {
      setGuildName(savedGuildName);
    } else {
      setGuildName("Sample Barracks");
    }

    // Set time
    setCurrentTime("2026-06-12 16:56:00 UTC");
  }, []);

  // Save automatically to localStorage upon roster updates
  const saveToLocalStorage = (updatedRoster: RosterMember[], metaData: any) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRoster));
    if (metaData) {
      localStorage.setItem(METADATA_KEY, JSON.stringify(metaData));
    } else {
      localStorage.removeItem(METADATA_KEY);
    }
    showFeedback("Guild state backed up locally!");
  };

  const showFeedback = (msg: string) => {
    setStatusBarMsg(msg);
    setTimeout(() => {
      setStatusBarMsg("");
    }, 4000);
  };

  // Actions
  const handleSelectMember = (member: RosterMember) => {
    setSelectedMember(member);
  };

  const handleSaveMember = (updatedMember: RosterMember) => {
    let newRoster = [...roster];
    const index = roster.findIndex(r => r.id === updatedMember.id);
    
    if (index !== -1) {
      newRoster[index] = updatedMember;
      showFeedback(`Updated specifications for ${updatedMember.name}`);
    } else {
      newRoster.push(updatedMember);
      showFeedback(`Registered new explorer ${updatedMember.name}`);
    }

    setRoster(newRoster);
    saveToLocalStorage(newRoster, originalFullData);
    // Refresh selected member state preview
    setSelectedMember(updatedMember);
  };

  const handleDeleteMember = (id: string) => {
    const memberName = roster.find(r => r.id === id)?.name || "Adventurer";
    if (window.confirm(`Are you sure you want to dismiss ${memberName} from the active guild lines?`)) {
      const newRoster = roster.filter(r => r.id !== id);
      setRoster(newRoster);
      saveToLocalStorage(newRoster, originalFullData);
      
      if (selectedMember?.id === id) {
        setSelectedMember(null);
      }
      showFeedback(`Dismissed ${memberName} from active duty`);
    }
  };

  const handleDuplicateMember = (member: RosterMember) => {
    const copy = JSON.parse(JSON.stringify(member)) as RosterMember;
    copy.id = `member_new_${Date.now()}`;
    copy.name = `${member.name} (Clone)`;
    
    const newRoster = [...roster, copy];
    setRoster(newRoster);
    saveToLocalStorage(newRoster, originalFullData);
    setSelectedMember(copy);
    setShowEditor(true);
    showFeedback(`Cloned ${member.name}`);
  };

  const handleAddNewMember = () => {
    const fresh: RosterMember = {
      id: `member_new_${Date.now()}`,
      name: "New Recruit",
      type: "adventurer",
      class: "Landsknecht",
      classRarity: "Common",
      level: 1,
      age: 18,
      potential: 50,
      potentialCeiling: 65,
      roles: ["attacker"],
      retiredAt: null,
      categoryCeilings: {
        physical: 70, vitality: 70, mental: 60, social: 70, combat: 70, heroic: 65, arcane: 30
      },
      stats: {
        str: 15, dex: 15, spd: 15, agi: 15, con: 15,
        vit: 15, end: 15, dur: 15, rec: 15,
        int: 10, wis: 10, lck: 12,
        cha: 10, ldr: 12, tmw: 15, tru: 10, loy: 80,
        atk: 20, def: 15,
        hro: 15, sur: 12,
        arc: 5, res: 10
      }
    };
    setSelectedMember(fresh);
    setShowEditor(true);
    showFeedback("Initiated new recruit profile. Add details and click Save.");
  };

  const handleImportSuccess = (importedRoster: RosterMember[], parsedFullData: any, importedGuildName?: string | null) => {
    setRoster(importedRoster);
    setOriginalFullData(parsedFullData);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(importedRoster));
    if (parsedFullData) {
      localStorage.setItem(METADATA_KEY, JSON.stringify(parsedFullData));
    }
    
    const finalGuildName = importedGuildName || (parsedFullData && (parsedFullData.guildName || (parsedFullData.gameState && parsedFullData.gameState.guildName))) || "Imported Guild";
    setGuildName(finalGuildName);
    localStorage.setItem(GUILD_NAME_KEY, finalGuildName);

    setSelectedMember(importedRoster[0] || null);
    showFeedback(`Parsed ${importedRoster.length} characters in Guild "${finalGuildName}" successfully.`);
  };

  const handleResetToDefault = () => {
    if (window.confirm("Restore guild roster to clean default sample characters? This overrides custom modifications.")) {
      setRoster(DEFAULT_ROSTER);
      setOriginalFullData(null);
      setGuildName("Sample Barracks");
      localStorage.setItem(GUILD_NAME_KEY, "Sample Barracks");
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(METADATA_KEY);
      setSelectedMember(null);
      showFeedback("Guild roster reset to clean defaults.");
    }
  };

  const executeClearDataAll = () => {
    setRoster([]);
    setOriginalFullData(null);
    setGuildName(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(METADATA_KEY);
    localStorage.removeItem(GUILD_NAME_KEY);
    setSelectedMember(null);
    showFeedback("All imported JSON roster data cleared.");
  };

  const handleClearDataAll = () => {
    setShowClearConfirm(true);
  };

  const handleClearRoster = () => {
    setShowClearConfirm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Download modified JSON
  const handleDownloadJson = () => {
    if (roster.length === 0) {
      alert("No roster items to package.");
      return;
    }
    const jsonStr = repackageJson(originalFullData, roster, guildName);
    
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "edf-edited2.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFeedback("Downloaded updated game data (edf-edited2.json)");
  };

  // Download XLS Sheet exactly mimicking Py extraction
  const handleDownloadExcel = () => {
    const extractedRows: any[] = [];

    for (const m of roster) {
      // FILTER RULE 1: Only keep records of type "adventurer"
      if (m.type !== "adventurer") {
         continue;
      }

      // FILTER RULE 2: Skip the record if they have a "retiredAt" field containing "age"
      const retiredAt = m.retiredAt;
      if (retiredAt && typeof retiredAt === "object" && "age" in retiredAt) {
         continue;
      }

      const stats = m.stats || {};
      const ceilings = m.categoryCeilings || {};
      const rolesStr = Array.isArray(m.roles) ? m.roles.join(", ") : "";

      const row = {
        "name": m.name || "",
        "class": m.class || "",
        "roles": rolesStr,
        "rarity": m.classRarity || "",
        "level": m.level !== undefined ? Number(m.level) : null,
        "age": m.age !== undefined ? Number(m.age) : null,
        "potential": m.potential !== undefined ? Number(m.potential) : null,
        "potentialCeiling": m.potentialCeiling !== undefined ? Number(m.potentialCeiling) : null,
        
        "categoryCeilings physical": ceilings.physical !== undefined ? Number(ceilings.physical) : null,
        "str": stats.str !== undefined ? Number(stats.str) : null,
        "dex": stats.dex !== undefined ? Number(stats.dex) : null,
        "spd": stats.spd !== undefined ? Number(stats.spd) : null,
        "agi": stats.agi !== undefined ? Number(stats.agi) : null,
        "con": stats.con !== undefined ? Number(stats.con) : null,
        
        "categoryCeilings vitality": ceilings.vitality !== undefined ? Number(ceilings.vitality) : null,
        "vit": stats.vit !== undefined ? Number(stats.vit) : null,
        "end": stats.end !== undefined ? Number(stats.end) : null,
        "dur": stats.dur !== undefined ? Number(stats.dur) : null,
        "rec": stats.rec !== undefined ? Number(stats.rec) : null,
        
        "categoryCeilings mental": ceilings.mental !== undefined ? Number(ceilings.mental) : null,
        "int": stats.int !== undefined ? Number(stats.int) : null,
        "wis": stats.wis !== undefined ? Number(stats.wis) : null,
        "lck": stats.lck !== undefined ? Number(stats.lck) : null,
        
        "categoryCeilings social": ceilings.social !== undefined ? Number(ceilings.social) : null,
        "cha": stats.cha !== undefined ? Number(stats.cha) : null,
        "ldr": stats.ldr !== undefined ? Number(stats.ldr) : null,
        "tmw": stats.tmw !== undefined ? Number(stats.tmw) : null,
        "tru": stats.tru !== undefined ? Number(stats.tru) : null,
        "loy": stats.loy !== undefined ? Number(stats.loy) : null,
        
        "categoryCeilings combat": ceilings.combat !== undefined ? Number(ceilings.combat) : null,
        "atk": stats.atk !== undefined ? Number(stats.atk) : null,
        "def": stats.def !== undefined ? Number(stats.def) : null,
        
        "categoryCeilings heroic": ceilings.heroic !== undefined ? Number(ceilings.heroic) : null,
        "hro": stats.hro !== undefined ? Number(stats.hro) : null,
        "sur": stats.sur !== undefined ? Number(stats.sur) : null,
        
        "categoryCeilings arcane": ceilings.arcane !== undefined ? Number(ceilings.arcane) : null,
        "arc": stats.arc !== undefined ? Number(stats.arc) : null,
        "res": stats.res !== undefined ? Number(stats.res) : null
      };
      
      extractedRows.push(row);
    }

    if (extractedRows.length === 0) {
      alert("No active adventurers to export. Note that retired or non-adventurer figures are filtered as mandated by extract.py.");
      return;
    }

    // SheetJS Workbook generation
    const worksheet = XLSX.utils.json_to_sheet(extractedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Active Adventurers");
    
    // Auto-fit columns
    const max_len = extractedRows.reduce((w, r) => Math.max(w, String(r.name).length), 10);
    worksheet["!cols"] = [{ wch: max_len + 4 }];

    XLSX.writeFile(workbook, "roster_table.xlsx");
    showFeedback(`Extracted ${extractedRows.length} active adventurers to roster_table.xlsx Successfully!`);
  };

  return (
    <div className="bg-[#0a0a0a] text-slate-100 min-h-screen font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Main RPG Navigation Header */}
      <header className="border-b border-white/10 bg-[#0f0f0f]/90 sticky top-0 backdrop-blur-md z-30 px-4 sm:px-8 py-4">
        <div className="w-full max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white font-black tracking-tighter text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              GTMT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-sans tracking-tight text-white uppercase sm:text-lg">
                  GT-Management Tool
                </h1>
                <span className="text-[10px] bg-indigo-600/10 text-indigo-400 border border-indigo-505/25 px-2 py-0.5 rounded font-mono">
                  v2.4.1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    lmonSQZ42.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <JsonImportExport onImportSuccess={handleImportSuccess} />

            {showClearConfirm ? (
              <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-500/40 rounded px-3 py-1.5 transition-all">
                <span className="text-xs text-rose-200 font-bold font-sans">Are you sure?</span>
                <button
                  onClick={() => {
                    executeClearDataAll();
                    setShowClearConfirm(false);
                  }}
                  className="px-2.5 py-1 bg-[#dc2626] hover:bg-rose-500 text-white rounded text-[10px] uppercase font-black transition-all cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded text-[10px] uppercase font-semibold transition-all cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                 onClick={handleClearDataAll}
                 title="clear data all"
                 className="px-3.5 py-2 rounded bg-rose-950/25 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                Clear Data All
              </button>
            )}

            <button
               onClick={handleDownloadJson}
               className="px-3.5 py-2 rounded bg-[#0f0f0f] border border-white/10 hover:border-white/20 text-slate-205 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-white/5"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              Download JSON (.json)
            </button>

            <button
               onClick={handleDownloadExcel}
               className="px-3.5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(79,70,229,0.2)]"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              Export Excel Roster
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Content */}
      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 py-6 space-y-6">
        
        {/* Tabs Control Row with Global Compact Stats on Right */}
        <div className="sticky top-[73px] bg-[#0a0a0a] z-20 flex flex-col lg:flex-row lg:items-end lg:justify-between border-b border-white/10 pt-2 pb-2.5 lg:pb-0 gap-3">
          <div id="navigation-tabs-container" className="flex items-end overflow-x-auto scrollbar-none gap-1 pt-2 -mb-[1px]">
            <button
              id="tab-btn-roster"
              onClick={() => setActiveTab("roster")}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-t-lg border-t border-x cursor-pointer shrink-0 relative ${
                activeTab === "roster"
                  ? "bg-[#0f0f0f] border-white/15 text-indigo-400 font-extrabold shadow-[0_-4px_18px_rgba(99,102,241,0.12)] z-10 translate-y-[1px]"
                  : "bg-black/35 border-transparent text-slate-450 hover:text-white hover:bg-black/50"
              }`}
            >
              {activeTab === "roster" && (
                <span className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-t-lg animate-pulse" />
              )}
              Guild Roster
            </button>
            
            {activeTab !== "roster" && activeTab !== "potentialDiff" && (
              <div className="w-[1px] h-3.5 bg-white/10 self-center shrink-0 opacity-40 mx-1" />
            )}
            
            <button
              id="tab-btn-potential-diff"
              onClick={() => setActiveTab("potentialDiff")}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-t-lg border-t border-x cursor-pointer shrink-0 relative ${
                activeTab === "potentialDiff"
                  ? "bg-[#0f0f0f] border-white/15 text-indigo-400 font-extrabold shadow-[0_-4px_18px_rgba(99,102,241,0.12)] z-10 translate-y-[1px]"
                  : "bg-black/35 border-transparent text-slate-450 hover:text-white hover:bg-black/50"
              }`}
            >
              {activeTab === "potentialDiff" && (
                <span className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-t-lg animate-pulse" />
              )}
              Potential Difference Analyzer
            </button>

            {activeTab !== "potentialDiff" && activeTab !== "party" && (
              <div className="w-[1px] h-3.5 bg-white/10 self-center shrink-0 opacity-40 mx-1" />
            )}

            <button
              id="tab-btn-party"
              onClick={() => setActiveTab("party")}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-t-lg border-t border-x cursor-pointer shrink-0 relative ${
                activeTab === "party"
                  ? "bg-[#0f0f0f] border-white/15 text-indigo-400 font-extrabold shadow-[0_-4px_18px_rgba(99,102,241,0.12)] z-10 translate-y-[1px]"
                  : "bg-black/35 border-transparent text-slate-450 hover:text-white hover:bg-black/50"
              }`}
            >
              {activeTab === "party" && (
                <span className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-t-lg animate-pulse" />
              )}
              Set Party
            </button>

            {activeTab !== "party" && activeTab !== "top10" && (
              <div className="w-[1px] h-3.5 bg-white/10 self-center shrink-0 opacity-40 mx-1" />
            )}

            <button
              id="tab-btn-top10"
              onClick={() => setActiveTab("top10")}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-t-lg border-t border-x cursor-pointer shrink-0 relative ${
                activeTab === "top10"
                  ? "bg-[#0f0f0f] border-white/15 text-indigo-400 font-extrabold shadow-[0_-4px_18px_rgba(99,102,241,0.12)] z-10 translate-y-[1px]"
                  : "bg-black/35 border-transparent text-slate-450 hover:text-white hover:bg-black/50"
              }`}
            >
              {activeTab === "top10" && (
                <span className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-t-lg animate-pulse" />
              )}
              Top 10 Potential
            </button>

            {activeTab !== "top10" && activeTab !== "listPartyDiff" && (
              <div className="w-[1px] h-3.5 bg-white/10 self-center shrink-0 opacity-40 mx-1" />
            )}

            <button
              id="tab-btn-list-party-diff"
              onClick={() => setActiveTab("listPartyDiff")}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-t-lg border-t border-x cursor-pointer shrink-0 relative ${
                activeTab === "listPartyDiff"
                  ? "bg-[#0f0f0f] border-white/15 text-indigo-400 font-extrabold shadow-[0_-4px_18px_rgba(99,102,241,0.12)] z-10 translate-y-[1px]"
                  : "bg-black/35 border-transparent text-slate-450 hover:text-white hover:bg-black/50"
              }`}
            >
              {activeTab === "listPartyDiff" && (
                <span className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-t-lg animate-pulse" />
              )}
              Spreadsheet - Difference
            </button>
          </div>
          
          <div className="mb-0.5 lg:-mb-[1px] shrink-0 self-start lg:self-end">
            <RosterSummary roster={activeRoster} guildName={guildName} />
          </div>
        </div>

        {/* Core Workspace Sections */}
        {activeTab === "roster" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Grid: Table + Import Block */}
            <div className={`${showEditor ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"} space-y-6`}>
              
              <RosterTable 
                roster={activeRoster}
                selectedMemberId={selectedMember?.id || null}
                onSelectMember={handleSelectMember}
                onDoubleClickMember={(member) => {
                  setSelectedMember(member);
                  setShowEditor(true);
                }}
                onDeleteMember={handleDeleteMember}
                onDuplicateMember={handleDuplicateMember}
                onAddNewMember={handleAddNewMember}
              />

            </div>

            {/* Right Grid: Detailed Characteristic Sheet */}
            {showEditor && (
              <div className="lg:col-span-5 xl:col-span-4 h-full">
                <RosterEditor 
                  member={selectedMember}
                  onSave={handleSaveMember}
                  onClose={() => {
                    setSelectedMember(null);
                    setShowEditor(false);
                  }}
                />
              </div>
            )}

          </div>
        )}

        {activeTab === "potentialDiff" && (
          <PotentialDifferenceAnalyzer
            roster={activeRoster}
            selectedMemberId={selectedMember?.id || null}
            onSelectMember={(member) => {
              handleSelectMember(member);
              setShowEditor(true);
            }}
            onUpdateMember={handleSaveMember}
            onClose={() => setActiveTab("roster")}
          />
        )}

        {activeTab === "party" && (
          <PartyTab
            roster={activeRoster}
            onShowStatusBarMessage={showFeedback}
          />
        )}

        {activeTab === "top10" && (
          <Top10Potential
            roster={activeRoster}
            onSelectMember={(member) => {
              handleSelectMember(member);
              setActiveTab("roster");
              setShowEditor(true);
            }}
            onClose={() => setActiveTab("roster")}
          />
        )}

        {activeTab === "listPartyDiff" && (
          <ListPartyDifference
            roster={activeRoster}
            onSelectMember={(member) => {
              handleSelectMember(member);
              setActiveTab("roster");
              setShowEditor(true);
            }}
            onClose={() => setActiveTab("roster")}
          />
        )}

        {/* Diagnostic Actions & Information Footer */}
        <div className="bg-[#0f0f0f] border border-white/10 p-4 rounded flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-mono text-[11px] text-slate-350">
              Session Ref: 2026-06-12 UT / Active Roster Vector Sandbox
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleResetToDefault}
              className="px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-white/5 hover:border-white/15 text-[11px] font-semibold text-indigo-400 transition-colors cursor-pointer"
            >
              Load Sample Barracks
            </button>
            <button
              onClick={handleClearRoster}
              className="px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-white/5 hover:border-white/15 text-[11px] font-semibold text-rose-400 transition-colors cursor-pointer"
            >
              Clear Roster
            </button>
          </div>
        </div>

      </main>

      {/* Floating Status Bar Notifications */}
      {statusBarMsg && (
        <div className="fixed bottom-6 right-6 bg-[#0f0f0f]/95 border border-indigo-500/20 text-indigo-400 text-xs px-4 py-3 rounded shadow-2xl backdrop-blur-md flex items-center space-x-2 z-50 animate-bounce duration-1000">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
          <span className="font-medium">{statusBarMsg}</span>
        </div>
      )}

    </div>
  );
}
