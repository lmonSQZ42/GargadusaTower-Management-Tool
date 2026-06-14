import React from "react";
import { RosterMember, Stats } from "../types";
import { TrendingUp, Trophy, Award, HelpCircle } from "lucide-react";

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

interface Top10PotentialProps {
  roster: RosterMember[];
  onSelectMember: (member: RosterMember) => void;
  onClose?: () => void;
}

export const Top10Potential: React.FC<Top10PotentialProps> = ({
  roster,
  onSelectMember,
  onClose,
}) => {
  // Canonical list of the 23 stats to average for "current potential"
  const STAT_KEYS: (keyof Stats)[] = [
    "str", "dex", "spd", "agi", "con",
    "vit", "end", "dur", "rec",
    "int", "wis", "lck",
    "cha", "ldr", "tmw", "tru", "loy",
    "atk", "def",
    "hro", "sur",
    "arc", "res"
  ];

  // Helper to calculate current potential (average of 23 stats)
  const calculateCurrentPotential = (member: RosterMember): number => {
    const stats = member.stats || {};
    const sum = STAT_KEYS.reduce((acc, key) => acc + (stats[key] ?? 0), 0);
    return STAT_KEYS.length > 0 ? sum / STAT_KEYS.length : 0;
  };

  // Process roster and compute deltas
  const rankedMembers = roster
    .map((member) => {
      const currentPotential = calculateCurrentPotential(member);
      const potentialCeiling = member.potentialCeiling ?? 0;
      const difference = potentialCeiling - currentPotential;
      
      return {
        member,
        currentPotential,
        potentialCeiling,
        difference,
      };
    })
    // Sort by difference descending
    .sort((a, b) => b.difference - a.difference)
    // Take Top 10
    .slice(0, 10);

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-lg p-4 sm:p-6 shadow-xl space-y-5 font-sans">
      
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">
              Top 10 Growth Potential Leaders
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Identifies adventurers with the largest gap between their <span className="text-indigo-300 font-semibold">Potential Ceiling</span> and their <span className="text-indigo-400 font-semibold">Current Potential</span> (calculated as the average of the 23 active stats: STR, DEX, SPD, AGI, CON, VIT, END, DUR, REC, INT, WIS, LCK, CHA, LDR, TMW, TRU, LOY, ATK, DEF, HRO, SUR, ARC, RES).
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 hover:text-white text-slate-300 border border-white/10 hover:border-white/20 rounded transition-colors cursor-pointer shrink-0"
          >
            Back to Sandbox
          </button>
        )}
      </div>

      {rankedMembers.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/5 rounded-lg bg-black/20">
          <HelpCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No adventurer profiles detected. Populate the roster map first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Legend header row for table feel */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Adventurer & Specifications</div>
            <div className="col-span-2 text-center font-bold">Untapped Delta</div>
            <div className="col-span-1 text-center font-bold">CURRENT OVR</div>
            <div className="col-span-1 text-center font-bold">Ceiling</div>
            <div className="col-span-3 text-center font-bold">Growth Progress Track</div>
          </div>

          <div className="space-y-3">
            {rankedMembers.map(({ member, currentPotential, potentialCeiling, difference }, idx) => {
              const rank = idx + 1;
              const formattedCurrent = Math.round(currentPotential).toString();
              const formattedCeiling = Math.round(potentialCeiling).toString();
              const formattedDiff = Math.round(difference).toString();

              const currentPercent = Math.min(100, Math.max(0, currentPotential));
              const ceilingPercent = Math.min(100, Math.max(0, potentialCeiling));
              const differencePercent = Math.min(100, Math.max(0, difference));

              const rankColorClass = 
                rank === 1 ? "bg-amber-400/10 text-amber-400 border-amber-500/30" :
                rank === 2 ? "bg-slate-300/10 text-slate-300 border-slate-400/20" :
                rank === 3 ? "bg-amber-700/10 text-amber-600 border-amber-800/20" :
                "bg-white/5 text-slate-400 border-white/5";

              const medalIcon = 
                rank === 1 ? "🥇" :
                rank === 2 ? "🥈" :
                rank === 3 ? "🥉" :
                `#${rank}`;

              return (
                <div
                  key={member.id}
                  className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center transition-all group shadow-md hover:border-white/10"
                >
                  {/* Rank Cell */}
                  <div className="col-span-1 flex items-center space-x-2 md:space-x-0">
                    <span className={`w-8 h-8 rounded-full border text-xs font-mono font-bold flex items-center justify-center shrink-0 ${rankColorClass}`}>
                       {medalIcon}
                    </span>
                    <span className="text-xs font-bold text-slate-400 md:hidden uppercase tracking-wider">
                      Rank {rank} Adventurer
                    </span>
                  </div>

                  {/* Character Identity Cell */}
                  <div className="col-span-1 md:col-span-4 min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 transition-colors truncate text-sm sm:text-base">
                        {member.name}
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono font-semibold">
                        Lv.{member.level}
                      </span>
                      {member.potential !== undefined && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/15 px-1.5 py-0.2 rounded font-mono font-bold">
                          POT: {getPotentialGrade(member.potential, member.rawPotential)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                      {member.class && (
                        <span className="text-indigo-350 font-mono italic">
                          {member.class}
                        </span>
                      )}
                      {member.roles && member.roles.length > 0 && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="bg-white/5 border border-white/10 px-1.5 py-0.2 rounded text-[10px] uppercase font-mono tracking-wider font-bold">
                            {member.roles.join(", ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Difference Potential Cell (Merged with Untapped Delta) */}
                  <div className="col-span-1 md:col-span-2 text-left md:text-center flex md:flex-col items-center md:items-center justify-between md:justify-center gap-2">
                    <div className="text-[10px] text-slate-500 font-mono uppercase block md:hidden">Untapped Delta</div>
                    <span className="text-emerald-400 font-black font-mono text-xs sm:text-sm flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      +{formattedDiff}
                    </span>
                  </div>

                  {/* Current OVR Cell */}
                  <div className="col-span-1 text-left md:text-center">
                    <div className="text-[10px] text-slate-500 font-mono uppercase block md:hidden">Current OVR</div>
                    <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                      {formattedCurrent}
                    </span>
                  </div>

                  {/* Ceiling Potential Cell */}
                  <div className="col-span-1 text-left md:text-center">
                    <div className="text-[10px] text-slate-500 font-mono uppercase block md:hidden">Potential Ceiling</div>
                    <span className="font-mono font-bold text-slate-100 text-xs sm:text-sm">
                      {formattedCeiling}
                    </span>
                  </div>

                  {/* Progression Visual Bar Gauge */}
                  <div className="col-span-1 md:col-span-3 space-y-1">
                    <div className="text-[10px] text-slate-500 font-mono uppercase block md:hidden">Growth Track Progression</div>
                    <div className="w-full bg-[#151515] h-3 rounded overflow-hidden flex border border-white/5">
                      {/* Fully trained portion */}
                      <div 
                        style={{ width: `${currentPercent}%` }} 
                        className="bg-indigo-600/75 h-full transition-all duration-300"
                      />
                      {/* Untapped growth delta gap */}
                      <div 
                        style={{ width: `${differencePercent}%` }} 
                        className="bg-emerald-500/30 h-full border-l border-dashed border-emerald-400/50 transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                      <span>Base {formattedCurrent}</span>
                      <span>Ceiling {formattedCeiling}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inline info card */}
      <div className="bg-[#151515]/40 border border-white/5 rounded-lg p-3.5 text-xs text-slate-400 space-y-1 leading-relaxed">
        <div className="flex items-center space-x-1.5 text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
          <Award className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Strategic Guild Insights & Roster Guidance</span>
        </div>
        <p>
          Adventurers listed above possess massive latent power and high ceilings relative to their current basic statistics. We highly recommend adding training routines to increase their base attribute metrics or focus on enlisting them in <b>Tactical Parties</b> to bridge this growth deficit in real-world labyrinth excursions!
        </p>
      </div>

    </div>
  );
};
