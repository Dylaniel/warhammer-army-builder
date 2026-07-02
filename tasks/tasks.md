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

- [x] **3.1 Army Roster Cards Enhancement**
  - Make the unit cards in the army roster vertically taller.
  - Replicate the brief composition display (e.g., `1x Terminator Sergeant \n 4x Terminator`) under the unit name.
  - The entire unit card should be clickable to navigate to the Unit Detail View.
  - Ensure the 3-dot menu (Delete, Duplicate) remains accessible and functioning properly on the expanded cards.
  - For applicaple units of `Character` category, 3-dot menu should have a "make warlord" option. Only one warlord per army, making another character warlord takes it from current warlord. Option should be greyed out in 3-dot menu if a unit is already warlord. 
  - Warlord unit should have a small yellow bookmark tag at top that says "HQ" between name and point cost.

- [x] **3.2 Dedicated Unit Detail View**
  - Clicking an active unit in the army roster should navigate the user to a dedicated `UnitDetailTab`.
  - Display the locked content area: the unit's stat block (M, T, SV, W, LD, OC), Weapons, and Abilities.
  - Include a "Unit Composition" accordion/section that allows the user to view the models, scale the unit quantity, and see the corresponding points changes (e.g., 5-man vs 10-man squads).
  - Include "Wargear Options" section indicating available selections (Barebones for now, no real options yet just default).

---

## Phase 4 — Ecosystem Expansion & Base Detachments

> Expansion of faction support, detachment architecture, and unit hydration.

- [ ] **4.1 Addition of Remaining Factions**
  - Introduce barebones, unhydrated JSON structures for all remaining factions matching current repository schema standards, establishing framework files before asset data population.

- [ ] **4.2 Base Detachment Options UI & Faction Gating**
  - Hydrate basic detachment naming options per faction. In the army creation UI, the detachment selector dropdown must be disabled (greyed out) until a faction is actively selected. Once selected, dynamically unlock the dropdown populated exclusively with eligible detachment options for that specific faction.

- [ ] **4.3 Full Unit Library Hydration**
  - Populate the newly added faction files with complete unit rosters, weapon configurations, and scaling point tiers. Execute this task strictly after base detachment selection architecture is stable to ensure proper data layout alignment.

---

## Phase 5 — Rules Integration & In-Game Battle Mode

> Interactive rule tracking and live tabletop dashboards.

- [ ] **5.1 Detachment Rules, Benefits & Keywords**
  - Attach target rules engines and static data modifiers to individual detachments. Implement conditional benefits that dynamically track specific unit types or weapon profiles (e.g., granting automated hit/wound bonuses or behavior rules to units carrying flame-based weapons).

- [ ] **5.2 Interactive Battle Mode Dashboard**
  - Build an optimized, play-focused "Battle Mode" interface for live tabletop usage. This view must aggregate all rule sets, detachments, traits, and abilities associated with the active army list and cleanly filter/display them organized by active game phases (e.g., Command Phase, Movement Phase, Shooting Phase options).

---

## Phase 6 — Data Serialization & Portability

> List sharing and JSON ecosystem integration.

- [ ] **6.1 Entity-Centric Detachment Schema Refactoring**
  - Refactor the data architecture to decouple detachment rules from parent-state conditional sweeps. Units, weapons, or profiles must explicitly declare their own applicable detachment bonuses within their schema object. Each bonus item must store a validation key indicating which detachment(s) it belongs to. 
  - **Crucial Rendering Rule:** The bonus text stored and rendered must reflect the exact, verbatim wording of the official tabletop rules. The application must not attempt to summarize or independently interpret ambiguous mechanics; it must provide the exact wording so players and their opponents can exercise human discretion during live gameplay. The rendering engine will simply read the entity's intrinsic array and display this verbatim text if the army's active detachment string matches.

- [ ] **6.2 Army Import / Export via JSON**
  - Implement robust list-sharing capabilities as the final ecosystem layer. Build a clipboard-copy mechanism for exporting full active states as JSON strings, alongside a text-area input window during army creation to parse and reconstruct lists.

---

## Parking Lot

Ideas that came up but need more discussion before committing to. + above marks worthy of addition to Phase 4 of primary tasks. Number next to plust indicates recommended sub task number eg. 4.x.:

- **Soft Army Composition Warnings**
  - Warn (non-blocking) when the army violates common composition guidelines (e.g., no Battleline units).
  - Enforce standard 10th edition rules: Max 3 of any given datasheet, Max 6 if Battleline or Dedicated Transport.
  - Flag if the army is missing a Character to serve as the Warlord.
  - Display as a soft-warning banner or badge — never a hard block.

- **Army Import/Export via JSON Extended Future**
  - Implement source feature that utilizes a future account system to list a source for an army as seperate componenet of description. Pureley username in text.

  - **User Account System**
    - Stores user army info for use on different devices seamlessly.
    - Simpler solution is account data export/import similar to armies to avoid complexity of being responsible for user data/authentication, circumventing need for real accounts.

- **Homebrew / Allied category** 
  - Give it its own per-category faction filter to handle cross-faction complex detachments.
- **Multiple detachments**
  - Supporting multiple detachments within a single army list.

- **Edition Picker**
  - Major task that would warrant being it's own phase due to complexity of overhaul and implementation.
  - Army should be designated as under a certain edition which indicates what rules the app should follow.
  - Support would start at 10th edition and future editions, the latest is 11th.
  - Should be a field during army creation.
  - Should display briefly (10th or 11th) on army card on right side, vertically between the points box and the two bottom buttons for edit and view army. Display like sideways bookmark coming from right edge and coloured grey.
  - This feature would require a prerequisite task of designating all current rules as being under 10th edition, and being seperated from hard logic of app functions. Unit options and such may be different and so rules should be identified as a certain edition as seperate logic that is plugged in when an army is of such an edition.
  - Would also require a special scenario for editing an army where if the edition is changed the user should be warned it will wipe all of that armies data (Perhaps not even allow it to be edited) if the edit is made.