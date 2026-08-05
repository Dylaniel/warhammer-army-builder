import { Army, Unit, UnitOption, UnitStats } from '../types/army';
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
 * dropped and missing groups are filled in at a sensible default so the
 * app can never crash on load. Returns `{}` when the unit has no
 * `modelGroups` (legacy/unmigrated data).
 */
export const normalizeModelGroupComposition = (
  unit: Unit,
  composition: Record<string, number> | undefined
): Record<string, number> => {
  const groups = unit.modelGroups;
  if (!groups) return {};

  // Some generated datasheets are composed entirely of interchangeable
  // weapon-loadout variants with no single mandatory "leader" group — e.g.
  // Necron Warriors has two follower groups (gauss flayer / gauss reaper)
  // that each independently allow `minQuantity: 0`, even though the unit
  // itself always fields 10+ models per its cheapest `pointTiers` entry.
  // Seeding a fresh composition purely from `minQuantity` in that case
  // yields an all-zero composition — wrong (the unit isn't free) and
  // unusable (nothing to decrement from). When every group's minimum is 0,
  // fall back to the cheapest defined tier's composition as the default
  // instead. This only affects filling in *missing* keys (a group absent
  // from `composition`), never a key the caller explicitly set to 0.
  const allMinsZero = Object.values(groups).every((g) => g.minQuantity === 0);
  const cheapestTierComposition =
    allMinsZero && unit.pointTiers && unit.pointTiers.length > 0
      ? [...unit.pointTiers].sort((a, b) => a.points - b.points)[0].composition
      : undefined;

  const normalized: Record<string, number> = {};
  for (const groupId of Object.keys(groups)) {
    const group = groups[groupId];
    const raw = composition ? composition[groupId] : undefined;
    const defaultValue = cheapestTierComposition?.[groupId] ?? group.minQuantity;
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : defaultValue;
    normalized[groupId] = Math.max(group.minQuantity, Math.min(group.maxQuantity, value));
  }
  return normalized;
};

/**
 * Resolve the total points for a unit's current model-group composition
 * against its `pointTiers` (Task 6.4 schema).
 *
 * Prefers an exact composition match (most precise when a tier corresponds
 * to a specific loadout combination, not just a raw model count). When no
 * exact match exists, falls back to resolving by total model count: per
 * TABLETOP_RULES.md, 10th-edition points are strictly tier-based on total
 * squad size and are NEVER computed per-model, so this rounds UP to the
 * cheapest tier whose total model count is >= the current total, rather
 * than interpolating or defaulting to the lowest tier (which would
 * undercharge, e.g. a 7-model Intercessor Squad silently priced at the
 * 5-model tier). Only falls back to the highest tier if the composition's
 * total exceeds every defined tier's total.
 */
export const resolveModelGroupPoints = (
  unit: Unit,
  composition: Record<string, number>
): number => {
  if (!unit.pointTiers || unit.pointTiers.length === 0) {
    return unit.basePoints;
  }

  const exactMatch = unit.pointTiers.find((tier) =>
    compositionsMatch(tier.composition, composition)
  );
  if (exactMatch) return exactMatch.points;

  const totalModels = Object.values(composition).reduce((sum, count) => sum + count, 0);

  const tiersByModelCount = unit.pointTiers
    .map((tier) => ({
      tier,
      totalModels: Object.values(tier.composition).reduce((sum, count) => sum + count, 0),
    }))
    .sort((a, b) => a.totalModels - b.totalModels);

  const applicable = tiersByModelCount.find((t) => t.totalModels >= totalModels);
  return (applicable ?? tiersByModelCount[tiersByModelCount.length - 1]).tier.points;
};

/**
 * The maximum total model count a unit can ever legally field, derived from
 * its `pointTiers` rather than the sum of each `modelGroup`'s own
 * `maxQuantity`. Follower ModelGroups are generated independently and their
 * individual maxima can sum to more models than any priced tier actually
 * covers — e.g. an Intercessor Squad's Sergeant(1) + Intercessor(4-9) +
 * Intercessor w/ Grenade Launcher(0-2) groups allow 12 models by their own
 * per-group limits, but in real 10th-edition rules the grenade-launcher
 * variant REPLACES base Intercessors rather than adding to them, and no
 * `pointTiers` entry prices above 10 models. The true ceiling is the
 * largest total model count that appears across all of the unit's defined
 * `pointTiers`.
 *
 * Returns `undefined` when the unit has no `pointTiers`, so callers can
 * leave per-group min/max as the only cap and units without pointTiers are
 * unaffected.
 */
export const getUnitModelCeiling = (unit: Unit): number | undefined => {
  if (!unit.pointTiers || unit.pointTiers.length === 0) return undefined;

  return unit.pointTiers.reduce((max, tier) => {
    const tierTotal = Object.values(tier.composition).reduce((sum, count) => sum + count, 0);
    return Math.max(max, tierTotal);
  }, 0);
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
 * Resolve the price to advertise for a unit that has NOT yet been added to
 * an army (e.g. the unit-picker "Add" row). `basePoints` is only a legacy
 * fallback and can disagree with the real cheapest `pointTiers` entry for
 * generated Task 6.6 data (7 of 1597 units, e.g. `aquila-kill-team`:
 * `basePoints` 100 vs a real cheapest tier of 200) — prefer the cheapest
 * defined tier when tiers exist. 0 is a legitimate price (e.g. Spore
 * Mines, Ripper Swarms, Mucolid Spores are genuinely free units) and must
 * never be treated as "missing".
 */
export const getUnitPickerPrice = (unit: Unit): number => {
  if (unit.pointTiers && unit.pointTiers.length > 0) {
    return Math.min(...unit.pointTiers.map((tier) => tier.points));
  }
  return unit.basePoints;
};

/**
 * Build a human-readable "1x Sergeant, 4x Marine" summary of a unit's
 * current composition, resolving each key against `modelGroups` (falling
 * back to legacy `composition`/`quantity` for unmigrated data).
 *
 * When a unit HAS `modelGroups`, that branch is authoritative and always
 * returns from within it — it must never fall through to the legacy
 * `unit.composition` branch below, which formats entries as
 * `${count}x ${name}` treating its keys as display names. For `modelGroups`
 * composition maps, the keys are ModelGroup *ids* (kebab-case, e.g.
 * "warrior-w-gauss-reaper"), not names, so falling through there would leak
 * raw ids into the UI. This matters especially for the all-zero-count case
 * (every group's `minQuantity` is 0, e.g. Necron Warriors' interchangeable
 * weapon-loadout followers) — that case must still resolve using the
 * groups' `name` fields, never their ids.
 */
export const describeUnitComposition = (unit: Unit): string => {
  if (unit.modelGroups && Object.keys(unit.modelGroups).length > 0) {
    const composition = normalizeModelGroupComposition(unit, unit.composition);
    const parts = Object.entries(composition)
      .filter(([, count]) => count > 0)
      .map(([groupId, count]) => `${count}x ${unit.modelGroups?.[groupId]?.name ?? groupId}`);
    if (parts.length > 0) return parts.join(', ');

    const groupNames = Object.values(unit.modelGroups).map((g) => g.name);
    return `No models selected (choose from: ${groupNames.join(', ')})`;
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
    // Nullish coalescing, not `||`: some units (e.g. spawned Spore Mines,
    // Ripper Swarms) are legitimately 0 points, and `0 || basePoints` would
    // wrongly substitute a nonzero fallback price for them.
    return total + (armyUnit.totalPoints ?? armyUnit.basePoints);
  }, 0);
};

/**
 * Reports whether an army currently has a valid, designated Warlord.
 * Only units in `army.characters` (HQ role) are eligible to be Warlord —
 * see `handleMakeWarlord` in `ArmyDetailTab`, which enforces this at the
 * point of assignment. This is a read-only, non-blocking status check: the
 * app warns about a missing Warlord but never prevents play, so callers
 * must only use this to render advisory UI, never to gate an action.
 *
 * The two "missing" cases are distinguished because they call for different
 * user guidance:
 * - `no-characters`: the army has no Character units at all, so it cannot
 *   have a Warlord yet — the user needs to add one first.
 * - `no-warlord-designated`: the army has one or more Characters, but none
 *   of them is flagged `isWarlord` — the user just needs to designate one.
 */
export type WarlordStatus =
  | { state: 'no-characters' }
  | { state: 'no-warlord-designated' }
  | { state: 'ok' };

export const getWarlordStatus = (army: Army): WarlordStatus => {
  const characters = army.characters || [];
  if (characters.length === 0) {
    return { state: 'no-characters' };
  }

  const hasWarlord = characters.some((unit) => unit.isWarlord === true);
  return hasWarlord ? { state: 'ok' } : { state: 'no-warlord-designated' };
};
