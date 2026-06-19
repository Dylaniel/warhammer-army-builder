#!/usr/bin/env node
/**
 * hydrate-units.js
 *
 * Standalone CLI utility that parses raw Warhammer 40k datasheet text
 * and safely appends a normalized Unit object to src/data/units.json.
 *
 * Usage:
 *   node scripts/hydrate-units.js --file <path-to-datasheet.txt>
 *   node scripts/hydrate-units.js --interactive
 *   cat datasheet.txt | node scripts/hydrate-units.js --stdin
 *
 * The script will NOT overwrite existing entries (matched by id).
 * Dry-run mode prints the parsed object without writing:
 *   node scripts/hydrate-units.js --file <path> --dry-run
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const readline = require('readline');

// ── Constants ────────────────────────────────────────────────────────────────

const UNITS_JSON_PATH = path.resolve(__dirname, '../src/data/units.json');

const VALID_ROLES = [
  'HQ', 'TROOPS', 'ELITES', 'FAST_ATTACK',
  'HEAVY_SUPPORT', 'FLYER', 'DEDICATED_TRANSPORT',
];

const VALID_WEAPON_TYPES = [
  'Pistol', 'Assault', 'Rapid Fire', 'Heavy', 'Melee', 'Grenade',
];

// Role aliases found on real datasheets → canonical UnitRole
const ROLE_ALIASES = {
  'character':           'HQ',
  'hq':                  'HQ',
  'troops':              'TROOPS',
  'battleline':          'TROOPS',
  'elites':              'ELITES',
  'elite':               'ELITES',
  'fast attack':         'FAST_ATTACK',
  'fast_attack':         'FAST_ATTACK',
  'heavy support':       'HEAVY_SUPPORT',
  'heavy_support':       'HEAVY_SUPPORT',
  'flyer':               'FLYER',
  'dedicated transport': 'DEDICATED_TRANSPORT',
  'dedicated_transport': 'DEDICATED_TRANSPORT',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/** Parse a stat cell — returns a number or a "N+" string. */
function parseStat(raw) {
  if (!raw) return 0;
  const trimmed = raw.trim();
  // Already formatted as "3+" or "6+"
  if (/^\d+\+$/.test(trimmed)) return trimmed;
  const n = parseInt(trimmed, 10);
  return isNaN(n) ? trimmed : n;
}

/** Parse attacks / damage — returns a number or dice string like "D6", "2D3". */
function parseDiceField(raw) {
  if (!raw) return 1;
  const trimmed = raw.trim();
  if (/^\d*[Dd]\d+(\+\d+)?$/.test(trimmed)) return trimmed.toUpperCase();
  const n = parseInt(trimmed, 10);
  return isNaN(n) ? trimmed : n;
}

/** Normalize a weapon type string to one of the valid enum values. */
function normalizeWeaponType(raw) {
  const lower = (raw || '').trim().toLowerCase();
  for (const valid of VALID_WEAPON_TYPES) {
    if (valid.toLowerCase() === lower) return valid;
  }
  // Partial match fallback
  const match = VALID_WEAPON_TYPES.find(v => lower.includes(v.toLowerCase()));
  return match || 'Assault';
}

/** Normalize a role string to a UnitRole. */
function normalizeRole(raw) {
  const lower = (raw || '').trim().toLowerCase();
  if (ROLE_ALIASES[lower]) return ROLE_ALIASES[lower];
  const direct = VALID_ROLES.find(r => r.toLowerCase() === lower);
  if (direct) return direct;
  // Partial match
  const partial = Object.keys(ROLE_ALIASES).find(k => lower.includes(k));
  return partial ? ROLE_ALIASES[partial] : 'TROOPS';
}

// ── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parses raw datasheet text into a Unit object.
 *
 * Expected (loose) format — the parser is deliberately tolerant:
 *
 *   Name: Infernus Squad
 *   Faction: Space Marines
 *   Role: Troops
 *   Points: 90
 *
 *   Stats:
 *   M  T  SV  W  LD  OC
 *   6  4  3+  2  6+   1
 *
 *   Weapons:
 *   Bolt Pistol | Pistol | 12 | 1 | 3+ | 4 | 0 | 1 |
 *   Pyreblaster | Assault | 12 | D6 | 3+ | 4 | -1 | 1 | Torrent, Ignores Cover
 *   Close Combat Weapon | Melee | Melee | 2 | 3+ | 4 | 0 | 1 |
 *
 *   Options:
 *   Replace bolt pistol with plasma pistol | plasma-pistol | 5
 *
 *   Abilities:
 *   Incendiary Terror
 *
 * Pipe-separated weapon columns:
 *   Name | Type | Range | Attacks | BS/WS | Strength | AP | Damage | Abilities (optional)
 */
function parseDatasheet(text) {
  const lines = text.split(/\r?\n/);

  const unit = {
    id:          '',
    name:        '',
    faction:     '',
    role:        'TROOPS',
    basePoints:  0,
    stats: {
      movement:         0,
      toughness:        0,
      save:             '3+',
      wounds:           1,
      leadership:       '7+',
      objectiveControl: 1,
    },
    options:   [],
    weapons:   [],
    abilities: [],
  };

  let section = 'header'; // header | stats | statrow | weapons | options | abilities

  for (let i = 0; i < lines.length; i++) {
    const raw  = lines[i];
    const line = raw.trim();
    if (!line) continue;

    // ── Section headers ────────────────────────────────────────────────────
    const sectionHeader = line.replace(/:.*$/, '').toLowerCase();
    if (/^stats?$/i.test(sectionHeader)) { section = 'stats'; continue; }
    if (/^weapons?$/i.test(sectionHeader)) { section = 'weapons'; continue; }
    if (/^options?$/i.test(sectionHeader)) { section = 'options'; continue; }
    if (/^abilities?$/i.test(sectionHeader)) { section = 'abilities'; continue; }

    // ── Header key-value fields ────────────────────────────────────────────
    if (section === 'header') {
      const kv = line.match(/^([^:]+):\s*(.+)$/);
      if (kv) {
        const key = kv[1].trim().toLowerCase();
        const val = kv[2].trim();
        if (key === 'name')    { unit.name = val; unit.id = toKebabCase(val); }
        if (key === 'faction') { unit.faction = val; }
        if (key === 'role')    { unit.role = normalizeRole(val); }
        if (key === 'points')  { unit.basePoints = parseInt(val, 10) || 0; }
      }
      continue;
    }

    // ── Stats — skip the column-header row (M T SV W LD OC) ───────────────
    if (section === 'stats') {
      if (/^[mM]\s+[tT]\s+/i.test(line)) { section = 'statrow'; continue; }
    }
    if (section === 'statrow') {
      const cells = line.split(/\s+/).filter(Boolean);
      if (cells.length >= 6) {
        unit.stats.movement         = parseStat(cells[0]);
        unit.stats.toughness        = parseStat(cells[1]);
        unit.stats.save             = parseStat(cells[2]);
        unit.stats.wounds           = parseStat(cells[3]);
        unit.stats.leadership       = parseStat(cells[4]);
        unit.stats.objectiveControl = parseStat(cells[5]);
      }
      section = 'header'; // stats block done, back to looking for next section
      continue;
    }

    // ── Weapons (pipe-separated) ───────────────────────────────────────────
    if (section === 'weapons') {
      // Skip column-header rows
      if (/^name\s*\|/i.test(line)) continue;

      const parts = line.split('|').map(s => s.trim());
      if (parts.length < 7) continue; // malformed, skip

      const [wName, wType, wRange, wAtk, wSkill, wStr, wAP, wDmg, wAbilities] = parts;

      const isRanged = wRange.toLowerCase() !== 'melee';
      const weaponId = toKebabCase(wName);

      const weapon = {
        id:               weaponId,
        name:             wName,
        type:             normalizeWeaponType(wType),
        range:            isRanged ? (parseInt(wRange, 10) || wRange) : 'Melee',
        attacks:          parseDiceField(wAtk),
        strength:         parseInt(wStr, 10) || 0,
        armourPenetration: parseInt(wAP, 10) || 0,
        damage:           parseDiceField(wDmg),
        abilities:        wAbilities
                            ? wAbilities.split(',').map(s => s.trim()).filter(Boolean)
                            : [],
      };

      // Attach BS (ranged) or WS (melee) from the skill column
      if (isRanged) {
        const bs = wSkill.replace('+', '');
        weapon.ballisticSkill = parseInt(bs, 10) || 0;
      } else {
        const ws = wSkill.replace('+', '');
        weapon.weaponSkill = parseInt(ws, 10) || 0;
      }

      unit.weapons.push(weapon);
      continue;
    }

    // ── Options (pipe-separated: Name | id | points) ──────────────────────
    if (section === 'options') {
      if (/^name\s*\|/i.test(line)) continue;
      const parts = line.split('|').map(s => s.trim());
      if (parts.length < 3) continue;

      const [oName, oId, oPts] = parts;
      unit.options.push({
        id:     oId || toKebabCase(oName),
        name:   oName,
        points: parseInt(oPts, 10) || 0,
      });
      continue;
    }

    // ── Abilities (one per line or comma-separated) ────────────────────────
    if (section === 'abilities') {
      const abilities = line.split(',').map(s => s.trim()).filter(Boolean);
      unit.abilities.push(...abilities);
      continue;
    }
  }

  // Derive id from name if not set via Name: key
  if (!unit.id && unit.name) unit.id = toKebabCase(unit.name);

  return unit;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateUnit(unit) {
  const errors = [];

  if (!unit.id)      errors.push('Missing: id');
  if (!unit.name)    errors.push('Missing: name');
  if (!unit.faction) errors.push('Missing: faction');
  if (!VALID_ROLES.includes(unit.role))
    errors.push(`Invalid role "${unit.role}". Must be one of: ${VALID_ROLES.join(', ')}`);
  if (typeof unit.basePoints !== 'number' || unit.basePoints < 0)
    errors.push('basePoints must be a non-negative number');
  if (!unit.stats || typeof unit.stats !== 'object')
    errors.push('Missing: stats');
  if (!Array.isArray(unit.weapons))
    errors.push('weapons must be an array');
  if (!Array.isArray(unit.options))
    errors.push('options must be an array');
  if (!Array.isArray(unit.abilities))
    errors.push('abilities must be an array');

  return errors;
}

// ── JSON I/O ─────────────────────────────────────────────────────────────────

function loadUnitsJson() {
  if (!fs.existsSync(UNITS_JSON_PATH)) return [];
  try {
    const raw = fs.readFileSync(UNITS_JSON_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[hydrate-units] Failed to parse ${UNITS_JSON_PATH}: ${e.message}`);
    process.exit(1);
  }
}

function saveUnitsJson(units) {
  const formatted = JSON.stringify(units, null, 2);
  fs.writeFileSync(UNITS_JSON_PATH, formatted, 'utf8');
}

function appendUnit(newUnit, dryRun) {
  const units = loadUnitsJson();
  const duplicate = units.find(u => u.id === newUnit.id);

  if (duplicate) {
    console.warn(`[hydrate-units] SKIP — unit with id "${newUnit.id}" already exists.`);
    console.warn('  Use --overwrite to replace it, or give the unit a unique id.');
    return;
  }

  if (dryRun) {
    console.log('\n[hydrate-units] DRY RUN — parsed unit (not written):\n');
    console.log(JSON.stringify(newUnit, null, 2));
    return;
  }

  units.push(newUnit);
  saveUnitsJson(units);
  console.log(`[hydrate-units] ✓ Appended "${newUnit.name}" (${newUnit.id}) to ${UNITS_JSON_PATH}`);
  console.log(`  Total units in roster: ${units.length}`);
}

function overwriteUnit(newUnit, dryRun) {
  const units = loadUnitsJson();
  const idx = units.findIndex(u => u.id === newUnit.id);

  if (dryRun) {
    console.log('\n[hydrate-units] DRY RUN — parsed unit (not written):\n');
    console.log(JSON.stringify(newUnit, null, 2));
    return;
  }

  if (idx >= 0) {
    units[idx] = newUnit;
    console.log(`[hydrate-units] ✓ Overwrote "${newUnit.name}" (${newUnit.id})`);
  } else {
    units.push(newUnit);
    console.log(`[hydrate-units] ✓ Appended "${newUnit.name}" (${newUnit.id})`);
  }
  saveUnitsJson(units);
}

// ── Interactive mode ──────────────────────────────────────────────────────────

async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  console.log('\n[hydrate-units] Interactive mode — press Ctrl+C to abort.\n');

  const name    = await ask('Unit name: ');
  const faction = await ask('Faction: ');
  const roleRaw = await ask(`Role (${VALID_ROLES.join(' | ')}): `);
  const points  = await ask('Base points: ');

  console.log('\nStats (press Enter to keep default):');
  const movement  = await ask('  Movement (e.g. 6): ');
  const toughness = await ask('  Toughness: ');
  const save      = await ask('  Save (e.g. 3+): ');
  const wounds    = await ask('  Wounds: ');
  const ld        = await ask('  Leadership (e.g. 6+): ');
  const oc        = await ask('  Objective Control: ');

  const unit = {
    id:         toKebabCase(name),
    name:       name.trim(),
    faction:    faction.trim(),
    role:       normalizeRole(roleRaw),
    basePoints: parseInt(points, 10) || 0,
    stats: {
      movement:         parseStat(movement  || '6'),
      toughness:        parseStat(toughness || '4'),
      save:             parseStat(save      || '3+'),
      wounds:           parseStat(wounds    || '1'),
      leadership:       parseStat(ld        || '7+'),
      objectiveControl: parseStat(oc        || '1'),
    },
    options:   [],
    weapons:   [],
    abilities: [],
  };

  console.log('\n[hydrate-units] Parsed unit:');
  console.log(JSON.stringify(unit, null, 2));

  const confirm = await ask('\nWrite to units.json? (y/N): ');
  rl.close();

  if (confirm.trim().toLowerCase() === 'y') {
    appendUnit(unit, false);
  } else {
    console.log('[hydrate-units] Aborted — nothing written.');
  }
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  const dryRun      = args.includes('--dry-run');
  const overwrite   = args.includes('--overwrite');
  const interactive = args.includes('--interactive');
  const useStdin    = args.includes('--stdin');

  const fileFlag = args.indexOf('--file');
  const filePath = fileFlag !== -1 ? args[fileFlag + 1] : null;

  if (args.includes('--help') || args.length === 0) {
    console.log(`
hydrate-units — parse a Warhammer 40k datasheet and append it to units.json

Usage:
  node scripts/hydrate-units.js --file <datasheet.txt>   Parse a text file
  node scripts/hydrate-units.js --stdin                  Read from stdin
  node scripts/hydrate-units.js --interactive            Prompt for values

Flags:
  --dry-run     Print parsed JSON without writing to units.json
  --overwrite   Replace an existing unit with the same id
  --help        Show this message

Datasheet format (pipe-separated weapons/options):
  Name: <Unit Name>
  Faction: <Faction>
  Role: <HQ | Troops | Elites | Fast Attack | Heavy Support | Flyer | Dedicated Transport>
  Points: <number>

  Stats:
  M  T  SV  W  LD  OC
  6  4  3+  2  6+   1

  Weapons:
  <Name> | <Type> | <Range> | <Attacks> | <BS/WS> | <Str> | <AP> | <Damage> | <Abilities>

  Options:
  <Name> | <id> | <points>

  Abilities:
  <Ability Name>, <Ability Name>
`);
    process.exit(0);
  }

  let text = '';

  if (interactive) {
    await runInteractive();
    return;
  }

  if (filePath) {
    if (!fs.existsSync(filePath)) {
      console.error(`[hydrate-units] File not found: ${filePath}`);
      process.exit(1);
    }
    text = fs.readFileSync(filePath, 'utf8');
  } else if (useStdin) {
    text = await new Promise(resolve => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => resolve(data));
    });
  } else {
    console.error('[hydrate-units] Specify --file <path>, --stdin, or --interactive. Use --help for details.');
    process.exit(1);
  }

  const unit   = parseDatasheet(text);
  const errors = validateUnit(unit);

  if (errors.length > 0) {
    console.error('[hydrate-units] Validation failed:');
    errors.forEach(e => console.error(`  • ${e}`));
    process.exit(1);
  }

  if (overwrite) {
    overwriteUnit(unit, dryRun);
  } else {
    appendUnit(unit, dryRun);
  }
}

main().catch(err => {
  console.error('[hydrate-units] Unexpected error:', err.message);
  process.exit(1);
});
