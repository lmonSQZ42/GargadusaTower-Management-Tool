import React, { useState, useMemo, useEffect } from "react";
import { RosterMember, Party, Stats, CategoryCeilings } from "../types";
import { 
  Search, 
  Edit2, 
  Trash2, 
  Copy, 
  Filter, 
  ArrowUpDown, 
  ShieldAlert, 
  BadgeInfo,
  ChevronLeft, 
  ChevronRight, 
  Table,
  Info
} from "lucide-react";

interface RosterTableProps {
  roster: RosterMember[];
  selectedMemberId: string | null;
  onSelectMember: (member: RosterMember) => void;
  onDoubleClickMember?: (member: RosterMember) => void;
  onDeleteMember: (id: string) => void;
  onDuplicateMember: (member: RosterMember) => void;
  onAddNewMember: () => void;
}

// Helper to calculate Current OVR from average of the 23 active stats
export const getMemberCurrentOvr = (member: RosterMember): number => {
  if (!member || !member.stats) return 0;
  const statKeys: (keyof Stats)[] = [
    "str", "dex", "spd", "agi", "con",
    "vit", "end", "dur", "rec",
    "int", "wis", "lck",
    "cha", "ldr", "tmw", "tru", "loy",
    "atk", "def",
    "hro", "sur",
    "arc", "res"
  ];
  let sum = 0;
  let count = 0;
  statKeys.forEach(k => {
    const val = member.stats?.[k];
    if (typeof val === "number") {
      sum += val;
      count++;
    }
  });
  return count > 0 ? Math.round(sum / count) : 0;
};

// Alphabetical Potential formatting
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
    if (val >= 45) return "D";
  }
  return "F";
};

const getGradeBadgeStyle = (grade: string): string => {
  switch (grade) {
    case "S": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "A": return "text-purple-400 bg-purple-500/10 border-purple-500/30";
    case "B": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    case "C": return "text-teal-400 bg-teal-500/10 border-teal-500/30";
    case "D": return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    default: return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  }
};

const getPrimaryStatsForClass = (member: RosterMember): string[] => {
  if (member.classData?.primary) {
    return member.classData.primary;
  }
  const cls = (member.class || "").toLowerCase();
  if (cls.includes("rogue") || cls.includes("nightseeker")) return ["dex", "agi", "spd"];
  if (cls.includes("mage") || cls.includes("runemaster")) return ["arc", "int", "atk"];
  if (cls.includes("landsknecht")) return ["str", "dex", "atk"];
  if (cls.includes("fortress")) return ["con", "def", "vit"];
  if (cls.includes("sniper")) return ["dex", "lck", "atk"];
  if (cls.includes("medic")) return ["int", "wis", "rec"];
  if (cls.includes("dancer")) return ["spd", "agi", "cha"];
  if (cls.includes("bushi")) return ["str", "con", "atk"];
  if (cls.includes("imperial")) return ["str", "def", "atk"];
  return [];
};

const getSecondaryStatsForClass = (member: RosterMember): string[] => {
  if (member.classData?.secondary) {
    return member.classData.secondary;
  }
  const cls = (member.class || "").toLowerCase();
  if (cls.includes("rogue") || cls.includes("nightseeker")) return ["atk", "lck", "int"];
  if (cls.includes("mage") || cls.includes("runemaster")) return ["spd", "hro", "lck"];
  if (cls.includes("landsknecht")) return ["con", "rec", "spd"];
  if (cls.includes("fortress")) return ["res", "dur", "end"];
  if (cls.includes("sniper")) return ["spd", "hro", "con"];
  if (cls.includes("medic")) return ["cha", "con", "wis"];
  if (cls.includes("dancer")) return ["tmw", "tru", "loy"];
  if (cls.includes("bushi")) return ["vit", "dex", "sur"];
  if (cls.includes("imperial")) return ["vit", "con", "wis"];
  return [];
};

// Stat mapping structure for categories identical to ListPartyDifference
const STAT_GROUPS = [
  {
    category: "physical",
    color: "border-t-red-500/40 bg-red-950/5",
    headerColor: "text-red-400",
    stats: [
      { key: "str" as keyof Stats, label: "STR" },
      { key: "dex" as keyof Stats, label: "DEX" },
      { key: "spd" as keyof Stats, label: "SPD" },
      { key: "agi" as keyof Stats, label: "AGI" },
      { key: "con" as keyof Stats, label: "CON" },
    ]
  },
  {
    category: "vitality",
    color: "border-t-orange-500/40 bg-orange-950/5",
    headerColor: "text-orange-400",
    stats: [
      { key: "vit" as keyof Stats, label: "VIT" },
      { key: "end" as keyof Stats, label: "END" },
      { key: "dur" as keyof Stats, label: "DUR" },
      { key: "rec" as keyof Stats, label: "REC" },
    ]
  },
  {
    category: "mental",
    color: "border-t-blue-500/40 bg-blue-950/5",
    headerColor: "text-blue-400",
    stats: [
      { key: "int" as keyof Stats, label: "INT" },
      { key: "wis" as keyof Stats, label: "WIS" },
      { key: "lck" as keyof Stats, label: "LCK" },
    ]
  },
  {
    category: "social",
    color: "border-t-pink-500/40 bg-pink-950/5",
    headerColor: "text-pink-400",
    stats: [
      { key: "cha" as keyof Stats, label: "CHA" },
      { key: "ldr" as keyof Stats, label: "LDR" },
      { key: "tmw" as keyof Stats, label: "TMW" },
      { key: "tru" as keyof Stats, label: "TRU" },
      { key: "loy" as keyof Stats, label: "LOY" },
    ]
  },
  {
    category: "combat",
    color: "border-t-indigo-500/40 bg-indigo-950/5",
    headerColor: "text-indigo-400",
    stats: [
      { key: "atk" as keyof Stats, label: "ATK" },
      { key: "def" as keyof Stats, label: "DEF" },
    ]
  },
  {
    category: "heroic",
    color: "border-t-amber-500/40 bg-amber-950/5",
    headerColor: "text-amber-400",
    stats: [
      { key: "hro" as keyof Stats, label: "HRO" },
      { key: "sur" as keyof Stats, label: "SUR" },
    ]
  },
  {
    category: "arcane",
    color: "border-t-purple-500/40 bg-purple-950/5",
    headerColor: "text-purple-400",
    stats: [
      { key: "arc" as keyof Stats, label: "ARC" },
      { key: "res" as keyof Stats, label: "RES" },
    ]
  }
];

const getCategoryForStat = (statKey: keyof Stats): keyof CategoryCeilings => {
  if (["str", "dex", "spd", "agi", "con"].includes(statKey)) return "physical";
  if (["vit", "end", "dur", "rec"].includes(statKey)) return "vitality";
  if (["int", "wis", "lck"].includes(statKey)) return "mental";
  if (["cha", "ldr", "tmw", "tru", "loy"].includes(statKey)) return "social";
  if (["atk", "def"].includes(statKey)) return "combat";
  if (["hro", "sur"].includes(statKey)) return "heroic";
  return "arcane";
};

export const RosterTable: React.FC<RosterTableProps> = ({
  roster,
  selectedMemberId,
  onSelectMember,
  onDoubleClickMember,
  onDeleteMember,
  onDuplicateMember,
  onAddNewMember,
}) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [hideInactive, setHideInactive] = useState(true);
  const [displayMode, setDisplayMode] = useState<"current" | "diff">("current");

  // Synchronized scroll states
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const leftVerticalScrollRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const isScrollingRef = React.useRef<string | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(300);

  // Sorting columns state
  const [sortColumn, setSortColumn] = useState<string>("level");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Cell Selection & Highlight Custom States
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [highlightedColKey, setHighlightedColKey] = useState<string | null>(null);
  const [highlightedCell, setHighlightedCell] = useState<{ rowId: string; colKey: string } | null>(null);

  // Row heights and colWidths
  const [rowHeight] = useState<number>(36);
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("roster-table-col-widths");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse roster-table-col-widths", e);
      }
    }
    const defaults: Record<string, number> = {
      party: 110,
      name: 135,
      job: 110,
      rarity: 85,
      level: 50,
      age: 50,
      potential: 110,
      ceiling: 115,
      overallCurrent: 105,
      roles: 120,
      actions: 90,
    };
    STAT_GROUPS.forEach(g => {
      g.stats.forEach(s => {
        defaults[s.key] = 52;
      });
    });
    return defaults;
  });

  // Persist column widths to localStorage
  useEffect(() => {
    localStorage.setItem("roster-table-col-widths", JSON.stringify(colWidths));
  }, [colWidths]);

  // Dynamic lists of columns
  const [metaOrder, setMetaOrder] = useState<string[]>([
    "party",
    "name",
    "job",
    "roles",
    "rarity",
    "level",
    "age",
    "potential",
    "ceiling",
    "overallCurrent",
    "actions"
  ]);

  const [groupOrder, setGroupOrder] = useState<string[]>([
    "physical",
    "vitality",
    "mental",
    "social",
    "combat",
    "heroic",
    "arcane"
  ]);

  // Load parties from local storage for the currently active preset slot
  useEffect(() => {
    const slotSaved = localStorage.getItem("guild-selected-preset-slot");
    const slot = (slotSaved === "1" || slotSaved === "2" || slotSaved === "3") ? slotSaved : "1";
    const activeKey = `guild-parties-active-slot-${slot}`;
    let saved = localStorage.getItem(activeKey);
    if (!saved && slot === "1") {
      // Fallback to legacy
      saved = localStorage.getItem("guild-parties");
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setParties(parsed);
        }
      } catch (e) {
        console.error("Failed to load parties for roster spreadsheet", e);
      }
    }
  }, [roster]);

  // Sync selectedMemberId with highlightedRow
  useEffect(() => {
    if (selectedMemberId) {
      setHighlightedRowId(selectedMemberId);
    }
  }, [selectedMemberId]);

  // Handle scroll syncing
  const handleTopScroll = () => {
    if (topScrollRef.current && tableContainerRef.current) {
      if (isScrollingRef.current === null) {
        isScrollingRef.current = "top";
      }
      if (isScrollingRef.current === "top") {
        if (tableContainerRef.current.scrollLeft !== topScrollRef.current.scrollLeft) {
          tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
        }
      }
    }
  };

  const handleLeftVerticalScroll = () => {
    if (leftVerticalScrollRef.current && tableContainerRef.current) {
      if (isScrollingRef.current === null) {
        isScrollingRef.current = "left";
      }
      if (isScrollingRef.current === "left") {
        if (tableContainerRef.current.scrollTop !== leftVerticalScrollRef.current.scrollTop) {
          tableContainerRef.current.scrollTop = leftVerticalScrollRef.current.scrollTop;
        }
      }
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableContainerRef.current) {
      if (isScrollingRef.current === null || isScrollingRef.current === "table") {
        isScrollingRef.current = "table";
        if (topScrollRef.current.scrollLeft !== tableContainerRef.current.scrollLeft) {
          topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
        }
      }
    }
    if (leftVerticalScrollRef.current && tableContainerRef.current) {
      if (isScrollingRef.current === null || isScrollingRef.current === "table") {
        isScrollingRef.current = "table";
        if (leftVerticalScrollRef.current.scrollTop !== tableContainerRef.current.scrollTop) {
          leftVerticalScrollRef.current.scrollTop = tableContainerRef.current.scrollTop;
        }
      }
    }
  };

  useEffect(() => {
    const clearScrollLock = () => {
      isScrollingRef.current = null;
    };

    window.addEventListener("mouseup", clearScrollLock);
    window.addEventListener("touchend", clearScrollLock);

    let timeoutId: any = null;
    const handleScrollReset = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        isScrollingRef.current = null;
      }, 150);
    };

    const tableEl = tableContainerRef.current;
    const leftEl = leftVerticalScrollRef.current;
    const topEl = topScrollRef.current;

    tableEl?.addEventListener("scroll", handleScrollReset, { passive: true });
    leftEl?.addEventListener("scroll", handleScrollReset, { passive: true });
    topEl?.addEventListener("scroll", handleScrollReset, { passive: true });

    return () => {
      window.removeEventListener("mouseup", clearScrollLock);
      window.removeEventListener("touchend", clearScrollLock);
      tableEl?.removeEventListener("scroll", handleScrollReset);
      leftEl?.removeEventListener("scroll", handleScrollReset);
      topEl?.removeEventListener("scroll", handleScrollReset);
      clearTimeout(timeoutId);
    };
  }, []);

  // Sync heights and widths dynamically
  useEffect(() => {
    const measureHeight = () => {
      if (tableContainerRef.current) {
        setTableHeight(tableContainerRef.current.scrollHeight);
      }
    };
    const tid = setTimeout(measureHeight, 50);

    let observer: ResizeObserver | null = null;
    if (tableRef.current && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measureHeight);
      observer.observe(tableRef.current);
    }

    return () => {
      clearTimeout(tid);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [roster, parties, rowHeight, searchTerm, filterClass, filterRarity, hideInactive]);

  const getPartyForMember = (memberId: string): string => {
    const matchedParty = parties.find(p => p.memberIds?.includes(memberId));
    return matchedParty ? matchedParty.name : "Unassigned";
  };

  const moveItem = (arr: string[], index: number, direction: "left" | "right") => {
    const nextIndex = direction === "left" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= arr.length) return arr;
    const res = [...arr];
    const temp = res[index];
    res[index] = res[nextIndex];
    res[nextIndex] = temp;
    return res;
  };

  const handleMoveMeta = (colKey: string, direction: "left" | "right", e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = metaOrder.indexOf(colKey);
    const nextOrder = moveItem(metaOrder, idx, direction);
    setMetaOrder(nextOrder);
  };

  const handleMoveGroup = (groupKey: string, direction: "left" | "right", e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = groupOrder.indexOf(groupKey);
    const nextOrder = moveItem(groupOrder, idx, direction);
    setGroupOrder(nextOrder);
  };

  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(colKey);
      setSortDirection("asc");
    }
  };

  const handleCellClick = (rowId: string, colKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHighlightedCell({ rowId, colKey });
    setHighlightedRowId(rowId);
    setHighlightedColKey(colKey);

    const match = roster.find(m => m.id === rowId);
    if (match) {
      onSelectMember(match);
    }
  };

  const handleHeaderClick = (colKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHighlightedColKey(colKey);
    setHighlightedRowId(null);
    setHighlightedCell(null);
  };

  const handleHeaderDoubleClick = (colKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleSort(colKey);
  };

  const handleResizeCol = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 52;

    const handleMouseMove = (mvEvent: MouseEvent) => {
      const deltaX = mvEvent.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [colKey]: Math.max(32, startWidth + deltaX)
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Check unique classes for filtering selectors
  const uniqueClasses = useMemo(() => {
    const list = roster.map(m => m.class).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [roster]);

  // Is member active logic
  const isMemberActive = (member: RosterMember): boolean => {
    if (member.type !== "adventurer") return false;
    const retiredAt = member.retiredAt;
    if (retiredAt && typeof retiredAt === "object" && "age" in retiredAt) {
      return false;
    }
    return true;
  };

  // Sort values fetcher
  const getSortValue = (member: RosterMember, col: string): any => {
    if (col === "party") {
      return getPartyForMember(member.id);
    }
    if (col === "name") {
      return member.name || "";
    }
    if (col === "job") {
      return member.class || "";
    }
    if (col === "rarity") {
      return member.classRarity || "";
    }
    if (col === "level") {
      return member.level ?? 0;
    }
    if (col === "age") {
      return member.age ?? 0;
    }
    if (col === "potential") {
      return member.potential ?? 0;
    }
    if (col === "ceiling") {
      return member.potentialCeiling ?? 0;
    }
    if (col === "overallCurrent") {
      return getMemberCurrentOvr(member);
    }
    if (col === "roles") {
      return (member.roles || []).join(", ");
    }
    if (col === "actions") {
      return 0;
    }

    const key = col as keyof Stats;
    const val = member.stats?.[key] ?? 0;
    if (displayMode === "diff") {
      const ceilingCategory = getCategoryForStat(key);
      const ceilingVal = member.categoryCeilings?.[ceilingCategory] ?? 0;
      return ceilingVal - val;
    }
    return val;
  };

  // Roster Filters
  const filteredRoster = useMemo(() => {
    return roster.filter(member => {
      if (hideInactive && !isMemberActive(member)) {
        return false;
      }

      const query = searchTerm.toLowerCase();
      const nameMatch = member.name?.toLowerCase().includes(query) ?? false;
      const classMatch = member.class?.toLowerCase().includes(query) ?? false;
      const rolesMatch = member.roles?.some(role => role.toLowerCase().includes(query)) ?? false;
      if (query && !nameMatch && !classMatch && !rolesMatch) {
         return false;
      }

      if (filterClass !== "all" && member.class !== filterClass) {
        return false;
      }

      if (filterRarity !== "all" && member.classRarity !== filterRarity) {
        return false;
      }

      return true;
    });
  }, [roster, searchTerm, filterClass, filterRarity, hideInactive]);

  // Sorted list
  const sortedRoster = useMemo(() => {
    const list = [...filteredRoster];
    list.sort((a, b) => {
      const valA = getSortValue(a, sortColumn);
      const valB = getSortValue(b, sortColumn);

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredRoster, sortColumn, sortDirection, displayMode]);

  const computedTableWidth = useMemo(() => {
    const metaWidth = metaOrder.reduce((sum, col) => sum + (colWidths[col] ?? 100), 0);
    const statsWidth = groupOrder.reduce((sum, catKey) => {
      const g = STAT_GROUPS.find(item => item.category === catKey);
      if (!g) return sum;
      return sum + g.stats.reduce((subSum, s) => subSum + (colWidths[s.key] ?? 52), 0);
    }, 0);
    return metaWidth + statsWidth;
  }, [metaOrder, groupOrder, colWidths]);

  // Keep top scroll synced when width or loaded elements change
  useEffect(() => {
    if (topScrollRef.current && tableContainerRef.current) {
      topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  }, [computedTableWidth, sortedRoster]);

  // Styled Rarity rendering
  const renderRarityBadge = (rarity?: string) => {
    const label = rarity || "Common";
    const lookup = label.toLowerCase();
    
    if (lookup === "legendary") {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          Legend
        </span>
      );
    }
    if (lookup === "epic") {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
          Epic
        </span>
      );
    }
    if (lookup === "rare") {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
          Rare
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        Common
      </span>
    );
  };

  // Helper row positioning leftOffset styles
  const getRowStickyLeftStyle = (colKey: string) => {
    const isSticky = colKey === "party" || colKey === "name" || colKey === "job";
    if (!isSticky) return {};
    const idx = metaOrder.indexOf(colKey);
    let leftOffset = 0;
    if (idx >= 0) {
      for (let i = 0; i < idx; i++) {
        leftOffset += colWidths[metaOrder[i]] ?? 100;
      }
    }
    return {
      position: "sticky" as const,
      left: leftOffset,
      zIndex: 10,
    };
  };

  const getRow2HeaderStyle = (colKey: string) => {
    const isSticky = colKey === "party" || colKey === "name" || colKey === "job";
    if (!isSticky) {
      return { position: "sticky" as const, top: 32, zIndex: 20 };
    }
    const idx = metaOrder.indexOf(colKey);
    let leftOffset = 0;
    if (idx >= 0) {
      for (let i = 0; i < idx; i++) {
        leftOffset += colWidths[metaOrder[i]] ?? 100;
      }
    }
    return {
      position: "sticky" as const,
      top: 32,
      left: leftOffset,
      zIndex: 43,
    };
  };

  // Render Meta Cell
  const renderMetaCell = (colKey: string, member: RosterMember, partyName: string, potGrade: string, isUnassigned: boolean) => {
    const isCellHighlighted = highlightedCell?.rowId === member.id && highlightedCell?.colKey === colKey;
    const isColHighlighted = highlightedColKey === colKey;

    const stickyKeys = ["party", "name", "job"];
    const isSticky = stickyKeys.includes(colKey);

    const stickyIndices = stickyKeys.map(k => metaOrder.indexOf(k)).filter(idx => idx >= 0);
    const maxStickyIdx = stickyIndices.length > 0 ? Math.max(...stickyIndices) : -1;
    const isRightmostFrozen = isSticky && metaOrder.indexOf(colKey) === maxStickyIdx;

    let stickyStyle = getRowStickyLeftStyle(colKey);

    const isRowHighlighted = highlightedRowId === member.id;

    let stickyBgClass = "";
    if (isSticky) {
      if (isCellHighlighted) {
        stickyBgClass = "bg-[#1e1b4b] text-white";
      } else if (isRowHighlighted) {
        stickyBgClass = "bg-[#14152e] text-white font-semibold";
      } else if (isColHighlighted) {
        stickyBgClass = "bg-[#0e0f22] text-slate-100 group-hover:bg-[#141525]";
      } else {
        stickyBgClass = "bg-[#0a0a0a] group-hover:bg-[#121320] text-slate-300";
      }
    }

    const borderStyleClass = isRightmostFrozen 
      ? "border-r-2 border-slate-600/70 shadow-[3px_0_5px_rgba(0,0,0,0.4)]" 
      : "border-r border-white/5";

    const highlightStyleClass = isCellHighlighted
      ? "ring-2 ring-indigo-500 ring-inset bg-indigo-500/25 text-white"
      : isColHighlighted
        ? (isSticky ? "" : "bg-indigo-500/5 text-slate-100")
        : "";

    switch (colKey) {
      case "party":
        return (
          <td 
            key="party" 
            onClick={(e) => handleCellClick(member.id, "party", e)}
            style={stickyStyle}
            className={`px-2.5 truncate font-medium align-middle cursor-pointer transition-all text-xs ${stickyBgClass} ${borderStyleClass} ${highlightStyleClass}`}
          >
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
              isUnassigned 
                ? "bg-slate-500/10 text-slate-450 border border-slate-500/15" 
                : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
            }`}>
              {partyName}
            </span>
          </td>
        );
      case "name":
        const isActive = isMemberActive(member);
        const isRetired = member.retiredAt && typeof member.retiredAt === "object" && "age" in member.retiredAt;
        return (
          <td 
            key="name" 
            onClick={(e) => handleCellClick(member.id, "name", e)}
            style={stickyStyle}
            className={`px-3 truncate align-middle cursor-pointer transition-all text-xs ${stickyBgClass} ${borderStyleClass} ${highlightStyleClass}`}
          >
            <div className="flex items-center space-x-1.5 truncate">
              <span className={`font-bold ${isRowHighlighted ? "text-indigo-400" : "text-slate-100"}`}>
                {member.name}
              </span>
              {!isActive && (
                <span className="inline-flex items-center px-1 rounded text-[8px] font-mono leading-none bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  {isRetired ? "Ret" : member.type || "npc"}
                </span>
              )}
            </div>
          </td>
        );
      case "job":
        return (
          <td 
            key="job" 
            onClick={(e) => handleCellClick(member.id, "job", e)}
            style={stickyStyle}
            className={`px-3 truncate text-slate-400 text-xs align-middle cursor-pointer transition-all ${stickyBgClass} ${borderStyleClass} ${highlightStyleClass}`}
          >
            {member.class || "--"}
          </td>
        );
      case "rarity":
        return (
          <td 
            key="rarity" 
            onClick={(e) => handleCellClick(member.id, "rarity", e)}
            className={`px-2 border-r border-white/5 align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            {renderRarityBadge(member.classRarity)}
          </td>
        );
      case "level":
        return (
          <td 
            key="level" 
            onClick={(e) => handleCellClick(member.id, "level", e)}
            className={`text-center font-mono font-bold text-slate-300 text-xs border-r border-white/5 align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            {member.level ?? "--"}
          </td>
        );
      case "age":
        return (
          <td 
            key="age" 
            onClick={(e) => handleCellClick(member.id, "age", e)}
            className={`text-center font-mono text-slate-400 text-xs border-r border-white/5 align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            {member.age ?? "--"}
          </td>
        );
      case "potential":
        return (
          <td 
            key="potential" 
            onClick={(e) => handleCellClick(member.id, "potential", e)}
            className={`px-2 text-center border-r border-white/5 align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono border ${getGradeBadgeStyle(potGrade)}`}>
              {potGrade}
            </span>
          </td>
        );
      case "ceiling":
        return (
          <td 
            key="ceiling" 
            onClick={(e) => handleCellClick(member.id, "ceiling", e)}
            className={`text-center font-mono font-bold text-[#8faaec] text-xs border-r border-white/10 align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            {member.potentialCeiling ?? "--"}
          </td>
        );
      case "overallCurrent":
        return (
          <td 
            key="overallCurrent" 
            onClick={(e) => handleCellClick(member.id, "overallCurrent", e)}
            className={`text-center font-mono font-bold text-emerald-400 text-xs border-r border-white/10 align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            {getMemberCurrentOvr(member) || "--"}
          </td>
        );
      case "roles":
        return (
          <td 
            key="roles" 
            onClick={(e) => handleCellClick(member.id, "roles", e)}
            className={`px-2 border-r border-white/5 truncate text-[10px] text-slate-450 align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            {member.roles && member.roles.length > 0 
              ? member.roles.join(", ") 
              : <span className="italic text-slate-600">None</span>
            }
          </td>
        );
      case "actions":
        return (
          <td 
            key="actions" 
            className={`px-1.5 border-r border-white/5 align-middle transition-all ${highlightStyleClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center space-x-1 font-mono">
              <button
                onClick={() => {
                  onSelectMember(member);
                  onDoubleClickMember?.(member);
                }}
                title="Edit Details"
                className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDuplicateMember(member)}
                title="Clone Adventurer"
                className="p-1 text-slate-450 hover:text-teal-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteMember(member.id)}
                title="Dismiss Adventurer"
                className="p-1 text-slate-500 hover:text-rose-450 hover:bg-white/5 rounded transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        );
      default:
        return null;
    }
  };

  const selectedMember = roster.find(m => m.id === highlightedRowId);
  const primaryStats = selectedMember ? getPrimaryStatsForClass(selectedMember) : [];
  const secondaryStats = selectedMember ? getSecondaryStatsForClass(selectedMember) : [];

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-lg shadow-lg flex flex-col h-[650px] relative">
      
      {/* Spreadsheet Header Controls */}
      <div className="p-4 bg-[#151515] border-b border-white/10 space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search adventurers, classes, roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0a] text-slate-100 pl-9 pr-4 py-2 rounded border border-white/10 focus:outline-none focus:border-indigo-500 text-xs font-sans placeholder-slate-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            {/* Display Mode Switch */}
            <div className="flex items-center space-x-1 bg-black/50 border border-white/10 rounded p-0.5">
              <button
                type="button"
                onClick={() => setDisplayMode("current")}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                  displayMode === "current"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Stat Values
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode("diff")}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                  displayMode === "diff"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Stat Gaps
              </button>
            </div>

            <button
              onClick={onAddNewMember}
              className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              Add Adventurer
            </button>
          </div>
        </div>

        {/* Filters Align Block */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-white/5 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500">Class:</span>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-[#0a0a0a] border border-white/10 rounded py-1 px-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-[11px] cursor-pointer"
              >
                <option value="all">All Classes</option>
                {uniqueClasses.map(cls => (
                   <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500">Rarity:</span>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="bg-[#0a0a0a] border border-white/10 rounded py-1 px-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-[11px] cursor-pointer"
              >
                <option value="all">All Rarities</option>
                <option value="Legendary">Legendary</option>
                <option value="Epic">Epic</option>
                <option value="Rare">Rare</option>
                <option value="Common">Common</option>
              </select>
            </div>
          </div>

          <label className="flex items-center space-x-2 select-none cursor-pointer group bg-black/30 hover:bg-black/50 px-2.5 py-1 rounded border border-white/5 transition-colors">
            <input
              type="checkbox"
              checked={hideInactive}
              onChange={(e) => setHideInactive(e.target.checked)}
              className="accent-indigo-500 h-3.5 w-3.5 rounded"
            />
            <span className="text-slate-300 font-sans text-[11px] group-hover:text-indigo-400 transition-colors">
              Active Adventurers Only
            </span>
          </label>
        </div>
      </div>

      {/* Main Spreadsheet Table Container with Horizontal Scroll */}
      <div className="space-y-1">
        {/* Top horizontal helper scrollbar */}
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-black/55 text-[10px] font-mono text-slate-400 border border-white/10 rounded-t w-full select-none">
          <span className="text-indigo-400 uppercase font-bold tracking-widest text-[9px]">Horizontal Scroll:</span>
          <span className="animate-pulse">◀ Use Scrollbar below to Scroll Table horizontally ▶</span>
        </div>
        <div 
          id="roster-top-horizontal-scroller"
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="overflow-x-auto overflow-y-hidden border-x border-b border-white/10 bg-black/45 select-none hover:bg-black/70 transition-colors"
          style={{ height: '14px' }}
          title="Roster Horizontal Scrollbar"
        >
          <div style={{ width: `${computedTableWidth}px`, height: '1px' }} />
        </div>
      </div>

      {/* Table grid wrapper */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row w-full rounded-b border border-white/10 bg-[#0a0a0a]">
        
        {/* Custom scroll layout identifier */}
        <style dangerouslySetInnerHTML={{__html: `
          #roster-left-vertical-scroller::-webkit-scrollbar {
            width: 12px !important;
            height: 0px !important;
          }
          #roster-left-vertical-scroller::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02) !important;
          }
          #roster-left-vertical-scroller::-webkit-scrollbar-thumb {
            background-color: rgba(99, 102, 241, 0.55) !important;
            border-radius: 9999px !important;
            border: 2px solid rgba(15, 15, 15, 0.95) !important;
          }
          #roster-left-vertical-scroller::-webkit-scrollbar-thumb:hover {
            background-color: rgba(99, 102, 241, 0.85) !important;
          }
          #roster-left-vertical-scroller {
            scrollbar-width: thin !important;
            scrollbar-color: rgba(99, 102, 241, 0.55) rgba(255, 255, 255, 0.02) !important;
            -ms-overflow-style: auto !important;
          }

          #roster-top-horizontal-scroller::-webkit-scrollbar {
            height: 12px !important;
            width: 0px !important;
          }
          #roster-top-horizontal-scroller::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02) !important;
          }
          #roster-top-horizontal-scroller::-webkit-scrollbar-thumb {
            background-color: rgba(99, 102, 241, 0.55) !important;
            border-radius: 9999px !important;
            border: 2px solid rgba(15, 15, 15, 0.95) !important;
          }
          #roster-top-horizontal-scroller::-webkit-scrollbar-thumb:hover {
            background-color: rgba(99, 102, 241, 0.85) !important;
          }
          #roster-top-horizontal-scroller {
            scrollbar-width: thin !important;
            scrollbar-color: rgba(99, 102, 241, 0.55) rgba(255, 255, 255, 0.02) !important;
            -ms-overflow-style: auto !important;
          }

          #roster-table-container::-webkit-scrollbar {
            display: none !important;
            width: 0px !important;
            height: 0px !important;
          }
          #roster-table-container {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
        `}} />

        {/* Sync visual scroller */}
        <div 
          id="roster-left-vertical-scroller"
          ref={leftVerticalScrollRef}
          onScroll={handleLeftVerticalScroll}
          className="overflow-y-auto overflow-x-hidden border-r border-white/10 bg-black/50 shrink-0 select-none hover:bg-black/80 transition-colors"
          style={{ width: "14px" }}
          title="Roster Vertical Scrollbar"
        >
          <div style={{ height: `${tableHeight}px`, width: "1px" }} />
        </div>

        {/* Body scroll container */}
        <div
          id="roster-table-container"
          ref={tableContainerRef}
          onScroll={handleTableScroll}
          className="flex-1 overflow-x-auto overflow-y-auto"
        >
          {sortedRoster.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
              <ShieldAlert className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-200 font-medium text-sm">No Guild Members Found</p>
              <p className="text-slate-500 text-xs mt-1 max-w-xs">
                Clear filters or uncheck "Active Adventurers Only" to view retired profiles.
              </p>
            </div>
          ) : (
            <table 
              ref={tableRef}
              style={{ width: `${computedTableWidth}px` }}
              className="text-left border-collapse table-fixed transition-all duration-75 text-slate-300"
            >
              <colgroup>
                {metaOrder.map((colKey) => (
                  <col key={colKey} style={{ width: `${colWidths[colKey] ?? 100}px` }} />
                ))}
                {groupOrder.map((catKey) => {
                  const group = STAT_GROUPS.find(g => g.category === catKey);
                  if (!group) return null;
                  return group.stats.map((stat) => (
                    <col key={stat.key} style={{ width: `${colWidths[stat.key] ?? 52}px` }} />
                  ));
                })}
              </colgroup>

              {/* Header block */}
              <thead>
                {/* Header Row 1: Groups */}
                <tr className="bg-[#0b0c0f] border-b border-white/10" style={{ height: "32px" }}>
                  {metaOrder.map((colKey, index) => {
                    if (colKey === "ceiling" || colKey === "overallCurrent") return null;

                    const stickyKeys = ["party", "name", "job"];
                    const isSticky = stickyKeys.includes(colKey);

                    const stickyIndices = stickyKeys.map(k => metaOrder.indexOf(k)).filter(idx => idx >= 0);
                    const maxStickyIdx = stickyIndices.length > 0 ? Math.max(...stickyIndices) : -1;
                    const isRightmostFrozen = isSticky && metaOrder.indexOf(colKey) === maxStickyIdx;

                    const borderStyle = isRightmostFrozen 
                      ? "border-r-2 border-slate-600/70 shadow-[3px_0_5px_rgba(0,0,0,0.4)]" 
                      : "border-r border-white/5";

                    const bgClass = isSticky ? "bg-[#16161c] text-indigo-300" : "bg-[#0b0c0f] text-slate-500";
                    const stickyStyle = getRowStickyLeftStyle(colKey);

                    const isPotentialGroup = colKey === "potential";
                    const colSpanVal = isPotentialGroup ? 3 : 1;

                    return (
                      <th 
                        key={colKey} 
                        colSpan={colSpanVal}
                        style={{ ...stickyStyle, width: isPotentialGroup ? undefined : `${colWidths[colKey]}px`, position: "sticky" as const, top: 0, zIndex: isSticky ? 45 : 20 }}
                        className={`py-1 px-3 text-[10px] uppercase font-mono tracking-wider text-center border-b border-white/15 ${bgClass} ${borderStyle} truncate select-none`}
                      >
                        {colKey === "party" 
                          ? "Assignment" 
                          : colKey === "name" 
                            ? "Adventurer" 
                            : isPotentialGroup 
                              ? "Potential" 
                              : colKey.toUpperCase()}
                      </th>
                    );
                  })}

                  {/* Render 7 Stat Groups spanning active cols */}
                  {groupOrder.map((catKey) => {
                    const group = STAT_GROUPS.find(g => g.category === catKey);
                    if (!group) return null;
                    return (
                      <th 
                        key={group.category} 
                        colSpan={group.stats.length} 
                        className={`py-1 px-2 text-center text-[10px] font-bold uppercase tracking-widest border-r border-white/10 last:border-r-0 ${group.headerColor} bg-[#0b0c0f] group/group-header relative`}
                        style={{ position: "sticky", top: 0, zIndex: 30 }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={(e) => handleMoveGroup(group.category, "left", e)}
                            title="Move column group left"
                            className="p-0.5 bg-indigo-500/20 hover:bg-indigo-600/40 hover:text-white rounded text-indigo-300 transition-all opacity-0 group-hover/group-header:opacity-100 cursor-pointer text-[10px] tracking-tight shrink-0"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <span className="select-none text-slate-200">{group.category}</span>
                          <button 
                            onClick={(e) => handleMoveGroup(group.category, "right", e)}
                            title="Move column group right"
                            className="p-0.5 bg-indigo-500/20 hover:bg-indigo-600/40 hover:text-white rounded text-indigo-300 transition-all opacity-0 group-hover/group-header:opacity-100 cursor-pointer text-[10px] tracking-tight shrink-0"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/* Header Row 2: Sub-headers */}
                <tr className="bg-[#111115] border-b border-white/10" style={{ height: "32px" }}>
                  {metaOrder.map((colKey) => {
                    const info = META_COLUMNS_INFO[colKey] || { label: colKey.toUpperCase(), borderClass: "border-r border-white/5", defaultSortField: colKey };
                    const isSorted = sortColumn === colKey;
                    const stickyKeys = ["party", "name", "job"];
                    const isSticky = stickyKeys.includes(colKey);

                    const stickyIndices = stickyKeys.map(k => metaOrder.indexOf(k)).filter(idx => idx >= 0);
                    const maxStickyIdx = stickyIndices.length > 0 ? Math.max(...stickyIndices) : -1;
                    const isRightmostFrozen = isSticky && metaOrder.indexOf(colKey) === maxStickyIdx;
                    const isColHighlighted = highlightedColKey === colKey;

                    const stickyStyle = getRow2HeaderStyle(colKey);

                    const borderStyle = isRightmostFrozen 
                      ? "border-r-2 border-slate-600/70 shadow-[3px_0_5px_rgba(0,0,0,0.4)]" 
                      : "border-r border-white/5";

                    const bgClass = isSticky 
                      ? (isColHighlighted ? "bg-[#1f1a4a] text-indigo-300" : "bg-[#16161c] text-slate-300")
                      : (isColHighlighted ? "bg-[#18153c] text-indigo-300 border-b-2 border-b-indigo-500" : "bg-[#0b0c0f] text-slate-400");

                    let displayLabel = "Actions";
                    if (colKey === "party") displayLabel = "Party Unit";
                    else if (colKey === "name") displayLabel = "Adventurer";
                    else if (colKey === "job") displayLabel = "Class/Job";
                    else if (colKey === "rarity") displayLabel = "Rarity";
                    else if (colKey === "level") displayLabel = "Level";
                    else if (colKey === "age") displayLabel = "Age";
                    else if (colKey === "potential") displayLabel = "Grade";
                    else if (colKey === "ceiling") displayLabel = "Ceiling";
                    else if (colKey === "overallCurrent") displayLabel = "Current OVR";
                    else if (colKey === "roles") displayLabel = "Roles";

                    return (
                      <th 
                        key={colKey} 
                        style={{ ...stickyStyle, width: `${colWidths[colKey]}px` }}
                        className={`py-1.5 px-3 text-left font-bold transition-all select-none group/meta-header cursor-pointer text-[10px] relative uppercase tracking-wider ${borderStyle} ${bgClass}`}
                        onClick={(e) => handleHeaderClick(colKey, e)}
                        onDoubleClick={(e) => handleHeaderDoubleClick(colKey, e)}
                        title="Click: Highlight column. Double click: Sort rows"
                      >
                        <div className="flex items-center space-x-1 justify-between h-full">
                          <button 
                            onClick={(e) => handleMoveMeta(colKey, "left", e)}
                            title="Move column left"
                            className="p-0.5 hover:bg-white/10 rounded text-slate-550 transition-colors opacity-0 group-hover/meta-header:opacity-100 cursor-pointer text-[9px] shrink-0"
                          >
                            <ChevronLeft className="w-2.5 h-2.5" />
                          </button>

                          <span className="truncate font-sans font-extrabold max-w-full text-center flex-1">{displayLabel}</span>
                          {isSorted && (
                            <span className="text-indigo-400 font-mono shrink-0 ml-0.5">
                              {sortDirection === "asc" ? "▲" : "▼"}
                            </span>
                          )}

                          <button 
                            onClick={(e) => handleMoveMeta(colKey, "right", e)}
                            title="Move column right"
                            className="p-0.5 hover:bg-white/10 rounded text-slate-550 transition-colors opacity-0 group-hover/meta-header:opacity-100 cursor-pointer text-[9px] shrink-0"
                          >
                            <ChevronRight className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Drag resize handle */}
                        <div 
                          onMouseDown={(e) => handleResizeCol(colKey, e)}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize group-hover/meta-header:bg-indigo-500/35 active:bg-indigo-600 active:w-3 transition-all z-20"
                          title="Drag to resize"
                        />
                      </th>
                    );
                  })}

                  {/* Individual sub-header columns block */}
                  {groupOrder.map((catKey) => {
                    const group = STAT_GROUPS.find(g => g.category === catKey);
                    if (!group) return null;
                    return group.stats.map((stat) => {
                      const isSorted = sortColumn === stat.key;
                      const isHighlighted = highlightedColKey === stat.key;
                      const isPrimary = primaryStats.includes(stat.key);
                      const isSecondary = secondaryStats.includes(stat.key);

                      let highlightStyle = "text-slate-400 bg-[#0e0f12]";
                      if (isPrimary) {
                        highlightStyle = "bg-[#330c0e] text-red-300 border-b-2 border-[#a61c1c]";
                      } else if (isSecondary) {
                        highlightStyle = "bg-[#2b180a] text-[#f2ccb3] border-b-2 border-[#804c26]";
                      } else if (isHighlighted) {
                        highlightStyle = "bg-[#1a1440] text-indigo-300 border-b-2 border-b-indigo-500";
                      }

                      return (
                        <th 
                          key={stat.key} 
                          className={`py-1.5 px-0.5 text-center font-bold border-r border-white/5 last:border-r-0 hover:bg-white/5 select-none relative group/stat-header cursor-pointer text-[9px] ${highlightStyle}`}
                          style={{ width: `${colWidths[stat.key]}px`, position: "sticky", top: 32, zIndex: 30 }}
                          onClick={(e) => handleHeaderClick(stat.key, e)}
                          onDoubleClick={(e) => handleHeaderDoubleClick(stat.key, e)}
                          title="Click: Highlight column. Double click: Sort rows"
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className="font-semibold truncate max-w-full">{stat.label}</span>
                            {isSorted && (
                              <span className="text-[7px] text-indigo-400 font-normal leading-none mt-0.5">
                                {sortDirection === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </div>

                          <div 
                            onMouseDown={(e) => handleResizeCol(stat.key, e)}
                            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize group-hover/stat-header:bg-emerald-500/35 active:bg-emerald-600 transition-all z-20"
                            title="Resize"
                          />
                        </th>
                      );
                    });
                  })}
                </tr>
              </thead>

              {/* Rows */}
              <tbody className="divide-y divide-white/5 text-slate-350">
                {sortedRoster.map((member) => {
                  const partyName = getPartyForMember(member.id);
                  const potGrade = getPotentialGrade(member.potential, member.rawPotential);
                  const isUnassigned = partyName === "Unassigned";
                  const isRowHighlighted = highlightedRowId === member.id;

                  return (
                    <tr 
                      key={member.id} 
                      onClick={() => {
                        setHighlightedRowId(member.id);
                        setHighlightedColKey(null);
                        setHighlightedCell(null);
                        onSelectMember(member);
                      }}
                      onDoubleClick={() => {
                        onDoubleClickMember?.(member);
                      }}
                      style={{ height: `${rowHeight}px` }}
                      className={`transition-all cursor-pointer group ${
                        isRowHighlighted 
                          ? "bg-indigo-500/10 text-white font-semibold ring-1 ring-inset ring-indigo-500/30" 
                          : "hover:bg-slate-800/15"
                      }`}
                    >
                      {metaOrder.map((colKey) => renderMetaCell(colKey, member, partyName, potGrade, isUnassigned))}

                      {/* 23 Stats Cells */}
                      {groupOrder.map((catKey) => {
                        const group = STAT_GROUPS.find(g => g.category === catKey);
                        if (!group) return null;
                        return group.stats.map((stat) => {
                          const val = member.stats?.[stat.key] ?? 0;
                          const ceilingKey = getCategoryForStat(stat.key);
                          const ceilingVal = member.categoryCeilings?.[ceilingKey] ?? 0;
                          const diff = ceilingVal - val;

                          const isCellHighlighted = highlightedCell?.rowId === member.id && highlightedCell?.colKey === stat.key;
                          const isColHighlighted = highlightedColKey === stat.key;

                          const rowPrimaryStats = getPrimaryStatsForClass(member);
                          const rowSecondaryStats = getSecondaryStatsForClass(member);

                          const isPrimary = rowPrimaryStats.includes(stat.key);
                          const isSecondary = rowSecondaryStats.includes(stat.key);

                          let highlightStyle = "";
                          if (isCellHighlighted) {
                            highlightStyle = "ring-2 ring-indigo-500 ring-inset bg-indigo-500/25 text-white";
                          } else if (isColHighlighted) {
                            highlightStyle = "bg-indigo-500/10 text-indigo-300";
                          } else if (isPrimary) {
                            highlightStyle = "bg-[#330c0e]/60 text-red-300 group-hover:bg-[#4d1316]/75 border-b border-[#a61c1c]/25";
                          } else if (isSecondary) {
                            highlightStyle = "bg-[#2b180a]/60 text-[#f2ccb3] group-hover:bg-[#40240f]/75 border-b border-[#804c26]/25";
                          } else {
                            highlightStyle = "text-slate-400 bg-[#0b0c0f]";
                          }

                          return (
                            <td 
                              key={stat.key} 
                              style={{ width: `${colWidths[stat.key]}px` }}
                              onClick={(e) => handleCellClick(member.id, stat.key, e)}
                              className={`px-1 text-center border-r border-white/5 last:border-r-0 font-mono text-[11px] align-middle transition-all cursor-pointer ${highlightStyle}`}
                            >
                              {displayMode === "diff" ? (
                                diff > 0 ? `+${diff}` : <span className="text-slate-700 opacity-30 font-extralight font-mono">-</span>
                              ) : (
                                <div className="flex items-center justify-center space-x-0.5 truncate">
                                  <span className={isRowHighlighted ? "text-slate-205 text-white" : ""}>{val}</span>
                                  <span className="text-slate-600 text-[8px] font-normal leading-none opacity-60">/{ceilingVal || "--"}</span>
                                </div>
                              )}
                            </td>
                          );
                        });
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Spreadsheet Muted Footer */}
      <div className="p-3 bg-[#151515] border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
        <div className="flex items-center space-x-1.5 font-mono">
          <BadgeInfo className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Active mode: <strong className="text-indigo-400 uppercase tracking-widest">{displayMode === "current" ? "Values / Ceilings" : "Gaps to Ceilings"}</strong></span>
          <span className="text-slate-600">|</span>
          <span>Shown: {sortedRoster.length} of {roster.length} matches</span>
        </div>
        <div className="text-slate-500 text-[10px] md:text-right font-sans">
          Click row to select, highlight stats columns/cells, or click chevrons to swap column groupings or sizes.
        </div>
      </div>
    </div>
  );
};

// Map meta headers labels properties
const META_COLUMNS_INFO: Record<string, { label: string; borderClass: string; defaultSortField: string }> = {
  party: { label: "Party", borderClass: "border-r border-white/5", defaultSortField: "party" },
  name: { label: "Adventurer", borderClass: "border-r border-white/5", defaultSortField: "name" },
  job: { label: "Class", borderClass: "border-r border-white/5", defaultSortField: "job" },
  rarity: { label: "Rarity", borderClass: "border-r border-white/5", defaultSortField: "rarity" },
  level: { label: "Lv", borderClass: "border-r border-white/5 text-center", defaultSortField: "level" },
  age: { label: "Age", borderClass: "border-r border-white/5 text-center", defaultSortField: "age" },
  potential: { label: "Grade", borderClass: "border-r border-white/5 text-center", defaultSortField: "potential" },
  ceiling: { label: "Ceiling", borderClass: "border-r border-white/10 text-center", defaultSortField: "ceiling" },
  overallCurrent: { label: "Current OVR", borderClass: "border-r border-white/10 text-center", defaultSortField: "overallCurrent" },
  roles: { label: "Roles", borderClass: "border-r border-white/5", defaultSortField: "roles" },
  actions: { label: "Actions", borderClass: "border-r border-white/5 text-center", defaultSortField: "actions" },
};
