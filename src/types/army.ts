export interface Army {
  armyName: string;
  faction: string;
  detachment: string;
  points: number;
}

interface UnitStats {
  movement: number;
  toughness: number;
  save: number;
  wounds: number;
  leadership: number;
  objectiveControl: number;
}

interface UnitOption {
  id: string;
  name: string;
  points: number;
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
  role: UnitRole;
  basePoints: number;
  stats: UnitStats;
  options: UnitOption[];
  abilities: string[];
}