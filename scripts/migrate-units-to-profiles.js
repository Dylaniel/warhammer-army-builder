/**
 * Task 6.4 migration script.
 *
 * Reads every faction JSON file in src/data/factions/ (flat `stats` +
 * `basePoints` per unit) and writes a structurally-equivalent copy into
 * src/data/factions-v2/ where each unit additionally carries:
 *   - modelGroups: a single ModelGroup derived from the unit's existing
 *     flat `stats` (id: "<unit-id>-model", category: "follower",
 *     minQuantity/maxQuantity: 1, no invented wargear options)
 *   - pointTiers: a single tier { composition: { "<group-id>": 1 },
 *     points: <basePoints> }
 *
 * This does NOT fabricate sergeant/trooper splits, min/max squad sizes, or
 * multi-model point tiers — per .agents/TABLETOP_RULES.md, "Do not invent
 * rules; rely on verbatim text." Authentic multi-model-group data is a
 * separate task (6.6, BSData pipeline). This script only restructures data
 * that already exists in the source files.
 *
 * The original src/data/factions/ files are left untouched — they remain
 * as history. Run with: node scripts/migrate-units-to-profiles.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src', 'data', 'factions');
const DEST_DIR = path.join(__dirname, '..', 'src', 'data', 'factions-v2');

/** Strip a UTF-8 BOM if present, without altering the rest of the string. */
function stripBOM(text) {
  return text.replace(/^﻿/, '');
}

/** Read a JSON file, tolerating an optional leading BOM. Returns the parsed
 * data plus whether the source file had a BOM, so we can preserve the
 * file's existing encoding style when writing the migrated copy. */
function readJsonFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const hadBOM = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  const raw = stripBOM(buffer.toString('utf8'));
  return { data: JSON.parse(raw), hadBOM };
}

/**
 * Convert one legacy flat unit into the Task 6.4 shape by deriving exactly
 * one ModelGroup from its existing `stats`/`basePoints`. All other fields
 * (id, name, faction, role, weapons, abilities, options,
 * detachmentBonuses, etc.) are carried over unchanged.
 */
function migrateUnit(unit) {
  const groupId = `${unit.id}-model`;

  const modelGroup = {
    id: groupId,
    name: unit.name,
    category: 'follower',
    stats: unit.stats,
    minQuantity: 1,
    maxQuantity: 1,
    availableOptions: [],
    equippedWargear: [],
  };

  const migrated = {
    ...unit,
    modelGroups: { [groupId]: modelGroup },
    pointTiers: [
      {
        composition: { [groupId]: 1 },
        points: unit.basePoints,
      },
    ],
  };

  return migrated;
}

function migrateFile(fileName) {
  const srcPath = path.join(SRC_DIR, fileName);
  const destPath = path.join(DEST_DIR, fileName);

  const { data, hadBOM } = readJsonFile(srcPath);

  if (!Array.isArray(data)) {
    throw new Error(`Expected an array of units in ${fileName}, got ${typeof data}`);
  }

  const migratedUnits = data.map(migrateUnit);

  const json = JSON.stringify(migratedUnits, null, 2) + '\n';
  const output = hadBOM ? '﻿' + json : json;

  fs.writeFileSync(destPath, output, 'utf8');

  return migratedUnits.length;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    throw new Error(`Source directory not found: ${SRC_DIR}`);
  }

  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.json'));

  let totalUnits = 0;
  for (const file of files) {
    const count = migrateFile(file);
    totalUnits += count;
    console.log(`  ${file}: ${count} units`);
  }

  console.log(`\nMigrated ${files.length} files / ${totalUnits} units into ${DEST_DIR}`);
}

main();
