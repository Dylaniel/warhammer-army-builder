type UnitRole = 'HQ' | 'TROOPS' | 'ELITES' | 'FAST_ATTACK' | 'HEAVY_SUPPORT' | 'FLYER' | 'DEDICATED_TRANSPORT';

interface UnitStats {
  movement: number;
  toughness: number;
  save: number;
  wounds: number;
  leadership: number;
  objectiveControl: number;
  // ... other stats
}

interface UnitOption {
  id: string;
  name: string;
  points: number;
  // ... other option properties
}

interface DetachmentRestriction {
  type: string;
  min: number;
  max: number;
  // ... other restriction properties
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
  }
  
  interface Unit {
    id: string;
    name: string;
    role: UnitRole;
    basePoints: number;
    stats: UnitStats;
    options: UnitOption[];
    abilities: string[];
  }
  
  interface Detachment {
    id: string;
    type: string;
    units: Unit[];
    restrictions: DetachmentRestriction[];
  }