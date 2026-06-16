import React, { useState, useEffect } from "react";
import { RosterMember, Party, Stats, CategoryCeilings } from "../types";
import { 
  Search, 
  Info, 
  SlidersHorizontal, 
  Table, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  MoveHorizontal
} from "lucide-react";

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
    if (val >= 45) return "D"; // Map 48 (Amara's potentialCeiling) correctly to D-Tier as in JSON!
  }
  return "F";
};

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

// Stat mapping structure for categories
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

// Helper to find category name for a stat
const getCategoryForStat = (statKey: keyof Stats): keyof CategoryCeilings => {
  if (["str", "dex", "spd", "agi", "con"].includes(statKey)) return "physical";
  if (["vit", "end", "dur", "rec"].includes(statKey)) return "vitality";
  if (["int", "wis", "lck"].includes(statKey)) return "mental";
  if (["cha", "ldr", "tmw", "tru", "loy"].includes(statKey)) return "social";
  if (["atk", "def"].includes(statKey)) return "combat";
  if (["hro", "sur"].includes(statKey)) return "heroic";
  return "arcane";
};

// Meta Columns Configuration Info Labels
const META_COLUMNS_INFO: Record<string, { label: string; borderClass: string; defaultSortField: string }> = {
  party: { label: "Party", borderClass: "border-r border-white/5", defaultSortField: "party" },
  name: { label: "Name", borderClass: "border-r border-white/5", defaultSortField: "name" },
  job: { label: "Job Class", borderClass: "border-r border-white/5", defaultSortField: "job" },
  potential: { label: "Grade", borderClass: "border-r border-white/5 text-center", defaultSortField: "potential" },
  ceiling: { label: "Ceiling", borderClass: "border-r border-white/10 text-center", defaultSortField: "ceiling" },
  overallCurrent: { label: "Current OVR", borderClass: "border-r border-white/10 text-center", defaultSortField: "overallCurrent" },
  delta: { label: "DELTA", borderClass: "border-r border-white/10 text-center", defaultSortField: "delta" },
};

interface ListPartyDifferenceProps {
  roster: RosterMember[];
  onSelectMember: (member: RosterMember) => void;
  onClose?: () => void;
}

export const ListPartyDifference: React.FC<ListPartyDifferenceProps> = ({
  roster,
  onSelectMember,
  onClose
}) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartyFilter, setSelectedPartyFilter] = useState<string>("all");
  const [viewLimit, setViewLimit] = useState<string>("all");

  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const leftVerticalScrollRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const isScrollingRef = React.useRef<string | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(300);

  // Compute sticky Left column styles statically
  const getRowStickyLeftStyle = (colKey: string) => {
    const isSticky = colKey === "party" || colKey === "name";
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
    const isSticky = colKey === "party" || colKey === "name";
    if (!isSticky) {
      return { position: "sticky" as const, top: 36, zIndex: 20 };
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
      top: 36,
      left: leftOffset,
      zIndex: 40,
    };
  };

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

  // Reset active scroll lock on mouse up or mouse leave to ensure scroll inputs feel continuous
  useEffect(() => {
    const clearScrollLock = () => {
      isScrollingRef.current = null;
    };

    window.addEventListener("mouseup", clearScrollLock);
    window.addEventListener("touchend", clearScrollLock);
    
    // Also use debounce/timer fallback on scroll divs to ensure reset if mouseup not captured
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

  // Row sorting states
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Selection & Highlight Custom States
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [highlightedColKey, setHighlightedColKey] = useState<string | null>(null);
  const [highlightedCell, setHighlightedCell] = useState<{ rowId: string; colKey: string } | null>(null);

  // Spreadsheet Sizing Custom States
  const [rowHeight, setRowHeight] = useState<number>(() => {
    const saved = localStorage.getItem("sheet-row-height");
    return saved ? Number(saved) : 36;
  }); // standard cell height in px

  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {
      party: 125,
      name: 145,
      job: 120,
      potential: 85,
      ceiling: 85,
      overallCurrent: 90,
      delta: 85,
    };
    // Include the 23 stats
    STAT_GROUPS.forEach(g => {
      g.stats.forEach(s => {
        defaults[s.key] = 52;
      });
    });

    const saved = localStorage.getItem("sheet-col-widths");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...defaults, ...parsed };
        }
      } catch (e) {
        console.error("Failed to parse sheet-col-widths", e);
      }
    }
    return defaults;
  });

  // Persist Row Height & Column Widths to localStorage
  useEffect(() => {
    localStorage.setItem("sheet-row-height", String(rowHeight));
  }, [rowHeight]);

  useEffect(() => {
    localStorage.setItem("sheet-col-widths", JSON.stringify(colWidths));
  }, [colWidths]);

  // Drag-to-resize columns handler
  const handleResizeCol = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 52;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [colKey]: Math.max(32, startWidth + deltaX) // Min limit of 32px
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Column arrangements / positioning states
  const [metaOrder, setMetaOrder] = useState<string[]>([
    "party",
    "name",
    "job",
    "potential",
    "ceiling",
    "overallCurrent",
    "delta"
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

  // Load parties from local storage
  useEffect(() => {
    const saved = localStorage.getItem("guild-parties");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setParties(parsed);
        }
      } catch (e) {
        console.error("Failed to load parties for difference spreadsheet", e);
      }
    }
  }, []);

  // Measure table's total scrollable height so the left scrollbar matches perfectly
  useEffect(() => {
    const measureHeight = () => {
      if (tableContainerRef.current) {
        setTableHeight(tableContainerRef.current.scrollHeight);
      }
    };

    // Run on micro-task to allow rendering lifecycle to complete
    const timeoutId = setTimeout(measureHeight, 50);

    // Set up a resize observer on the table element to instantly respond to dynamic content layout changes
    let observer: ResizeObserver | null = null;
    if (tableRef.current && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measureHeight);
      observer.observe(tableRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [roster, parties, rowHeight, viewLimit, searchQuery, selectedPartyFilter]);

  // Map each roster member to their party
  const getPartyForMember = (memberId: string): string => {
    const matchedParty = parties.find(p => p.memberIds?.includes(memberId));
    return matchedParty ? matchedParty.name : "Unassigned";
  };

  // Helper code to swap order in columns array
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

  // Click-to-sort columns
  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(colKey);
      setSortDirection("asc");
    }
  };

  // Cell single-click handler (highlights the cell, its entire column, and its entire row)
  const handleCellClick = (rowId: string, colKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHighlightedCell({ rowId, colKey });
    setHighlightedRowId(rowId);
    setHighlightedColKey(colKey);
  };

  // Header single-click handler (highlights the entire column)
  const handleHeaderClick = (colKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHighlightedColKey(colKey);
    setHighlightedRowId(null);
    setHighlightedCell(null);
  };

  // Header double-click handler (triggers row sorting)
  const handleHeaderDoubleClick = (colKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleSort(colKey);
  };

  // Helper to extract nested sort val
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
    if (col === "potential") {
      return member.potential ?? 0;
    }
    if (col === "ceiling") {
      return member.potentialCeiling ?? 0;
    }
    if (col === "overallCurrent") {
      return getMemberCurrentOvr(member);
    }
    if (col === "delta") {
      return (member.potentialCeiling ?? 0) - getMemberCurrentOvr(member);
    }
    // Specific primary stats
    const statKey = col as keyof Stats;
    const val = member.stats?.[statKey] ?? 0;
    const ceilingCategory = getCategoryForStat(statKey);
    const ceilingVal = member.categoryCeilings?.[ceilingCategory] ?? 0;
    // Difference display gap value
    return ceilingVal - val;
  };

  // Filter roster items
  const filteredRoster = roster.filter(member => {
    // Only adventurers, exclude retired
    if (member.type !== "adventurer") return false;
    if (member.retiredAt !== null && member.retiredAt !== undefined) return false;

    const memberPartyName = getPartyForMember(member.id);
    if (selectedPartyFilter !== "all") {
      if (selectedPartyFilter === "unassigned" && memberPartyName !== "Unassigned") return false;
      if (selectedPartyFilter !== "unassigned" && memberPartyName !== selectedPartyFilter) return false;
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const nameMatch = (member.name || "").toLowerCase().includes(query);
    const classMatch = (member.class || "").toLowerCase().includes(query);
    const partyMatch = memberPartyName.toLowerCase().includes(query);

    return nameMatch || classMatch || partyMatch;
  });

  // Sort matched entries
  const sortedAndFilteredRoster = [...filteredRoster].sort((a, b) => {
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

  const displayedRoster = viewLimit === "all"
    ? sortedAndFilteredRoster
    : sortedAndFilteredRoster.slice(0, parseInt(viewLimit, 10));

  const highlightedMember = roster.find(m => m.id === highlightedRowId);
  const primaryStats = highlightedMember ? getPrimaryStatsForClass(highlightedMember) : [];
  const secondaryStats = highlightedMember ? getSecondaryStatsForClass(highlightedMember) : [];

  // Calculate precise table width in pixels dynamically
  const computedTableWidth = metaOrder.reduce((sum, col) => sum + (colWidths[col] ?? 100), 0) +
    groupOrder.reduce((sum, catKey) => {
      const g = STAT_GROUPS.find(item => item.category === catKey);
      if (!g) return sum;
      return sum + g.stats.reduce((subSum, s) => subSum + (colWidths[s.key] ?? 52), 0);
    }, 0);

  // Keep top scroll synced when width or loaded elements change
  useEffect(() => {
    if (topScrollRef.current && tableContainerRef.current) {
      topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  }, [computedTableWidth, displayedRoster]);

  // Helper renderer function for the basic specs cells with customizable highlights
  const renderMetaCell = (colKey: string, member: RosterMember, partyName: string, potGrade: string, isUnassigned: boolean) => {
    const isCellHighlighted = highlightedCell?.rowId === member.id && highlightedCell?.colKey === colKey;
    const isColHighlighted = highlightedColKey === colKey;

    const isParty = colKey === "party";
    const isName = colKey === "name";
    const isSticky = isParty || isName;

    const partyIdx = metaOrder.indexOf("party");
    const nameIdx = metaOrder.indexOf("name");

    let stickyStyle: React.CSSProperties = {};
    if (isSticky) {
      const targetIdx = isParty ? partyIdx : nameIdx;
      let left = 0;
      for (let i = 0; i < targetIdx; i++) {
        left += colWidths[metaOrder[i]] ?? 100;
      }
      stickyStyle = {
        position: "sticky",
        left,
        zIndex: 10,
      };
    }

    const isRowHighlighted = highlightedRowId === member.id;
    const isRightmostFrozen = isSticky && colKey === (partyIdx > nameIdx ? "party" : "name");

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
            id={`cell-party-${member.id}`} 
            key="party" 
            onClick={(e) => handleCellClick(member.id, "party", e)}
            style={stickyStyle}
            className={`px-3 truncate font-medium align-middle cursor-pointer transition-all ${stickyBgClass} ${borderStyleClass} ${highlightStyleClass}`}
          >
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
              isUnassigned 
                ? "bg-slate-500/10 text-slate-450 border border-slate-500/15" 
                : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
            }`}>
              {partyName}
            </span>
          </td>
        );
      case "name":
        return (
          <td 
            id={`cell-name-${member.id}`} 
            key="name" 
            onClick={(e) => handleCellClick(member.id, "name", e)}
            style={stickyStyle}
            className={`px-3 truncate font-semibold font-sans align-middle cursor-pointer transition-all ${stickyBgClass} ${borderStyleClass} ${highlightStyleClass}`}
          >
            {member.name}
          </td>
        );
      case "job":
        return (
          <td 
            id={`cell-job-${member.id}`} 
            key="job" 
            onClick={(e) => handleCellClick(member.id, "job", e)}
            className={`px-3 border-r border-white/5 truncate text-slate-450 align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            {member.class || "--"}
          </td>
        );
      case "potential":
        return (
          <td 
            id={`cell-potential-${member.id}`} 
            key="potential" 
            onClick={(e) => handleCellClick(member.id, "potential", e)}
            className={`px-3 border-r border-white/5 text-center align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${getGradeBadgeStyle(potGrade)}`}>
              {potGrade}
            </span>
          </td>
        );
      case "ceiling":
        return (
          <td 
            id={`cell-ceiling-${member.id}`} 
            key="ceiling" 
            onClick={(e) => handleCellClick(member.id, "ceiling", e)}
            className={`px-3 border-r border-white/10 text-center font-mono font-bold text-[#8faaec] align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            {member.potentialCeiling ?? "--"}
          </td>
        );
      case "overallCurrent":
        return (
          <td 
            id={`cell-overallCurrent-${member.id}`} 
            key="overallCurrent" 
            onClick={(e) => handleCellClick(member.id, "overallCurrent", e)}
            className={`px-3 border-r border-white/10 text-center font-mono font-bold text-emerald-400 align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            {getMemberCurrentOvr(member) || "--"}
          </td>
        );
      case "delta":
        const ceilValue = member.potentialCeiling;
        const ovrValue = getMemberCurrentOvr(member);
        const deltaValue = (ceilValue !== undefined && ceilValue !== null) ? (ceilValue - ovrValue) : null;
        return (
          <td 
            id={`cell-delta-${member.id}`} 
            key="delta" 
            onClick={(e) => handleCellClick(member.id, "delta", e)}
            className={`px-3 border-r border-[#8faaec]/10 text-center font-mono font-bold text-indigo-400 align-middle cursor-pointer transition-all ${highlightStyleClass}`}
          >
            {deltaValue !== null ? (deltaValue > 0 ? `+${deltaValue}` : deltaValue) : "--"}
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div id="list-party-difference-view" className="bg-[#0f0f0f] border border-white/10 rounded-lg p-4 sm:p-6 shadow-xl space-y-5 font-sans">
      
      {/* Compact, Static Party Filter Header */}
      <div className="bg-[#0c0c0e]/95 border-b border-white/10 p-3 flex flex-col items-start gap-2.5 shadow-md rounded-lg mb-4">
        {/* Row 1: Label and General Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-indigo-400 shrink-0" />
            Party Filter:
          </span>
          
          <button
            onClick={() => setSelectedPartyFilter("all")}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-all cursor-pointer font-bold ${
              selectedPartyFilter === "all"
                ? "bg-indigo-600 border border-indigo-500 text-white shadow-sm"
                : "bg-white/5 border border-white/10 hover:bg-white/10 text-slate-355"
            }`}
          >
            All
          </button>

          {(() => {
            const isSelected = selectedPartyFilter === "unassigned";
            const unassignedCount = roster.filter(m => {
              if (m.type !== "adventurer") return false;
              if (m.retiredAt !== null && m.retiredAt !== undefined) return false;
              const hasParty = parties.some(p => p.memberIds?.includes(m.id));
              return !hasParty;
            }).length;
            return (
              <button
                onClick={() => setSelectedPartyFilter("unassigned")}
                className={`px-2.5 py-1 text-xs rounded transition-all cursor-pointer flex items-center gap-1 font-bold ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm border border-indigo-500 font-bold"
                    : "bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                }`}
              >
                <span>Unassigned</span>
                <span className={`text-[9px] px-1 rounded font-mono font-bold ${
                  isSelected ? "bg-indigo-700 text-indigo-100" : "bg-white/10 text-slate-400"
                }`}>
                  {unassignedCount}
                </span>
              </button>
            );
          })()}
        </div>

        {/* Row 2: Parties 1-10 */}
        <div className="flex flex-wrap items-center gap-1.5 w-full">
          {parties.map((p) => {
            const isSelected = selectedPartyFilter === p.name;
            const count = roster.filter(m => m.type === "adventurer" && (m.retiredAt === null || m.retiredAt === undefined) && p.memberIds?.includes(m.id)).length;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPartyFilter(p.name)}
                className={`px-2.5 py-1 text-xs rounded transition-all cursor-pointer flex items-center gap-1 text-[11px] font-sans ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm border border-indigo-500 font-semibold"
                    : "bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                }`}
              >
                <span>{p.name}</span>
                <span className={`text-[9px] px-1 rounded font-mono font-bold ${
                  isSelected ? "bg-indigo-700 text-indigo-100" : "bg-white/10 text-slate-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Control Filters & Spacing Area (Inside Sticky Header Container) */}
        <div className="flex flex-wrap items-center gap-4 bg-black/45 p-2 sm:p-2.5 rounded-lg border border-white/5 w-full mt-1">
          {/* Search */}
          <div className="min-w-[200px] flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search adventurers, job classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* View Limit Filter */}
          <div className="flex items-center space-x-2 min-w-[130px]">
            <Table className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Rows:</span>
            <select
              value={viewLimit}
              onChange={(e) => setViewLimit(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer font-sans"
            >
              <option value="20">20 Rows</option>
              <option value="60">60 Rows</option>
              <option value="all">All Rows</option>
            </select>
          </div>

          {/* Row Height Config Slider */}
          <div className="flex items-center space-x-2 border-l border-white/10 pl-4 py-0.5">
            <span className="text-[10px] font-mono text-slate-400 shrink-0 select-none">ROW HEIGHT:</span>
            <input 
              type="range" 
              min="26" 
              max="76" 
              value={rowHeight} 
              onChange={(e) => setRowHeight(Number(e.target.value))} 
              className="w-20 accent-indigo-500 cursor-col-resize h-1 bg-white/10 rounded-lg appearance-none"
              title="Slide to change row height sizing"
            />
            <span className="text-[10px] font-mono text-indigo-400 font-bold shrink-0">{rowHeight}px</span>
          </div>

          {/* batch resize stats cols */}
          <div className="flex items-center space-x-2 border-l border-white/10 pl-4 py-0.5">
            <span className="text-[10px] font-mono text-slate-400 shrink-0 select-none">STAT COLS:</span>
            <input 
              type="range" 
              min="32" 
              max="110" 
              value={colWidths["str"] || 52} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setColWidths(prev => {
                  const updated = { ...prev };
                  STAT_GROUPS.forEach(g => {
                    g.stats.forEach(s => {
                      updated[s.key] = val;
                    });
                  });
                  return updated;
                });
              }} 
              className="w-20 accent-emerald-500 cursor-col-resize h-1 bg-white/10 rounded-lg appearance-none"
              title="Resize all 23 primary stats column widths"
            />
            <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">{(colWidths["str"] || 52)}px</span>
          </div>

          {/* Reset spreadsheet views */}
          <button
            onClick={() => {
              setMetaOrder(["party", "name", "job", "potential", "ceiling", "overallCurrent", "delta"]);
              setGroupOrder(["physical", "vitality", "mental", "social", "combat", "heroic", "arcane"]);
              setRowHeight(36);
              setViewLimit("all");
              setHighlightedRowId(null);
              setHighlightedColKey(null);
              setHighlightedCell(null);
              setColWidths(prev => {
                const res = { ...prev };
                res.party = 125;
                res.name = 145;
                res.job = 120;
                res.potential = 85;
                res.ceiling = 85;
                res.overallCurrent = 90;
                res.delta = 85;
                STAT_GROUPS.forEach(g => {
                  g.stats.forEach(s => {
                    res[s.key] = 52;
                  });
                });
                return res;
              });
            }}
            className="text-[9px] font-mono uppercase bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-500/20 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Main Spreadsheet Table Container with Horizontal Scroll */}
      {sortedAndFilteredRoster.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/5 rounded-lg bg-black/20">
          <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No matching adventurer items found. Clear your search or active filters.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Top horizontal helper scrollbar */}
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-black/55 text-[10px] font-mono text-slate-400 border border-white/10 rounded-t w-full select-none">
            <span className="text-indigo-400 uppercase font-bold tracking-widest text-[9px]">Horizontal Scroll:</span>
            <span className="animate-pulse">◀ Use Scrollbar below to Scroll Table horizontally ▶</span>
          </div>
          <div 
            id="top-horizontal-scroller"
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="overflow-x-auto overflow-y-hidden border-x border-b border-white/10 bg-black/45 select-none hover:bg-black/70 transition-colors"
            style={{ height: '14px' }}
            title="Spreadsheet Horizontal Scrollbar"
          >
            <div style={{ width: `${computedTableWidth}px`, height: '1px' }} />
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            #left-vertical-scroller::-webkit-scrollbar {
              width: 12px !important;
              height: 0px !important;
            }
            #left-vertical-scroller::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.02) !important;
            }
            #left-vertical-scroller::-webkit-scrollbar-thumb {
              background-color: rgba(99, 102, 241, 0.55) !important;
              border-radius: 9999px !important;
              border: 2px solid rgba(15, 15, 15, 0.95) !important;
            }
            #left-vertical-scroller::-webkit-scrollbar-thumb:hover {
              background-color: rgba(99, 102, 241, 0.85) !important;
            }
            #left-vertical-scroller {
              scrollbar-width: thin !important;
              scrollbar-color: rgba(99, 102, 241, 0.55) rgba(255, 255, 255, 0.02) !important;
              -ms-overflow-style: auto !important;
            }

            #top-horizontal-scroller::-webkit-scrollbar {
              height: 12px !important;
              width: 0px !important;
            }
            #top-horizontal-scroller::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.02) !important;
            }
            #top-horizontal-scroller::-webkit-scrollbar-thumb {
              background-color: rgba(99, 102, 241, 0.55) !important;
              border-radius: 9999px !important;
              border: 2px solid rgba(15, 15, 15, 0.95) !important;
            }
            #top-horizontal-scroller::-webkit-scrollbar-thumb:hover {
              background-color: rgba(99, 102, 241, 0.85) !important;
            }
            #top-horizontal-scroller {
              scrollbar-width: thin !important;
              scrollbar-color: rgba(99, 102, 241, 0.55) rgba(255, 255, 255, 0.02) !important;
              -ms-overflow-style: auto !important;
            }

            #table-scroller::-webkit-scrollbar {
              display: none !important;
              width: 0px !important;
              height: 0px !important;
            }
            #table-scroller {
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
          `}} />

          {/* Table Container wrapping Left Scrollbar + Table Content */}
          <div className="flex flex-row w-full rounded-b border border-white/10 bg-[#0a0a0a] overflow-hidden">
            {/* Left Hand Side Vertical Scrollbar */}
            <div 
              id="left-vertical-scroller"
              ref={leftVerticalScrollRef}
              onScroll={handleLeftVerticalScroll}
              className="overflow-y-auto overflow-x-hidden border-r border-white/10 bg-black/50 shrink-0 select-none hover:bg-black/80 transition-colors"
              style={{ width: '14px', maxHeight: '550px' }}
              title="Spreadsheet Vertical Scrollbar"
            >
              <div style={{ height: `${tableHeight}px`, width: '1px' }} />
            </div>

            {/* Table content container with disabled default scrollbars */}
            <div 
              id="table-scroller"
              ref={tableContainerRef}
              onScroll={handleTableScroll}
              className="flex-1 overflow-x-auto overflow-y-auto max-h-[550px]"
            >
              <table 
                ref={tableRef}
                style={{ width: `${computedTableWidth}px` }}
                className="text-left border-collapse table-fixed transition-all duration-75 text-slate-300"
              >
            {/* Table Dynamic Col Width Declarations using standard HTML table specs */}
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

            {/* Column Header Category Rows */}
            <thead>
              <tr className="bg-[#111] border-b border-white/15 h-8">
                {/* Meta Columns Category Headers */}
                {metaOrder.map((colKey) => {
                  if (colKey === "ceiling" || colKey === "overallCurrent" || colKey === "delta") return null;

                  const isSticky = colKey === "party" || colKey === "name";
                  const isParty = colKey === "party";
                  const isName = colKey === "name";
                  const partyIdx = metaOrder.indexOf("party");
                  const nameIdx = metaOrder.indexOf("name");

                  let stickyStyle: React.CSSProperties = { position: "sticky", top: 0, zIndex: 35 };
                  if (isSticky) {
                    const targetIdx = isParty ? partyIdx : nameIdx;
                    let left = 0;
                    for (let i = 0; i < targetIdx; i++) {
                      left += colWidths[metaOrder[i]] ?? 100;
                    }
                    stickyStyle = {
                      position: "sticky",
                      top: 0,
                      left,
                      zIndex: 48,
                    };
                  }

                  const isRightmostFrozen = isSticky && colKey === (partyIdx > nameIdx ? "party" : "name");
                  const borderStyle = isRightmostFrozen 
                    ? "border-r-2 border-slate-600/70 shadow-[3px_0_5px_rgba(0,0,0,0.4)]" 
                    : "border-r border-white/5";

                  const bgClass = isSticky ? "bg-[#16161c] text-indigo-300" : "bg-[#0b0c0f] text-slate-500";

                  const isPotentialGroup = colKey === "potential";
                  const colSpanVal = isPotentialGroup ? 4 : 1;

                  return (
                    <th 
                      key={`cat-meta-${colKey}`}
                      colSpan={colSpanVal}
                      style={{ ...stickyStyle, width: isPotentialGroup ? undefined : `${colWidths[colKey]}px` }}
                      className={`py-1 px-3 text-[10px] uppercase font-bold tracking-wider text-center border-b border-white/15 ${bgClass} ${borderStyle}`}
                    >
                      {colKey === "party" 
                        ? "Group" 
                        : colKey === "name" 
                          ? "Adventurer" 
                          : isPotentialGroup 
                            ? "Potential" 
                            : ""}
                    </th>
                  );
                })}

                {/* Stat Categories Column Headers, rearrangable by groups */}
                {groupOrder.map((groupKey) => {
                  const group = STAT_GROUPS.find(g => g.category === groupKey);
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

              {/* Precise Stat Attribute Header Cells with Interactive drag-resizable dividers */}
              <tr className="bg-[#151515] text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-white/10 h-8">
                {/* Dynamically configured Meta headers according to metaOrder */}
                {metaOrder.map((colKey) => {
                  const info = META_COLUMNS_INFO[colKey];
                  const isSorted = sortColumn === colKey;
                  const isHighlighted = highlightedColKey === colKey;

                  const isSticky = colKey === "party" || colKey === "name";
                  const isParty = colKey === "party";
                  const isName = colKey === "name";
                  const partyIdx = metaOrder.indexOf("party");
                  const nameIdx = metaOrder.indexOf("name");

                  let stickyStyle: React.CSSProperties = { position: "sticky", top: 32, zIndex: 35 };
                  if (isSticky) {
                    const targetIdx = isParty ? partyIdx : nameIdx;
                    let left = 0;
                    for (let i = 0; i < targetIdx; i++) {
                      left += colWidths[metaOrder[i]] ?? 100;
                    }
                    stickyStyle = {
                      position: "sticky",
                      top: 32,
                      left,
                      zIndex: 48,
                    };
                  }

                  const isRightmostFrozen = isSticky && colKey === (partyIdx > nameIdx ? "party" : "name");
                  const borderStyle = isRightmostFrozen 
                    ? "border-r-2 border-slate-600/70 shadow-[3px_0_5px_rgba(0,0,0,0.4)]" 
                    : "border-r border-white/5";

                  const bgClass = isSticky 
                    ? (isHighlighted ? "bg-[#1f1a4a] text-indigo-300" : "bg-[#16161c] text-slate-300")
                    : (isHighlighted ? "bg-[#18153c] text-indigo-300 border-b-2 border-b-indigo-500" : "bg-[#0b0c0f] text-slate-400");

                  return (
                    <th 
                      key={colKey}
                      className={`py-1.5 px-3 font-bold select-none group/meta-header cursor-pointer text-[10px] relative uppercase tracking-wider transition-all ${bgClass} ${borderStyle}`}
                      style={{ ...stickyStyle, width: `${colWidths[colKey]}px` }}
                      onClick={(e) => handleHeaderClick(colKey, e)}
                      onDoubleClick={(e) => handleHeaderDoubleClick(colKey, e)}
                      title="Click: Highlight column. Double click: Sort rows"
                    >
                      <div className="flex items-center space-x-1 justify-between h-full">
                        <button 
                          onClick={(e) => handleMoveMeta(colKey, "left", e)}
                          title="Move column left"
                          className="p-0.5 hover:bg-white/10 rounded text-slate-400 transition-colors opacity-0 group-hover/meta-header:opacity-100 cursor-pointer text-[9px] shrink-0"
                        >
                          <ChevronLeft className="w-2.5 h-2.5" />
                        </button>

                        <span className="truncate font-sans font-extrabold max-w-full text-center flex-1">{info.label}</span>
                        {isSorted && (
                          <span className="text-indigo-400 font-mono shrink-0 ml-0.5">
                            {sortDirection === "asc" ? "▲" : "▼"}
                          </span>
                        )}

                        <button 
                          onClick={(e) => handleMoveMeta(colKey, "right", e)}
                          title="Move column right"
                          className="p-0.5 hover:bg-white/10 rounded text-slate-400 transition-colors opacity-0 group-hover/meta-header:opacity-100 cursor-pointer text-[9px] shrink-0"
                        >
                          <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Right drag-resize divider handle */}
                      <div 
                        onMouseDown={(e) => handleResizeCol(colKey, e)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize group-hover/meta-header:bg-indigo-500/35 active:bg-indigo-600 active:w-3 transition-all z-20"
                        title="Drag horizontal line to resize width"
                      />
                    </th>
                  );
                })}

                {/* Render individual header columns block */}
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
                        className={`py-1 px-0.5 text-center font-bold border-r border-white/5 last:border-r-0 hover:bg-white/5 transition-colors select-none relative group/stat-header cursor-pointer transition-all ${highlightStyle}`}
                        style={{ width: `${colWidths[stat.key]}px`, position: "sticky", top: 32, zIndex: 30 }}
                      >
                        {/* 1 click to highlight entire column, double click to sort */}
                        <div 
                          onClick={(e) => handleHeaderClick(stat.key, e)}
                          onDoubleClick={(e) => handleHeaderDoubleClick(stat.key, e)}
                          className="flex flex-col items-center justify-center cursor-pointer h-full select-none"
                          title="Click: Highlight column. Double click: Sort rows"
                        >
                          <span className="font-semibold text-[9px] truncate max-w-full">{stat.label}</span>
                          <span className="text-[7px] text-slate-500 font-normal leading-none h-1.5 mt-0.5">
                            {isSorted ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                          </span>
                        </div>

                        {/* Drag resize handle for stat cells */}
                        <div 
                          onMouseDown={(e) => handleResizeCol(stat.key, e)}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize group-hover/stat-header:bg-emerald-500/35 active:bg-emerald-600 transition-all z-20"
                          title={`Drag to resize ${stat.label} column`}
                        />
                      </th>
                    );
                  });
                })}
              </tr>
            </thead>

            {/* Body Rows */}
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {displayedRoster.map((member) => {
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
                    }}
                    onDoubleClick={() => onSelectMember(member)}
                    style={{ height: `${rowHeight}px` }}
                    className={`transition-all cursor-pointer group ${
                      isRowHighlighted 
                        ? "bg-indigo-500/10 text-white font-semibold ring-1 ring-inset ring-indigo-500/35" 
                        : "hover:bg-indigo-500/5 hover:text-white"
                    }`}
                  >
                    {/* Render Basic Specs cells in sorted columns order */}
                    {metaOrder.map((colKey) => renderMetaCell(colKey, member, partyName, potGrade, isUnassigned))}

                    {/* Render 23 stats based on sorted group categories */}
                    {groupOrder.map((catKey) => {
                      const group = STAT_GROUPS.find(g => g.category === catKey);
                      if (!group) return null;
                      return group.stats.map((stat) => {
                        const val = member.stats?.[stat.key] ?? 0;
                        const ceilingKey = getCategoryForStat(stat.key);
                        const ceilingVal = member.categoryCeilings?.[ceilingKey] ?? 0;
                        const diff = ceilingVal - val;

                        const showDiff = diff > 0;
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
                          highlightStyle = "bg-indigo-505/10 text-indigo-300";
                        } else if (isPrimary) {
                          // Dark red background highlight for primary stats
                          highlightStyle = showDiff 
                            ? "bg-[#330c0e] text-red-300 group-hover:bg-[#4d1316]" 
                            : "bg-[#210809] text-red-500/35 group-hover:bg-[#330c0e]";
                        } else if (isSecondary) {
                          // Brown background highlight for secondary stats
                          highlightStyle = showDiff 
                            ? "bg-[#2b180a] text-[#f2ccb3] group-hover:bg-[#40240f]" 
                            : "bg-[#1c0f06] text-[#b3774d]/35 group-hover:bg-[#2b180a]";
                        } else {
                          // Standard background highlights
                          highlightStyle = showDiff 
                            ? "text-emerald-400 bg-emerald-500/5 group-hover:bg-emerald-500/10" 
                            : "text-slate-700 bg-black/10";
                        }

                        return (
                          <td 
                            key={stat.key} 
                            style={{ width: `${colWidths[stat.key]}px` }}
                            onClick={(e) => handleCellClick(member.id, stat.key, e)}
                            onDoubleClick={() => onSelectMember(member)}
                            className={`px-1 text-center border-r border-white/5 last:border-r-0 font-mono font-bold align-middle transition-all cursor-pointer ${highlightStyle}`}
                          >
                            {showDiff ? `+${diff}` : <span className="text-slate-800 font-extralight font-mono opacity-25">-</span>}
                          </td>
                        );
                      });
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* Spreadsheet Instructions & Custom Legend */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#0a0a0a] p-3 border border-white/5 rounded text-[11px] font-mono text-slate-400">
        <div className="flex flex-col gap-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded bg-emerald-500 inline-block shrink-0" />
            <span>Active remaining stat gaps are green: <code className="text-indigo-300">Ceiling - Current</code></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded bg-indigo-500 inline-block shrink-0" />
            <span>Interactive selections: 1-click on spreadsheet grids to highlight cells; double click headers to sort</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-slate-700 font-bold leading-none">-</span>
          <span>Dashes (-) are attributes already level maxed (limits exceeded)</span>
        </div>
        <div className="text-slate-500 text-[10px] text-right">
          Row-count: <strong className="text-indigo-400">
            {displayedRoster.length} matches{viewLimit !== "all" && ` (showing top ${viewLimit} of ${sortedAndFilteredRoster.length})`}
          </strong>. Select rows to edit specs.
        </div>
      </div>

    </div>
  );
};
