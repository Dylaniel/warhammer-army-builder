/**
 * Task 6.6 — BattleScribe (BSData) → OpenForge data pipeline.
 *
 * Reads the BSData `wh40k-10e` community catalogues from `raw-data/` (gitignored)
 * and emits 10th-edition-shaped JSON that conforms to the Task 6.4 schema in
 * `src/types/army.ts` (`Unit` / `ModelGroup` / `UnitPointTier`).
 *
 * Output goes to `src/data/factions-v3/` — a STAGING directory. This script never
 * writes to `src/data/factions-v2/`, which is the dataset the app currently runs on.
 *
 * Usage:
 *   npm run parse:bsdata              parse + write + validate
 *   npm run parse:bsdata -- --validate   validate the existing staging output only
 *
 * Honest scope notes (see also the report emitted at the end of a run):
 *  - `entryLink` targets are resolved through a single global id index built from
 *    every `.cat` and the `.gst`. BSData ids are GUID-unique across catalogues, so
 *    this resolves cross-catalogue library links without modelling `catalogueLink`.
 *  - `modifier` elements are only interpreted for point costs, and only the simple
 *    `set` / `increment` / `decrement` forms driven by an `atLeast` / `greaterThan`
 *    `selections` condition. Conditional-on-anything-else and `repeats`-driven cost
 *    modifiers are counted and reported as UNSUPPORTED rather than guessed at.
 *  - Nothing is invented. Ability text is copied verbatim. Where a schema field has
 *    no source (e.g. the 9th-edition-era `Weapon.type`), the fallback used is stated
 *    in the report.
 */

import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

import type { ModelGroup, Unit, UnitOption, UnitPointTier, UnitRole, UnitStats, Weapon } from '../src/types/army';
import type { WargearOption } from '../src/types/army';

/* ------------------------------------------------------------------ */
/* Raw XML plumbing                                                    */
/* ------------------------------------------------------------------ */

type XmlNode = { [key: string]: unknown };

const isNode = (value: unknown): value is XmlNode =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asArray = (value: unknown): XmlNode[] => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.filter(isNode);
  return isNode(value) ? [value] : [];
};

const attr = (node: XmlNode, name: string): string | undefined => {
  const value = node['@_' + name];
  if (value === undefined || value === null) return undefined;
  return String(value);
};

const textOf = (node: XmlNode): string => {
  const value = node['#text'];
  if (value === undefined || value === null) return '';
  return String(value);
};

/** `node.<wrapper>.<item>` normalised to an array (BattleScribe's list idiom). */
const listOf = (node: XmlNode, wrapper: string, item: string): XmlNode[] => {
  const holder = node[wrapper];
  if (!isNode(holder)) return [];
  return asArray(holder[item]);
};

/* ------------------------------------------------------------------ */
/* Paths & constants                                                   */
/* ------------------------------------------------------------------ */

const REPO_ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(REPO_ROOT, 'raw-data');
const OUT_DIR = path.join(REPO_ROOT, 'src', 'data', 'factions-v3');
const V2_DIR = path.join(REPO_ROOT, 'src', 'data', 'factions-v2');

const UNIT_PROFILE = 'Unit';
const RANGED_PROFILE = 'Ranged Weapons';
const MELEE_PROFILE = 'Melee Weapons';
const ABILITY_PROFILE = 'Abilities';

/**
 * Meta selection groups that exist for BattleScribe roster bookkeeping (Crusade
 * progression, per-weapon "modification" hooks). They carry no datasheet content
 * and pull in thousands of irrelevant nodes, so subtree walks stop at them.
 */
const META_SUBTREES = ['Crusade', 'Weapon Modifications', 'Experience Points', 'Battle Honours'];

/**
 * BSData catalogue file -> canonical faction string from SUPPORTED_FACTIONS
 * (src/utils/unitUtils.ts). Only these files produce output files.
 */
const FACTION_CATALOGUES: { file: string; faction: string }[] = [
  { file: 'Imperium - Space Marines.cat', faction: 'Space Marines' },
  { file: 'Imperium - Adepta Sororitas.cat', faction: 'Adepta Sororitas' },
  { file: 'Imperium - Adeptus Custodes.cat', faction: 'Adeptus Custodes' },
  { file: 'Imperium - Adeptus Mechanicus.cat', faction: 'Adeptus Mechanicus' },
  { file: 'Aeldari - Craftworlds.cat', faction: 'Aeldari' },
  { file: 'Imperium - Agents of the Imperium.cat', faction: 'Agents of the Imperium' },
  { file: 'Imperium - Astra Militarum.cat', faction: 'Astra Militarum' },
  { file: 'Imperium - Black Templars.cat', faction: 'Black Templars' },
  { file: 'Imperium - Blood Angels.cat', faction: 'Blood Angels' },
  { file: 'Chaos - Chaos Daemons.cat', faction: 'Chaos Daemons' },
  { file: 'Chaos - Chaos Knights.cat', faction: 'Chaos Knights' },
  { file: 'Chaos - Chaos Space Marines.cat', faction: 'Chaos Space Marines' },
  { file: 'Imperium - Dark Angels.cat', faction: 'Dark Angels' },
  { file: 'Chaos - Death Guard.cat', faction: 'Death Guard' },
  { file: 'Imperium - Deathwatch.cat', faction: 'Deathwatch' },
  { file: 'Aeldari - Drukhari.cat', faction: 'Drukhari' },
  { file: 'Genestealer Cults.cat', faction: 'Genestealer Cults' },
  { file: 'Imperium - Grey Knights.cat', faction: 'Grey Knights' },
  { file: 'Imperium - Imperial Knights.cat', faction: 'Imperial Knights' },
  { file: 'Leagues of Votann.cat', faction: 'Leagues of Votann' },
  { file: 'Necrons.cat', faction: 'Necrons' },
  { file: 'Orks.cat', faction: 'Orks' },
  { file: 'Imperium - Space Wolves.cat', faction: 'Space Wolves' },
  { file: "T'au Empire.cat", faction: "T'au Empire" },
  { file: 'Chaos - Thousand Sons.cat', faction: 'Thousand Sons' },
  { file: 'Tyranids.cat', faction: 'Tyranids' },
  { file: 'Chaos - World Eaters.cat', faction: 'World Eaters' },
];

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unnamed';

/** Parses `6"`, `12`, `-1`, `3+` to a number; returns undefined when not numeric. */
const toNumber = (raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  const cleaned = raw.replace(/["+\s]/g, '').replace(/″/g, '');
  if (cleaned === '' || cleaned === '-' || /^n\/?a$/i.test(cleaned)) return undefined;
  if (!/^-?\d+$/.test(cleaned)) return undefined;
  return parseInt(cleaned, 10);
};

/** Numeric when possible, otherwise the verbatim source string (e.g. "D6", "2D3"). */
const numberOrText = (raw: string | undefined): number | string => {
  const num = toNumber(raw);
  if (num !== undefined) return num;
  return raw === undefined ? 0 : raw.trim();
};

/** Faction JSON filename, matching the existing factions-v2 convention exactly. */
const factionFileName = (faction: string): string =>
  faction
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '.json';

const uniqueId = (base: string, used: Set<string>): string => {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let n = 2;
  while (used.has(base + '-' + String(n))) n += 1;
  const next = base + '-' + String(n);
  used.add(next);
  return next;
};

/* ------------------------------------------------------------------ */
/* Global id index                                                     */
/* ------------------------------------------------------------------ */

interface IndexedNode {
  node: XmlNode;
  file: string;
}

interface Catalogue {
  file: string;
  name: string;
  root: XmlNode;
}

interface SourceIndex {
  byId: Map<string, IndexedNode>;
  catalogues: Map<string, Catalogue>;
  ptsTypeId: string;
}

const indexNode = (node: unknown, file: string, byId: Map<string, IndexedNode>): void => {
  if (Array.isArray(node)) {
    node.forEach((child) => indexNode(child, file, byId));
    return;
  }
  if (!isNode(node)) return;
  const id = attr(node, 'id');
  if (id !== undefined && !byId.has(id)) byId.set(id, { node, file });
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i].indexOf('@_') === 0) continue;
    indexNode(node[keys[i]], file, byId);
  }
};

const loadSources = (): SourceIndex => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    parseAttributeValue: false,
    processEntities: true,
    trimValues: false,
  });

  const byId = new Map<string, IndexedNode>();
  const catalogues = new Map<string, Catalogue>();
  let ptsTypeId = '';

  const files = fs
    .readdirSync(RAW_DIR)
    .filter((f) => f.endsWith('.cat') || f.endsWith('.gst'))
    .sort();

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const parsed: unknown = parser.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf8'));
    if (!isNode(parsed)) continue;
    const rootRaw = parsed.catalogue !== undefined ? parsed.catalogue : parsed.gameSystem;
    if (!isNode(rootRaw)) continue;
    catalogues.set(file, { file, name: attr(rootRaw, 'name') || file, root: rootRaw });
    indexNode(rootRaw, file, byId);

    const costTypes = listOf(rootRaw, 'costTypes', 'costType');
    for (let c = 0; c < costTypes.length; c += 1) {
      if (attr(costTypes[c], 'name') === 'pts') ptsTypeId = attr(costTypes[c], 'id') || ptsTypeId;
    }
  }

  return { byId, catalogues, ptsTypeId };
};

const resolve = (index: SourceIndex, targetId: string | undefined): XmlNode | undefined => {
  if (targetId === undefined) return undefined;
  const hit = index.byId.get(targetId);
  return hit === undefined ? undefined : hit.node;
};

/* ------------------------------------------------------------------ */
/* Statistics / diagnostics collected during a run                     */
/* ------------------------------------------------------------------ */

interface RunDiagnostics {
  unresolvedEntryLinks: number;
  unresolvedInfoLinks: number;
  unsupportedCostModifiers: number;
  weaponTypeFallbacks: number;
  totalWeaponProfiles: number;
  nonNumericStrength: number;
  nonNumericAp: number;
  perModelCostedUnits: string[];
  datasheetsWithoutStats: string[];
  datasheetsWithoutWeapons: string[];
  datasheetsWithoutPoints: string[];
}

const newDiagnostics = (): RunDiagnostics => ({
  unresolvedEntryLinks: 0,
  unresolvedInfoLinks: 0,
  unsupportedCostModifiers: 0,
  weaponTypeFallbacks: 0,
  totalWeaponProfiles: 0,
  nonNumericStrength: 0,
  nonNumericAp: 0,
  perModelCostedUnits: [],
  datasheetsWithoutStats: [],
  datasheetsWithoutWeapons: [],
  datasheetsWithoutPoints: [],
});

/* ------------------------------------------------------------------ */
/* Profile extraction                                                  */
/* ------------------------------------------------------------------ */

const characteristics = (profile: XmlNode): Map<string, string> => {
  const map = new Map<string, string>();
  const chars = listOf(profile, 'characteristics', 'characteristic');
  for (let i = 0; i < chars.length; i += 1) {
    const name = attr(chars[i], 'name');
    if (name !== undefined) map.set(name, textOf(chars[i]).trim());
  }
  return map;
};

/**
 * Profiles of a given type declared inline on `node`, plus any referenced through
 * `<infoLink type="profile">`. BSData routinely shares one statline across several
 * model entries via infoLink (e.g. every Adepta Sororitas "Battle Sister"), so
 * ignoring infoLinks loses whole squads.
 */
const profilesOf = (node: XmlNode, typeName: string, index?: SourceIndex): XmlNode[] => {
  const out = listOf(node, 'profiles', 'profile').filter((p) => attr(p, 'typeName') === typeName);
  if (index === undefined) return out;
  const infoLinks = listOf(node, 'infoLinks', 'infoLink');
  for (let i = 0; i < infoLinks.length; i += 1) {
    if (attr(infoLinks[i], 'type') !== 'profile') continue;
    const target = resolve(index, attr(infoLinks[i], 'targetId'));
    if (target === undefined || attr(target, 'typeName') !== typeName) continue;
    out.push(target);
  }
  return out;
};

/** `-` is BattleScribe's "characteristic does not apply"; encoded as 0, never guessed. */
const statCharacteristic = (raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  if (raw.trim() === '-' || raw.trim() === 'N/A') return 0;
  return toNumber(raw);
};

const statsFromProfile = (profile: XmlNode): UnitStats | undefined => {
  const c = characteristics(profile);
  const movement = statCharacteristic(c.get('M'));
  const toughness = statCharacteristic(c.get('T'));
  const wounds = statCharacteristic(c.get('W'));
  const objectiveControl = statCharacteristic(c.get('OC'));
  const save = c.get('SV');
  const leadership = c.get('LD');
  if (
    movement === undefined ||
    toughness === undefined ||
    wounds === undefined ||
    objectiveControl === undefined ||
    save === undefined ||
    leadership === undefined
  ) {
    return undefined;
  }
  return { movement, toughness, save, wounds, leadership, objectiveControl };
};

/* ------------------------------------------------------------------ */
/* Subtree traversal (entryLink-resolving, cycle-safe)                 */
/* ------------------------------------------------------------------ */

/**
 * Yields every selectionEntry / selectionEntryGroup reachable beneath `root`,
 * following `entryLink`s through the global index. Stops at META_SUBTREES and at
 * `maxDepth` so Crusade bookkeeping and weapon-modification hooks stay out.
 */
const walkSubtree = (
  index: SourceIndex,
  root: XmlNode,
  diagnostics: RunDiagnostics,
  maxDepth: number,
  visit: (node: XmlNode, depth: number) => void
): void => {
  const seen = new Set<string>();

  const step = (node: XmlNode, depth: number): void => {
    if (depth > maxDepth) return;
    const name = attr(node, 'name');
    if (name !== undefined && META_SUBTREES.indexOf(name) !== -1) return;
    const id = attr(node, 'id');
    if (id !== undefined) {
      if (seen.has(id)) return;
      seen.add(id);
    }
    visit(node, depth);

    const children = listOf(node, 'selectionEntries', 'selectionEntry')
      .concat(listOf(node, 'selectionEntryGroups', 'selectionEntryGroup'))
      .concat(listOf(node, 'sharedSelectionEntries', 'selectionEntry'));
    for (let i = 0; i < children.length; i += 1) step(children[i], depth + 1);

    const links = listOf(node, 'entryLinks', 'entryLink');
    for (let i = 0; i < links.length; i += 1) {
      const linkName = attr(links[i], 'name');
      if (linkName !== undefined && META_SUBTREES.indexOf(linkName) !== -1) continue;
      const target = resolve(index, attr(links[i], 'targetId'));
      if (target === undefined) {
        diagnostics.unresolvedEntryLinks += 1;
        continue;
      }
      step(target, depth + 1);
    }
  };

  step(root, 0);
};

/* ------------------------------------------------------------------ */
/* Weapons                                                             */
/* ------------------------------------------------------------------ */

const WEAPON_TYPE_KEYWORDS: { keyword: string; type: Weapon['type'] }[] = [
  { keyword: 'pistol', type: 'Pistol' },
  { keyword: 'grenade', type: 'Grenade' },
  { keyword: 'rapid fire', type: 'Rapid Fire' },
  { keyword: 'assault', type: 'Assault' },
  { keyword: 'heavy', type: 'Heavy' },
];

const weaponFromProfile = (
  profile: XmlNode,
  melee: boolean,
  diagnostics: RunDiagnostics
): Weapon | undefined => {
  const name = attr(profile, 'name');
  if (name === undefined) return undefined;
  diagnostics.totalWeaponProfiles += 1;
  const c = characteristics(profile);

  const rawKeywords = c.get('Keywords');
  const abilities =
    rawKeywords === undefined || rawKeywords === '-' || rawKeywords === ''
      ? []
      : rawKeywords
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k !== '' && k !== '-');

  let type: Weapon['type'];
  if (melee) {
    type = 'Melee';
  } else {
    const lower = abilities.join(', ').toLowerCase();
    let matched: Weapon['type'] | undefined;
    for (let i = 0; i < WEAPON_TYPE_KEYWORDS.length && matched === undefined; i += 1) {
      if (lower.indexOf(WEAPON_TYPE_KEYWORDS[i].keyword) !== -1) matched = WEAPON_TYPE_KEYWORDS[i].type;
    }
    if (matched === undefined) {
      // 10th edition has no weapon "type"; the schema field is a 9th-edition
      // holdover. When the source carries no type-like keyword we fall back to
      // 'Assault' and count it rather than inventing a classification.
      diagnostics.weaponTypeFallbacks += 1;
      type = 'Assault';
    } else {
      type = matched;
    }
  }

  const strength = toNumber(c.get('S'));
  if (strength === undefined) diagnostics.nonNumericStrength += 1;
  const ap = toNumber(c.get('AP'));
  if (ap === undefined) diagnostics.nonNumericAp += 1;

  const rangeRaw = c.get('Range');
  const rangeNum = toNumber(rangeRaw);
  const range: number | 'Melee' = melee || rangeNum === undefined ? 'Melee' : rangeNum;

  const weapon: Weapon = {
    id: slug(name),
    name,
    type,
    range,
    attacks: numberOrText(c.get('A')),
    strength: strength === undefined ? 0 : strength,
    armourPenetration: ap === undefined ? 0 : ap,
    damage: numberOrText(c.get('D')),
    abilities,
  };

  const skill = toNumber(c.get(melee ? 'WS' : 'BS'));
  if (skill !== undefined) {
    if (melee) weapon.weaponSkill = skill;
    else weapon.ballisticSkill = skill;
  }
  return weapon;
};

const collectWeapons = (
  index: SourceIndex,
  datasheet: XmlNode,
  diagnostics: RunDiagnostics
): Weapon[] => {
  const byId = new Map<string, Weapon>();
  walkSubtree(index, datasheet, diagnostics, 8, (node) => {
    const ranged = profilesOf(node, RANGED_PROFILE, index);
    for (let i = 0; i < ranged.length; i += 1) {
      const w = weaponFromProfile(ranged[i], false, diagnostics);
      if (w !== undefined && !byId.has(w.id)) byId.set(w.id, w);
    }
    const melee = profilesOf(node, MELEE_PROFILE, index);
    for (let i = 0; i < melee.length; i += 1) {
      const w = weaponFromProfile(melee[i], true, diagnostics);
      if (w !== undefined && !byId.has(w.id)) byId.set(w.id, w);
    }
  });
  return Array.from(byId.values());
};

/* ------------------------------------------------------------------ */
/* Abilities (verbatim)                                                */
/* ------------------------------------------------------------------ */

interface NamedAbility {
  name: string;
  description: string;
}

const collectAbilities = (
  index: SourceIndex,
  datasheet: XmlNode,
  diagnostics: RunDiagnostics
): NamedAbility[] => {
  const out = new Map<string, NamedAbility>();

  const addProfile = (profile: XmlNode): void => {
    const name = attr(profile, 'name');
    if (name === undefined || out.has(name)) return;
    const description = characteristics(profile).get('Description');
    if (description === undefined || description.trim() === '') return;
    out.set(name, { name, description: description.trim() });
  };

  // Abilities declared on the datasheet itself and on its model entries.
  walkSubtree(index, datasheet, diagnostics, 3, (node) => {
    const profiles = profilesOf(node, ABILITY_PROFILE, index);
    for (let i = 0; i < profiles.length; i += 1) addProfile(profiles[i]);
  });

  // Core / faction rules referenced by infoLink; `rule` nodes carry <description>.
  const infoLinks = listOf(datasheet, 'infoLinks', 'infoLink');
  for (let i = 0; i < infoLinks.length; i += 1) {
    const link = infoLinks[i];
    const target = resolve(index, attr(link, 'targetId'));
    if (target === undefined) {
      diagnostics.unresolvedInfoLinks += 1;
      continue;
    }
    const name = attr(target, 'name') || attr(link, 'name');
    if (name === undefined || out.has(name)) continue;
    const rawDescription = target.description;
    if (typeof rawDescription === 'string' && rawDescription.trim() !== '') {
      out.set(name, { name, description: rawDescription.trim() });
      continue;
    }
    if (attr(target, 'typeName') === ABILITY_PROFILE) addProfile(target);
  }

  return Array.from(out.values());
};

/* ------------------------------------------------------------------ */
/* Constraints                                                         */
/* ------------------------------------------------------------------ */

interface Bounds {
  min?: number;
  max?: number;
}

const selectionBounds = (node: XmlNode): Bounds => {
  const bounds: Bounds = {};
  const constraints = listOf(node, 'constraints', 'constraint');
  for (let i = 0; i < constraints.length; i += 1) {
    const constraint = constraints[i];
    if (attr(constraint, 'field') !== 'selections') continue;
    const scope = attr(constraint, 'scope');
    if (scope !== 'parent' && scope !== 'self') continue;
    const value = toNumber(attr(constraint, 'value'));
    if (value === undefined) continue;
    const type = attr(constraint, 'type');
    if (type === 'min') bounds.min = value;
    if (type === 'max') bounds.max = value;
  }
  return bounds;
};

/* ------------------------------------------------------------------ */
/* Model groups                                                        */
/* ------------------------------------------------------------------ */

interface RawModelEntry {
  node: XmlNode;
  stats: UnitStats;
  bounds: Bounds;
  /** id of the selectionEntryGroup that wraps this model ('' when ungrouped). */
  wrapperId: string;
  /** Constraints of the selectionEntryGroup that wraps this model, if any. */
  wrapperBounds: Bounds;
  /** `pts` declared on the model entry itself (BSData's per-model pricing form). */
  ownCost: number;
}

const ptsCostOf = (node: XmlNode): number => {
  const costs = listOf(node, 'costs', 'cost');
  for (let i = 0; i < costs.length; i += 1) {
    if (attr(costs[i], 'name') !== 'pts') continue;
    const value = toNumber(attr(costs[i], 'value'));
    if (value !== undefined) return value;
  }
  return 0;
};

/**
 * A model group is a nested `selectionEntry type="model"` that carries its own
 * `Unit` profile plus its own min/max selection constraints. Single-model
 * datasheets (characters) are themselves `type="model"` and yield one group.
 */
const collectModelEntries = (index: SourceIndex, datasheet: XmlNode, diagnostics: RunDiagnostics): RawModelEntry[] => {
  const entries: RawModelEntry[] = [];
  const seen = new Set<string>();

  const ownProfile = profilesOf(datasheet, UNIT_PROFILE, index)[0];
  const datasheetType = attr(datasheet, 'type');

  /** Statline declared on `node` itself, if any. */
  const ownStats = (node: XmlNode): UnitStats | undefined => {
    const profile = profilesOf(node, UNIT_PROFILE, index)[0];
    return profile === undefined ? undefined : statsFromProfile(profile);
  };

  const descend = (
    node: XmlNode,
    depth: number,
    wrapperId: string,
    wrapperBounds: Bounds,
    inherited: UnitStats | undefined
  ): void => {
    if (depth > 4) return;
    const name = attr(node, 'name');
    if (name !== undefined && META_SUBTREES.indexOf(name) !== -1) return;

    const children = listOf(node, 'selectionEntries', 'selectionEntry');
    const groups = listOf(node, 'selectionEntryGroups', 'selectionEntryGroup');
    const links = listOf(node, 'entryLinks', 'entryLink');

    for (let i = 0; i < children.length; i += 1) {
      consider(children[i], depth + 1, wrapperId, wrapperBounds, inherited);
    }
    for (let i = 0; i < links.length; i += 1) {
      const linkName = attr(links[i], 'name');
      if (linkName !== undefined && META_SUBTREES.indexOf(linkName) !== -1) continue;
      const target = resolve(index, attr(links[i], 'targetId'));
      if (target === undefined) {
        diagnostics.unresolvedEntryLinks += 1;
        continue;
      }
      if (attr(target, 'type') !== 'model') continue;
      // Constraints declared on the link override the shared entry's own.
      const merged: XmlNode = { ...target };
      if (isNode(links[i].constraints)) merged.constraints = links[i].constraints;
      consider(merged, depth + 1, wrapperId, wrapperBounds, inherited);
    }
    for (let i = 0; i < groups.length; i += 1) {
      const groupName = attr(groups[i], 'name');
      if (groupName !== undefined && META_SUBTREES.indexOf(groupName) !== -1) continue;
      // Several datasheets hang the shared statline on the wrapping group rather
      // than on each model entry (e.g. Space Wolves Wulfen); inherit it downward.
      const groupStats = ownStats(groups[i]);
      descend(
        groups[i],
        depth + 1,
        attr(groups[i], 'id') || '',
        selectionBounds(groups[i]),
        groupStats === undefined ? inherited : groupStats
      );
    }
  };

  const consider = (
    node: XmlNode,
    depth: number,
    wrapperId: string,
    wrapperBounds: Bounds,
    inherited: UnitStats | undefined
  ): void => {
    if (attr(node, 'type') !== 'model') {
      descend(node, depth, wrapperId, wrapperBounds, inherited);
      return;
    }
    const declared = ownStats(node);
    const stats = declared === undefined ? inherited : declared;
    if (stats === undefined) {
      descend(node, depth, wrapperId, wrapperBounds, inherited);
      return;
    }
    const id = attr(node, 'id');
    if (id !== undefined) {
      if (seen.has(id)) return;
      seen.add(id);
    }
    entries.push({
      node,
      stats,
      bounds: selectionBounds(node),
      wrapperId,
      wrapperBounds,
      ownCost: ptsCostOf(node),
    });
  };

  if (datasheetType === 'model' && ownProfile !== undefined) {
    const stats = statsFromProfile(ownProfile);
    if (stats !== undefined) {
      entries.push({
        node: datasheet,
        stats,
        bounds: { min: 1, max: 1 },
        wrapperId: '',
        wrapperBounds: {},
        ownCost: 0,
      });
    }
  }
  descend(datasheet, 0, '', {}, ownProfile === undefined ? undefined : statsFromProfile(ownProfile));

  // A unit-typed datasheet with no nested model entries but its own Unit profile
  // (e.g. most vehicles) is a single implicit model group.
  if (entries.length === 0 && ownProfile !== undefined) {
    const stats = statsFromProfile(ownProfile);
    if (stats !== undefined) {
      entries.push({
        node: datasheet,
        stats,
        bounds: { min: 1, max: 1 },
        wrapperId: '',
        wrapperBounds: {},
        ownCost: 0,
      });
    }
  }
  return entries;
};

const buildWargearOptions = (index: SourceIndex, modelNode: XmlNode, diagnostics: RunDiagnostics): WargearOption[] => {
  const options: WargearOption[] = [];
  const used = new Set<string>();
  const groups = listOf(modelNode, 'selectionEntryGroups', 'selectionEntryGroup');

  for (let g = 0; g < groups.length; g += 1) {
    const group = groups[g];
    const groupName = attr(group, 'name') || 'Options';
    if (META_SUBTREES.indexOf(groupName) !== -1) continue;

    const choiceNames: string[] = [];
    const links = listOf(group, 'entryLinks', 'entryLink');
    for (let i = 0; i < links.length; i += 1) {
      const linkName = attr(links[i], 'name');
      if (linkName === undefined || META_SUBTREES.indexOf(linkName) !== -1) continue;
      const target = resolve(index, attr(links[i], 'targetId'));
      if (target === undefined) diagnostics.unresolvedEntryLinks += 1;
      choiceNames.push(linkName);
    }
    const inline = listOf(group, 'selectionEntries', 'selectionEntry');
    for (let i = 0; i < inline.length; i += 1) {
      const inlineName = attr(inline[i], 'name');
      if (inlineName !== undefined) choiceNames.push(inlineName);
    }
    if (choiceNames.length < 2) continue;

    const ids = choiceNames.map((n) => uniqueId(slug(groupName + '-' + n), used));
    for (let i = 0; i < ids.length; i += 1) {
      options.push({
        id: ids[i],
        description: groupName + ': ' + choiceNames[i],
        exclusiveWith: ids.filter((_, j) => j !== i),
      });
    }
  }
  return options;
};

/** Weapons the source marks as always-present on this model (min == max == 1 links). */
const buildEquippedWargear = (index: SourceIndex, modelNode: XmlNode): string[] => {
  const out: string[] = [];
  const links = listOf(modelNode, 'entryLinks', 'entryLink');
  for (let i = 0; i < links.length; i += 1) {
    const link = links[i];
    const name = attr(link, 'name');
    if (name === undefined || META_SUBTREES.indexOf(name) !== -1) continue;
    const bounds = selectionBounds(link);
    if (bounds.min === undefined || bounds.min < 1) continue;
    const target = resolve(index, attr(link, 'targetId'));
    if (target === undefined) continue;
    if (out.indexOf(slug(name)) === -1) out.push(slug(name));
  }
  const groups = listOf(modelNode, 'selectionEntryGroups', 'selectionEntryGroup');
  for (let g = 0; g < groups.length; g += 1) {
    const defaultId = attr(groups[g], 'defaultSelectionEntryId');
    if (defaultId === undefined) continue;
    const target = resolve(index, defaultId);
    const name = target === undefined ? undefined : attr(target, 'name');
    if (name !== undefined && out.indexOf(slug(name)) === -1) out.push(slug(name));
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* Point tiers                                                         */
/* ------------------------------------------------------------------ */

interface CostModifier {
  kind: 'set' | 'increment' | 'decrement';
  value: number;
  threshold: number;
}

const gatherModifiers = (node: XmlNode): XmlNode[] => {
  let out = listOf(node, 'modifiers', 'modifier');
  const groups = listOf(node, 'modifierGroups', 'modifierGroup');
  for (let i = 0; i < groups.length; i += 1) {
    out = out.concat(listOf(groups[i], 'modifiers', 'modifier'));
  }
  return out;
};

/**
 * Reads the datasheet's point cost modifiers. Only the simple shape
 * `<modifier type="set|increment|decrement" field="<ptsTypeId>">` gated by a single
 * `atLeast` / `greaterThan` `selections` condition is understood. Everything else
 * (repeat-driven per-model costs, multi-condition groups) is counted as unsupported.
 */
const readCostModifiers = (
  datasheet: XmlNode,
  ptsTypeId: string,
  diagnostics: RunDiagnostics
): CostModifier[] => {
  const out: CostModifier[] = [];
  const modifiers = gatherModifiers(datasheet);

  for (let i = 0; i < modifiers.length; i += 1) {
    const modifier = modifiers[i];
    if (attr(modifier, 'field') !== ptsTypeId) continue;
    const kindRaw = attr(modifier, 'type');
    if (kindRaw !== 'set' && kindRaw !== 'increment' && kindRaw !== 'decrement') {
      diagnostics.unsupportedCostModifiers += 1;
      continue;
    }
    const value = toNumber(attr(modifier, 'value'));
    if (value === undefined) {
      diagnostics.unsupportedCostModifiers += 1;
      continue;
    }
    if (isNode(modifier.repeats)) {
      // Repeat-driven costs are per-N-models pricing. TABLETOP_RULES.md forbids
      // synthesising per-model pricing, so these are reported, not guessed.
      diagnostics.unsupportedCostModifiers += 1;
      continue;
    }
    const conditions = listOf(modifier, 'conditions', 'condition');
    if (conditions.length !== 1) {
      diagnostics.unsupportedCostModifiers += 1;
      continue;
    }
    const condition = conditions[0];
    if (attr(condition, 'field') !== 'selections') {
      diagnostics.unsupportedCostModifiers += 1;
      continue;
    }
    const conditionValue = toNumber(attr(condition, 'value'));
    if (conditionValue === undefined) {
      diagnostics.unsupportedCostModifiers += 1;
      continue;
    }
    const conditionType = attr(condition, 'type');
    let threshold: number;
    if (conditionType === 'atLeast') threshold = conditionValue;
    else if (conditionType === 'greaterThan') threshold = conditionValue + 1;
    else {
      diagnostics.unsupportedCostModifiers += 1;
      continue;
    }
    out.push({ kind: kindRaw, value, threshold });
  }
  return out;
};

const costAtTotal = (base: number, modifiers: CostModifier[], total: number): number => {
  let cost = base;
  const applicable = modifiers.filter((m) => total >= m.threshold);
  // `set` wins over increments; apply the highest-threshold `set` first.
  const sets = applicable.filter((m) => m.kind === 'set').sort((a, b) => a.threshold - b.threshold);
  if (sets.length > 0) cost = sets[sets.length - 1].value;
  for (let i = 0; i < applicable.length; i += 1) {
    if (applicable[i].kind === 'increment') cost += applicable[i].value;
    if (applicable[i].kind === 'decrement') cost -= applicable[i].value;
  }
  return cost;
};

/** Spreads `total` models across groups: each at min, surplus to the biggest headroom. */
const compositionFor = (groups: ModelGroup[], total: number): Record<string, number> => {
  const counts: Record<string, number> = {};
  let assigned = 0;
  for (let i = 0; i < groups.length; i += 1) {
    counts[groups[i].id] = groups[i].minQuantity;
    assigned += groups[i].minQuantity;
  }
  let remaining = total - assigned;
  if (remaining <= 0) return counts;

  const order = groups
    .slice()
    .sort((a, b) => b.maxQuantity - b.minQuantity - (a.maxQuantity - a.minQuantity));
  for (let i = 0; i < order.length && remaining > 0; i += 1) {
    const headroom = order[i].maxQuantity - order[i].minQuantity;
    const take = Math.min(headroom, remaining);
    counts[order[i].id] += take;
    remaining -= take;
  }
  return counts;
};

/* ------------------------------------------------------------------ */
/* Role                                                                */
/* ------------------------------------------------------------------ */

const roleFor = (categoryNames: string[]): UnitRole => {
  const has = (name: string): boolean => categoryNames.indexOf(name) !== -1;
  if (has('Aircraft')) return 'FLYER';
  if (has('Dedicated Transport')) return 'DEDICATED_TRANSPORT';
  if (has('Battleline')) return 'TROOPS';
  if (has('Character') || has('Epic Hero')) return 'HQ';
  if (has('Vehicle') || has('Monster') || has('Fortification') || has('Titanic')) {
    return 'HEAVY_SUPPORT';
  }
  if (has('Mounted') || has('Beast') || has('Swarm') || has('Drone')) return 'FAST_ATTACK';
  return 'ELITES';
};

/* ------------------------------------------------------------------ */
/* Datasheet -> Unit                                                   */
/* ------------------------------------------------------------------ */

const buildUnit = (
  index: SourceIndex,
  datasheet: XmlNode,
  faction: string,
  usedUnitIds: Set<string>,
  diagnostics: RunDiagnostics
): Unit | undefined => {
  const name = attr(datasheet, 'name');
  if (name === undefined) return undefined;

  const categoryNames = listOf(datasheet, 'categoryLinks', 'categoryLink')
    .map((c) => attr(c, 'name'))
    .filter((c): c is string => c !== undefined);

  const modelEntries = collectModelEntries(index, datasheet, diagnostics);
  const usedGroupIds = new Set<string>();
  const bareGroups = modelEntries.map((entry) => {
    const groupName = attr(entry.node, 'name') || name;
    return {
      entry,
      id: uniqueId(slug(groupName), usedGroupIds),
      name: groupName,
    };
  });

  const maxGroupSize = bareGroups.reduce(
    (acc, g) => Math.max(acc, g.entry.bounds.max === undefined ? 1 : g.entry.bounds.max),
    0
  );

  const modelGroups: Record<string, ModelGroup> = {};
  const orderedGroups: ModelGroup[] = [];
  for (let i = 0; i < bareGroups.length; i += 1) {
    const { entry, id, name: groupName } = bareGroups[i];
    const min = entry.bounds.min === undefined ? (bareGroups.length === 1 ? 1 : 0) : entry.bounds.min;
    const max = entry.bounds.max === undefined ? Math.max(min, 1) : entry.bounds.max;
    // 'leader' only where the source structurally supports it: a max-1 group
    // sitting alongside a larger group in the same unit. Otherwise 'follower'.
    const category: ModelGroup['category'] =
      bareGroups.length > 1 && max === 1 && maxGroupSize > 1 ? 'leader' : 'follower';
    const group: ModelGroup = {
      id,
      name: groupName,
      category,
      stats: entry.stats,
      minQuantity: min,
      maxQuantity: max,
      availableOptions: buildWargearOptions(index, entry.node, diagnostics),
      equippedWargear: buildEquippedWargear(index, entry.node),
    };
    modelGroups[id] = group;
    orderedGroups.push(group);
  }

  const stats =
    orderedGroups.length > 0
      ? orderedGroups[0].stats
      : { movement: 0, toughness: 0, save: '-', wounds: 0, leadership: '-', objectiveControl: 0 };
  if (orderedGroups.length === 0) diagnostics.datasheetsWithoutStats.push(faction + ' / ' + name);

  const weapons = collectWeapons(index, datasheet, diagnostics);
  if (weapons.length === 0) diagnostics.datasheetsWithoutWeapons.push(faction + ' / ' + name);

  const abilities = collectAbilities(index, datasheet, diagnostics);

  // --- points -------------------------------------------------------
  const basePoints = ptsCostOf(datasheet);
  const costModifiers = readCostModifiers(datasheet, index.ptsTypeId, diagnostics);

  // Squad-size bounds come from the selectionEntryGroup that wraps each set of
  // model entries ("bucket"); ungrouped model entries form their own bucket. The
  // wrapper's own min/max is authoritative over the sum of its members'.
  const buckets = new Map<string, { min: number; max: number; wrapper: Bounds }>();
  for (let i = 0; i < bareGroups.length; i += 1) {
    const entry = bareGroups[i].entry;
    const key = entry.wrapperId === '' ? 'ungrouped:' + bareGroups[i].id : entry.wrapperId;
    const group = modelGroups[bareGroups[i].id];
    const current = buckets.get(key);
    if (current === undefined) {
      buckets.set(key, {
        min: group.minQuantity,
        max: group.maxQuantity,
        wrapper: entry.wrapperBounds,
      });
    } else {
      current.min += group.minQuantity;
      current.max += group.maxQuantity;
    }
  }
  let totalMin = 0;
  let totalMax = 0;
  Array.from(buckets.values()).forEach((bucket) => {
    totalMin += bucket.wrapper.min === undefined ? bucket.min : bucket.wrapper.min;
    totalMax +=
      bucket.wrapper.max === undefined ? bucket.max : Math.min(bucket.wrapper.max, bucket.max);
  });
  totalMin = Math.max(1, totalMin);
  totalMax = Math.max(totalMin, totalMax);

  // Some datasheets (mostly 1-3 identical walkers/bikes) price per model in the
  // source: unit cost 0, each model entry carries its own `pts`. That is the
  // source's own pricing, not a per-model formula we invented, so it is evaluated
  // per composition — and every such unit is listed in the diagnostics.
  const groupCosts: Record<string, number> = {};
  let hasPerModelCost = false;
  for (let i = 0; i < bareGroups.length; i += 1) {
    groupCosts[bareGroups[i].id] = bareGroups[i].entry.ownCost;
    if (bareGroups[i].entry.ownCost > 0) hasPerModelCost = true;
  }
  const usePerModelCost = basePoints === 0 && hasPerModelCost;
  if (usePerModelCost) diagnostics.perModelCostedUnits.push(faction + ' / ' + name);

  // Candidate totals: the declared bounds plus each cost threshold and the model
  // count immediately below it. Nothing between thresholds is interpolated —
  // except for per-model-costed units, where every legal size has its own cost.
  const candidates: number[] = [totalMin, totalMax];
  for (let i = 0; i < costModifiers.length; i += 1) {
    candidates.push(costModifiers[i].threshold - 1, costModifiers[i].threshold);
  }
  if (usePerModelCost) {
    for (let t = totalMin; t <= Math.min(totalMax, 60); t += 1) candidates.push(t);
  }
  const totals = Array.from(new Set(candidates.filter((t) => t >= totalMin && t <= totalMax))).sort(
    (a, b) => a - b
  );

  const pointsForTotal = (total: number, composition: Record<string, number>): number => {
    let points = costAtTotal(basePoints, costModifiers, total);
    if (!usePerModelCost) return points;
    const ids = Object.keys(composition);
    for (let i = 0; i < ids.length; i += 1) {
      points += composition[ids[i]] * (groupCosts[ids[i]] === undefined ? 0 : groupCosts[ids[i]]);
    }
    return points;
  };

  // Collapse to one tier per distinct cost, keeping the largest legal model count
  // for that cost — that is the real 10th-edition tier breakpoint.
  const byCost = new Map<number, Record<string, number>>();
  for (let i = 0; i < totals.length; i += 1) {
    const composition = compositionFor(orderedGroups, totals[i]);
    byCost.set(pointsForTotal(totals[i], composition), composition);
  }
  const pointTiers: UnitPointTier[] = Array.from(byCost.entries())
    .map(([points, composition]) => ({ composition, points }))
    .sort((a, b) => a.points - b.points);

  // --- costed upgrades ---------------------------------------------
  const options: UnitOption[] = [];
  const usedOptionIds = new Set<string>();
  walkSubtree(index, datasheet, diagnostics, 4, (node) => {
    if (attr(node, 'type') !== 'upgrade') return;
    const optionName = attr(node, 'name');
    if (optionName === undefined) return;
    const optionCosts = listOf(node, 'costs', 'cost');
    for (let i = 0; i < optionCosts.length; i += 1) {
      if (attr(optionCosts[i], 'name') !== 'pts') continue;
      const value = toNumber(attr(optionCosts[i], 'value'));
      if (value === undefined || value === 0) continue;
      options.push({ id: uniqueId(slug(optionName), usedOptionIds), name: optionName, points: value });
    }
  });

  // `basePoints` is the legacy flat fallback; the lowest real tier is the honest
  // value when the datasheet itself carries no unit-level cost.
  const effectiveBasePoints =
    basePoints > 0 ? basePoints : pointTiers.length > 0 ? pointTiers[0].points : 0;
  if (effectiveBasePoints <= 0) diagnostics.datasheetsWithoutPoints.push(faction + ' / ' + name);

  return {
    id: uniqueId(slug(name), usedUnitIds),
    name,
    faction,
    role: roleFor(categoryNames),
    basePoints: effectiveBasePoints,
    stats,
    options,
    weapons,
    abilities,
    modelGroups,
    pointTiers,
  };
};

/* ------------------------------------------------------------------ */
/* Datasheet discovery                                                 */
/* ------------------------------------------------------------------ */

const discoverDatasheets = (index: SourceIndex, catalogue: Catalogue, diagnostics: RunDiagnostics): XmlNode[] => {
  const out: XmlNode[] = [];
  const seen = new Set<string>();

  const consider = (node: XmlNode): void => {
    const type = attr(node, 'type');
    if (type !== 'unit' && type !== 'model') return;
    const id = attr(node, 'id');
    if (id === undefined || seen.has(id)) return;
    seen.add(id);
    out.push(node);
  };

  const links = listOf(catalogue.root, 'entryLinks', 'entryLink');
  for (let i = 0; i < links.length; i += 1) {
    const target = resolve(index, attr(links[i], 'targetId'));
    if (target === undefined) {
      diagnostics.unresolvedEntryLinks += 1;
      continue;
    }
    consider(target);
  }
  const inline = listOf(catalogue.root, 'selectionEntries', 'selectionEntry');
  for (let i = 0; i < inline.length; i += 1) consider(inline[i]);

  return out;
};

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

interface FactionReport {
  faction: string;
  file: string;
  units: number;
  completeStats: number;
  withWeapons: number;
  withAbilities: number;
  withPointTiers: number;
  multiGroup: number;
  leaderGroups: number;
  zeroPoints: number;
  badStats: number;
  badWeapons: number;
  schemaErrors: string[];
}

const isValidStats = (value: unknown): boolean => {
  if (!isNode(value)) return false;
  const s = value as unknown as UnitStats;
  return (
    typeof s.movement === 'number' &&
    Number.isFinite(s.movement) &&
    typeof s.toughness === 'number' &&
    Number.isFinite(s.toughness) &&
    typeof s.wounds === 'number' &&
    Number.isFinite(s.wounds) &&
    typeof s.objectiveControl === 'number' &&
    Number.isFinite(s.objectiveControl) &&
    (typeof s.save === 'number' || typeof s.save === 'string') &&
    (typeof s.leadership === 'number' || typeof s.leadership === 'string')
  );
};

const validateUnit = (unit: Unit, errors: string[]): void => {
  const where = unit.faction + ' / ' + unit.name + ': ';
  if (typeof unit.id !== 'string' || unit.id === '') errors.push(where + 'missing id');
  if (typeof unit.name !== 'string' || unit.name === '') errors.push(where + 'missing name');
  if (typeof unit.faction !== 'string' || unit.faction === '') errors.push(where + 'missing faction');
  const roles: UnitRole[] = [
    'HQ',
    'TROOPS',
    'ELITES',
    'FAST_ATTACK',
    'HEAVY_SUPPORT',
    'FLYER',
    'DEDICATED_TRANSPORT',
  ];
  if (roles.indexOf(unit.role) === -1) errors.push(where + 'invalid role ' + String(unit.role));
  if (typeof unit.basePoints !== 'number' || !Number.isFinite(unit.basePoints)) {
    errors.push(where + 'basePoints is not a finite number');
  }
  if (!isValidStats(unit.stats)) errors.push(where + 'malformed stats');
  if (!Array.isArray(unit.options)) errors.push(where + 'options is not an array');
  if (!Array.isArray(unit.weapons)) errors.push(where + 'weapons is not an array');
  if (!Array.isArray(unit.abilities)) errors.push(where + 'abilities is not an array');

  const weaponTypes: Weapon['type'][] = ['Pistol', 'Assault', 'Rapid Fire', 'Heavy', 'Melee', 'Grenade'];
  for (let i = 0; i < unit.weapons.length; i += 1) {
    const w = unit.weapons[i];
    if (weaponTypes.indexOf(w.type) === -1) errors.push(where + 'weapon ' + w.name + ' invalid type');
    if (typeof w.strength !== 'number' || !Number.isFinite(w.strength)) {
      errors.push(where + 'weapon ' + w.name + ' invalid strength');
    }
    if (typeof w.armourPenetration !== 'number' || !Number.isFinite(w.armourPenetration)) {
      errors.push(where + 'weapon ' + w.name + ' invalid AP');
    }
    if (!Array.isArray(w.abilities)) errors.push(where + 'weapon ' + w.name + ' abilities not array');
  }

  const groups = unit.modelGroups;
  if (groups === undefined || Object.keys(groups).length === 0) {
    errors.push(where + 'no modelGroups');
  } else {
    const ids = Object.keys(groups);
    for (let i = 0; i < ids.length; i += 1) {
      const g = groups[ids[i]];
      if (g.id !== ids[i]) errors.push(where + 'modelGroup key/id mismatch on ' + ids[i]);
      if (g.category !== 'leader' && g.category !== 'follower') {
        errors.push(where + 'modelGroup ' + g.id + ' invalid category');
      }
      if (!isValidStats(g.stats)) errors.push(where + 'modelGroup ' + g.id + ' malformed stats');
      if (typeof g.minQuantity !== 'number' || typeof g.maxQuantity !== 'number') {
        errors.push(where + 'modelGroup ' + g.id + ' invalid quantities');
      } else if (g.minQuantity > g.maxQuantity) {
        errors.push(where + 'modelGroup ' + g.id + ' min > max');
      }
      if (!Array.isArray(g.availableOptions)) errors.push(where + 'modelGroup ' + g.id + ' options not array');
      if (!Array.isArray(g.equippedWargear)) errors.push(where + 'modelGroup ' + g.id + ' wargear not array');
    }
  }

  const tiers = unit.pointTiers;
  if (tiers === undefined || tiers.length === 0) {
    errors.push(where + 'no pointTiers');
  } else {
    for (let i = 0; i < tiers.length; i += 1) {
      if (typeof tiers[i].points !== 'number' || !Number.isFinite(tiers[i].points) || tiers[i].points <= 0) {
        errors.push(where + 'pointTier ' + String(i) + ' has non-positive/NaN points');
      }
      const compKeys = Object.keys(tiers[i].composition);
      if (compKeys.length === 0) errors.push(where + 'pointTier ' + String(i) + ' empty composition');
      for (let k = 0; k < compKeys.length; k += 1) {
        if (groups === undefined || groups[compKeys[k]] === undefined) {
          errors.push(where + 'pointTier references unknown group ' + compKeys[k]);
        }
      }
    }
  }
};

const reportFor = (faction: string, file: string, units: Unit[]): FactionReport => {
  const report: FactionReport = {
    faction,
    file,
    units: units.length,
    completeStats: 0,
    withWeapons: 0,
    withAbilities: 0,
    withPointTiers: 0,
    multiGroup: 0,
    leaderGroups: 0,
    zeroPoints: 0,
    badStats: 0,
    badWeapons: 0,
    schemaErrors: [],
  };

  for (let i = 0; i < units.length; i += 1) {
    const unit = units[i];
    if (isValidStats(unit.stats)) report.completeStats += 1;
    else report.badStats += 1;
    if (unit.weapons.length > 0) report.withWeapons += 1;
    if (unit.abilities.length > 0) report.withAbilities += 1;
    if (unit.pointTiers !== undefined && unit.pointTiers.length > 0) report.withPointTiers += 1;
    if (unit.modelGroups !== undefined && Object.keys(unit.modelGroups).length > 1) report.multiGroup += 1;
    if (unit.modelGroups !== undefined) {
      const ids = Object.keys(unit.modelGroups);
      for (let g = 0; g < ids.length; g += 1) {
        if (unit.modelGroups[ids[g]].category === 'leader') {
          report.leaderGroups += 1;
          break;
        }
      }
    }
    if (!Number.isFinite(unit.basePoints) || unit.basePoints <= 0) report.zeroPoints += 1;
    for (let w = 0; w < unit.weapons.length; w += 1) {
      const weapon = unit.weapons[w];
      if (!Number.isFinite(weapon.strength) || !Number.isFinite(weapon.armourPenetration)) {
        report.badWeapons += 1;
        break;
      }
    }
    validateUnit(unit, report.schemaErrors);
  }
  return report;
};

const readJsonUnits = (file: string): Unit[] => {
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Unit[]) : [];
};

const v2Counts = (): Map<string, number> => {
  const counts = new Map<string, number>();
  if (!fs.existsSync(V2_DIR)) return counts;
  const files = fs.readdirSync(V2_DIR).filter((f) => f.endsWith('.json'));
  for (let i = 0; i < files.length; i += 1) {
    counts.set(files[i], readJsonUnits(path.join(V2_DIR, files[i])).length);
  }
  return counts;
};

const printReports = (reports: FactionReport[]): void => {
  const v2 = v2Counts();
  const pad = (value: string | number, width: number): string => {
    const s = String(value);
    return s.length >= width ? s : s + ' '.repeat(width - s.length);
  };
  const padLeft = (value: string | number, width: number): string => {
    const s = String(value);
    return s.length >= width ? s : ' '.repeat(width - s.length) + s;
  };

  console.log('');
  console.log('FACTION                     v3   v2  stats  weap  abil  tiers  >1grp  ldr  0pts  errs');
  console.log('-'.repeat(88));
  let totals = { v3: 0, v2: 0, stats: 0, weap: 0, abil: 0, tiers: 0, multi: 0, ldr: 0, zero: 0, err: 0 };
  for (let i = 0; i < reports.length; i += 1) {
    const r = reports[i];
    const legacy = v2.get(r.file) === undefined ? 0 : (v2.get(r.file) as number);
    totals = {
      v3: totals.v3 + r.units,
      v2: totals.v2 + legacy,
      stats: totals.stats + r.completeStats,
      weap: totals.weap + r.withWeapons,
      abil: totals.abil + r.withAbilities,
      tiers: totals.tiers + r.withPointTiers,
      multi: totals.multi + r.multiGroup,
      ldr: totals.ldr + r.leaderGroups,
      zero: totals.zero + r.zeroPoints,
      err: totals.err + r.schemaErrors.length,
    };
    console.log(
      pad(r.faction, 24) +
        padLeft(r.units, 5) +
        padLeft(legacy, 5) +
        padLeft(r.completeStats, 7) +
        padLeft(r.withWeapons, 6) +
        padLeft(r.withAbilities, 6) +
        padLeft(r.withPointTiers, 7) +
        padLeft(r.multiGroup, 7) +
        padLeft(r.leaderGroups, 5) +
        padLeft(r.zeroPoints, 6) +
        padLeft(r.schemaErrors.length, 6)
    );
  }
  console.log('-'.repeat(88));
  console.log(
    pad('TOTAL', 24) +
      padLeft(totals.v3, 5) +
      padLeft(totals.v2, 5) +
      padLeft(totals.stats, 7) +
      padLeft(totals.weap, 6) +
      padLeft(totals.abil, 6) +
      padLeft(totals.tiers, 7) +
      padLeft(totals.multi, 7) +
      padLeft(totals.ldr, 5) +
      padLeft(totals.zero, 6) +
      padLeft(totals.err, 6)
  );

  const allErrors: string[] = [];
  for (let i = 0; i < reports.length; i += 1) {
    for (let e = 0; e < reports[i].schemaErrors.length; e += 1) allErrors.push(reports[i].schemaErrors[e]);
  }
  if (allErrors.length > 0) {
    console.log('');
    console.log('SCHEMA / DATA ERRORS (' + String(allErrors.length) + ' total, first 40 shown):');
    for (let i = 0; i < Math.min(40, allErrors.length); i += 1) console.log('  - ' + allErrors[i]);
  }
};

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

const runValidateOnly = (): void => {
  if (!fs.existsSync(OUT_DIR)) {
    console.error('No staging output at ' + OUT_DIR + '. Run without --validate first.');
    process.exitCode = 1;
    return;
  }
  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.json'));
  const reports: FactionReport[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const units = readJsonUnits(path.join(OUT_DIR, files[i]));
    reports.push(reportFor(units.length > 0 ? units[0].faction : files[i], files[i], units));
  }
  printReports(reports);
};

const run = (): void => {
  if (!fs.existsSync(RAW_DIR)) {
    console.error('raw-data/ not found. Clone the BSData wh40k-10e catalogues there first.');
    process.exitCode = 1;
    return;
  }

  console.log('Indexing BSData catalogues...');
  const index = loadSources();
  console.log(
    '  ' +
      String(index.catalogues.size) +
      ' catalogues, ' +
      String(index.byId.size) +
      ' addressable nodes, pts cost type = ' +
      index.ptsTypeId
  );

  const diagnostics = newDiagnostics();
  const reports: FactionReport[] = [];
  const missingCatalogues: string[] = [];

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (let i = 0; i < FACTION_CATALOGUES.length; i += 1) {
    const mapping = FACTION_CATALOGUES[i];
    const catalogue = index.catalogues.get(mapping.file);
    if (catalogue === undefined) {
      missingCatalogues.push(mapping.file + ' -> ' + mapping.faction);
      continue;
    }
    const datasheets = discoverDatasheets(index, catalogue, diagnostics);
    const usedUnitIds = new Set<string>();
    const units: Unit[] = [];
    for (let d = 0; d < datasheets.length; d += 1) {
      const unit = buildUnit(index, datasheets[d], mapping.faction, usedUnitIds, diagnostics);
      if (unit !== undefined) units.push(unit);
    }
    units.sort((a, b) => a.name.localeCompare(b.name));

    const outFile = factionFileName(mapping.faction);
    fs.writeFileSync(path.join(OUT_DIR, outFile), JSON.stringify(units, null, 2) + '\n', {
      encoding: 'utf8',
    });
    reports.push(reportFor(mapping.faction, outFile, units));
  }

  const mapped = FACTION_CATALOGUES.map((m) => m.file);
  const unmapped = Array.from(index.catalogues.keys()).filter(
    (f) => mapped.indexOf(f) === -1 && f.endsWith('.cat')
  );

  printReports(reports);

  console.log('');
  console.log('PARSER DIAGNOSTICS');
  console.log('  unresolved entryLinks      : ' + String(diagnostics.unresolvedEntryLinks));
  console.log('  unresolved infoLinks       : ' + String(diagnostics.unresolvedInfoLinks));
  console.log('  UNSUPPORTED cost modifiers : ' + String(diagnostics.unsupportedCostModifiers));
  console.log(
    '  weapon type fallbacks      : ' +
      String(diagnostics.weaponTypeFallbacks) +
      ' of ' +
      String(diagnostics.totalWeaponProfiles) +
      ' weapon profiles'
  );
  console.log('  per-model-costed units     : ' + String(diagnostics.perModelCostedUnits.length));
  console.log('  non-numeric weapon S       : ' + String(diagnostics.nonNumericStrength));
  console.log('  non-numeric weapon AP      : ' + String(diagnostics.nonNumericAp));
  console.log('  datasheets with no stats   : ' + String(diagnostics.datasheetsWithoutStats.length));
  console.log('  datasheets with no weapons : ' + String(diagnostics.datasheetsWithoutWeapons.length));
  console.log('  datasheets with 0 points   : ' + String(diagnostics.datasheetsWithoutPoints.length));

  if (missingCatalogues.length > 0) {
    console.log('');
    console.log('MAPPED FACTIONS WITH NO SOURCE CATALOGUE:');
    for (let i = 0; i < missingCatalogues.length; i += 1) console.log('  - ' + missingCatalogues[i]);
  }
  console.log('');
  console.log('UNMAPPED CATALOGUES (no SUPPORTED_FACTIONS equivalent, skipped):');
  for (let i = 0; i < unmapped.length; i += 1) console.log('  - ' + unmapped[i]);

  console.log('');
  console.log('Wrote ' + String(reports.length) + ' faction files to ' + OUT_DIR);
};

const main = (): void => {
  if (process.argv.indexOf('--validate') !== -1) runValidateOnly();
  else run();
};

main();
