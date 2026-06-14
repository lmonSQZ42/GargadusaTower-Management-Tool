import { RosterMember, ParseResult } from "./types";

/**
 * Robustly parses a roster string from a file using the logic adapted from extract.py
 */
export function extractRosterRobust(rawContent: string): ParseResult {
  // Try extracting guildName using regex fallback first
  let extractedGuildName: string | null = null;
  const guildNameRegex = /"guildName"\s*:\s*"([^"]+)"/;
  const match = guildNameRegex.exec(rawContent);
  if (match) {
    extractedGuildName = match[1];
  }

  // Try ATTEMPT 1: Clean and standard JSON parse
  try {
    const lines = rawContent.split(/\r?\n/);
    const cleanLines: string[] = [];
    
    for (const line of lines) {
      const stripped = line.trim();
      if (
        stripped.indexOf("---") === 0 || 
        stripped.includes("START OF FILE") || 
        stripped.includes("END OF FILE")
      ) {
        continue;
      }
      cleanLines.push(line);
    }
    
    let content = cleanLines.join("\n").trim();
    
    // Auto-wrap if it appears to be a raw dict fragment
    if (!content.startsWith("{") && !content.startsWith("[")) {
      content = `{${content}}`;
    }
    
    const parsed = JSON.parse(content);
    
    let rosterRaw: any = null;
    let guildName: string | null = extractedGuildName;
    if (parsed && typeof parsed === "object") {
      if (parsed.gameState && typeof parsed.gameState === "object" && Array.isArray(parsed.gameState.roster)) {
        rosterRaw = parsed.gameState.roster;
        if (parsed.gameState.guildName) {
          guildName = parsed.gameState.guildName;
        }
      } else if (Array.isArray(parsed.roster)) {
        rosterRaw = parsed.roster;
        if (parsed.guildName) {
          guildName = parsed.guildName;
        }
      } else if (Array.isArray(parsed)) {
        rosterRaw = parsed;
      }
    }
    
    if (Array.isArray(rosterRaw)) {
      return {
        fullData: parsed,
        roster: mapRawRosterToMembers(rosterRaw),
        guildName: guildName || extractedGuildName
      };
    }
  } catch (err) {
    // Attempt 1 failed, fall back to Attempt 2 bracket matching
    console.warn("Standard JSON parsing failed, falling back to bracket matching:", err);
  }

  // ATTEMPT 2: Fallback Bracket-Matching System
  const rosterMatch = /"roster"\s*:\s*\[/.exec(rawContent);
  if (rosterMatch) {
    const startIdx = rosterMatch.index + rosterMatch[0].length - 1; // Index of the opening '['
    let bracketCount = 0;
    let endIdx = -1;
    let inString = false;
    let escape = false;
 
    for (let i = startIdx; i < rawContent.length; i++) {
      const char = rawContent[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === "[") {
          bracketCount++;
        } else if (char === "]") {
          bracketCount--;
          if (bracketCount === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }

    if (endIdx !== -1) {
      let rosterStr = rawContent.slice(startIdx, endIdx + 1);
      
      // Clean up trailing commas before matching brackets, e.g. [1, 2, 3,] -> [1, 2, 3]
      // Replace instances like ,} or ,]
      rosterStr = rosterStr.replace(/,\s*([\]}])/g, "$1");
      
      try {
        const parsedRoster = JSON.parse(rosterStr);
        if (Array.isArray(parsedRoster)) {
          return {
            fullData: { roster: parsedRoster },
            roster: mapRawRosterToMembers(parsedRoster),
            guildName: extractedGuildName
          };
        }
      } catch (decodeErr) {
        throw new Error(`Extracted the roster block, but the data itself is corrupt: ${decodeErr}`);
      }
    }
  }

  throw new Error("Could not locate a valid 'roster' block in the file.");
}

/**
 * Converts raw JSON objects to typed RosterMembers with unique IDs
 */
function mapRawRosterToMembers(rawList: any[]): RosterMember[] {
  return rawList.map((item, index) => {
    const isPotString = typeof item.potential === "string";
    const potCeiling = Math.round(Number(item.potentialCeiling ?? (isPotString ? 60 : item.potential ?? 60)));
    const potential = isPotString ? potCeiling : Math.round(Number(item.potential ?? 50));

    // Support rounding all stats
    const roundedStats: any = {};
    if (item.stats && typeof item.stats === "object") {
      for (const [key, val] of Object.entries(item.stats)) {
        roundedStats[key] = Math.round(Number(val ?? 0));
      }
    }

    // Support rounding all ceilings
    const roundedCeilings: any = {};
    if (item.categoryCeilings && typeof item.categoryCeilings === "object") {
      for (const [key, val] of Object.entries(item.categoryCeilings)) {
        roundedCeilings[key] = Math.round(Number(val ?? 0));
      }
    }

    return {
      id: item.id || `uploaded_${index}_${Date.now()}`,
      name: item.name ?? "Unnamed Adventurer",
      type: item.type ?? "adventurer",
      class: item.class ?? "Unknown Class",
      classRarity: item.classRarity ?? item.rarity ?? "Common",
      level: Math.round(Number(item.level ?? 1)),
      age: Math.round(Number(item.age ?? 20)),
      potential,
      potentialCeiling: potCeiling,
      rawPotential: isPotString ? item.potential : undefined,
      classData: item.classData || null,
      roles: Array.isArray(item.roles) ? item.roles : [],
      retiredAt: item.retiredAt || null,
      categoryCeilings: roundedCeilings,
      stats: roundedStats
    };
  });
}

/**
 * Packages the updated RosterMembers back into the original file structure (wrapping or updating)
 */
export function repackageJson(originalFullData: any, updatedRoster: RosterMember[], currentGuildName?: string | null): string {
  // Convert RosterMembers back to the exact format needed by saving (stripping key 'id')
  const cleanRosterRaw = updatedRoster.map(m => {
    const { id, ...rest } = m;
    return rest;
  });

  if (originalFullData && typeof originalFullData === "object") {
    // We had a full structural object (e.g. { gameState: { roster: [...] } })
    const copy = JSON.parse(JSON.stringify(originalFullData));
    if (copy.gameState && typeof copy.gameState === "object") {
      copy.gameState.roster = cleanRosterRaw;
      if (currentGuildName) {
        copy.gameState.guildName = currentGuildName;
      }
    } else if (copy.roster) {
      copy.roster = cleanRosterRaw;
      if (currentGuildName) {
        copy.guildName = currentGuildName;
      }
    } else if (Array.isArray(copy)) {
      return JSON.stringify(cleanRosterRaw, null, 2);
    } else {
      copy.roster = cleanRosterRaw;
      if (currentGuildName) {
        copy.guildName = currentGuildName;
      }
    }
    return JSON.stringify(copy, null, 2);
  }

  // Fallback default wrapper:
  const outObj: any = {
    gameState: {
      roster: cleanRosterRaw
    }
  };
  if (currentGuildName) {
    outObj.gameState.guildName = currentGuildName;
  }
  return JSON.stringify(outObj, null, 2);
}
