import React, { useState, useEffect } from "react";
import { RosterMember, CategoryCeilings, Stats } from "../types";
import { Save, X, Sparkles, UserPlus, HelpCircle } from "lucide-react";

interface RosterEditorProps {
  member: RosterMember | null;
  onSave: (member: RosterMember) => void;
  onClose: () => void;
}

export const RosterEditor: React.FC<RosterEditorProps> = ({
  member,
  onSave,
  onClose,
}) => {
  const [edited, setEdited] = useState<RosterMember | null>(null);
  const [roleInput, setRoleInput] = useState("");
  const [isClassCustom, setIsClassCustom] = useState(false);

  // Sync state with selected member
  useEffect(() => {
    if (member) {
      // Deep copy to prevent mutating father state directly
      const copy = JSON.parse(JSON.stringify(member)) as RosterMember;
      
      // Ensure structures exist
      if (!copy.categoryCeilings) copy.categoryCeilings = {};
      if (!copy.stats) copy.stats = {};
      if (!copy.roles) copy.roles = [];

      setEdited(copy);
      setIsClassCustom(![
        "Landsknecht", "Fortress", "Sniper", "Runemaster", 
        "Medic", "Nightseeker", "Dancer", "Bushi", "Imperial"
      ].includes(copy.class || ""));
    } else {
      setEdited(null);
    }
  }, [member]);

  if (!edited) {
    return (
      <div className="bg-[#0f0f0f] border border-white/10 rounded-lg p-6 shadow-lg h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded bg-[#151515] flex items-center justify-center text-slate-400 mb-4 border border-white/10">
          <Sparkles className="w-8 h-8 text-indigo-450" />
        </div>
        <h3 className="text-slate-200 font-semibold text-sm">Select an Adventurer</h3>
        <p className="text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">
          Click on any adventurer in the guild roster to edit their characteristics, roles, stats, and category ceilings. Or create a brand new adventurer!
        </p>
      </div>
    );
  }

  // Handle deep stats updates
  const handleStatChange = (category: keyof Stats, value: string) => {
    const num = value === "" ? 0 : Math.max(0, parseInt(value) || 0);
    setEdited(prev => {
      if (!prev) return null;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          [category]: num,
        }
      };
    });
  };

  // Handle deep ceiling updates
  const handleCeilingChange = (category: keyof CategoryCeilings, value: string) => {
    const num = value === "" ? 0 : Math.max(0, parseInt(value) || 0);
    setEdited(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categoryCeilings: {
          ...prev.categoryCeilings,
          [category]: num,
        }
      };
    });
  };

  // Handle basic fields
  const handleChange = (field: keyof RosterMember, value: any) => {
    setEdited(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // Handle retirement toggling
  const handleRetirementToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setEdited(prev => {
      if (!prev) return null;
      return {
        ...prev,
        retiredAt: checked ? { age: prev.age ? prev.age - 2 : 40 } : null
      };
    });
  };

  const handleRetirementAgeChange = (val: string) => {
    const num = parseInt(val) || 0;
    setEdited(prev => {
      if (!prev) return null;
      return {
        ...prev,
        retiredAt: { age: num }
      };
    });
  };

  // Handle Tag Addition
  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roleInput.trim().toLowerCase();
    if (clean && edited.roles && !edited.roles.includes(clean)) {
      setEdited(prev => {
        if (!prev) return null;
        return {
          ...prev,
          roles: [...(prev.roles || []), clean]
        };
      });
      setRoleInput("");
    }
  };

  const handleRemoveRole = (role: string) => {
    setEdited(prev => {
      if (!prev) return null;
      return {
        ...prev,
        roles: (prev.roles || []).filter(r => r !== role)
      };
    });
  };

  // Stat roll templates matching common Etrian Odyssey classes
  const rollStatsByClass = () => {
    const cls = edited.class || "Landsknecht";
    const level = edited.level || 1;
    let ceilings: CategoryCeilings = {
      physical: 70, vitality: 70, mental: 70, social: 70, combat: 70, heroic: 70, arcane: 75
    };
    let rawStats: Stats = {};

    // Standard baseline template weights
    let physW = 50, vitW = 50, mentW = 50, socW = 50, combW = 50, heroW = 50, arcW = 50;

    switch (cls) {
      case "Landsknecht":
        ceilings = { physical: 90, vitality: 80, mental: 60, social: 75, combat: 90, heroic: 80, arcane: 40 };
        physW = 85; vitW = 75; mentW = 50; socW = 72; combW = 88; heroW = 78; arcW = 25;
        break;
      case "Fortress":
        ceilings = { physical: 75, vitality: 95, mental: 65, social: 80, combat: 75, heroic: 90, arcane: 35 };
        physW = 70; vitW = 92; mentW = 55; socW = 78; combW = 70; heroW = 85; arcW = 20;
        break;
      case "Sniper":
        ceilings = { physical: 85, vitality: 65, mental: 75, social: 65, combat: 85, heroic: 75, arcane: 45 };
        physW = 80; vitW = 60; mentW = 70; socW = 60; combW = 82; heroW = 70; arcW = 35;
        break;
      case "Runemaster":
        ceilings = { physical: 45, vitality: 60, mental: 95, social: 70, combat: 75, heroic: 75, arcane: 95 };
        physW = 40; vitW = 52; mentW = 90; socW = 65; combW = 70; heroW = 68; arcW = 92;
        break;
      case "Medic":
        ceilings = { physical: 55, vitality: 75, mental: 80, social: 85, combat: 55, heroic: 80, arcane: 70 };
        physW = 50; vitW = 72; mentW = 78; socW = 82; combW = 50; heroW = 75; arcW = 65;
        break;
      case "Nightseeker":
        ceilings = { physical: 85, vitality: 60, mental: 70, social: 60, combat: 80, heroic: 70, arcane: 45 };
        physW = 82; vitW = 55; mentW = 65; socW = 55; combW = 78; heroW = 65; arcW = 30;
        break;
      case "Dancer":
        ceilings = { physical: 80, vitality: 70, mental: 75, social: 90, combat: 70, heroic: 80, arcane: 60 };
        physW = 72; vitW = 65; mentW = 70; socW = 88; combW = 68; heroW = 76; arcW = 50;
        break;
      case "Bushi":
        ceilings = { physical: 95, vitality: 85, mental: 50, social: 65, combat: 92, heroic: 85, arcane: 30 };
        physW = 92; vitW = 80; mentW = 45; socW = 58; combW = 90; heroW = 82; arcW = 15;
        break;
      case "Imperial":
        ceilings = { physical: 90, vitality: 85, mental: 70, social: 70, combat: 95, heroic: 80, arcane: 55 };
        physW = 88; vitW = 82; mentW = 68; socW = 65; combW = 94; heroW = 78; arcW = 45;
        break;
      default:
        // Generic RPG balance
        ceilings = { physical: 75, vitality: 75, mental: 75, social: 75, combat: 75, heroic: 75, arcane: 75 };
        physW = 70; vitW = 70; mentW = 70; socW = 70; combW = 70; heroW = 70; arcW = 70;
    }

    // Helper to scale stat value based on level (1-99) and weight with minor random variance
    const rollStat = (weight: number) => {
      const levelMultiplier = 0.4 + (level / 150); // scales stats smoothly from lv 1 to 99
      const base = weight * levelMultiplier;
      const variance = (Math.random() * 10 - 5); // +/- 5 random variance
      return Math.min(100, Math.max(1, Math.round(base + variance)));
    };

    // Populate all 23 stats based on categories
    rawStats = {
      // Physical
      str: rollStat(physW),
      dex: rollStat(physW),
      spd: rollStat(physW - 5),
      agi: rollStat(physW - 2),
      con: rollStat(physW + 3),
      // Vitality
      vit: rollStat(vitW),
      end: rollStat(vitW - 3),
      dur: rollStat(vitW + 5),
      rec: rollStat(vitW - 10),
      // Mental
      int: rollStat(mentW),
      wis: rollStat(mentW + 5),
      lck: rollStat(mentW + 2),
      // Social
      cha: rollStat(socW),
      ldr: rollStat(socW - 5),
      tmw: rollStat(socW + 10),
      tru: rollStat(socW + 5),
      loy: rollStat(socW + 15),
      // Combat
      atk: rollStat(combW),
      def: rollStat(combW - 5),
      // Heroic
      hro: rollStat(heroW),
      sur: rollStat(heroW - 10),
      // Arcane
      arc: rollStat(arcW),
      res: rollStat(arcW + 10)
    };

    // Update state with newly rolled stats and ceilings
    setEdited(prev => {
      if (!prev) return null;
      return {
        ...prev,
        potential: Math.min(99, Math.round(55 + Math.random() * 35)),
        potentialCeiling: Math.min(100, Math.round(75 + Math.random() * 25)),
        categoryCeilings: ceilings,
        stats: rawStats
      };
    });
  };

  const categoriesDef = [
    {
      id: "physical",
      name: "Physical Structure Stats",
      desc: "Dictates strength, accuracy, and physical agility.",
      ceilKey: "physical" as keyof CategoryCeilings,
      stats: [
        { key: "str" as keyof Stats, label: "Strength (str)" },
        { key: "dex" as keyof Stats, label: "Dexterity (dex)" },
        { key: "spd" as keyof Stats, label: "Speed (spd)" },
        { key: "agi" as keyof Stats, label: "Agility (agi)" },
        { key: "con" as keyof Stats, label: "Constitution (con)" },
      ],
      color: "border-amber-500/10 hover:border-amber-500/30 text-amber-400 bg-amber-500/5"
    },
    {
      id: "vitality",
      name: "Vitality & Endurance",
      desc: "Dictates general HP pool, resistance, and recovery.",
      ceilKey: "vitality" as keyof CategoryCeilings,
      stats: [
        { key: "vit" as keyof Stats, label: "Vitality (vit)" },
        { key: "end" as keyof Stats, label: "Endurance (end)" },
        { key: "dur" as keyof Stats, label: "Durability (dur)" },
        { key: "rec" as keyof Stats, label: "Recovery (rec)" },
      ],
      color: "border-emerald-500/10 hover:border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
    },
    {
      id: "mental",
      name: "Mental Capability",
      desc: "Guides intelligence and discovery-based luck factor.",
      ceilKey: "mental" as keyof CategoryCeilings,
      stats: [
        { key: "int" as keyof Stats, label: "Intelligence (int)" },
        { key: "wis" as keyof Stats, label: "Wisdom (wis)" },
        { key: "lck" as keyof Stats, label: "Luck (lck)" },
      ],
      color: "border-cyan-500/10 hover:border-cyan-500/30 text-cyan-400 bg-cyan-500/5"
    },
    {
      id: "social",
      name: "Social & Leadership",
      desc: "Influences squad chemistry, team synergy, and loyalty.",
      ceilKey: "social" as keyof CategoryCeilings,
      stats: [
        { key: "cha" as keyof Stats, label: "Charisma (cha)" },
        { key: "ldr" as keyof Stats, label: "Leadership (ldr)" },
        { key: "tmw" as keyof Stats, label: "Teamwork (tmw)" },
        { key: "tru" as keyof Stats, label: "Trustworthiness (tru)" },
        { key: "loy" as keyof Stats, label: "Loyalty (loy)" },
      ],
      color: "border-pink-500/10 hover:border-pink-500/30 text-pink-400 bg-pink-500/5"
    },
    {
      id: "combat",
      name: "Combat Power Base",
      desc: "Base direct attack and defense coefficients.",
      ceilKey: "combat" as keyof CategoryCeilings,
      stats: [
        { key: "atk" as keyof Stats, label: "Attack (atk)" },
        { key: "def" as keyof Stats, label: "Defense (def)" },
      ],
      color: "border-indigo-500/10 hover:border-indigo-500/30 text-indigo-400 bg-indigo-500/5"
    },
    {
      id: "heroic",
      name: "Heroic & Survival Aura",
      desc: "Heroism parameters and close-shave escape stats.",
      ceilKey: "heroic" as keyof CategoryCeilings,
      stats: [
        { key: "hro" as keyof Stats, label: "Heroism (hro)" },
        { key: "sur" as keyof Stats, label: "Survival (sur)" },
      ],
      color: "border-rose-500/10 hover:border-rose-500/30 text-rose-400 bg-rose-500/5"
    },
    {
      id: "arcane",
      name: "Arcane & Resistance",
      desc: "Specialized magic elements and magic barrier resilience.",
      ceilKey: "arcane" as keyof CategoryCeilings,
      stats: [
        { key: "arc" as keyof Stats, label: "Arcane (arc)" },
        { key: "res" as keyof Stats, label: "Resistance (res)" },
      ],
      color: "border-purple-500/10 hover:border-purple-500/30 text-purple-400 bg-purple-500/5"
    },
  ];

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-lg shadow-lg flex flex-col h-[650px] overflow-hidden">
      
      {/* Detail Panel Header */}
      <div className="p-4 bg-[#151515] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          <h3 className="text-slate-100 font-bold font-sans text-sm">
            {edited.id.startsWith("member_new_") ? "Register New Adventurer" : "Characteristics Sheet"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sheet Form View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        
        {/* Core Profile Area */}
        <div className="bg-[#151515]/40 p-4 rounded border border-white/5 space-y-4">
          <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Identities & Parameters</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-sans">
            {/* Name */}
            <div>
              <label className="block text-[11px] text-slate-400 font-mono mb-1">Adventurer Name</label>
              <input
                type="text"
                value={edited.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Valen the Brave"
                className="w-full bg-[#0a0a0a] text-slate-100 border border-white/10 hover:border-white/20 focus:border-indigo-505 focus:outline-none rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-505 transition-colors"
              />
            </div>

            {/* Class Choice */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-slate-400 font-mono">Specialty Class</label>
                <button
                  type="button"
                  onClick={() => setIsClassCustom(!isClassCustom)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  {isClassCustom ? "Standard List" : "Custom Class"}
                </button>
              </div>
              
              {isClassCustom ? (
                <input
                  type="text"
                  value={edited.class || ""}
                  onChange={(e) => handleChange("class", e.target.value)}
                  placeholder="E.g., Dark Hunter"
                  className="w-full bg-[#0a0a0a] text-slate-100 border border-white/10 hover:border-white/20 focus:border-indigo-505 focus:outline-none rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-505 transition-colors"
                />
              ) : (
                <select
                  value={edited.class || ""}
                  onChange={(e) => handleChange("class", e.target.value)}
                  className="w-full bg-[#0a0a0a] text-slate-150 border border-white/10 hover:border-white/20 focus:border-indigo-505 focus:outline-none rounded px-2 py-1.5 text-xs cursor-pointer"
                >
                  <option value="Landsknecht">Landsknecht (Damage/Offense)</option>
                  <option value="Fortress">Fortress (Pure Shield & HP)</option>
                  <option value="Sniper">Sniper (Critical/Accuracy)</option>
                  <option value="Runemaster">Runemaster (Elementary Mage)</option>
                  <option value="Medic">Medic (Cleric/Revive Support)</option>
                  <option value="Nightseeker">Nightseeker (Dagger Poisoner)</option>
                  <option value="Dancer">Dancer (Sway Buffing)</option>
                  <option value="Bushi">Bushi (War Beast Stance)</option>
                  <option value="Imperial">Imperial (Driveblade Guard)</option>
                  <option value="Other">Custom Unbound</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Level */}
            <div>
              <label className="block text-[11px] text-slate-400 font-mono mb-1">Current Level</label>
              <input
                type="number"
                min="1"
                max="99"
                value={edited.level ?? 1}
                onChange={(e) => handleChange("level", Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#0a0a0a] text-slate-100 border border-white/10 focus:border-indigo-500 focus:outline-none rounded px-3 py-1.5 text-xs font-mono"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-[11px] text-slate-400 font-mono mb-1">Age (Years)</label>
              <input
                type="number"
                min="1"
                max="150"
                value={edited.age ?? 20}
                onChange={(e) => handleChange("age", Math.max(1, parseInt(e.target.value) || 20))}
                className="w-full bg-[#0a0a0a] text-slate-100 border border-white/10 focus:border-indigo-500 focus:outline-none rounded px-3 py-1.5 text-xs font-mono"
              />
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-[11px] text-slate-400 font-mono mb-1">Class Rarity</label>
              <select
                value={edited.classRarity || "Common"}
                onChange={(e) => handleChange("classRarity", e.target.value)}
                className="w-full bg-[#0a0a0a] text-slate-150 border border-white/10 focus:border-indigo-500 focus:outline-none rounded px-2 py-1.5 text-xs cursor-pointer font-sans"
              >
                <option value="Common">Common</option>
                <option value="Rare">Rare</option>
                <option value="Epic">Epic</option>
                <option value="Legendary">Legendary</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-[11px] text-slate-400 font-mono mb-1">Entity Type</label>
              <select
                value={edited.type || "adventurer"}
                onChange={(e) => handleChange("type", e.target.value)}
                className="w-full bg-[#0a0a0a] text-slate-150 border border-white/10 focus:border-indigo-500 focus:outline-none rounded px-2 py-1.5 text-xs cursor-pointer font-mono"
              >
                <option value="adventurer">adventurer</option>
                <option value="npc">npc</option>
                <option value="beast">beast</option>
              </select>
            </div>
          </div>

          {/* Potential Stats */}
          <div className="grid grid-cols-2 gap-3 pb-2 col-span-2">
            <div>
              <label className="block text-[11px] text-slate-400 font-mono mb-1">Potential</label>
              <input
                type="number"
                min="0"
                max="100"
                value={edited.potential ?? 50}
                onChange={(e) => handleChange("potential", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full bg-[#0a0a0a] text-slate-105 border border-white/10 focus:border-indigo-500 focus:outline-none rounded px-3 py-1.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-mono mb-1">Potential Ceiling</label>
              <input
                type="number"
                min="0"
                max="100"
                value={edited.potentialCeiling ?? 50}
                onChange={(e) => handleChange("potentialCeiling", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full bg-[#0a0a0a] text-slate-105 border border-white/10 focus:border-indigo-500 focus:outline-none rounded px-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* Active Status Toggles */}
          <div className="pt-2 border-t border-white/5 space-y-3">
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!edited.retiredAt}
                  onChange={handleRetirementToggle}
                  className="accent-indigo-500 h-4 w-4 rounded cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-sans">
                  Mark Adventurer as Retired (Excluded from Roster Table Excel Output)
                </span>
              </label>
            </div>

            {edited.retiredAt && (
              <div className="bg-rose-500/5 p-3 rounded border border-rose-500/10 flex items-center justify-between max-w-sm">
                <span className="text-xs text-rose-400 font-medium font-sans">Retirement Age Ceiling:</span>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={edited.retiredAt.age ?? 45}
                  onChange={(e) => handleRetirementAgeChange(e.target.value)}
                  className="w-20 bg-[#0a0a0a] text-rose-300 border border-rose-500/20 text-center rounded focus:outline-none focus:border-rose-500 text-xs font-mono ml-4 px-2 py-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Roles tag control */}
        <div className="bg-[#151515]/40 p-4 rounded border border-white/5 space-y-3">
          <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Assigned Tactical Roles</h4>
          
          <form onSubmit={handleAddRole} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. attacker, defender, healer, disabler..."
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="flex-1 bg-[#0a0a0a] text-slate-100 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:outline-none rounded px-3 py-1.5 text-xs transition-colors"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded text-xs font-mono border border-indigo-500/25 transition-all cursor-pointer"
            >
              + Tag
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {edited.roles && edited.roles.length > 0 ? (
              edited.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-2 py-0.5 rounded bg-white/5 text-slate-300 text-xs font-mono gap-1 border border-white/5"
                >
                  {role}
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(role)}
                    className="text-slate-500 hover:text-rose-400 ml-0.5 font-bold cursor-pointer font-sans"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-550 italic">No roles assigned. Add some tags above.</p>
            )}
          </div>
        </div>

        {/* Stat Booster Generator */}
        <div className="p-3.5 bg-[#151515] border border-white/10 rounded flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <h5 className="text-xs font-bold text-slate-250 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
              Guild Stat Roll Engine
            </h5>
            <p className="text-[10px] text-slate-500 max-w-[240px]">
              Instantly generate stats based on selected explorer specialty class level.
            </p>
          </div>
          <button
            type="button"
            onClick={rollStatsByClass}
            className="px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/25 rounded text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
          >
            Roll Stats
          </button>
        </div>

        {/* 7 Category Columns & 23 Stats Inputs */}
        <div className="space-y-4 font-sans">
          <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Adventurer Statistics & Ceilings</h4>
          
          {categoriesDef.map((cat) => {
            const ceilingVal = edited.categoryCeilings?.[cat.ceilKey] ?? 0;
            return (
              <div
                key={cat.id}
                className="bg-[#151515]/20 rounded border border-white/5 overflow-hidden shadow-inner hover:border-white/10 transition-colors"
              >
                {/* Category Header */}
                <div className="p-3 bg-[#151515] border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-200">{cat.name}</h5>
                    <p className="text-[10px] text-slate-500 leading-normal">{cat.desc}</p>
                  </div>
                  
                  {/* Category Ceiling field */}
                  <div className="flex items-center space-x-1.5 bg-[#0a0a0a] py-1 px-2.5 rounded border border-white/10">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Ceiling:</span>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={ceilingVal}
                      onChange={(e) => handleCeilingChange(cat.ceilKey, e.target.value)}
                      className="w-12 bg-[#0a0a0a] text-right font-mono text-xs font-bold text-indigo-400 rounded px-1.5 py-0.5 border border-white/5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Stat Grid */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {cat.stats.map((stat) => {
                    const val = edited.stats?.[stat.key] ?? 0;
                    const isOverCeiling = ceilingVal > 0 && val > ceilingVal;
                    
                    return (
                      <div key={stat.key} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[#8c8c8c] font-mono">
                          <label>{stat.label}</label>
                          {isOverCeiling && (
                            <span 
                              title="Value exceeds Category Ceiling!" 
                              className="text-[9px] text-rose-400 leading-none bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/15"
                            >
                              Exceeds
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                             type="number"
                             min="0"
                             max="100"
                             value={val}
                             onChange={(e) => handleStatChange(stat.key, e.target.value)}
                             className={`w-full bg-[#0a0a0a] text-slate-200 border rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none transition-colors ${
                               isOverCeiling 
                                 ? "border-rose-500/40 text-rose-350 focus:border-rose-500" 
                                 : "border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                             }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Detail Panel Footer Options */}
      <div className="p-4 bg-[#151515] border-t border-white/10 flex gap-2.5 font-sans">
        <button
          type="button"
          onClick={() => onSave(edited)}
          className="flex-1 py-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Member Info
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white font-medium text-xs transition-colors cursor-pointer border border-white/5"
        >
          Cancel
        </button>
      </div>

    </div>
  );
};
