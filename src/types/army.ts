export type GamePhase = 'Command' | 'Movement' | 'Shooting' | 'Charge' | 'Fight';

export interface DetachmentBonus {
  validationKeys: string[];
  name: string;
  description: string;
  phase: GamePhase[];
}

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
  detachmentBonuses?: DetachmentBonus[];
}

type UnitRole =
  | 'HQ'
  | 'TROOPS'
  | 'ELITES'
  | 'FAST_ATTACK'
  | 'HEAVY_SUPPORT'
  | 'FLYER'
  | 'DEDICATED_TRANSPORT';

export interface Profile {
  name: string;
  stats: UnitStats;
  minQuantity: number; // e.g., 1 for a Sergeant, 4 for standard troops
  maxQuantity: number; // e.g., 1 for a Sergeant, 9 for standard troops
  equippedWeapons?: string[]; // Array of weapon IDs/Names assigned specifically to this profile
}

interface Unit {
  id: string;
  name: string;
  faction: string;
  role: UnitRole;
  basePoints: number; // Legacy fallback points
  pointsTiers?: { models: number; points: number }[]; // 10th edition tiered point costs based on total squad size
  stats: UnitStats; // Legacy fallback
  profiles?: Profile[]; // 10th edition explicit model profiles
  options: UnitOption[];
  weapons: Weapon[];
  abilities: (string | { name: string; description: string; phase?: GamePhase[] })[];
  detachmentBonuses?: DetachmentBonus[];
  selectedOptions?: string[]; // Array of selected option IDs (for army units)
  totalPoints?: number; // Base points + selected options (for army units)
  quantity?: number; // Legacy single-counter fallback
  composition?: Record<string, number>; // Dictionary mapping Profile name -> current active quantity
  isWarlord?: boolean; // Indicates if this unit is the army's Warlord (for army units)
}

export type { Unit, UnitRole, UnitStats, UnitOption, Weapon };
