import React from "react";
import { RosterMember } from "../types";
import { Users, Sparkles, Shield } from "lucide-react";

interface RosterSummaryProps {
  roster: RosterMember[];
  guildName: string | null;
}

export const RosterSummary: React.FC<RosterSummaryProps> = ({ roster, guildName }) => {
  const totalCount = roster.length;

  const avgCurrentPotential = totalCount > 0
    ? roster.reduce((acc, m) => acc + (m.potential || 0), 0) / totalCount
    : 0;

  return (
    <div id="roster-compact-summary-row" className="bg-[#0b0b0b] border border-white/10 rounded-lg p-3 flex flex-col gap-2.5 shadow-md min-w-[280px]">
      {/* Top Part: Guild Name */}
      <div className="flex items-center gap-2 min-w-0 border-b border-white/5 pb-1.5 w-full justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-black">GUILD</span>
        </div>
        <span className="text-sm font-black text-amber-100 truncate max-w-[180px] text-right" title={guildName || "No Guild Loaded"}>
          {guildName || "---"}
        </span>
      </div>

      {/* Bottom Part: Guild Member & Avg Potential side-by-side */}
      <div className="flex items-center justify-between gap-5">
        {/* Guild Member Segment */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-black mr-1">MEMBERS:</span>
          <span className="text-sm font-black text-white">
            {totalCount}
          </span>
        </div>

        {/* Avg Potential Segment */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-black mr-1">AVERAGE OVR:</span>
          <span className="text-sm font-black text-emerald-400">
            {Math.round(avgCurrentPotential)}
          </span>
        </div>
      </div>
    </div>
  );
};

