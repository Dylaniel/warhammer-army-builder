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

/**
 * @deprecated Legacy per-profile schema retained for history (pre Task 6.4).
 * No unit in src/data/factions-v2 populates this at runtime. Superseded by
 * `ModelGroup` / `UnitPointTier`. Kept in the codebase intentionally so the
 * migration path and prior data shape remain visible.
 */
export interface Profile {
  name: string;
  stats: UnitStats;
  minQuantity: number; // e.g., 1 for a Sergeant, 4 for standard troops
  maxQuantity: number; // e.g., 1 for a Sergeant, 9 for standard troops
  equippedWeapons?: string[]; // Array of weapon IDs/Names assigned specifically to this profile
}

/**
 * A single wargear swap/addition available to a specific ModelGroup.
 */
export interface WargearOption {
  id: string;
  description: string; // e.g., "Replace bolt rifle with power fist"
  exclusiveWith?: string[]; // Prevents conflicting selections
}

/**
 * One distinct model type within a Unit (e.g. "Infernus Sergeant" vs
 * "Infernus Marine"). A Unit is composed of one or more ModelGroups.
 * This is the 10th-edition-accurate replacement for the legacy `Profile`.
 */
export interface ModelGroup {
  id: string; // kebab-case, unique within the unit, e.g. "infernus-sergeant"
  name: string; // e.g., "Infernus Sergeant"
  category: 'leader' | 'follower'; // Explicitly distinguishes leader vs base minis
  stats: UnitStats;
  minQuantity: number; // e.g., 1 (for sergeant) or 4 (for base marines)
  maxQuantity: number; // e.g., 1 (for sergeant) or 9 (for base marines)
  availableOptions: WargearOption[]; // Wargear options specific to this model type; [] valid, never omit
  equippedWargear: string[]; // Selected loadout IDs for this group; [] valid, never omit
}

/**
 * A valid combination of ModelGroup counts and the total points cost for
 * that exact configuration. Points in 10th edition are strictly tier-based
 * by total composition, never computed per-model.
 */
export interface UnitPointTier {
  composition: Record<string, number>; // Maps modelGroup id to count
  points: number; // Total points for this exact configuration
}

interface Unit {
  id: string;
  name: string;
  faction: string;
  role: UnitRole;
  basePoints: number; // Legacy fallback points
  /**
   * @deprecated Legacy tiered points keyed by raw model count. Superseded by
   * `pointTiers` (keyed by per-ModelGroup composition). Retained for history.
   */
  pointsTiers?: { models: number; points: number }[];
  /**
   * @deprecated Legacy flat statline fallback, used only when `modelGroups`
   * is absent. Superseded by per-ModelGroup `stats`.
   */
  stats: UnitStats;
  /**
   * @deprecated 10th edition explicit model profiles, superseded by
   * `modelGroups`. No production data populates this field anymore.
   */
  profiles?: Profile[];
  options: UnitOption[];
  weapons: Weapon[];
  abilities: (string | { name: string; description: string; phase?: GamePhase[] })[];
  detachmentBonuses?: DetachmentBonus[];
  selectedOptions?: string[]; // Array of selected option IDs (for army units)
  totalPoints?: number; // Base points + selected options (for army units)
  quantity?: number; // Legacy single-counter fallback
  /**
   * @deprecated Legacy composition keyed by Profile `name`. Superseded by
   * the `composition` semantics implied by `pointTiers` (keyed by
   * ModelGroup id). Armies persisted before Task 6.4 may still have this
   * shape in `localStorage`; consumers must normalize defensively.
   */
  composition?: Record<string, number>; // Dictionary mapping Profile name -> current active quantity
  isWarlord?: boolean; // Indicates if this unit is the army's Warlord (for army units)

  // --- Task 6.4 schema: per-model-group composition ---
  modelGroups?: Record<string, ModelGroup>; // Distinct model types making up this unit, keyed by ModelGroup id
  pointTiers?: UnitPointTier[]; // Valid ModelGroup-count combinations and their total points
}

export type { Unit, UnitRole, UnitStats, UnitOption, Weapon };
