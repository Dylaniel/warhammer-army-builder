# OpenForge â€” Task List

> **For AI agents and human contributors alike.**
> This is the canonical task list for the OpenForge project.
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

- [x] **4.1 Addition of Remaining Factions**
  - Introduce barebones, unhydrated JSON structures for all remaining factions matching current repository schema standards, establishing framework files before asset data population.

- [x] **4.2 Base Detachment Options UI & Faction Gating**
  - Hydrate basic detachment naming options per faction. In the army creation UI, the detachment selector dropdown must be disabled (greyed out) until a faction is actively selected. Once selected, dynamically unlock the dropdown populated exclusively with eligible detachment options for that specific faction.

- [x] **4.3 Full Unit Library Hydration**
  - Populate the newly added faction files with complete unit rosters, weapon configurations, and scaling point tiers. Execute this task strictly after base detachment selection architecture is stable to ensure proper data layout alignment.
  - **UX Enhancements to incorporate:** 
    - Ensure weapon sections in the unit viewer have their stats labeled above them inline with the weapons title (e.g., Range, A, S, AP, D).
    - Ensure unit abilities explicitly state the language of the rules in the viewer.
    - *Note:* These UX enhancements must also be retroactively applied to the Space Marines units since they were already implemented.

---

## Phase 5 — Rules Integration & In-Game Battle Mode

> Interactive rule tracking and live tabletop dashboards.

- [x] **5.1 Detachment Rules, Benefits & Keywords**
  - Attach target rules engines and static data modifiers to individual detachments. Implement conditional benefits that dynamically track specific unit types or weapon profiles (e.g., granting automated hit/wound bonuses or behavior rules to units carrying flame-based weapons).

- [x] **5.2 Interactive Battle Mode Dashboard**
  - Build an optimized, play-focused "Battle Mode" interface for live tabletop usage. This view must aggregate all rule sets, detachments, traits, and abilities associated with the active army list and cleanly filter/display them organized by active game phases (e.g., Command Phase, Movement Phase, Shooting Phase options).

---

## Phase 6 — Data Serialization & Portability

> List sharing and JSON ecosystem integration.

- [x] **6.1 Entity-Centric Detachment Schema Refactoring**
  - Refactor the data architecture to decouple detachment rules from parent-state conditional sweeps. Units, weapons, or profiles must explicitly declare their own applicable detachment bonuses within their schema object. Each bonus item must store a validation key indicating which detachment(s) it belongs to. 
  - **Crucial Rendering Rule:** The bonus text stored and rendered must reflect the exact, verbatim wording of the official tabletop rules. The application must not attempt to summarize or independently interpret ambiguous mechanics; it must provide the exact wording so players and their opponents can exercise human discretion during live gameplay. The rendering engine will simply read the entity's intrinsic array and display this verbatim text if the army's active detachment string matches.

- [x] **6.2 Rebrand App to "OpenForge"**
  - Public-facing titles, meta tags, and UI headers already read OpenForge from earlier work. Completed the rebrand by also renaming the internal component files/exports (`BattleForgeApp.tsx` → `OpenForgeApp.tsx`, `BattleForgeTab.tsx` → `OpenForgeTab.tsx`, `TabType`'s `'battleForge'` key → `'openForge'`), `package.json`'s `name` field, and doc references in `README.md`/`AGENTS.md` for full consistency. Verified in dev server: header, nav tab, and page `<title>` all read OpenForge.

- [x] **6.3 Vercel Deployment Readiness**
  - `vercel.json` previously contained a Vite/CRA-style SPA rewrite (`/(.*) → /index.html`) that doesn't apply to this Next.js App Router project — Next.js doesn't emit a root `index.html`, and Vercel auto-detects and zero-configs Next.js deployments on its own. That file would likely have broken routing on an actual deploy despite `npm run build` passing locally (Next's local build pipeline ignores `vercel.json`). Removed it; deployment now relies on Vercel's built-in Next.js zero-config handling. `npm run build` verified clean (no TS/build errors).

- [x] **6.4 Unit Composition Schema & UI Refactor**
  - Landed on a `ModelGroup`-based schema (per the user-supplied `geminiUnitInterfacesExample.ts` framework) rather than the originally-worded `profiles: Profile[]`. `army.ts` gained `WargearOption`, `ModelGroup` (id, name, `category: 'leader' | 'follower'`, stats, min/maxQuantity, availableOptions, equippedWargear) and `UnitPointTier` (composition map → points); `Unit` gained `modelGroups?: Record<string, ModelGroup>` and `pointTiers?: UnitPointTier[]`. Legacy `Profile`, `stats`, `pointsTiers`, and name-keyed `composition` are marked `@deprecated` and retained in the codebase for history, but are no longer used at runtime.
  - **Data migration:** `scripts/migrate-units-to-profiles.js` converted all 432 units across 27 faction files into `src/data/factions-v2/`, leaving the original `src/data/factions/` untouched as history. `useFactionUnits` now loads `factions-v2`. Per `TABLETOP_RULES.md` ("do not invent rules"), migration did **not** fabricate leader/follower splits or multi-model point tiers — each migrated unit has one model group at min=max=1 derived strictly from existing data. Authentic multi-model-group compositions are Task 6.6's job.
  - **UI:** `UnitDetailTab`'s Unit Composition accordion renders an independent bounds-clamped counter per model group; `ArmyDetailTab` roster cards render mixed composition via `describeUnitComposition`, and the unit-picker stat block uses the crash-safe `getDisplayStats`. Composition/points logic lives in `unitUtils.ts` per AGENTS.md §1.
  - **QA:** Pass 1 failed with 3 defects (lost counter updates, lost roster updates, truncated duplicate ids); all three fixed via the One-Strike loop by making the whole update chain functional, and independently re-verified in Pass 2. `npm run build` clean throughout.

- [ ] **6.4a Fix lost updates on army-list actions** *(found by Task 6.4 Pass 2 QA — pre-existing, not introduced by 6.4)*
  - `OpenForgeTab.tsx` line ~157 `onDelete` uses `setArmies(armies.filter(...))`, closing over the render-time `armies` prop instead of the functional `setArmies(prev => ...)` form. Deterministic repro: with armies A/B/C, clicking Delete on C then immediately on B removes only B — C survives. `handleCreateArmy` (~line 100) and the local `EditArmyModal onSubmit` (~lines 169-172) share the identical anti-pattern. Task 6.4 fixed this bug class in `ArmyDetailTab`/`UnitDetailTab` but this outer layer was out of its scope.

- [ ] **6.4b Sanitize legacy composition display values** *(found by Task 6.4 Pass 2 QA — minor)*
  - `describeUnitComposition`'s legacy fallback in `unitUtils.ts` (~lines 151-155) interpolates `count` with no type/finite check, so a corrupted legacy `composition` renders literal roster text like `-3x Sergeant, nullx Marine, notanumberx Garbage`. No crash and no `NaN`, but inconsistent with the `modelGroups` path, which coerces defensively via `normalizeModelGroupComposition`.

- [x] **6.5 HQ / Warlord Validation Warning**
  - Added `getWarlordStatus(army)` to `unitUtils.ts` returning a discriminated union (`no-characters` | `no-warlord-designated` | `ok`), keeping the logic out of the component per AGENTS.md §1. `ArmyDetailTab` renders a `WarlordWarningBanner` beneath the army header that distinguishes the two cases with different guidance — add a Character first, vs. designate one of the existing Characters via the ⋮ menu — and renders nothing once a Warlord is set.
  - Strictly advisory per the project's "warns but never blocks" value: nothing is disabled or gated. Verified at runtime across all three states (empty army → character added → warlord designated → warlord deleted brings it back), and confirmed units can still be added/deleted and Battle Mode opened while the banner shows.

- [x] **6.6 Automated Data Pipeline & Full Hydration** — *merged after Loop 1 of the Two-Strike protocol passed both fresh-tester checks. Newly-found defects below are tracked separately, not blockers.*
  - **Done:** `scripts/parse-bsdata.ts` parses the BattleScribe catalogues in `raw-data/` (gitignored) into `src/data/factions-v3/`. Output: 27 files, **1597 units** (up from 432 in v2), all with complete six-stat statlines, and **381 with genuine multi-model-group compositions** — the leader/follower splits Task 6.4's schema was built for but which no dataset previously exercised. All faction strings map to `SUPPORTED_FACTIONS` with full coverage. Spot-checked against source: Intercessor Squad 5→80/10→160, Infernus Squad 5→90/10→180, Terminator Squad 5→170/10→340. Added `fast-xml-parser` + `tsx` devDeps and a `parse:bsdata` npm script.
  - **Done:** runtime switched to `factions-v3` (`useFactionUnits`); v2 and the original `factions/` retained on disk as history. Fixed tier resolution to round **up** by total model count (a 7-model squad was being charged the 5-model price), `||`→`??` so legitimately-free units (Spore Mines, Ripper Swarms) aren't repriced, and seeded compositions from the cheapest tier for the 60 units whose model groups all allow `minQuantity: 0`.
  - **Done — One-Strike fix pass (all 4 Pass 1 defects fixed, re-verified by Pass 2):** `65805e7` composition summary never falls through to the legacy branch, so raw ModelGroup ids can no longer leak; `7df73bc` new `getUnitModelCeiling()` caps a unit's total models at its largest tier (Intercessor Squad can no longer reach 12 models for the 10-model price) with clamping in the handler as well as the UI — Pass 2 could not bypass it even by invoking React's `onClick` prop directly 30 times; `5fdbb8e` new `getUnitPickerPrice()` shows the cheapest tier instead of stale `basePoints` (Crusader Squad 150→300); `b98dd78` `toFinitePoints`/`getSafeUnitPoints` guard all four point-display sites against non-numeric localStorage. Fixes were deliberately runtime-only — no dataset regeneration.

  - **Done — Loop 1 fix pass (Two-Strike protocol), both defects fixed and independently verified by two fresh concurrent testers:**
    - `35ab9ba` **(was CRITICAL)** `normalizeModelGroupComposition` now seeds from the cheapest tier whenever the min-derived default totals fewer models than that tier requires, generalizing the old all-minimums-zero special case. Verified across all 1597 units: units seeding below their cheapest tier went **177 → 0**, exactly 177 compositions changed, 1420 byte-identical, 0 bounds violations, 0 seeded above their model ceiling, 0 trapped un-decrementable. Live: Orks Boyz now seeds `9x Boy + 1x Boss Nob` @80pts, Crusader Squad 20 models @300pts, Intercessor Squad unchanged at `1x Sergeant + 4x Intercessor` @80pts.
      - *Blast radius correction:* the Pass 2 report's "120 affected" was an undercount. QA adjudicated the true figure as **177** — the 120 heuristic only matched the literal one-mandatory-leader shape and missed 70 units where two or more groups had nonzero minimums that still summed short of the cheapest tier (Battle Sisters Squad 7→10, Kasrkin 3→14, Death Korps 18→36, and 65 others).
      - *Notable:* QA confirmed `oldPts === newPts` for all 177 — the old code already billed the cheapest-tier price via round-up, so this is purely a **display** correction bringing the shown composition into line with the price already charged. Zero points blast radius.
    - `0c71027` **(was MAJOR)** `Max Point Tester` dev fixture removed from `src/data/units.json` (emptied to `[]`; the file is an established import in two modules). Verified absent across 8 factions. QA narrowed the original report: the fixture was only ever reachable in **Space Marines** armies, not "any faction", because `ArmyDetailTab` filters on `unit.faction`.

  - **NEW — found by Loop 1 QA, not yet fixed:**
    1. *(MAJOR, pre-existing — 1 of 27 factions is completely unusable)* `useFactionUnits.ts:33` normalizes a faction name with `.toLowerCase().replace(/\s+/g,'-')`, which leaves the apostrophe in `T'au Empire` → `t'au-empire`, but the data file is `t-au-empire.json`. Every category in a T'au Empire army shows "No units available for this category." All 26 other factions resolve correctly. Not a regression from this branch — T'au was equally broken before.
    2. *(MAJOR, pre-existing)* `OpenForgeApp.tsx:33-37` — the localStorage save effect fires unconditionally on mount while `armies` is still the initial `[]`, with no guard against the load effect not yet having landed, so it can clobber a saved roster with an empty array. Adjacent to 6.4a but a different file than that item names.
    3. *(MINOR)* `units.json` is now `[]`, which TypeScript infers as `never[]`. Harmless today because both consumers cast via `as Unit[]`, but those casts now validate nothing — a future malformed entry would typecheck silently.
    4. *(MINOR)* `getAllUnits`/`getUnitsByRole`/`getUnitById` in `unitUtils.ts` are exported with **zero callers** and now permanently return empty. Delete or document.
    5. *(MINOR)* Composition values aren't checked for integrality — `Number.isFinite(3.7)` passes, so hand-edited localStorage renders `3.7x Neophyte w/ Firearm`. Pre-existing, line unchanged by this branch.
    6. *(MINOR, cosmetic)* `scripts/hydrate-units.js:454,479,487` help text still says "units.json"; the script actually writes to `src/data/factions/<faction>.json`.

  - **RESOLVED — tier round-up is intended behaviour, not a defect.** Owner decision (2026-08-05): the user may build any total within each group's min/max range, and pays the next tier up if that total isn't a priced size. "If they want to have 6 minis even though it is double the points that is fine, they just won't be as economical as they could be. Ultimately that is up to the user to judge." This is consistent with the project's warns-but-never-blocks value — do not add a hard constraint to legal tier sizes, and do not treat the 356 units with reachable unpriced sizes as a bug.

  - *Superseded — earlier Pass 2 minor findings, still open:* a unit zeroed to 0 models still costs the cheapest tier (Necron Warriors 0 models = 90pts); `toFinitePoints` accepts negative and scientific-notation values (`-50 pts`, `1e+21 pts`).

  - *Superseded — Pass 1 defects, all now fixed (kept for history):*
    1. *(MAJOR)* `describeUnitComposition` (`unitUtils.ts` ~183-199) filters zero-count entries out of the modelGroups branch; when that empties the list it falls through to the legacy branch and prints raw ModelGroup **ids** — e.g. `0x allarus-custodian-guardian-spear, 0x warrior-w-gauss-reaper`. Reachable by clicking every counter to 0 on any of the 60 all-zero-minimum units.
    2. *(MAJOR)* `calculateArmyPoints` (`unitUtils.ts` ~324-331) does `total + (totalPoints ?? basePoints)` with no numeric validation. `??` only guards null/undefined, so a truthy non-numeric `totalPoints` from legacy/corrupt localStorage string-concatenates into garbage like `-50not-a-number-999... / 999 pts`. Pre-existing failure mode, not caused by the `||`→`??` change.
    3. *(MAJOR)* Follower model groups carry independently-generated maxima with no shared cap, so a unit can exceed its largest tier and still be charged that tier's price — Intercessor Squad can be built to 12 models (1 + 9 + 2) for the 10-model price of 160, i.e. 2 free models. The grenade-launcher variant should *replace* Intercessors, not add to them. Root cause is a schema/data-generation gap in `parse-bsdata.ts`, not just pricing logic.
    4. *(MINOR)* 7 of 1597 units have `basePoints` disagreeing with `pointTiers[0].points` (`aquila-kill-team` 100 vs 200, `crusader-squad` 150 vs 300, `death-korps-of-krieg` 65 vs 145, `catachan-jungle-fighters`, `decimus-kill-team`). In-roster price is correct; only the pre-add picker row (`ArmyDetailTab` ~530, which renders `unit.basePoints` directly) is misleading.
  - **Verified clean by QA:** tier round-up at every intermediate count, free-unit pricing, army-total consistency, multi-group counter integrity under 20 rapid synchronous clicks (no lost updates — the Task 6.4 fixes held), 110-unit category render with no hang, zero console errors across the whole session, and 0 duplicate ids / 0 inverted min-max / 0 dangling tier references across all 1597 units.

- [ ] **6.6 (original scope note)**
  - Build a Node.js parsing script (`scripts/parse-bsdata.ts`) to read machine-readable community XML/CAT files (fetched automatically from the community repository at `https://github.com/BSData/wh40k-10e.git` into `/raw-data`) and transform them into 10th-edition compliant JSON files mapped perfectly to the Task 6.1 entity-centric schema. Spawn parallel sub-agents to execute this script across all 26 factions, replacing the currently incomplete partial-hydration files with perfectly accurate datasets.

- [ ] **6.8 Per-Model Wargear — parser hydration** *(prerequisite for 6.9)*
  - `ModelGroup.equippedWargear` and `ModelGroup.availableOptions` exist in `army.ts` but are **empty for all 1597 units** — `parse-bsdata.ts` never populated them. Extend the parser to resolve BSData `entryLink`/`infoLink` references (including into the shared `* Library.cat` catalogues) and fill both fields, keeping the two concepts distinct: `equippedWargear` = what this group already carries (display), `availableOptions` = what it may swap (choice), with `exclusiveWith` for conflicting selections.
  - Attempted to measure how often rank-and-file models (vs. leaders) have real wargear choices, in order to size the UI clutter risk. **The measurement failed and its numbers must not be trusted** — an ad-hoc script reached only 60-169 of 1597 units because it did not resolve `entryLink`s, so its "88% have no wargear choice" reflects unresolved links rather than genuine absence. The owner's own screenshot of the official app shows Infernus Marine (rank-and-file) carrying Bolt pistol / Pyreblaster / Close combat weapon, directly contradicting it. The real frequency distribution falls out of this task as a by-product; decide 6.9's UI only once it exists.

- [x] **6.10 Move Abilities below Composition & Wargear**
  - Owner request: in the unit detail view, Abilities pushed Composition and Wargear Options below the fold. Abilities is now the last section, rendered as a third accordion matching the two above it and defaulted open so nothing previously visible became hidden. Verified order: stat block → weapons → Unit Composition → Wargear Options → Abilities.

- [ ] **6.9 Per-Model Wargear — UI** *(blocked on 6.8)*
  - Reference behaviour, from the official GW app (owner-supplied screenshots): wargear is shown **per model group**, and the widget shape follows the group's size — **checkboxes when the group is a single model** (e.g. Infernus Sergeant), **counters when it has several** (e.g. "Bolt pistol ×4" across 4 Infernus Marines). A "Default Wargear" heading separates the carried loadout from any swaps.
  - Owner's stated concern is clutter — repeating identical rows across five model groups. Mitigations to apply: render nothing for groups with no options; keep the loadout inside the existing collapsed "Wargear Options" accordion rather than expanding every group; surface swap options only where they exist.
  - **DECIDED (2026-08-05): use counters, not per-model checklists.** Owner confirmed after reviewing Sternguard Veteran Squad, which has genuinely complex options ("Any number of models can each have their Sternguard bolt rifle replaced with 1 combi-weapon"; "For every 5 models in this unit, 1 Sternguard bolt rifle can be replaced with one of the following"). A counter per option scales to those "any number" / "1 per 5 models" rules and stays compact; a checklist repeated per model would not. Keep checkboxes only where the group is a single model (the Sergeant), matching the official app.
  - Note the earlier Infernus Squad screenshots were a unit with **no** real options — its three entries are simply its full fixed loadout. Sternguard is the correct reference for what the UI must handle.

- [ ] **6.11 Space Marine Chapter selection (and sub-faction gating generally)**
  - Owner request: the army builder never asks which **Chapter** a Space Marines army belongs to, but Chapter gates which named characters are legal (Roboute Guilliman / Marneus Calgar for Ultramarines, Lion El'Jonson for Dark Angels, etc.).
  - **Verified against BSData — chapters are ADDITIVE overlays, not separate rosters.** Base `Imperium - Space Marines.cat` has 129 units; each chapter catalogue adds only its own named characters on top: Ultramarines 16, Space Wolves 49, Blood Angels 27, Black Templars 20, Dark Angels 19, Deathwatch 16, Imperial Fists 3 (Lysander, Tor Garadon, Pedro Kantor), Iron Hands 2, Raven Guard 2, Salamanders 2, White Scars 2.
  - Six chapters have **no representation at all** in `SUPPORTED_FACTIONS` today: Ultramarines, Imperial Fists, Iron Hands, Raven Guard, Salamanders, White Scars.
  - **Answering the owner's question about other factions:** Thousand Sons is already correct — it is its own full codex catalogue (`Chaos - Thousand Sons.cat`, 68 shipped units), not a sub-faction of Chaos Space Marines, so it needs no gating. Death Guard and World Eaters likewise. The only genuine sub-faction/overlay structure found is Space Marine chapters. (Aeldari has `Craftworlds`/`Drukhari`/`Ynnari` catalogues, but an ad-hoc extraction returned 0 units for all three because they resolve via `entryLink`s — **unverified, do not treat as assessed**. Shipped Aeldari 100 / Drukhari 48 look healthy.)
  - `Chaos - Emperor's Children.cat` (26 units) exists in BSData but is **missing entirely** from `SUPPORTED_FACTIONS`.

- [ ] **6.12 BUG (MAJOR): chapter factions ship without the core Space Marine roster**
  - Direct consequence of the overlay structure found in 6.11, and it is live right now. `blood-angels.json` (27), `dark-angels.json` (19), `black-templars.json` (20), `space-wolves.json` (42) and `deathwatch.json` (11) each contain **only** that chapter's own characters — none of the ~129 core Space Marine datasheets.
  - So a Blood Angels army today cannot add Intercessors, Terminators, a basic Captain, or any core unit; the picker offers only Death Company / Sanguinor / Dante and similar. Five of 27 factions are effectively unusable for real list-building.
  - Fix direction: model a chapter as `base Space Marines roster + chapter overlay` rather than as a standalone faction, which resolves 6.11 and 6.12 together.

- [ ] **6.7 Army Import / Export via JSON**
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