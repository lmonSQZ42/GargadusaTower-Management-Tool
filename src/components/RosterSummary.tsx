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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* Guild Name Card (on the left of Total Adventurer!) */}
      <div id="summary-guild-name-card" className="bg-[#0f0f0f] border border-white/10 p-5 rounded-lg flex items-center justify-between shadow-md relative overflow-hidden group hover:border-[#F59E0B]/40 transition-colors">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#F59E0B] font-mono">Guild Name</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-lg sm:text-xl font-bold font-sans text-amber-100 truncate max-w-[280px]" title={guildName || "No Guild Loaded"}>
              {guildName || "---"}
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-500">
            {guildName ? "Extracted from source JSON" : "Upload JSON to display guild name"}
          </p>
        </div>
        <div className="p-3.5 bg-amber-500/10 rounded text-amber-400 z-10">
          <Shield className="w-5 h-5" />
        </div>
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
      </div>

      {/* Total Adventurer Card */}
      <div id="summary-total-explorers-card" className="bg-[#0f0f0f] border border-white/10 p-5 rounded-lg flex items-center justify-between shadow-md relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Total Adventurer</p>
          <div className="flex items-baseline space-x-2 border-l border-white/5 pl-2">
            <span className="text-3xl font-bold font-sans text-white">{totalCount}</span>
            <span className="text-xs font-mono text-slate-500">Adventurers Registered</span>
          </div>
        </div>
        <div className="p-3.5 bg-indigo-600/10 rounded text-indigo-400 z-10">
          <Users className="w-5 h-5" />
        </div>
        <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
      </div>

      {/* Average Current Potential Card */}
      <div id="summary-avg-potential-card" className="bg-[#0f0f0f] border border-white/10 p-5 rounded-lg flex items-center justify-between shadow-md relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Average Current Potential</p>
          <div className="flex items-baseline space-x-2 border-l border-white/5 pl-2">
            <span className="text-3xl font-bold font-sans text-emerald-400">
              {Math.round(avgCurrentPotential)}
            </span>
            <span className="text-xs font-mono text-slate-500">Avg Rating</span>
          </div>
        </div>
        <div className="p-3.5 bg-emerald-500/10 rounded text-emerald-400 z-10">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
      </div>
    </div>
  );
};
