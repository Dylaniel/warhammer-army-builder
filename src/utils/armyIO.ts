import {
  Army,
  ModelGroup,
  Unit,
  UnitOption,
  UnitPointTier,
  UnitRole,
  UnitStats,
  Weapon,
} from '../types/army';
import { generateArmyUnitId, SUPPORTED_FACTIONS } from './unitUtils';

/**
 * Task 6.7 — Army Import / Export via JSON.
 *
 * All parsing and validation of untrusted, user-pasted JSON lives here so
 * components never touch `unknown` data directly (per AGENTS.md: components
 * render, utils decide). Nothing in this file trusts the shape of parsed
 * JSON — every field is narrowed with an explicit type guard before use.
 */

// --- Primitive guards -------------------------------------------------

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

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

/**
 * Loose structural check used to decide whether an array entry is even
 * worth treating as a unit. Per the Task 6.7 spec this is deliberately
 * shallow — only `id` and `name` are required to be strings. Anything else
 * on the object is defaulted/coerced by `sanitizeUnit` below rather than
 * validated, so legacy/partial exported units never crash the app.
 */
const looksLikeUnit = (value: unknown): value is Record<string, unknown> =>
  isPlainObject(value) && isString(value.id) && isString(value.name);

const sanitizeArray = <T>(value: unknown, fallback: T[] = []): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

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
  const numOrStr = (v: unknown): number | string => {
    if (isFiniteNumber(v)) return v;
    if (isString(v)) return v;
    return 0;
  };

  return {
    movement: num(value.movement),
    toughness: num(value.toughness),
    save: numOrStr(value.save),
    wounds: num(value.wounds),
    leadership: numOrStr(value.leadership),
    objectiveControl: num(value.objectiveControl),
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
 * `modelGroups` and `pointTiers` (the Task 6.4 schema) are passed through
 * as-is when they are at least object/array-shaped: they are deeply nested
 * and, since they only ever round-trip through export/import of this same
 * schema, re-validating every nested field here would be redundant with
 * validating the top-level shape. They are still gated behind a coarse
 * shape check so a malicious/garbled payload can't smuggle a non-object
 * value into a field consumers assume is an object/array.
 */
const sanitizeUnit = (raw: Record<string, unknown>): Unit => {
  const unit: Unit = {
    id: generateArmyUnitId(String(raw.id)),
    name: String(raw.name),
    faction: isString(raw.faction) ? raw.faction : '',
    role: isUnitRole(raw.role) ? raw.role : 'HQ',
    basePoints: isFiniteNumber(raw.basePoints) ? raw.basePoints : 0,
    stats: sanitizeStats(raw.stats),
    options: sanitizeArray<UnitOption>(raw.options),
    weapons: sanitizeArray<Weapon>(raw.weapons),
    abilities: sanitizeArray<Unit['abilities'][number]>(raw.abilities),
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

  if (isPlainObject(raw.modelGroups)) {
    unit.modelGroups = raw.modelGroups as Record<string, ModelGroup>;
  }
  if (Array.isArray(raw.pointTiers)) {
    unit.pointTiers = raw.pointTiers as UnitPointTier[];
  }

  return unit;
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
 * All unit ids are regenerated via `generateArmyUnitId` so an imported army
 * can never collide with ids already present in the current session.
 */
export const parseAndValidateArmyJson = (input: string): ArmyImportResult => {
  if (!input || !input.trim()) {
    return { ok: false, error: 'Paste an exported army JSON string before importing.' };
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

  const army: Army = {
    armyName,
    faction,
    detachment,
    points,
    characters: unitsByField.characters.map(sanitizeUnit),
    battleline: unitsByField.battleline.map(sanitizeUnit),
    dedicatedTransports: unitsByField.dedicatedTransports.map(sanitizeUnit),
    otherDatasheets: unitsByField.otherDatasheets.map(sanitizeUnit),
    alliedUnits: unitsByField.alliedUnits.map(sanitizeUnit),
  };

  const warning = SUPPORTED_FACTIONS.includes(faction)
    ? undefined
    : `"${faction}" isn't a recognized faction. The army was imported anyway, but the unit picker and other faction-aware features may not work correctly for it.`;

  return { ok: true, army, warning };
};
