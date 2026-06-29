# BattleForge â€” Task List

> **For AI agents and human contributors alike.**
> This is the canonical task list for the BattleForge project.
> It supersedes `tasks.json` (deleted). Source of truth: `REASSESSMENT.md` (2026-06-12) + live codebase audit.
>
> **Status legend:** `[ ]` todo Â· `[/]` in progress Â· `[x]` done

---

## Intentional Out-of-Scope Decisions

The following items appeared in earlier planning but have been **deliberately scoped out**. Do not re-implement them without explicit discussion.

| Item | Rationale |
|---|---|
| Hard points enforcement (blocking) | App warns but never blocks. Homebrew flexibility is a core project value. |
| Faction filter UI in unit picker | Faction is set at army creation and filters automatically. A separate UI adds complexity for no standard-play gain. Revisit if a homebrew/Allied category is added. |
| Category name overhaul | `Characters / Battleline / Dedicated Transports / Other Datasheets / Allied Units` deliberately matches the official GW app's terminology. |
| Multi-resolution / responsive layout | The 390Ã—844 phone shell is the primary design target. Desktop works even if imperfect. Not a current priority. |

---

## Phase 0 â€” Infrastructure Cleanup

> Fix the build before adding features. The Tailwind dark mode is silently broken until 0.3 is done.

- [x] **0.1** Delete `postcss.config.mjs`. Keep only `postcss.config.js` (CJS, Tailwind v3).
- [x] **0.2** Uninstall `@tailwindcss/postcss` â€” it is a Tailwind v4 adapter installed alongside v3, creating a silent conflict. (`npm uninstall @tailwindcss/postcss`)
- [x] **0.3** Add `darkMode: 'class'` to `tailwind.config.js`. Without this, every `dark:` utility across all components is dead and the theme system does not work.
- [x] **0.4** Delete `src/types/interfaces.ts` â€” entirely commented-out dead code, superseded by `army.ts`.
- [x] **0.5** Delete or gitignore `src/styles/output.css` â€” compiled artefact not referenced by the app; causes noisy diffs.
- [x] **0.6** Fix `ArmyDetailTab.tsx` â€” remove its inline duplicate `createArmyUnit` function and import from `unitUtils.ts` instead.
- [x] **0.7** Fix `any[]` prop types in `BattleForgeTab.tsx` and `NewArmyModal.tsx` â€” replace with `Unit[]`.
- [x] **0.8** Fix `setArmies` prop signature in `BattleForgeTab` â€” change from `(armies: Army[]) => void` to `Dispatch<SetStateAction<Army[]>>` to allow functional update patterns.
- [x] **0.9** Normalize line endings â€” run `git add --renormalize .` to resolve the mixed CRLF/LF state across the repo.

---

## Phase 1 â€” Core Functional Gaps

> The app shell exists but the features that make it actually useful are missing.

- [x] **1.1 Live points counter in Army Detail**
  - Wire `calculateArmyPoints` (already in `unitUtils.ts`) into `ArmyDetailTab`.
  - Display a `X / Y pts` counter in the army detail header at all times.
  - Counter text turns **red** when X > Y. This is a soft warning only â€” no blocking, no cap enforcement.

- [x] **1.2 Unit removal & duplication**
  - Added a 3-dot menu to each unit row in `ArmyDetailTab` with Delete and Duplicate actions.
  - Modifying units updates army state and persists to localStorage.

- [x] **1.3 Army editing**
  - Allow editing army name, faction, detachment type, and points limit from the army detail view or army card.
  - Changes persist to localStorage via the existing `setArmies` pattern.

- [x] **1.4 Reference tab — real content**
  - Replace the four placeholder `<details>` accordions with useful content.
  - MVP scope: 10th edition core rules summary, detachment rules overview, points/limits quick-reference.
  - Does not need to be a full rulebook — enough to be genuinely useful at the table.

- [x] **1.5 Profile tab — usable content**
  - Expand beyond the lone theme toggle.
  - Minimum additions: army count summary, a "clear all armies" action with confirmation.

---

## Phase 2 — Unit Data & Picker Wiring

> The unit picker UI exists but is near-useless with only one unit in the roster.

- [x] **2.1: Data Architecture & Lazy Loading**
  - Implement a `useFactionUnits` hook to lazy-load specific JSON faction files on demand.
  - Convert `units.json` into a split structure: `src/data/factions/{faction-name}.json`.
  - Update `ArmyDetailTab` and `unitUtils` to use the new hook.

- [x] **2.2 Space Marines core roster**
  - Populate `src/data/factions/space-marines.json` with ~20–30 Space Marines units.
  - Use the newly architected `scripts/hydrate-units.js` as the authoring tool.
  - Minimum role coverage: HQ ×3, TROOPS ×4, ELITES ×5, FAST_ATTACK ×3, HEAVY_SUPPORT ×4, DEDICATED_TRANSPORT ×2.
  - All entries must pass the schema rules defined in `.agents/AGENTS.md §2`.

- [x] **2.3 Faction filter in unit picker**
  - `ArmyDetailTab` already filters units by role.
  - Add a second filter: only show units whose `faction` matches the army's `faction` field.
  - No new UI required — this is a data filter on the existing list, automatic from army context.

- [x] **2.4 Stat block display in unit picker**
  - When browsing units to add, show the stat block (M / T / SV / W / LD / OC) and weapon list in the picker row expansion.
  - Users should be able to evaluate a unit before adding it.

---

## Phase 3 — Unit Interaction & Detail View

> Shift from simple army lists to interactive unit inspection and composition editing.

- [ ] **3.1 Army Roster Cards Enhancement**
  - Make the unit cards in the army roster vertically taller.
  - Replicate the brief composition display (e.g., `1x Terminator Sergeant \n 4x Terminator`) under the unit name.
  - The entire unit card should be clickable to navigate to the Unit Detail View.
  - Ensure the 3-dot menu (Delete, Duplicate) remains accessible and functioning properly on the expanded cards.

- [ ] **3.2 Dedicated Unit Detail View**
  - Clicking an active unit in the army roster should navigate the user to a dedicated `UnitDetailTab`.
  - Display the locked content area: the unit's stat block (M, T, SV, W, LD, OC), Weapons, and Abilities.
  - Include a "Unit Composition" accordion/section that allows the user to view the models, scale the unit quantity, and see the corresponding points changes (e.g., 5-man vs 10-man squads).
  - Include "Wargear Options" section indicating available selections (Barebones for now, no real options yet just default).

---

## Parking Lot

Ideas that came up but need more discussion before committing to. + above marks worthy of addition to Phase 4 of primary tasks. Number next to plust indicates sub task number eg. 4.x.:

- **Soft Army Composition Warnings**
  - Warn (non-blocking) when the army violates common composition guidelines (e.g., no Battleline units).
  - Enforce standard 10th edition rules: Max 3 of any given datasheet, Max 6 if Battleline or Dedicated Transport.
  - Flag if the army is missing a Character to serve as the Warlord.
  - Display as a soft-warning banner or badge — never a hard block.

+3
- **Army Import / Export via JSON**
  - Implement a robust system to share army lists natively.
  - **Export**: Add a "Copy as JSON file" button on the army card for existing armies. This will export the entire army state (all components, options, quantities) into a clean JSON string copied to the clipboard.
  - **Import**: When creating a new army, add an "Add via JSON" option. This will open a text box where users can paste the JSON payload to instantly reconstruct the full army list with all options retained.

- **Homebrew / Allied category** 
  - Give it its own per-category faction filter to handle cross-faction complex detachments.
- **Multiple detachments**
  - Supporting multiple detachments within a single army list.

+1
- **Addition of Remaining Factions**
  - Currently only space marines faction is present. Must introduce all other factions and ensure full space marine implementation.
  - New factions should be implemented as barebones, no hydration similar to how space marines were initially implemented.

+2
- **Full Unit Library Hydration**
  - Currently only space marines are hydrated. Other Factions must recieve their respective units.
  - Also includes weapon options, rules for unit composition (X min of leader, Y min of subordinate mini's, point cost for different compositions such as Z points for 4 subordinates, but A points for >4 subordinates)
  - Can refer to tasks 2.2 and 3.2 for reference of implementation for space marines