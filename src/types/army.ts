export interface Army {
  armyName: string;
  faction: string;
  detachment: string;
  points: number;
  characters: Unit[]; // HQ units
  battleline: Unit[]; // TROOPS units
  dedicatedTransports: Unit[]; // DEDICATED_TRANSPORT units
  otherDatasheets: Unit[]; // ELITES and other units
  alliedUnits: Unit[]; // Allied units
}

interface UnitStats {
  movement: number;
  toughness: number;
  save: number | string; // Can be 3 or "3+" for roll requirements
  wounds: number;
  leadership: number | string; // Can be 7 or "7+" for roll requirements
  objectiveControl: number;
}

interface UnitOption {
  id: string;
  name: string;
  points: number;
}

interface Weapon {
  id: string;
  name: string;
  type: 'Pistol' | 'Assault' | 'Rapid Fire' | 'Heavy' | 'Melee' | 'Grenade';
  range: number | 'Melee';
  attacks: number | string; // Can be "D6", "2D6", etc.
  ballisticSkill?: number; // For ranged weapons
  weaponSkill?: number; // For melee weapons
  strength: number;
  armourPenetration: number;
  damage: number | string; // Can be "D3", "D6", etc.
  abilities: string[];
}

type UnitRole =
  | 'HQ'
  | 'TROOPS'
  | 'ELITES'
  | 'FAST_ATTACK'
  | 'HEAVY_SUPPORT'
  | 'FLYER'
  | 'DEDICATED_TRANSPORT';

interface Unit {
  id: string;
  name: string;
  faction: string;
  role: UnitRole;
  basePoints: number;
  stats: UnitStats;
  options: UnitOption[];
  weapons: Weapon[];
  abilities: string[];
  selectedOptions?: string[]; // Array of selected option IDs (for army units)
  totalPoints?: number; // Base points + selected options (for army units)
  quantity?: number; // For units that can have multiple models (for army units)
}

export type { Unit, UnitRole, UnitStats, UnitOption, Weapon };