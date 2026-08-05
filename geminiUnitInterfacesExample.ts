export interface UnitStats {
  m: string;
  t: string;
  sv: string;
  w: string;
  ld: string;
  oc: string;
}

export interface Ability {
  name: string;
  description: string;
}

export interface WargearOption {
  id: string;
  description: string;      // e.g., "Replace bolt rifle with power fist"
  exclusiveWith?: string[]; // Prevents conflicting selections
}

export interface ModelGroup {
  id: string;               // e.g., "infernus-sergeant"
  name: string;             // e.g., "Infernus Sergeant"
  category: 'leader' | 'follower'; // Explicitly distinguishes leader vs base minis
  stats: UnitStats;
  minQuantity: number;      // e.g., 1 (for sergeant) or 4 (for base marines)
  maxQuantity: number;      // e.g., 1 (for sergeant) or 9 (for base marines)
  
  // Wargear options specific *only* to this specific model type
  availableOptions: WargearOption[];
  equippedWargear: string[]; // Selected loadout IDs for this group
}

export interface UnitPointTier {
  composition: Record<string, number>; // Maps modelGroup id to count (e.g., { "infernus-sergeant": 1, "infernus-marine": 4 })
  points: number;                      // Total points for this exact configuration (e.g., 85)
}

export interface Unit {
  id: string;
  datasheetId: string;
  name: string;             // e.g., "Infernus Squad"
  faction: string;
  role: string;
  
  // The grouped components broken down by miniature type
  modelGroups: Record<string, ModelGroup>; 
  
  // Live user selections tracking current counts
  composition: Record<string, number>;     // e.g., { "infernus-sergeant": 1, "infernus-marine": 4 }
  
  pointTiers: UnitPointTier[];
  abilities: Ability[];
}