import React, { useState, useEffect } from "react";
import { RosterMember, Party } from "../types";
import { 
  Users, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  Search, 
  X, 
  UserPlus, 
  ShieldAlert, 
  Plus, 
  CheckCircle,
  HelpCircle,
  FolderSync,
  Crown,
  Copy
} from "lucide-react";

interface PartyTabProps {
  roster: RosterMember[];
  onShowStatusBarMessage: (msg: string) => void;
}

const DEFAULT_PARTY_NAMES = Array.from({ length: 10 }, (_, i) => `Party ${i + 1}`);

const isHealer = (member: RosterMember): boolean => {
  const roles = (member.roles || []).map(r => r.toLowerCase());
  return roles.some(r => 
    r.includes("healer") ||
    r.includes("support") ||
    r.includes("cleric") ||
    r.includes("medic")
  );
};

const isTank = (member: RosterMember): boolean => {
  const roles = (member.roles || []).map(r => r.toLowerCase());
  return roles.some(r => 
    r.includes("tank") ||
    r.includes("defender") ||
    r.includes("guardian") ||
    r.includes("fortress") ||
    r.includes("knight")
  );
};

const getPotentialGrade = (val: number | string | undefined | null, rawPotential?: string): string => {
  const source = rawPotential || (typeof val === "string" ? val : null);
  if (source) {
    const clean = source.trim().toUpperCase();
    if (clean.includes("-TIER")) {
      const idx = clean.indexOf("-");
      if (idx > 0) return clean.substring(0, idx);
    }
    const firstChar = clean.charAt(0);
    if (["S", "A", "B", "C", "D", "E", "F"].includes(firstChar)) {
      return firstChar;
    }
  }

  if (typeof val === "string") {
    val = parseFloat(val);
  }
  if (typeof val === "number" && !isNaN(val)) {
    if (val >= 95) return "S";
    if (val >= 85) return "A";
    if (val >= 75) return "B";
    if (val >= 65) return "C";
    if (val >= 45) return "D"; // Map 48 (Amara's potential) correctly to D-Tier as in JSON!
  }
  return "F";
};

export const PartyTab: React.FC<PartyTabProps> = ({ roster, onShowStatusBarMessage }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [selectedPresetSlot, setSelectedPresetSlot] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem("guild-selected-preset-slot");
    if (saved === "1" || saved === "2" || saved === "3") {
      return parseInt(saved, 10) as 1 | 2 | 3;
    }
    return 1;
  });
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [presetUpdateTrigger, setPresetUpdateTrigger] = useState(0);
  const [cloneSourceSlot, setCloneSourceSlot] = useState<1 | 2 | 3>(2);

  // Initialize active parties from localStorage or defaults on a per-preset-slot basis
  useEffect(() => {
    // Keep cloneSourceSlot distinct from selectedPresetSlot
    if (cloneSourceSlot === selectedPresetSlot) {
      const remainingSlots = ([1, 2, 3] as const).filter(s => s !== selectedPresetSlot);
      if (remainingSlots.length > 0) {
        setCloneSourceSlot(remainingSlots[0]);
      }
    }
    const activeKey = `guild-parties-active-slot-${selectedPresetSlot}`;
    const savedActive = localStorage.getItem(activeKey);
    if (savedActive) {
      try {
        const parsed = JSON.parse(savedActive);
        if (Array.isArray(parsed) && parsed.length === 10) {
          const normalized = parsed.map(p => {
            let ids = Array.isArray(p.memberIds) ? p.memberIds.filter(id => typeof id === "string") : [];
            ids = ids.slice(0, 5);
            while (ids.length < 5) ids.push("");
            return {
              ...p,
              memberIds: ids,
              leaderId: typeof p.leaderId === "string" ? p.leaderId : null
            };
          });
          setParties(normalized);
          if (!normalized.some(p => p.id === selectedPartyId)) {
            setSelectedPartyId(normalized[0].id);
          }
          return;
        }
      } catch (e) {
        console.error("Failed to parse active parties for slot", selectedPresetSlot, e);
      }
    }

    // Fallback to legacy global `guild-parties` if we are on Slot 1
    if (selectedPresetSlot === 1) {
      const legacySaved = localStorage.getItem("guild-parties");
      if (legacySaved) {
        try {
          const parsed = JSON.parse(legacySaved);
          if (Array.isArray(parsed) && parsed.length === 10) {
            const normalized = parsed.map(p => {
              let ids = Array.isArray(p.memberIds) ? p.memberIds.filter(id => typeof id === "string") : [];
              ids = ids.slice(0, 5);
              while (ids.length < 5) ids.push("");
              return {
                ...p,
                memberIds: ids,
                leaderId: typeof p.leaderId === "string" ? p.leaderId : null
              };
            });
            saveParties(normalized, 1);
            if (!normalized.some(p => p.id === selectedPartyId)) {
              setSelectedPartyId(normalized[0].id);
            }
            return;
          }
        } catch (e) {
          console.error("Failed to parse saved parties", e);
        }
      }
    }

    // Default 10 Parties
    const initialParties: Party[] = Array.from({ length: 10 }, (_, i) => ({
      id: `party-${i + 1}`,
      name: DEFAULT_PARTY_NAMES[i] || `Party ${i + 1}`,
      memberIds: ["", "", "", "", ""],
      leaderId: null
    }));
    saveParties(initialParties, selectedPresetSlot);
    if (!initialParties.some(p => p.id === selectedPartyId)) {
      setSelectedPartyId(initialParties[0].id);
    }
  }, [selectedPresetSlot]);

  // Sync active parties to local storage (specifically for the current active slot)
  const saveParties = (newParties: Party[], slotNum?: 1 | 2 | 3) => {
    const slot = slotNum ?? selectedPresetSlot;
    setParties(newParties);
    localStorage.setItem(`guild-parties-active-slot-${slot}`, JSON.stringify(newParties));
    // Fallback sync for components loading the simple key
    localStorage.setItem("guild-parties", JSON.stringify(newParties));
  };

  // Drag handles
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedMemberId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedMemberId(null);
  };

  // Add member to party
  const addPlayerToParty = (partyId: string, memberId: string, targetSlotIdx?: number) => {
    const party = parties.find(p => p.id === partyId);
    if (!party) return;

    const member = roster.find(m => m.id === memberId);
    if (!member) return;

    const currentSlot = party.memberIds.indexOf(memberId);
    const isH = isHealer(member);
    const isT = isTank(member);

    // If target slot is explicitly specified, use it
    if (targetSlotIdx !== undefined && targetSlotIdx >= 0 && targetSlotIdx < 5) {
      if (targetSlotIdx === 0 && !isT) {
        onShowStatusBarMessage(`Slot 1 is reserved for Tanks only! ${member.name} (${member.class || "No Class"}) cannot be placed here.`);
        return;
      }
      if (targetSlotIdx === 1 && !isH) {
        onShowStatusBarMessage(`Slot 2 is reserved for Healers only! ${member.name} (${member.class || "No Class"}) cannot be placed here.`);
        return;
      }

      const updatedIds = [...party.memberIds];
      if (currentSlot !== -1) {
        updatedIds[currentSlot] = "";
      }
      updatedIds[targetSlotIdx] = memberId;

      const updated = parties.map(p => {
        if (p.id === partyId) {
          return { ...p, memberIds: updatedIds };
        }
        return p;
      });
      saveParties(updated);
      onShowStatusBarMessage(`Assigned ${member.name} to Slot ${targetSlotIdx + 1}!`);
      return;
    }

    // Otherwise, check if copy already in party
    if (currentSlot !== -1) {
      onShowStatusBarMessage("Adventurer is already registered in this party squad!");
      return;
    }

    // Find the best available slot automatically (Slot 1 Tank, Slot 2 Healer)
    let destSlot = -1;
    if (isT && party.memberIds[0] === "") {
      destSlot = 0;
    } else if (isH && party.memberIds[1] === "") {
      destSlot = 1;
    } else {
      // Find empty slot from index 2, 3, 4
      for (let i = 2; i < 5; i++) {
        if (party.memberIds[i] === "") {
          destSlot = i;
          break;
        }
      }
    }

    // Fallback if preferred slots are filled but there are other slots
    if (destSlot === -1) {
      for (let i = 2; i < 5; i++) {
        if (party.memberIds[i] === "") {
          destSlot = i;
          break;
        }
      }
    }

    if (destSlot === -1) {
      onShowStatusBarMessage("Max 5 members reached, or no compatible slot is empty!");
      return;
    }

    const updatedIds = [...party.memberIds];
    updatedIds[destSlot] = memberId;

    const updated = parties.map(p => {
      if (p.id === partyId) {
        return { ...p, memberIds: updatedIds };
      }
      return p;
    });

    saveParties(updated);
    onShowStatusBarMessage(`Enlisted: ${member.name} joined ${party.name} at Slot ${destSlot + 1}`);
  };

  // Toggle leader crown nominated status for a specific member in a tactical party
  const toggleMemberCrown = (partyId: string, memberId: string) => {
    const updated = parties.map(p => {
      if (p.id === partyId) {
        const newLeaderId = p.leaderId === memberId ? null : memberId;
        return { ...p, leaderId: newLeaderId };
      }
      return p;
    });
    saveParties(updated);
    
    const party = updated.find(p => p.id === partyId);
    const member = roster.find(m => m.id === memberId);
    
    if (party && member) {
      if (party.leaderId === memberId) {
        onShowStatusBarMessage(`Nominated ${member.name} as leader of ${party.name}`);
      } else {
        onShowStatusBarMessage(`Removed leadership nomination from ${member.name}`);
      }
    }
  };

  // Remove member from party
  const removePlayerFromParty = (partyId: string, memberId: string) => {
    const updated = parties.map(p => {
      if (p.id === partyId) {
        const newMemberIds = p.memberIds.map(id => id === memberId ? "" : id);
        const isLeaderStillHere = newMemberIds.includes(p.leaderId || "");
        return {
          ...p,
          memberIds: newMemberIds,
          leaderId: isLeaderStillHere ? p.leaderId : null
        };
      }
      return p;
    });
    saveParties(updated);
    onShowStatusBarMessage("Adventurer removed from tactical party.");
  };

  // Rename party title
  const handleRenameParty = (id: string, newName: string) => {
    const updated = parties.map(p => {
      if (p.id === id) {
        return { ...p, name: newName || `Party ${id}` };
      }
      return p;
    });
    saveParties(updated);
  };

  // Clear all slots of a party
  const clearPartySquad = (partyId: string) => {
    const updated = parties.map(p => {
      if (p.id === partyId) {
        return { ...p, memberIds: ["", "", "", "", ""], leaderId: null };
      }
      return p;
    });
    saveParties(updated);
    onShowStatusBarMessage("Cleared squad slots.");
  };

  // Quick Action: click adventurer to assign to selected party
  const handleQuickAssign = (memberId: string) => {
    if (!selectedPartyId) {
      onShowStatusBarMessage("Please designate an active target party on the left first.");
      return;
    }
    addPlayerToParty(selectedPartyId, memberId);
  };

  // Standalone Export Parties
  const handleExportParties = () => {
    const activeParties = parties;
    const presets: Record<string, any> = {};
    [1, 2, 3].forEach(slotNum => {
      const saved = localStorage.getItem(`guild-parties-preset-${slotNum}`);
      if (saved) {
        try {
          presets[String(slotNum)] = JSON.parse(saved);
        } catch {
          presets[String(slotNum)] = null;
        }
      } else {
        presets[String(slotNum)] = null;
      }
    });

    const fileContent = JSON.stringify({
      type: "guild-squads-package",
      activeParties,
      presets
    }, null, 2);

    const blob = new Blob([fileContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "guild-squads-export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowStatusBarMessage("Downloaded active squads and all preset slots package JSON.");
  };

  // Standalone Import Parties
  const handleImportParties = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Legacy format (array of parties)
          const validated = parsed.slice(0, 10).map((item, idx) => {
            let ids = Array.isArray(item.memberIds) ? item.memberIds.filter((m: any) => typeof m === "string") : [];
            ids = ids.slice(0, 5);
            while (ids.length < 5) ids.push("");
            return {
              id: item.id || `party-${idx + 1}`,
              name: item.name || `Party ${idx + 1}`,
              memberIds: ids,
              leaderId: typeof item.leaderId === "string" ? item.leaderId : null
            };
          });

          while (validated.length < 10) {
            const index = validated.length;
            validated.push({
              id: `party-${index + 1}`,
              name: `Party ${index + 1}`,
              memberIds: ["", "", "", "", ""],
              leaderId: null
            });
          }

          saveParties(validated);
          setSelectedPartyId(validated[0].id);
          onShowStatusBarMessage("Successfully restored 10 active parties from file!");
        } else if (parsed && typeof parsed === "object") {
          // New format containing activeParties and presets
          let activePartiesToLoad = parties;
          const incomingActive = parsed.activeParties || parsed.parties;
          if (Array.isArray(incomingActive)) {
            activePartiesToLoad = incomingActive.slice(0, 10).map((item, idx) => {
              let ids = Array.isArray(item.memberIds) ? item.memberIds.filter((m: any) => typeof m === "string") : [];
              ids = ids.slice(0, 5);
              while (ids.length < 5) ids.push("");
              return {
                id: item.id || `party-${idx + 1}`,
                name: item.name || `Party ${idx + 1}`,
                memberIds: ids,
                leaderId: typeof item.leaderId === "string" ? item.leaderId : null
              };
            });
            while (activePartiesToLoad.length < 10) {
              const index = activePartiesToLoad.length;
              activePartiesToLoad.push({
                id: `party-${index + 1}`,
                name: `Party ${index + 1}`,
                memberIds: ["", "", "", "", ""],
                leaderId: null
              });
            }
          }

          if (parsed.presets && typeof parsed.presets === "object") {
            [1, 2, 3].forEach(slotNum => {
              const slotPreset = parsed.presets[String(slotNum)] || parsed.presets[slotNum];
              if (Array.isArray(slotPreset)) {
                const validatedPreset = slotPreset.slice(0, 10).map((item, idx) => {
                  let ids = Array.isArray(item.memberIds) ? item.memberIds.filter((m: any) => typeof m === "string") : [];
                  ids = ids.slice(0, 5);
                  while (ids.length < 5) ids.push("");
                  return {
                    id: item.id || `party-${idx + 1}`,
                    name: item.name || `Party ${idx + 1}`,
                    memberIds: ids,
                    leaderId: typeof item.leaderId === "string" ? item.leaderId : null
                  };
                });
                while (validatedPreset.length < 10) {
                  const index = validatedPreset.length;
                  validatedPreset.push({
                    id: `party-${index + 1}`,
                    name: `Party ${index + 1}`,
                    memberIds: ["", "", "", "", ""],
                    leaderId: null
                  });
                }
                localStorage.setItem(`guild-parties-preset-${slotNum}`, JSON.stringify(validatedPreset));
              } else {
                localStorage.removeItem(`guild-parties-preset-${slotNum}`);
              }
            });
          }

          saveParties(activePartiesToLoad);
          setSelectedPartyId(activePartiesToLoad[0].id);
          setPresetUpdateTrigger(prev => prev + 1);
          onShowStatusBarMessage("Successfully imported active squads and preset slots from package file!");
        } else {
          onShowStatusBarMessage("Invalid file root structure. Must be JSON.");
        }
      } catch (err) {
        console.error(err);
        onShowStatusBarMessage("Failed to parse JSON file template.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Clear all enlisted members across all 10 squads
  const handleClearAllParties = () => {
    const updated = parties.map(p => ({
      ...p,
      memberIds: ["", "", "", "", ""],
      leaderId: null
    }));
    saveParties(updated);
    onShowStatusBarMessage("Successfully disbanded all 10 squads.");
  };

  // Switch Preset Slot handler (sets the targeted slot, does not overwrite active in-screen drafts)
  const handleSwitchPresetSlot = (slotNum: 1 | 2 | 3) => {
    setSelectedPresetSlot(slotNum);
    localStorage.setItem("guild-selected-preset-slot", String(slotNum));
    
    // Auto-adjust clone source slot to keep it distinct from the active slot
    if (cloneSourceSlot === slotNum) {
      const remainingSlots = ([1, 2, 3] as const).filter(s => s !== slotNum);
      if (remainingSlots.length > 0) {
        setCloneSourceSlot(remainingSlots[0]);
      }
    }

    const isSlotSaved = localStorage.getItem(`guild-parties-preset-${slotNum}`) !== null;
    if (isSlotSaved) {
      onShowStatusBarMessage(`Targeted Preset Slot ${slotNum}. Click 'Load' to view it, or 'Save' to overwrite.`);
    } else {
      onShowStatusBarMessage(`Targeted Preset Slot ${slotNum} (Empty). Click 'Save' to store your current on-screen squads.`);
    }
  };

  // Clone active squads handler
  const handleCloneActiveSlot = (sourceSlot: 1 | 2 | 3) => {
    if (sourceSlot === selectedPresetSlot) {
      onShowStatusBarMessage("Cannot clone a slot into itself.");
      return;
    }
    
    const sourceKey = `guild-parties-active-slot-${sourceSlot}`;
    const savedSource = localStorage.getItem(sourceKey);
    let parsed: Party[] | null = null;
    
    if (savedSource) {
      try {
        parsed = JSON.parse(savedSource);
      } catch (e) {
        console.error("Failed to parse source preset active squad list", e);
      }
    } else if (sourceSlot === 1) {
      // Legacy fallback
      const legacySaved = localStorage.getItem("guild-parties");
      if (legacySaved) {
        try {
          parsed = JSON.parse(legacySaved);
        } catch (e) {
          console.error("Failed to parse legacy parties", e);
        }
      }
    }
    
    if (parsed && Array.isArray(parsed) && parsed.length === 10) {
      const normalized = parsed.map(p => {
        let ids = Array.isArray(p.memberIds) ? p.memberIds.filter(id => typeof id === "string") : [];
        ids = ids.slice(0, 5);
        while (ids.length < 5) ids.push("");
        return {
          ...p,
          memberIds: ids,
          leaderId: typeof p.leaderId === "string" ? p.leaderId : null
        };
      });
      saveParties(normalized, selectedPresetSlot);
      setSelectedPartyId(normalized[0].id);
      onShowStatusBarMessage(`Active squads successfully cloned from Slot ${sourceSlot} to current Slot ${selectedPresetSlot}!`);
    } else {
      // Create empty ones
      const initialParties: Party[] = Array.from({ length: 10 }, (_, i) => ({
        id: `party-${i + 1}`,
        name: DEFAULT_PARTY_NAMES[i] || `Party ${i + 1}`,
        memberIds: ["", "", "", "", ""],
        leaderId: null
      }));
      saveParties(initialParties, selectedPresetSlot);
      setSelectedPartyId(initialParties[0].id);
      onShowStatusBarMessage(`Slot ${sourceSlot} had no active squads. Placed empty workspace layout.`);
    }
  };

  // Save preset handler (explicit save to the chosen slot database)
  const handleSavePreset = () => {
    localStorage.setItem(`guild-parties-preset-${selectedPresetSlot}`, JSON.stringify(parties));
    setPresetUpdateTrigger(prev => prev + 1);
    onShowStatusBarMessage(`Tactical squads successfully saved to Local Preset Slot ${selectedPresetSlot}!`);
  };

  // Clear preset slot handler (deletes chosen preset slot from database, leaves active in-screen squads intact)
  const handleClearPresetSlot = () => {
    const key = `guild-parties-preset-${selectedPresetSlot}`;
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      setPresetUpdateTrigger(prev => prev + 1);
      onShowStatusBarMessage(`Preset Slot ${selectedPresetSlot} cleared successfully. Current active draft is kept on screen.`);
    } else {
      onShowStatusBarMessage(`Preset Slot ${selectedPresetSlot} is already empty.`);
    }
  };

  // Load preset handler (loads selected preset database into on-screen active squads)
  const handleLoadPreset = () => {
    const saved = localStorage.getItem(`guild-parties-preset-${selectedPresetSlot}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map(p => {
            let ids = Array.isArray(p.memberIds) ? p.memberIds.filter(id => typeof id === "string") : [];
            ids = ids.slice(0, 5);
            while (ids.length < 5) ids.push("");
            return {
              ...p,
              memberIds: ids,
              leaderId: typeof p.leaderId === "string" ? p.leaderId : null
            };
          });
          saveParties(normalized);
          setSelectedPartyId(normalized[0].id);
          onShowStatusBarMessage(`Loaded saved squads from Local Preset Slot ${selectedPresetSlot} onto the screen!`);
        }
      } catch (e) {
        console.error(e);
        onShowStatusBarMessage(`Preset Slot ${selectedPresetSlot} contains corrupted files.`);
      }
    } else {
      onShowStatusBarMessage(`Preset Slot ${selectedPresetSlot} is empty. No squads were loaded.`);
    }
  };

  // Filter roster
  const filteredExplorers = roster.filter(m => {
    // Hide members who are already enlisted in any party
    const isEnlisted = parties.some(p => p.memberIds.includes(m.id));
    if (isEnlisted) return false;

    // Check optional active role filter
    if (selectedRoleFilter !== "all") {
      const roles = (m.roles || []).map(r => r.toLowerCase());
      if (selectedRoleFilter === "tank") {
        const isT = roles.some(r => r.includes("tank") || r.includes("defender") || r.includes("guardian"));
        if (!isT) return false;
      } else if (selectedRoleFilter === "healer") {
        const isH = roles.some(r => r.includes("healer") || r.includes("support") || r.includes("cleric") || r.includes("medic"));
        if (!isH) return false;
      } else if (selectedRoleFilter === "ranged") {
        const isR = roles.some(r => r.includes("ranged") || r.includes("mage") || r.includes("archer") || r.includes("wizard"));
        if (!isR) return false;
      } else if (selectedRoleFilter === "melee") {
        const isM = roles.some(r => r.includes("melee") || r.includes("warrior") || r.includes("assassin") || r.includes("brawler") || r.includes("knight") || r.includes("berserker"));
        if (!isM) return false;
      }
    }

    const nameMatch = m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const classMatch = m.class?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const rolesMatch = m.roles?.some(role => role.toLowerCase().includes(searchQuery.toLowerCase())) ?? false;
    return nameMatch || classMatch || rolesMatch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
      
      {/* LEFT BLOCK: 10 PARTIES (8 cols on normal, 9 cols on wide desktop) */}
      <div className="lg:col-span-8 2xl:col-span-9 space-y-4">
        
        {/* Actions panel */}
        <div className="bg-[#0f0f0f] border border-white/10 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="text-xs font-bold text-slate-100 uppercase tracking-widest block">Squad Formations</span>
              <span className="text-[10px] text-slate-400">Drag adventurer tags from the sidebar into any slot. Max 5.</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {/* Standalone Import */}
            <label className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#0a0a0a] hover:bg-neutral-900 text-[11px] text-slate-300 hover:text-white border border-white/10 rounded cursor-pointer transition-all select-none">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import Squads</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportParties} 
                className="hidden" 
              />
            </label>

            {/* Standalone Export */}
            <button
              onClick={handleExportParties}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#0a0a0a] hover:bg-neutral-900 text-[11px] text-slate-300 hover:text-white border border-white/10 rounded cursor-pointer transition-all select-none"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Squads</span>
            </button>

            {/* Standalone Clear All Enlisted */}
            <button
              onClick={handleClearAllParties}
              className="flex items-center space-x-1 px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/40 text-[11px] text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 rounded cursor-pointer transition-all select-none font-bold"
              title="Disband all enlisted members across all 10 squads"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Preset Slots Local Persistence Row */}
        <div className="bg-[#0f0f0f] border border-white/10 p-3.5 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-305 font-bold">Preset Slots:</span>
            <div className="flex bg-black/40 border border-white/5 rounded p-0.5 space-x-1">
              {[1, 2, 3].map((slotNum) => {
                const isActive = selectedPresetSlot === slotNum;
                const hasSavedData = presetUpdateTrigger >= 0 && localStorage.getItem(`guild-parties-preset-${slotNum}`) !== null;
                return (
                  <button
                    key={slotNum}
                    type="button"
                    onClick={() => handleSwitchPresetSlot(slotNum as 1 | 2 | 3)}
                    className={`px-3 py-1 text-xs font-mono rounded font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    Slot {slotNum}
                    {hasSavedData && (
                      <span className="ml-1 w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" title="Has saved data" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSavePreset}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/15 text-[11px] text-indigo-300 hover:text-indigo-200 border border-indigo-500/15 hover:border-indigo-500/30 rounded cursor-pointer transition-all font-bold tracking-wide select-none"
            >
              <FolderSync className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save Squads Slot {selectedPresetSlot}</span>
            </button>
            <button
              type="button"
              onClick={handleLoadPreset}
              className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 text-[11px] text-emerald-400 hover:text-emerald-300 border border-emerald-500/15 hover:border-emerald-500/30 rounded cursor-pointer transition-all font-bold tracking-wide select-none"
            >
              <FolderSync className="w-3.5 h-3.5 text-emerald-400" />
              <span>Load Squads Slot {selectedPresetSlot}</span>
            </button>
            <button
              type="button"
              onClick={handleClearPresetSlot}
              className="flex items-center space-x-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/15 text-[11px] text-rose-400 hover:text-rose-350 border border-rose-500/15 hover:border-rose-500/30 rounded cursor-pointer transition-all font-bold tracking-wide select-none"
              title={`Clear Slot ${selectedPresetSlot}`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Slot {selectedPresetSlot}</span>
            </button>
          </div>
        </div>

        {/* Clone Active Squads Panel */}
        <div className="bg-[#0f0f0f] border border-white/10 p-3.5 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <Copy className="w-4 h-4 text-indigo-400 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-slate-200 block">Clone Active Squads</span>
              <span className="text-[10px] text-slate-400">Directly duplicate on-screen active drafts from another slot into your current Slot {selectedPresetSlot}.</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">From Slot:</span>
            <select
              value={cloneSourceSlot}
              onChange={(e) => setCloneSourceSlot(Number(e.target.value) as 1 | 2 | 3)}
              className="bg-[#050505] border border-white/10 rounded px-2.5 text-xs text-slate-100 h-8 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
            >
              {[1, 2, 3]
                .filter(s => s !== selectedPresetSlot)
                .map(s => (
                  <option key={s} value={s}>Slot {s}</option>
                ))
              }
            </select>
            <button
              type="button"
              onClick={() => handleCloneActiveSlot(cloneSourceSlot)}
              className="flex items-center space-x-1 px-3 h-8 bg-indigo-500/10 hover:bg-indigo-500/15 text-[11px] text-indigo-300 hover:text-indigo-200 border border-indigo-500/15 hover:border-indigo-500/35 rounded cursor-pointer transition-all font-bold tracking-wide select-none"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Clone from Slot {cloneSourceSlot}</span>
            </button>
          </div>
        </div>

        {/* 10 Parties Roster Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5">
          {parties.map((party, idx) => {
            const isActive = party.id === selectedPartyId;
            
            return (
              <div
                key={party.id}
                onClick={() => setSelectedPartyId(party.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const mId = e.dataTransfer.getData("text/plain");
                  if (mId) {
                    addPlayerToParty(party.id, mId);
                  }
                }}
                className={`bg-[#0a0a0a] border rounded-lg p-3.5 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer ${
                  isActive 
                    ? "border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-1 ring-indigo-505" 
                    : "border-white/10 hover:border-white/15"
                }`}
              >
                {/* Party Title Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                    <span className="font-mono text-[10px] font-bold text-indigo-400/85 select-none mr-0.5">
                      #{idx + 1}
                    </span>
                    <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={party.name}
                      onChange={(e) => handleRenameParty(party.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()} // don't trigger selection toggle
                      className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-500 font-bold text-xs text-slate-200 mt-0 focus:outline-none w-full py-0.5 truncate uppercase tracking-wide"
                      placeholder="Rename Combat Unit..."
                    />
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="text-[10px] font-mono font-bold bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">
                      {party.memberIds.filter(id => id !== "").length}/5
                    </span>
                    {party.memberIds.filter(id => id !== "").length > 0 && (
                      <button
                        title="Clear Team Slots"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearPartySquad(party.id);
                        }}
                        className="p-1 hover:text-rose-400 text-slate-500 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Slots List circles */}
                <div className="space-y-1.5 flex-1">
                  {Array.from({ length: 5 }).map((_, slotIdx) => {
                    const memberId = party.memberIds[slotIdx];
                    const member = roster.find(m => m.id === memberId);

                    if (member) {
                      return (
                        <div
                          key={`filled-${slotIdx}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const mId = e.dataTransfer.getData("text/plain");
                            if (mId) {
                              addPlayerToParty(party.id, mId, slotIdx);
                            }
                          }}
                          className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 px-2 py-1 rounded text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <div className="w-4 h-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono rounded flex items-center justify-center font-bold">
                              {slotIdx + 1}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMemberCrown(party.id, member.id);
                              }}
                              className={`p-0.5 rounded cursor-pointer transition-all ${
                                party.leaderId === member.id 
                                  ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)] scale-110" 
                                  : "text-slate-600 hover:text-slate-400"
                              }`}
                              title={party.leaderId === member.id ? "Leader Nominated (Click to demote)" : "Nominate as Team Leader"}
                            >
                              <Crown className={`w-3.5 h-3.5 ${party.leaderId === member.id ? 'fill-current' : ''}`} />
                            </button>
                            <span className={`font-medium truncate ${party.leaderId === member.id ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                              {member.name}
                            </span>
                            {slotIdx === 0 && (
                              <span className="text-[9px] text-[#fbbf24] bg-[#fbbf24]/15 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                                Tank
                              </span>
                            )}
                            {slotIdx === 1 && (
                              <span className="text-[9px] text-[#34d399] bg-[#34d399]/15 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                                Healer
                              </span>
                            )}
                            {member.class && (
                              <span className="text-[9px] text-[#818cf8] bg-[#6366f1]/15 px-1 py-0.2 rounded shrink-0 font-medium">
                                {member.class}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlayerFromParty(party.id, member.id);
                            }}
                            className="p-0.5 text-slate-500 hover:text-rose-450 rounded transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    } else {
                      const label = 
                        slotIdx === 0 ? "🛡️ Slot 1: Tank only" :
                        slotIdx === 1 ? "★ Slot 2: Healer only" :
                        `- Empty Slot ${slotIdx + 1} -`;

                      const customBorder = 
                        slotIdx === 0 
                          ? "border-amber-500/16 bg-amber-500/3 text-amber-400/80" 
                          : slotIdx === 1 
                            ? "border-[#10b981]/16 bg-[#10b981]/3 text-[#34d399]/85" 
                            : isActive 
                              ? "border-indigo-500/20 bg-indigo-500/2 text-slate-400" 
                              : "border-white/5 bg-transparent text-slate-500";

                      return (
                        <div
                          key={`empty-${slotIdx}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const mId = e.dataTransfer.getData("text/plain");
                            if (mId) {
                              addPlayerToParty(party.id, mId, slotIdx);
                            }
                          }}
                          className={`relative border border-dashed hover:border-white/20 transition-all rounded p-1.5 text-[10px] flex items-center justify-center space-x-1 cursor-pointer group/slot ${customBorder}`}
                        >
                          <select
                            value=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                addPlayerToParty(party.id, val, slotIdx);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            title="Click to select adventurer"
                          >
                            <option value="">{label} (Click to select...)</option>
                            {roster
                              .filter(m => {
                                // Must not be already in any party
                                const isEnlisted = parties.some(p => p.memberIds.includes(m.id));
                                if (isEnlisted) return false;
                                
                                // Slot 1 Tank restriction
                                if (slotIdx === 0) {
                                  return isTank(m);
                                }
                                // Slot 2 Healer restriction
                                if (slotIdx === 1) {
                                  return isHealer(m);
                                }
                                // Other empty slots can be filled with any roles
                                return true;
                              })
                              .map(m => (
                                <option key={m.id} value={m.id} className="bg-[#121212] text-slate-250 font-sans">
                                  {m.name} ({m.class || "No Class"}) {m.roles && m.roles.length > 0 ? `[${m.roles.join(", ")}]` : ""}
                                </option>
                              ))}
                          </select>
                          <span className="group-hover/slot:text-indigo-400 transition-colors font-mono">{label}</span>
                        </div>
                      );
                    }
                  })}
                </div>

                {/* Helper notice */}
                {isActive && (
                  <div className="text-[9px] font-mono text-indigo-400/80 uppercase tracking-widest text-center mt-1 border border-indigo-500/10 bg-indigo-500/5 py-1 rounded">
                    ★ Selected tactical unit
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* RIGHT BLOCK: DRAGGABLE ROSTER (4 cols on normal, 3 cols on wide desktop) */}
      <div className="lg:col-span-4 2xl:col-span-3 bg-[#0a0a0a] border border-white/10 rounded-lg p-3.5 space-y-4 shadow-sm lg:sticky lg:top-[110px] self-start">
        
        {/* Sidebar header */}
        <div className="space-y-1 pb-1.5 border-b border-white/5">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
            Adventurer Repository
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Drag card into slot, or <span className="text-indigo-300 font-bold">Click</span> card to auto-add to the active party.
          </p>
        </div>

        {/* Searching bar filter */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by name / class..."
            className="w-full bg-black/60 border border-white/10 rounded pl-8 pr-3 py-1.8 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2.5 p-0.5 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Roles Quick Buttons Panel */}
        <div className="space-y-1.5 pt-0.5 pb-1 border-b border-white/5">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-bold">Quick Role filter:</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "tank", label: "🛡️ Tank", border: "border-amber-500/20 hover:border-amber-500/40 text-amber-500/90 hover:bg-amber-500/5", active: "bg-amber-500/15 border-amber-500 text-amber-300" },
              { id: "healer", label: "★ Healer", border: "border-emerald-500/20 hover:border-emerald-500/40 text-emerald-450 hover:bg-emerald-500/5", active: "bg-emerald-500/15 border-emerald-500 text-emerald-300" },
              { id: "ranged", label: "🏹 Ranged", border: "border-sky-500/20 hover:border-sky-500/40 text-sky-400/90 hover:bg-sky-500/5", active: "bg-sky-500/15 border-sky-500 text-sky-300" },
              { id: "melee", label: "⚔️ Melee", border: "border-rose-500/20 hover:border-rose-500/40 text-rose-455 hover:bg-rose-500/5", active: "bg-rose-500/15 border-rose-500 text-rose-350" }
            ].map((roleObj) => {
              const isSelected = selectedRoleFilter === roleObj.id;
              return (
                <button
                  key={roleObj.id}
                  type="button"
                  onClick={() => setSelectedRoleFilter(selectedRoleFilter === roleObj.id ? "all" : roleObj.id)}
                  className={`border py-1.5 rounded text-[11px] font-bold tracking-wide transition-all cursor-pointer select-none text-center ${
                    isSelected ? roleObj.active : `bg-black/20 ${roleObj.border}`
                  }`}
                >
                  {roleObj.label}
                </button>
              );
            })}
          </div>
          {selectedRoleFilter !== "all" && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-mono text-slate-500">Active role filter matches cards</span>
              <button
                type="button"
                onClick={() => setSelectedRoleFilter("all")}
                className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Draggable roster name items list container */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredExplorers.length === 0 ? (
            <div className="p-6 text-center text-slate-550 border border-dashed border-white/5 rounded">
              <ShieldAlert className="w-5 h-5 text-slate-650 mx-auto mb-1" />
              <p className="text-[10px]">No adventurers match query</p>
            </div>
          ) : (
            filteredExplorers.map((explorer) => {
              return (
                <div
                  key={explorer.id}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, explorer.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleQuickAssign(explorer.id)}
                  className="bg-black/40 hover:bg-white/5 border border-white/5 hover:border-white/12 rounded p-2.5 transition-all cursor-pointer flex items-center justify-between relative group select-none shadow-sm hover:ring-1 hover:ring-indigo-500/30"
                  title="Click to enlist instantly to selected unit"
                >
                  <div className="min-w-0 pr-1 space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate transition-colors font-sans">
                        {explorer.name}
                      </span>
                      {explorer.level !== undefined && (
                        <span className="text-[9px] text-emerald-450 font-mono font-bold">
                          Lv.{explorer.level}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1.5 text-[10px] flex-wrap gap-y-0.5">
                      {explorer.class && (
                        <span className="text-slate-400 font-mono italic">{explorer.class}</span>
                      )}
                      {explorer.roles && explorer.roles.length > 0 && (
                        <>
                          <span className="text-slate-600 font-mono">•</span>
                          <span className="text-[9px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider">
                            {explorer.roles.join(", ")}
                          </span>
                        </>
                      )}
                      {explorer.potential !== undefined && (
                        <>
                          <span className="text-slate-600 font-mono">•</span>
                          <span className="text-[9px] text-amber-400 font-mono font-bold uppercase">
                            Pot: {getPotentialGrade(explorer.potential, explorer.rawPotential)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAssign(explorer.id);
                    }}
                    className="p-1 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-white rounded border border-indigo-500/10 hover:border-indigo-500/35 text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Enroll to selected Unit"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Enlist</span>
                  </button>

                  {/* Tiny drag indicator */}
                  <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-slate-700/50 rounded group-hover:bg-indigo-500/40 transition-colors" />
                </div>
              );
            })
          )}
        </div>

        {/* Selected target unit widget helper */}
        <div className="bg-[#151515] p-3 rounded-lg border border-white/5 text-[11px] space-y-1.5">
          <div className="flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-slate-200">Active Party Slot Controller</span>
          </div>
          <p className="text-slate-400 leading-normal text-[10px]">
            The current active party is <span className="text-indigo-300 font-bold">"{(parties.find(p => p.id === selectedPartyId))?.name}"</span>. 
            Tapping "Enlist" on any adventurer directly assigns them to this unit.
          </p>
        </div>

      </div>

    </div>
  );
};
