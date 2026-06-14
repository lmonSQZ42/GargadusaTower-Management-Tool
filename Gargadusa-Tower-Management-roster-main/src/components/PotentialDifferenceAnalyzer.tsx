import React, { useState, useEffect } from "react";
import { RosterMember, CategoryCeilings, Stats } from "../types";
import { ShieldCheck, Sparkles, User, AlertCircle } from "lucide-react";

interface PotentialDifferenceAnalyzerProps {
  roster: RosterMember[];
  onUpdateMember: (member: RosterMember) => void;
  selectedMemberId: string | null;
  onSelectMember: (member: RosterMember) => void;
  onClose?: () => void;
}

export const PotentialDifferenceAnalyzer: React.FC<PotentialDifferenceAnalyzerProps> = ({
  roster,
  onUpdateMember,
  selectedMemberId,
  onSelectMember,
  onClose,
}) => {
  // Find current selected member or fallback to first active adventurer
  const activeAdventurers = roster.filter(m => m.type === "adventurer");
  const fallbackMember = activeAdventurers[0] || roster[0] || null;
  
  const currentMember = roster.find(m => m.id === selectedMemberId) || fallbackMember;

  // Local editable state to make typing smooth before bubbling up
  const [edited, setEdited] = useState<RosterMember | null>(null);

  useEffect(() => {
    if (currentMember) {
      setEdited(JSON.parse(JSON.stringify(currentMember)));
    } else {
      setEdited(null);
    }
  }, [currentMember, selectedMemberId]);

  if (!edited) {
    return (
      <div className="bg-[#0f0f0f] border border-white/10 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-pulse" />
        <p className="text-slate-400 text-sm">No adventurers available. Please add or import some adventurers first.</p>
      </div>
    );
  }

  // Ensure internal objects exist
  const ceilings = edited.categoryCeilings || {};
  const stats = edited.stats || {};
  const potential = edited.potential ?? 0;
  const potentialCeiling = edited.potentialCeiling ?? 0;

  // Trigger state bubble-up to App.tsx
  const handleValueChange = (updated: RosterMember) => {
    setEdited(updated);
    onUpdateMember(updated);
  };

  const updatePotential = (val: number) => {
    const updated = { ...edited, potential: val };
    handleValueChange(updated);
  };

  const updatePotentialCeiling = (val: number) => {
    const updated = { ...edited, potentialCeiling: val };
    handleValueChange(updated);
  };

  const updateCeiling = (cat: keyof CategoryCeilings, val: number) => {
    const updated = {
      ...edited,
      categoryCeilings: {
        ...(edited.categoryCeilings || {}),
        [cat]: val
      }
    };
    handleValueChange(updated);
  };

  const updateStat = (key: keyof Stats, val: number) => {
    const updated = {
      ...edited,
      stats: {
        ...(edited.stats || {}),
        [key]: val
      }
    };
    handleValueChange(updated);
  };

  // Difference Helper: Ceiling - Value
  const getDiff = (ceiling: number | undefined, val: number | undefined) => {
    const c = ceiling ?? 0;
    const v = val ?? 0;
    return c - v;
  };

  // Color Helper for difference status
  const getDiffStyle = (diff: number) => {
    if (diff < 0) return "text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded";
    if (diff === 0) return "text-indigo-400 font-bold bg-indigo-500/5 px-1.5 py-0.5 rounded border border-white/5";
    return "text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded";
  };

  const handleExplorerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = roster.find(m => m.id === e.target.value);
    if (found) {
      onSelectMember(found);
    }
  };

  // Category layout array
  const categoriesDef = [
    {
      id: "physical",
      name: "Physical Force",
      ceilKey: "physical" as keyof CategoryCeilings,
      stats: [
        { key: "str" as keyof Stats, label: "Strength (STR)" },
        { key: "dex" as keyof Stats, label: "Dexterity (DEX)" },
        { key: "spd" as keyof Stats, label: "Speed (SPD)" },
        { key: "agi" as keyof Stats, label: "Agility (AGI)" },
        { key: "con" as keyof Stats, label: "Constitution (CON)" },
      ]
    },
    {
      id: "vitality",
      name: "Vitality Force",
      ceilKey: "vitality" as keyof CategoryCeilings,
      stats: [
        { key: "vit" as keyof Stats, label: "Vitality (VIT)" },
        { key: "end" as keyof Stats, label: "Endurance (END)" },
        { key: "dur" as keyof Stats, label: "Durability (DUR)" },
        { key: "rec" as keyof Stats, label: "Recovery (REC)" },
      ]
    },
    {
      id: "mental",
      name: "Mental Focus",
      ceilKey: "mental" as keyof CategoryCeilings,
      stats: [
        { key: "int" as keyof Stats, label: "Intelligence (INT)" },
        { key: "wis" as keyof Stats, label: "Wisdom (WIS)" },
        { key: "lck" as keyof Stats, label: "Luck (LCK)" },
      ]
    },
    {
      id: "social",
      name: "Social Affinity",
      ceilKey: "social" as keyof CategoryCeilings,
      stats: [
        { key: "cha" as keyof Stats, label: "Charisma (CHA)" },
        { key: "ldr" as keyof Stats, label: "Leadership (LDR)" },
        { key: "tmw" as keyof Stats, label: "Teamwork (TMW)" },
        { key: "tru" as keyof Stats, label: "Trustworthiness (TRU)" },
        { key: "loy" as keyof Stats, label: "Loyalty (LOY)" },
      ]
    },
    {
      id: "combat",
      name: "Combat Masteries",
      ceilKey: "combat" as keyof CategoryCeilings,
      stats: [
        { key: "atk" as keyof Stats, label: "Attack Power (ATK)" },
        { key: "def" as keyof Stats, label: "Defense Power (DEF)" },
      ]
    },
    {
      id: "heroic",
      name: "Heroic Destiny",
      ceilKey: "heroic" as keyof CategoryCeilings,
      stats: [
        { key: "hro" as keyof Stats, label: "Heroism (HRO)" },
        { key: "sur" as keyof Stats, label: "Survivalism (SUR)" },
      ]
    },
    {
      id: "arcane",
      name: "Arcane Reservoirs",
      ceilKey: "arcane" as keyof CategoryCeilings,
      stats: [
        { key: "arc" as keyof Stats, label: "Arcanism (ARC)" },
        { key: "res" as keyof Stats, label: "Resilience (RES)" },
      ]
    }
  ];

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-lg p-3 sm:p-4 shadow-lg space-y-3.5 potential-analyzer-container">
      
      {/* Header and Select Options */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-sans">
              Potential Difference Analyzer
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Interactive playground calculating math delta <code className="font-mono text-indigo-300 text-[10px]">Ceiling - Current</code>. Adjust values to simulate adventurer growths!
          </p>
        </div>

        {/* Selected Adventurer Dropdown selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end gap-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono text-slate-500">Active:</span>
            <select
              value={edited.id}
              onChange={handleExplorerSelect}
              className="bg-[#0a0a0a] border border-white/10 text-slate-100 text-xs px-2 py-1 rounded focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[130px] font-sans"
            >
              {roster.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.class || "No Class"}) {m.retiredAt ? "[Retired]" : ""}
                </option>
              ))}
            </select>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-[10px] bg-white/5 hover:bg-white/10 hover:text-white text-slate-300 border border-white/10 hover:border-white/20 rounded transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Adventurer identity overview info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-black/40 px-3 py-1.5 border border-white/5 rounded text-[11px]">
        <div className="flex items-center space-x-1.5">
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 font-mono">Adventurer:</span>
          <span className="font-bold text-slate-200">
            {edited.name}
          </span>
        </div>
        <div className="w-px h-2.5 bg-white/10 hidden sm:block" />
        <div>
          <span className="text-slate-500 font-mono">Class:</span>
          <span className="font-bold text-indigo-400 ml-1">{edited.class || "None"}</span>
        </div>
        <div className="w-px h-2.5 bg-white/10 hidden sm:block" />
        <div>
          <span className="text-slate-500 font-mono">Level:</span>
          <span className="text-emerald-450 font-bold ml-1">Lv. {edited.level}</span>
        </div>
      </div>

      {/* Potential Difference Group */}
      <div className="bg-[#151515]/45 border border-white/5 p-3 rounded space-y-2">
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <h4 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Potential Delta (Ceiling vs Base)
          </h4>
          <span className="text-[9px] font-mono text-slate-500">Formula: potentialCeiling - potential</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center font-sans">
          
          {/* Base Potential Input */}
          <div className="space-y-0.5">
            <label className="block text-[10px] text-slate-400 font-mono">Current Base Potential</label>
            <input
              type="number"
              min="0"
              max="100"
              value={potential}
              onChange={(e) => updatePotential(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-full bg-[#0a0a0a] text-slate-100 border border-white/10 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Potential Ceiling Input */}
          <div className="space-y-0.5">
            <label className="block text-[10px] text-slate-400 font-mono">Potential Ceiling Max</label>
            <input
              type="number"
              min="0"
              max="100"
              value={potentialCeiling}
              onChange={(e) => updatePotentialCeiling(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-full bg-[#0a0a0a] text-indigo-400 border border-white/10 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          {/* Computed potential difference */}
          <div className="bg-black/30 px-3 py-1.5 rounded border border-white/5 flex items-center justify-between sm:flex-col sm:justify-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Delta Remaining</span>
            <span className={`text-[13px] font-bold font-mono ${getDiffStyle(getDiff(potentialCeiling, potential))}`}>
              {getDiff(potentialCeiling, potential)}
            </span>
          </div>

        </div>
      </div>

      {/* Grid of 7 Categories (Bento layout structure) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 border-t border-white/5 pt-3">
        {categoriesDef.map((cat) => {
          const ceilingVal = ceilings[cat.ceilKey] ?? 0;
          
          return (
            <div 
              key={cat.id} 
              className="bg-[#151515]/30 border border-white/5 rounded overflow-hidden flex flex-col shadow-inner"
            >
              {/* Category Ceiling Block Header */}
              <div className="px-2 py-1.5 bg-[#151515] border-b border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 truncate">{cat.name}</span>

                {/* Editable Category Floor Ceiling */}
                <div className="flex items-center space-x-1 px-1 py-0.5 bg-[#0a0a0a] rounded border border-white/5">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Ceil:</span>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={ceilingVal}
                    onChange={(e) => updateCeiling(cat.ceilKey, Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-8 bg-transparent text-right font-mono text-[10px] font-bold text-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Attributes and Difference entries */}
              <div className="p-1.5 space-y-1">
                <div className="space-y-1 font-sans">
                  {cat.stats.map((stat) => {
                    const val = stats[stat.key] ?? 0;
                    const diff = getDiff(ceilingVal, val);
                    const cleanLabel = stat.label.substring(0, stat.label.indexOf('(') !== -1 ? stat.label.indexOf('(') : stat.label.length).trim();
                    const code = stat.label.match(/\(([^)]+)\)/)?.[1] || "";

                    return (
                      <div 
                        key={stat.key} 
                        className="flex items-center justify-between text-[11px] border-b border-white/5 pb-1 last:border-b-0 last:pb-0"
                      >
                        {/* Label name */}
                        <div className="flex-1 min-w-0 pr-1 flex items-center space-x-1">
                          <span className="text-[11px] text-slate-300 truncate block" title={stat.label}>
                            {cleanLabel}
                          </span>
                          {code && (
                            <span className="text-[8px] font-mono text-slate-500 bg-white/5 px-1 py-0.2 rounded select-all font-bold">
                              {code}
                            </span>
                          )}
                        </div>

                        {/* Editable Attribute Value Input */}
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            max="150"
                            value={val}
                            onChange={(e) => updateStat(stat.key, Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-9 bg-[#0a0a0a] text-center border border-white/10 rounded py-0.5 px-0.5 text-[11px] font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                          />

                          {/* Computation Delta Difference */}
                          <span className={`text-[10px] font-mono font-bold w-9 text-right inline-block ${getDiffStyle(diff)}`}>
                            {diff >= 0 ? `+${diff}` : diff}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        /* Hide spin/stepper buttons of quantity numbers on the potential analyzer */
        .potential-analyzer-container input[type="number"]::-webkit-inner-spin-button, 
        .potential-analyzer-container input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .potential-analyzer-container input[type="number"]:hover::-webkit-inner-spin-button, 
        .potential-analyzer-container input[type="number"]:hover::-webkit-outer-spin-button {
          -webkit-appearance: auto;
        }
        /* Firefox fallback */
        .potential-analyzer-container input[type="number"] {
          -moz-appearance: textfield;
        }
        .potential-analyzer-container input[type="number"]:hover {
          -moz-appearance: number-input;
        }
      `}</style>
    </div>
  );
};
