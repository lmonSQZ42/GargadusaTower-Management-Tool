import { RosterMember } from "./types";

export const DEFAULT_ROSTER: RosterMember[] = [
  {
    id: "member_1",
    name: "Kaelen the Stalwart",
    type: "adventurer",
    class: "Landsknecht",
    classRarity: "Legendary",
    level: 42,
    age: 29,
    potential: 85,
    potentialCeiling: 95,
    roles: ["attacker", "defender"],
    retiredAt: null,
    categoryCeilings: {
      physical: 90,
      vitality: 85,
      mental: 60,
      social: 75,
      combat: 95,
      heroic: 85,
      arcane: 40
    },
    stats: {
      str: 88, dex: 72, spd: 65, agi: 70, con: 82,
      vit: 80, end: 83, dur: 84, rec: 55,
      int: 42, wis: 50, lck: 58,
      cha: 68, ldr: 74, tmw: 80, tru: 70, loy: 90,
      atk: 92, def: 81,
      hro: 82, sur: 78,
      arc: 15, res: 35
    }
  },
  {
    id: "member_2",
    name: "Selene Swiftbow",
    type: "adventurer",
    class: "Sniper",
    classRarity: "Epic",
    level: 35,
    age: 24,
    potential: 78,
    potentialCeiling: 88,
    roles: ["attacker", "disabler"],
    retiredAt: null,
    categoryCeilings: {
      physical: 85,
      vitality: 70,
      mental: 75,
      social: 65,
      combat: 85,
      heroic: 70,
      arcane: 50
    },
    stats: {
      str: 70, dex: 84, spd: 80, agi: 76, con: 60,
      vit: 62, end: 65, dur: 58, rec: 68,
      int: 55, wis: 68, lck: 72,
      cha: 58, ldr: 45, tmw: 70, tru: 60, loy: 82,
      atk: 82, def: 55,
      hro: 65, sur: 68,
      arc: 32, res: 40
    }
  },
  {
    id: "member_3",
    name: "Brutus Ironwall",
    type: "adventurer",
    class: "Fortress",
    classRarity: "Rare",
    level: 45,
    age: 34,
    potential: 72,
    potentialCeiling: 80,
    roles: ["defender"],
    retiredAt: null,
    categoryCeilings: {
      physical: 80,
      vitality: 95,
      mental: 65,
      social: 80,
      combat: 75,
      heroic: 90,
      arcane: 30
    },
    stats: {
      str: 75, dex: 54, spd: 45, agi: 50, con: 88,
      vit: 94, end: 92, dur: 95, rec: 70,
      int: 40, wis: 58, lck: 55,
      cha: 72, ldr: 85, tmw: 88, tru: 80, loy: 95,
      atk: 68, def: 92,
      hro: 85, sur: 82,
      arc: 10, res: 45
    }
  },
  {
    id: "member_4",
    name: "Alysia the Wise",
    type: "adventurer",
    class: "Runemaster",
    classRarity: "Epic",
    level: 38,
    age: 26,
    potential: 82,
    potentialCeiling: 92,
    roles: ["attacker"],
    retiredAt: null,
    categoryCeilings: {
      physical: 50,
      vitality: 65,
      mental: 95,
      social: 70,
      combat: 80,
      heroic: 75,
      arcane: 95
    },
    stats: {
      str: 42, dex: 60, spd: 68, agi: 62, con: 52,
      vit: 55, end: 58, dur: 50, rec: 72,
      int: 92, wis: 88, lck: 65,
      cha: 60, ldr: 55, tmw: 75, tru: 70, loy: 85,
      atk: 78, def: 48,
      hro: 70, sur: 60,
      arc: 94, res: 88
    }
  },
  {
    id: "member_5",
    name: "Fiona the Gentle",
    type: "adventurer",
    class: "Medic",
    classRarity: "Common",
    level: 30,
    age: 22,
    potential: 65,
    potentialCeiling: 75,
    roles: ["healer"],
    retiredAt: null,
    categoryCeilings: {
      physical: 55,
      vitality: 75,
      mental: 80,
      social: 85,
      combat: 50,
      heroic: 80,
      arcane: 70
    },
    stats: {
      str: 48, dex: 58, spd: 62, agi: 60, con: 64,
      vit: 72, end: 68, dur: 70, rec: 82,
      int: 74, wis: 78, lck: 70,
      cha: 82, ldr: 60, tmw: 92, tru: 85, loy: 90,
      atk: 45, def: 62,
      hro: 75, sur: 72,
      arc: 65, res: 75
    }
  },
  {
    id: "member_6",
    name: "Jorim Shadowstep",
    type: "adventurer",
    class: "Nightseeker",
    classRarity: "Rare",
    level: 28,
    age: 21,
    potential: 70,
    potentialCeiling: 82,
    roles: ["attacker", "disabler"],
    retiredAt: null,
    categoryCeilings: {
      physical: 88,
      vitality: 62,
      mental: 70,
      social: 55,
      combat: 80,
      heroic: 65,
      arcane: 45
    },
    stats: {
      str: 72, dex: 85, spd: 84, agi: 86, con: 55,
      vit: 58, end: 54, dur: 52, rec: 60,
      int: 50, wis: 55, lck: 78,
      cha: 52, ldr: 40, tmw: 65, tru: 45, loy: 75,
      atk: 76, def: 50,
      hro: 58, sur: 66,
      arc: 25, res: 35
    }
  },
  {
    id: "member_7",
    name: "Garrick the Elder",
    type: "adventurer",
    class: "Vanguard",
    classRarity: "Epic",
    level: 55,
    age: 56,
    potential: 80,
    potentialCeiling: 85,
    roles: ["attacker"],
    retiredAt: { age: 52 }, // Filter Rule 2: retiredAt has age key!
    categoryCeilings: {
      physical: 75,
      vitality: 80,
      mental: 75,
      social: 88,
      combat: 85,
      heroic: 85,
      arcane: 50
    },
    stats: {
      str: 70, dex: 68, spd: 55, agi: 60, con: 74,
      vit: 75, end: 78, dur: 76, rec: 65,
      int: 68, wis: 74, lck: 68,
      cha: 84, ldr: 86, tmw: 80, tru: 75, loy: 88,
      atk: 82, def: 75,
      hro: 80, sur: 82,
      arc: 35, res: 48
    }
  },
  {
    id: "member_8",
    name: "Town Shopkeeper Hugo",
    type: "npc", // Filter Rule 1: type != "adventurer"
    class: "Shopkeeper",
    classRarity: "Common",
    level: 12,
    age: 48,
    potential: 30,
    potentialCeiling: 45,
    roles: [],
    retiredAt: null,
    categoryCeilings: {
      physical: 50,
      vitality: 50,
      mental: 60,
      social: 90,
      combat: 30,
      heroic: 40,
      arcane: 30
    },
    stats: {
      str: 40, dex: 45, spd: 40, agi: 35, con: 48,
      vit: 45, end: 48, dur: 45, rec: 55,
      int: 58, wis: 60, lck: 65,
      cha: 88, ldr: 72, tmw: 60, tru: 80, loy: 85,
      atk: 25, def: 35,
      hro: 30, sur: 35,
      arc: 12, res: 28
    }
  }
];
