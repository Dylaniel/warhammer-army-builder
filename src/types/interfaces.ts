type UnitRole =
  | 'HQ'
  | 'TROOPS'
  | 'ELITES'
  | 'FAST_ATTACK'
  | 'HEAVY_SUPPORT'
  | 'FLYER'
  | 'DEDICATED_TRANSPORT'; // possibly need more, need to check rule books

interface UnitStats {
  movement: number;
  toughness: number;
  save: number;
  wounds: number;
  leadership: number;
  objectiveControl: number;
  // possibly need more, need to check rule books
}

interface UnitOption {
  id: string;
  name: string;
  points: number;
  // possibly need more, need to check rule books
}

interface DetachmentRestriction {
  type: string;
  min: number;
  max: number;
  // possibly need more, need to check rule books
}

interface ArmyList {
  id: string;
  name: string;
  faction: string;
  edition: string;
  points: number;
  detachments: Detachment[];
  created: Date;
  updated: Date;
  userId: string;
  // possibly need more, need to check rule books
}

interface Unit {
  id: string;
  name: string;
  role: UnitRole;
  basePoints: number;
  stats: UnitStats;
  options: UnitOption[];
  abilities: string[];
  // possibly need more, need to check rule books
}

interface Detachment {
  id: string;
  type: string;
  units: Unit[];
  restrictions: DetachmentRestriction[];
  // possibly need more, need to check rule books
}
