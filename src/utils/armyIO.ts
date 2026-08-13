import {
  Army,
  DetachmentBonus,
  GamePhase,
  ModelGroup,
  Unit,
  UnitOption,
  UnitPointTier,
  UnitRole,
  UnitStats,
  WargearOption,
  Weapon,
} from '../types/army';
import { generateArmyUnitId, SUPPORTED_FACTIONS } from './unitUtils';

/**
 * Task 6.7 — Army Import / Export via JSON.
 *
 * All parsing and validation of untrusted, user-pasted JSON lives here so
 * components never touch `unknown` data directly (per AGENTS.md: components
 * render, utils decide). Nothing in this file trusts the shape of parsed
 * JSON — every field, including deeply nested ones (`modelGroups`,
 * `pointTiers`, `options`, `weapons`, `abilities`), is narrowed field-by-
 * field via an explicit type guard or sanitizer before use. Malformed
 * nested entries are dropped individually (never the whole import) and
 * surfaced as a non-blocking warning, consistent with the rest of this
 * module's warns-but-never-blocks behaviour.
 */

// A hard cap on the size of pasted import text, applied before `JSON.parse`
// runs. This is defence in depth against a single oversized field (e.g. a
// multi-megabyte `armyName`) blowing past `localStorage`'s quota once saved
// — see the QuotaExceededError guard in `OpenForgeApp.tsx`. 2MB is far more
// than any legitimate exported army (a few KB) will ever need.
const MAX_IMPORT_JSON_LENGTH = 2_000_000;

// --- Primitive guards -------------------------------------------------

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Coerce to a finite number if possible, else fall back to a string, else 0. */
const numOrStr = (value: unknown): number | string => {
  if (isFiniteNumber(value)) return value;
  if (isString(value)) return value;
  return 0;
};

const VALID_ROLES: UnitRole[] = [
  'HQ',
  'TROOPS',
  'ELITES',
  'FAST_ATTACK',
  'HEAVY_SUPPORT',
  'FLYER',
  'DEDICATED_TRANSPORT',
];

const isUnitRole = (value: unknown): value is UnitRole =>
  isString(value) && (VALID_ROLES as string[]).includes(value);

const GAME_PHASES: GamePhase[] = ['Command', 'Movement', 'Shooting', 'Charge', 'Fight'];

const isGamePhase = (value: unknown): value is GamePhase =>
  isString(value) && (GAME_PHASES as string[]).includes(value);

const WEAPON_TYPES: Weapon['type'][] = [
  'Pistol',
  'Assault',
  'Rapid Fire',
  'Heavy',
  'Melee',
  'Grenade',
];

const isWeaponType = (value: unknown): value is Weapon['type'] =>
  isString(value) && (WEAPON_TYPES as string[]).includes(value);

const isModelGroupCategory = (value: unknown): value is ModelGroup['category'] =>
  value === 'leader' || value === 'follower';

/**
 * Loose structural check used to decide whether an array entry is even
 * worth treating as a unit. Per the Task 6.7 spec this is deliberately
 * shallow — only `id` and `name` are required to be strings. Anything else
 * on the object is defaulted/coerced by `sanitizeUnit` below rather than
 * validated, so legacy/partial exported units never crash the app.
 */
const looksLikeUnit = (value: unknown): value is Record<string, unknown> =>
  isPlainObject(value) && isString(value.id) && isString(value.name);

const DEFAULT_STATS: UnitStats = {
  movement: 0,
  toughness: 0,
  save: 0,
  wounds: 0,
  leadership: 0,
  objectiveControl: 0,
};

const sanitizeStats = (value: unknown): UnitStats => {
  if (!isPlainObject(value)) return { ...DEFAULT_STATS };

  const num = (v: unknown): number => (isFiniteNumber(v) ? v : 0);

  return {
    movement: num(value.movement),
    toughness: num(value.toughness),
    save: numOrStr(value.save),
    wounds: num(value.wounds),
    leadership: numOrStr(value.leadership),
    objectiveControl: num(value.objectiveControl),
  };
};

// --- Nested-array sanitization helper ----------------------------------

/**
 * Sanitize every entry of an array with `sanitizeOne`, dropping (not
 * rejecting the whole import for) any entry that doesn't hold up — e.g. a
 * `null`, a primitive, or an object missing required fields. Returns both
 * the surviving entries and a count of how many were dropped so callers can
 * surface a single aggregate warning instead of failing the import.
 */
const sanitizeEntries = <T>(
  value: unknown,
  sanitizeOne: (entry: unknown) => T | null
): { items: T[]; dropped: number } => {
  if (!Array.isArray(value)) return { items: [], dropped: 0 };
  const items: T[] = [];
  let dropped = 0;
  for (const entry of value) {
    const sanitized = sanitizeOne(entry);
    if (sanitized === null) {
      dropped += 1;
    } else {
      items.push(sanitized);
    }
  }
  return { items, dropped };
};

// --- Nested-object sanitizers --------------------------------------------

const sanitizeDetachmentBonus = (value: unknown): DetachmentBonus | null => {
  if (!isPlainObject(value)) return null;
  if (!isString(value.name) || !isString(value.description)) return null;
  return {
    name: value.name,
    description: value.description,
    validationKeys: Array.isArray(value.validationKeys)
      ? value.validationKeys.filter(isString)
      : [],
    phase: Array.isArray(value.phase) ? value.phase.filter(isGamePhase) : [],
  };
};

const sanitizeUnitOption = (value: unknown): UnitOption | null => {
  if (!isPlainObject(value)) return null;
  if (!isString(value.id) || !isString(value.name)) return null;
  return {
    id: value.id,
    name: value.name,
    points: isFiniteNumber(value.points) ? value.points : 0,
  };
};

const sanitizeWeapon = (value: unknown): Weapon | null => {
  if (!isPlainObject(value)) return null;
  if (!isString(value.id) || !isString(value.name)) return null;

  const weapon: Weapon = {
    id: value.id,
    name: value.name,
    type: isWeaponType(value.type) ? value.type : 'Melee',
    range: isFiniteNumber(value.range) ? value.range : value.range === 'Melee' ? 'Melee' : 0,
    attacks: numOrStr(value.attacks),
    strength: isFiniteNumber(value.strength) ? value.strength : 0,
    armourPenetration: isFiniteNumber(value.armourPenetration) ? value.armourPenetration : 0,
    damage: numOrStr(value.damage),
    abilities: Array.isArray(value.abilities) ? value.abilities.filter(isString) : [],
  };

  if (isFiniteNumber(value.ballisticSkill)) weapon.ballisticSkill = value.ballisticSkill;
  if (isFiniteNumber(value.weaponSkill)) weapon.weaponSkill = value.weaponSkill;

  if (Array.isArray(value.detachmentBonuses)) {
    const { items } = sanitizeEntries(value.detachmentBonuses, sanitizeDetachmentBonus);
    weapon.detachmentBonuses = items;
  }

  return weapon;
};

/** Entries of `Unit['abilities']`: either a plain display string, or a rich `{ name, description, phase? }` object. */
type UnitAbility = Unit['abilities'][number];

const sanitizeAbility = (value: unknown): UnitAbility | null => {
  if (isString(value)) return value;
  if (isPlainObject(value) && isString(value.name) && isString(value.description)) {
    const phase = Array.isArray(value.phase) ? value.phase.filter(isGamePhase) : [];
    return phase.length > 0
      ? { name: value.name, description: value.description, phase }
      : { name: value.name, description: value.description };
  }
  return null;
};

const sanitizeWargearOption = (value: unknown): WargearOption | null => {
  if (!isPlainObject(value)) return null;
  if (!isString(value.id) || !isString(value.description)) return null;
  const option: WargearOption = { id: value.id, description: value.description };
  if (Array.isArray(value.exclusiveWith)) {
    option.exclusiveWith = value.exclusiveWith.filter(isString);
  }
  return option;
};

const sanitizeModelGroup = (value: unknown): ModelGroup | null => {
  if (!isPlainObject(value)) return null;
  if (!isString(value.id) || !isString(value.name)) return null;

  const minQuantity = isFiniteNumber(value.minQuantity) ? value.minQuantity : 0;
  const maxQuantity = isFiniteNumber(value.maxQuantity) ? value.maxQuantity : minQuantity;
  const { items: availableOptions } = sanitizeEntries(
    value.availableOptions,
    sanitizeWargearOption
  );
  const equippedWargear = Array.isArray(value.equippedWargear)
    ? value.equippedWargear.filter(isString)
    : [];

  return {
    id: value.id,
    name: value.name,
    category: isModelGroupCategory(value.category) ? value.category : 'follower',
    stats: sanitizeStats(value.stats),
    minQuantity,
    maxQuantity,
    availableOptions,
    equippedWargear,
  };
};

/**
 * Sanitize a `modelGroups` record (keyed by group id) member-by-member.
 * Any value that isn't a well-formed `ModelGroup` — including `null`, a
 * primitive, or an object missing `id`/`name` — is dropped rather than
 * being blindly asserted through, which is what let a `{"g": null}`
 * payload crash `normalizeModelGroupComposition`'s `g.minQuantity`
 * dereference before this fix.
 */
const sanitizeModelGroups = (
  value: unknown
): { modelGroups: Record<string, ModelGroup> | undefined; dropped: number } => {
  if (!isPlainObject(value)) return { modelGroups: undefined, dropped: 0 };
  const modelGroups: Record<string, ModelGroup> = {};
  let dropped = 0;
  for (const [key, entry] of Object.entries(value)) {
    const group = sanitizeModelGroup(entry);
    if (group === null) {
      dropped += 1;
    } else {
      modelGroups[key] = group;
    }
  }
  return { modelGroups, dropped };
};

const sanitizeUnitPointTier = (value: unknown): UnitPointTier | null => {
  if (!isPlainObject(value)) return null;
  const composition: Record<string, number> = {};
  if (isPlainObject(value.composition)) {
    for (const [key, v] of Object.entries(value.composition)) {
      if (isFiniteNumber(v)) composition[key] = v;
    }
  }
  return {
    composition,
    points: isFiniteNumber(value.points) ? value.points : 0,
  };
};

/**
 * Build a fully-formed `Unit` from a loosely-shaped, already-`looksLikeUnit`
 * object. Every field the `Unit` interface requires is defaulted if absent
 * or the wrong type, so a partial/legacy exported unit can never crash
 * downstream rendering. The id is always regenerated (via
 * `generateArmyUnitId`) so an imported army can never collide with ids
 * already present in the current session.
 *
 * `modelGroups`, `pointTiers`, `options`, `weapons` and `abilities` are all
 * deeply nested, untrusted structures. Every member of every one of them is
 * narrowed field-by-field (see the `sanitize*` helpers above) rather than
 * asserted through with an `as` cast — a well-formed *container* (a plain
 * object or array) says nothing about whether its *contents* are safe to
 * dereference, and this module exists specifically to guard that boundary.
 * Malformed members are dropped individually so one bad entry can't sink
 * the whole import; the caller aggregates a dropped-entry count into a
 * warning.
 */
const sanitizeUnit = (raw: Record<string, unknown>): { unit: Unit; dropped: number } => {
  let dropped = 0;

  const options = sanitizeEntries(raw.options, sanitizeUnitOption);
  const weapons = sanitizeEntries(raw.weapons, sanitizeWeapon);
  const abilities = sanitizeEntries(raw.abilities, sanitizeAbility);
  dropped += options.dropped + weapons.dropped + abilities.dropped;

  const unit: Unit = {
    id: generateArmyUnitId(String(raw.id)),
    name: String(raw.name),
    faction: isString(raw.faction) ? raw.faction : '',
    role: isUnitRole(raw.role) ? raw.role : 'HQ',
    basePoints: isFiniteNumber(raw.basePoints) ? raw.basePoints : 0,
    stats: sanitizeStats(raw.stats),
    options: options.items,
    weapons: weapons.items,
    abilities: abilities.items,
  };

  if (Array.isArray(raw.selectedOptions)) {
    unit.selectedOptions = raw.selectedOptions.filter(isString);
  }
  if (isFiniteNumber(raw.totalPoints)) unit.totalPoints = raw.totalPoints;
  if (isFiniteNumber(raw.quantity)) unit.quantity = raw.quantity;
  if (typeof raw.isWarlord === 'boolean') unit.isWarlord = raw.isWarlord;

  if (isPlainObject(raw.composition)) {
    const composition: Record<string, number> = {};
    for (const [key, value] of Object.entries(raw.composition)) {
      if (isFiniteNumber(value)) composition[key] = value;
    }
    unit.composition = composition;
  }

  const { modelGroups, dropped: modelGroupsDropped } = sanitizeModelGroups(raw.modelGroups);
  if (modelGroups !== undefined) unit.modelGroups = modelGroups;
  dropped += modelGroupsDropped;

  if (Array.isArray(raw.pointTiers)) {
    const { items: pointTiers, dropped: pointTiersDropped } = sanitizeEntries(
      raw.pointTiers,
      sanitizeUnitPointTier
    );
    unit.pointTiers = pointTiers;
    dropped += pointTiersDropped;
  }

  return { unit, dropped };
};

const UNIT_ARRAY_FIELDS = [
  'characters',
  'battleline',
  'dedicatedTransports',
  'otherDatasheets',
  'alliedUnits',
] as const;

type UnitArrayField = (typeof UNIT_ARRAY_FIELDS)[number];

/**
 * Validates a single unit-array field of a parsed army object. Per the
 * Task 6.7 spec the field is valid when it is either absent (defaults to
 * `[]`) or an array whose every entry "looks like" a Unit (string `id` and
 * `name`). Anything else — present but not an array, or an array containing
 * a non-unit-shaped entry — fails validation for the whole import so we
 * never silently drop or guess at malformed data.
 */
const validateUnitArrayField = (
  value: unknown,
  fieldName: UnitArrayField
): { ok: true; entries: Record<string, unknown>[] } | { ok: false; error: string } => {
  if (value === undefined) return { ok: true, entries: [] };
  if (!Array.isArray(value)) {
    return { ok: false, error: `"${fieldName}" must be an array of units.` };
  }
  for (const entry of value) {
    if (!looksLikeUnit(entry)) {
      return {
        ok: false,
        error: `"${fieldName}" contains an entry that isn't a valid unit (each unit needs a string "id" and "name").`,
      };
    }
  }
  return { ok: true, entries: value as Record<string, unknown>[] };
};

export interface ArmyImportSuccess {
  ok: true;
  army: Army;
  /** Set when the army imported successfully but with a non-blocking caveat, e.g. an unrecognized faction. */
  warning?: string;
}

export interface ArmyImportFailure {
  ok: false;
  error: string;
}

export type ArmyImportResult = ArmyImportSuccess | ArmyImportFailure;

/**
 * Serialize an `Army` to a pretty-printed JSON string for export/clipboard
 * copy. Kept trivial and centralized here so the export format is defined
 * in exactly one place (and stays symmetric with `parseAndValidateArmyJson`
 * below).
 */
export const serializeArmy = (army: Army): string => JSON.stringify(army, null, 2);

/**
 * Parse and validate a pasted JSON string as an `Army`. Never throws —
 * every failure mode (malformed JSON, wrong top-level type, wrong field
 * types, malformed unit arrays) returns `{ ok: false, error }` instead, so
 * callers can render an inline error rather than crashing the React tree.
 *
 * Per Task 6.7: an unrecognized `faction` (not in `SUPPORTED_FACTIONS`)
 * warns but never blocks the import — it is returned as `{ ok: true, warning }`.
 * The same applies to malformed nested data (bad `modelGroups`/`pointTiers`
 * members, bad `options`/`weapons`/`abilities` entries, or a `points` value
 * the manual creation form would refuse): those are dropped/kept-with-a-
 * warning rather than failing the import. All unit ids are regenerated via
 * `generateArmyUnitId` so an imported army can never collide with ids
 * already present in the current session.
 */
export const parseAndValidateArmyJson = (input: string): ArmyImportResult => {
  if (!input || !input.trim()) {
    return { ok: false, error: 'Paste an exported army JSON string before importing.' };
  }

  if (input.length > MAX_IMPORT_JSON_LENGTH) {
    return {
      ok: false,
      error: `That JSON is too large to import (${input.length.toLocaleString()} characters, limit ${MAX_IMPORT_JSON_LENGTH.toLocaleString()}). Exported armies are typically a few KB — check the pasted text.`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return {
      ok: false,
      error: 'That text is not valid JSON. Paste an army exported from OpenForge.',
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      error: 'Expected a JSON object describing an army, not an array or a primitive value.',
    };
  }

  const { armyName, faction, detachment, points } = parsed;
  if (!isString(armyName)) return { ok: false, error: '"armyName" must be a string.' };
  if (!isString(faction)) return { ok: false, error: '"faction" must be a string.' };
  if (!isString(detachment)) return { ok: false, error: '"detachment" must be a string.' };
  if (!isFiniteNumber(points)) return { ok: false, error: '"points" must be a finite number.' };

  const unitsByField: Record<UnitArrayField, Record<string, unknown>[]> = {
    characters: [],
    battleline: [],
    dedicatedTransports: [],
    otherDatasheets: [],
    alliedUnits: [],
  };

  for (const field of UNIT_ARRAY_FIELDS) {
    const result = validateUnitArrayField(parsed[field], field);
    if (!result.ok) return { ok: false, error: result.error };
    unitsByField[field] = result.entries;
  }

  let droppedNestedEntries = 0;
  const sanitizeUnitList = (entries: Record<string, unknown>[]): Unit[] =>
    entries.map((entry) => {
      const { unit, dropped } = sanitizeUnit(entry);
      droppedNestedEntries += dropped;
      return unit;
    });

  const army: Army = {
    armyName,
    faction,
    detachment,
    points,
    characters: sanitizeUnitList(unitsByField.characters),
    battleline: sanitizeUnitList(unitsByField.battleline),
    dedicatedTransports: sanitizeUnitList(unitsByField.dedicatedTransports),
    otherDatasheets: sanitizeUnitList(unitsByField.otherDatasheets),
    alliedUnits: sanitizeUnitList(unitsByField.alliedUnits),
  };

  const warnings: string[] = [];

  if (!SUPPORTED_FACTIONS.includes(faction)) {
    warnings.push(
      `"${faction}" isn't a recognized faction. The army was imported anyway, but the unit picker and other faction-aware features may not work correctly for it.`
    );
  }

  // Mirrors the validation NewArmyModal's manual "Create Army" form applies
  // to `points` (positive integers only) — import must not be a way to
  // bypass it, but per the warns-never-blocks rule for this module it's a
  // warning rather than a rejection. The upper bound isn't in the manual
  // form's explicit check, but nothing typed through its number input can
  // ever reach a value like `1e308`, so it's just as much "a value the
  // manual path would refuse" in practice.
  if (!Number.isInteger(points) || points < 1 || points > Number.MAX_SAFE_INTEGER) {
    warnings.push(
      `"points" (${points}) isn't a sane positive whole number, which the manual army form would normally require. The army was imported with this value anyway.`
    );
  }

  if (droppedNestedEntries > 0) {
    warnings.push(
      `${droppedNestedEntries} malformed nested value${droppedNestedEntries === 1 ? '' : 's'} (inside a unit's modelGroups, pointTiers, options, weapons, or abilities) ${droppedNestedEntries === 1 ? 'was' : 'were'} invalid and ${droppedNestedEntries === 1 ? 'has' : 'have'} been dropped. The rest of the army imported normally.`
    );
  }

  return { ok: true, army, warning: warnings.length > 0 ? warnings.join(' ') : undefined };
};
