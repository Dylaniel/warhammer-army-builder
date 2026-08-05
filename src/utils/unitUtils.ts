import { Unit, UnitOption, UnitStats } from '../types/army';
import unitsData from '../data/units.json';

/**
 * Official supported factions for dropdowns and lazy loading
 */
export const SUPPORTED_FACTIONS = [
  'Space Marines',
  'Adepta Sororitas',
  'Adeptus Custodes',
  'Adeptus Mechanicus',
  'Aeldari',
  'Agents of the Imperium',
  'Astra Militarum',
  'Black Templars',
  'Blood Angels',
  'Chaos Daemons',
  'Chaos Knights',
  'Chaos Space Marines',
  'Dark Angels',
  'Death Guard',
  'Deathwatch',
  'Drukhari',
  'Genestealer Cults',
  'Grey Knights',
  'Imperial Knights',
  'Leagues of Votann',
  'Necrons',
  'Orks',
  'Space Wolves',
  "T'au Empire",
  'Thousand Sons',
  'Tyranids',
  'World Eaters',
];

/**
 * Get all available generic units (from units.json)
 */
export const getAllUnits = (): Unit[] => {
  return unitsData as Unit[];
};

/**
 * Get units by role
 */
export const getUnitsByRole = (role: Unit['role']): Unit[] => {
  return getAllUnits().filter((unit) => unit.role === role);
};

/**
 * Find a specific unit by ID
 */
export const getUnitById = (id: string): Unit | undefined => {
  return getAllUnits().find((unit) => unit.id === id);
};

/**
 * Determine whether two model-group composition maps represent the same
 * configuration. Zero-count entries are treated as absent so callers don't
 * need to worry about whether zeros are included explicitly.
 */
const compositionsMatch = (a: Record<string, number>, b: Record<string, number>): boolean => {
  const normalize = (map: Record<string, number>): [string, number][] =>
    Object.entries(map)
      .filter(([, count]) => count > 0)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  const normA = normalize(a);
  const normB = normalize(b);
  if (normA.length !== normB.length) return false;
  return normA.every(([key, count], idx) => normB[idx][0] === key && normB[idx][1] === count);
};

/**
 * Normalize a (possibly stale or legacy) composition map against a unit's
 * current `modelGroups`. Armies persisted in localStorage before Task 6.4
 * may carry a `composition` keyed by legacy Profile *name* rather than
 * ModelGroup id, or reference groups that no longer exist. Unknown keys are
 * dropped and missing groups are filled in at their `minQuantity` so the
 * app can never crash on load. Returns `{}` when the unit has no
 * `modelGroups` (legacy/unmigrated data).
 */
export const normalizeModelGroupComposition = (
  unit: Unit,
  composition: Record<string, number> | undefined
): Record<string, number> => {
  const groups = unit.modelGroups;
  if (!groups) return {};

  const normalized: Record<string, number> = {};
  for (const groupId of Object.keys(groups)) {
    const group = groups[groupId];
    const raw = composition ? composition[groupId] : undefined;
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : group.minQuantity;
    normalized[groupId] = Math.max(group.minQuantity, Math.min(group.maxQuantity, value));
  }
  return normalized;
};

/**
 * Resolve the total points for a unit's current model-group composition
 * against its `pointTiers` (Task 6.4 schema). Falls back to the lowest
 * defined tier if no exact match exists (e.g. a composition outside
 * currently-migrated data) rather than guessing a formula.
 */
export const resolveModelGroupPoints = (
  unit: Unit,
  composition: Record<string, number>
): number => {
  if (!unit.pointTiers || unit.pointTiers.length === 0) {
    return unit.basePoints;
  }

  const match = unit.pointTiers.find((tier) => compositionsMatch(tier.composition, composition));
  return match ? match.points : unit.pointTiers[0].points;
};

/**
 * Resolve a representative statline for display purposes (e.g. the
 * unit-picker preview stat block). Prefers the first `leader` model group,
 * then the first defined model group, then falls back to legacy
 * `profiles`/`stats` so unmigrated or malformed data can never crash the UI.
 */
export const getDisplayStats = (unit: Unit): UnitStats => {
  const groups = unit.modelGroups ? Object.values(unit.modelGroups) : [];
  if (groups.length > 0) {
    const leader = groups.find((g) => g.category === 'leader');
    return (leader || groups[0]).stats;
  }
  if (unit.profiles && unit.profiles.length > 0) {
    return unit.profiles[0].stats;
  }
  return unit.stats;
};

/**
 * Build a human-readable "1x Sergeant, 4x Marine" summary of a unit's
 * current composition, resolving each key against `modelGroups` (falling
 * back to legacy `composition`/`quantity` for unmigrated data).
 */
export const describeUnitComposition = (unit: Unit): string => {
  if (unit.modelGroups && Object.keys(unit.modelGroups).length > 0) {
    const composition = normalizeModelGroupComposition(unit, unit.composition);
    const parts = Object.entries(composition)
      .filter(([, count]) => count > 0)
      .map(([groupId, count]) => `${count}x ${unit.modelGroups?.[groupId]?.name ?? groupId}`);
    if (parts.length > 0) return parts.join(', ');
  }

  if (unit.composition && Object.keys(unit.composition).length > 0) {
    return Object.entries(unit.composition)
      .map(([name, count]) => `${count}x ${name}`)
      .join(', ');
  }

  return `${unit.quantity || 1}x ${unit.name} Models`;
};

/**
 * Calculate total points for a unit with selected options
 */
export const calculateUnitPoints = (unit: Unit, selectedOptionIds: string[] = []): number => {
  const optionPoints = selectedOptionIds.reduce((total, optionId) => {
    const option = unit.options.find((opt) => opt.id === optionId);
    return total + (option?.points || 0);
  }, 0);

  let baseCost = unit.basePoints;

  if (unit.modelGroups && Object.keys(unit.modelGroups).length > 0) {
    // Task 6.4 schema: resolve points from the per-model-group composition.
    const composition = normalizeModelGroupComposition(unit, unit.composition);
    baseCost = resolveModelGroupPoints(unit, composition);
  } else if (unit.pointsTiers && unit.pointsTiers.length > 0) {
    // Legacy 10th edition tiered point costing based on total models in the unit.
    let totalModels = 0;
    if (unit.composition && Object.keys(unit.composition).length > 0) {
      totalModels = Object.values(unit.composition).reduce((a, b) => a + b, 0);
    } else if (unit.quantity) {
      totalModels = unit.quantity;
    } else if (unit.profiles) {
      totalModels = unit.profiles.reduce((sum, p) => sum + p.minQuantity, 0);
    } else {
      totalModels = 1;
    }

    // Sort tiers by models ascending
    const sortedTiers = [...unit.pointsTiers].sort((a, b) => a.models - b.models);

    // Find the tier that accommodates the total models
    const applicableTier = sortedTiers.find((tier) => totalModels <= tier.models);

    // If we exceed the max tier, use the highest tier cost (or a custom formula, but typically max tier)
    if (applicableTier) {
      baseCost = applicableTier.points;
    } else {
      baseCost = sortedTiers[sortedTiers.length - 1].points;
    }
  }

  return baseCost + optionPoints;
};

/**
 * Get selected options for a unit
 */
export const getSelectedOptions = (unit: Unit, selectedOptionIds: string[]): UnitOption[] => {
  return unit.options.filter((option) => selectedOptionIds.includes(option.id));
};

/**
 * Monotonic counter mixed into generated ids so multiple ids requested
 * within the same millisecond (e.g. rapid-click "Add"/"Duplicate") never
 * collide, even though `Date.now()` alone has only millisecond resolution.
 */
let uniqueIdCounter = 0;

const nextUniqueSuffix = (): string => {
  uniqueIdCounter = (uniqueIdCounter + 1) % 1_000_000;
  return `${Date.now()}-${uniqueIdCounter}`;
};

/**
 * Strip a previously-appended uniqueness suffix (as produced by
 * `nextUniqueSuffix`/`generateArmyUnitId`) from an id, so re-duplicating an
 * already-instantiated army unit doesn't accumulate suffixes and the
 * readable base id (e.g. "captain-in-gravis-armour") is preserved rather
 * than collapsed to its first hyphen segment.
 */
const stripUniqueSuffix = (id: string): string => id.replace(/-\d{10,}(-\d+)?$/, '');

/**
 * Generate a globally-unique id for an army-unit instance derived from a
 * catalog unit id. Preserves the full base id (only trimming a prior
 * uniqueness suffix if one is already present) and appends a fresh
 * collision-resistant token, so this stays safe to call many times in a
 * single millisecond (e.g. rapid-click duplication).
 */
export const generateArmyUnitId = (baseUnitId: string): string => {
  return `${stripUniqueSuffix(baseUnitId)}-${nextUniqueSuffix()}`;
};

/**
 * Create an army unit from a base unit with selected options
 */
export const createArmyUnit = (
  unit: Unit,
  selectedOptionIds: string[] = [],
  quantity: number = 1
): Unit => {
  // Task 6.4 schema: seed composition at each model group's minQuantity so
  // points resolve correctly the moment the unit is added, before the user
  // touches any counters.
  const initialComposition = unit.modelGroups
    ? normalizeModelGroupComposition(unit, undefined)
    : unit.composition;

  const unitWithComposition: Unit = { ...unit, composition: initialComposition };
  const totalPoints = calculateUnitPoints(unitWithComposition, selectedOptionIds);

  return {
    ...unitWithComposition,
    id: generateArmyUnitId(unit.id), // Generate unique ID
    selectedOptions: selectedOptionIds,
    totalPoints,
    quantity,
  };
};

/**
 * Validate if selected options are valid for a unit
 */
export const validateUnitOptions = (unit: Unit, selectedOptionIds: string[]): boolean => {
  return selectedOptionIds.every((optionId) =>
    unit.options.some((option) => option.id === optionId)
  );
};

/**
 * Get total points for an army
 */
export const calculateArmyPoints = (armyUnits: Unit[]): number => {
  return armyUnits.reduce((total, armyUnit) => {
    return total + (armyUnit.totalPoints || armyUnit.basePoints);
  }, 0);
};
