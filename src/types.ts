export interface CategoryCeilings {
  physical?: number;
  vitality?: number;
  mental?: number;
  social?: number;
  combat?: number;
  heroic?: number;
  arcane?: number;
}

export interface Stats {
  // Physical
  str?: number;
  dex?: number;
  spd?: number;
  agi?: number;
  con?: number;

  // Vitality
  vit?: number;
  end?: number;
  dur?: number;
  rec?: number;

  // Mental
  int?: number;
  wis?: number;
  lck?: number;

  // Social
  cha?: number;
  ldr?: number;
  tmw?: number;
  tru?: number;
  loy?: number;

  // Combat
  atk?: number;
  def?: number;

  // Heroic
  hro?: number;
  sur?: number;

  // Arcane
  arc?: number;
  res?: number;
}

export interface RetiredAt {
  age?: number;
}

export interface RosterMember {
  id: string; // Internal React key to safely track edits/additions
  name?: string;
  type?: string;
  class?: string;
  classRarity?: string;
  level?: number;
  age?: number;
  potential?: number;
  potentialCeiling?: number;
  rawPotential?: string; // Original untransformed string if string based (e.g. "D-Tier")
  classData?: any; // Nested class specifications (primary/secondary stats)
  roles?: string[];
  retiredAt?: RetiredAt | null;
  categoryCeilings?: CategoryCeilings;
  stats?: Stats;
}

// Struct to store a full parsed file state if the user uploaded one
export interface ParseResult {
  fullData?: any; // The whole JSON parsed, so we can preserve it when downloaded
  roster: RosterMember[];
  guildName?: string | null;
}

export interface Party {
  id: string;
  name: string;
  memberIds: string[]; // up to 5 members
  hasCrown?: boolean;
  leaderId?: string | null;
}
