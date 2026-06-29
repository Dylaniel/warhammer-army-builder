# Warhammer Army Builder — Project Reassessment

**Date:** 2026-06-12

## 1. Overview

This document is a candid assessment of the project's current state, written when work was resumed after an initial development period begun with Cursor in summer 2025. It is intended as a persistent reference in case conversation history is lost.

The project is called **Battle Forge** — a mobile-styled (390×844 px, iPhone-sized) Next.js web app that sits in a browser and simulates a native mobile experience. The goal is a Warhammer 40K army list builder with three tabs: Reference (rules), Battle Forge (army management), and Profile (settings).

## 2. What Works

- **Next.js 15 + React 19 scaffold** is in good shape. The project builds and runs (`npm run dev`).
- **App shell is functional**: `BattleForgeApp.tsx` correctly orchestrates tab routing, localStorage persistence for armies, and dark/light theme via `ThemeContext`.
- **ThemeContext** is a clean implementation — persists to localStorage, toggles correctly via `ProfileTab`.
- **Army creation flow** works end-to-end: `NewArmyModal` → `BattleForgeTab` → stored in state + localStorage.
- **ArmyDetailTab** has a working UI skeleton: category accordion sections (Characters, Battleline, etc.) with an expandable unit picker.
- **Type system (`army.ts`)** is well-structured — `Army`, `Unit`, `UnitRole`, `UnitStats`, `Weapon`, `UnitOption` types are all defined and used.
- **`unitUtils.ts`** is a solid utility library (`getAllUnits`, `getUnitsByRole`, `calculateArmyPoints`, `createArmyUnit`, etc.) — mostly unused by the UI yet but ready.
- **PRD (`scripts/prd.md`)** and **task list (`tasks/tasks.json`)** exist and give good context on intended scope and phasing.
- **ESLint + Prettier** are configured, with TypeScript ESLint plugin in place.


## 3. Issues & Gaps Found

### 3.1 Critical / Blocking

+
#### Almost zero unit data
`src/data/units.json` contains **exactly one unit**: an Infernus Squad (Space Marines, TROOPS role). This means the entire unit selection UI is essentially non-functional in practice — you can add an Infernus Squad to any category, but that's it. The PRD's Phase 1 goal of "Space Marines faction support" is very far from complete.  
`src/data/units/` (subdirectory) is completely **empty**.

-this is intentional, we do not want to strictly enforce rules like this only warn of them. if we strictly limit points by having a max value for the field either technically or voluntarily and we enforce it, the app will be less flexible for those homebrewing.
#### Points budget not enforced
The army's `points` field is set when creating the army (e.g. 2000 pts) and then never touched again. Adding units does not subtract from or compare against this budget, and there is no running "X/2000 pts used" display anywhere. The `calculateArmyPoints` utility exists in `unitUtils.ts` but is never called from the UI.

+
#### Unit removal is missing
Once a unit is added to a category in `ArmyDetailTab`, there is no way to remove it. There is no delete button on added units.

+
#### Army editing is missing
Armies can be created and viewed but not edited (name, faction, detachment, points limit). The only action on an army card is "View" or "Delete".

### 3.2 Architecture / Code Quality

#### Dual PostCSS config files (conflict risk)
Both `postcss.config.js` (CJS, uses `tailwindcss: {}`) and `postcss.config.mjs` (ESM, uses `@tailwindcss/postcss` + `tailwindcss` + `autoprefixer`) exist at root. This is almost certainly a leftover from a botched Tailwind v4 migration attempt. Next.js will pick one depending on the environment, but having both is confusing and could cause unexpected build behaviour. The `.mjs` file also references `@tailwindcss/postcss` (a Tailwind v4 plugin) while `package.json` actually installs **Tailwind v3** (`"tailwindcss": "^3.4.17"`). The `@tailwindcss/postcss` devDependency is installed (`"@tailwindcss/postcss": "^4.1.11"`) but belongs to v4, creating a version mismatch. **Recommendation:** Delete `postcss.config.mjs` and keep only the CJS config with `tailwindcss` + `autoprefixer`.

#### `output.css` committed to source control
`src/styles/output.css` (17 KB) is a compiled CSS artefact that should **not** be in version control. It is not referenced by the app (the app imports `globals.css`), is redundant, and will cause noisy git diffs. Add it to `.gitignore` or delete it.

#### Broken `dark:` Tailwind classes
The theme is implemented via a custom `ThemeContext` that adds a `dark` or `light` class to `<html>`. Tailwind's `dark:` variant works when `darkMode: 'class'` is set in `tailwind.config.js`, but **that config option is absent**. This means every `dark:text-white`, `dark:bg-gray-700`, etc. class in the components is non-functional. The components try to compensate with dual classes (e.g. `bg-gray-800 dark:bg-gray-800 bg-gray-100`) but the pattern is inconsistent and many elements will simply not theme correctly.  
**Recommendation:** Add `darkMode: 'class'` to `tailwind.config.js`.

#### `interfaces.ts` is entirely commented out
`src/types/interfaces.ts` contains 53 lines of completely commented-out code with placeholder comments like `// possibly need more, need to check rule books`. This is dead weight — it was superseded by `army.ts`. Should be deleted or repurposed as a draft scratchpad.

#### `ArmyDetailTab` duplicates `unitUtils.ts` logic
`ArmyDetailTab.tsx` has its own `createArmyUnit` function inline (lines 16–24) that duplicates the one in `unitUtils.ts`. The `unitUtils.ts` version is more complete (handles options, quantity). The component should import from `unitUtils.ts` instead.

#### `any[]` types in army creation interfaces
`BattleForgeTab.tsx` and `NewArmyModal.tsx` use `any[]` for the unit category arrays in the form data type. These should be typed as `Unit[]`.

#### `ArmyCard` has conflicting Tailwind classes
In `BattleForgeTab.tsx` line 15: `className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg..."` — two conflicting `bg-*` classes on the same element. CSS specificity will make whichever comes last in the compiled stylesheet win, ignoring the intended theming. This pattern repeats throughout the codebase.

#### `setArmies` prop type is too narrow
`BattleForgeTab` receives `setArmies: (armies: Army[]) => void` instead of the React `Dispatch<SetStateAction<Army[]>>`. This prevents functional update patterns (`prev => [...]`) and is a common footgun.

#### Mixed line endings
Some files use `\r\n` (CRLF — Windows) and others use `\n` (LF). `.gitattributes` exists but the inconsistency made it through. This is minor but worth a `git add --renormalize .` pass.

#### `FloatingActionButton.tsx` listed in README but doesn't exist
The README's component structure table lists `FloatingActionButton.tsx`, but that file does not exist in `src/components/`. The README is stale.

#### `page.tsx` has `'use client'` at root layout level unnecessarily
`src/app/page.tsx` is marked `'use client'`. Since this file just re-exports `BattleForgeApp`, which is already `'use client'`, the directive is harmless but unnecessary and opts out the page from potential future RSC optimisations.

### 3.3 UX / Product Gaps

+ this is certainly a problem but we are primarily working with mobile as our baseline as the official app is mobile only. while we may support other resolutions in the future, it is not a priority at the moment since at the end of the day it is still usable on desktop even if not ideal.
#### Fixed pixel dimensions break on most screens
The phone shell is hardcoded to `w-[390px] h-[844px]` with a `gridTemplateRows: '20px 64px 623px 64px'` layout. This works on a 1440p display but will overflow or look broken on smaller laptops. There is no viewport-aware fallback.

-refer to note above the next issue listed, we are by default focused on the standard rules in which factions are determined at army creation and as such would be filtered automatically for the user within the standard categories. Filtering would however be useful in the theoretical homebrew category mentioned below.
#### No faction filtering on unit picker
When adding units in `ArmyDetailTab`, the available units list is filtered by *role* (HQ, TROOPS, etc.) but **not by faction**. A Space Marines army can theoretically be shown units from any faction once more data is added.

-this is the terminology in the official app, which we are replicating to get around their mandatory subscription for multiple armies. this is intentional. although there is a possibility that we add one original category for outside factions to help with homebrew armies in similar vain to our philosiphy with max points limits.

#### Category names don't match 10th edition terminology
The app uses `Characters / Battleline / Dedicated Transports / Other Datasheets / Allied Units` — which is close to correct for 10th edition, but "Other Datasheets" is vague. In actual 10th edition rules, the primary categories are Characters, Battleline, Infantry, Mounted, Beasts, Monster, Vehicle, and Dedicated Transports (Allied are a detachment-level concept). The role enum (`HQ`, `TROOPS`, `ELITES`, `FAST_ATTACK`, `HEAVY_SUPPORT`) also mixes 8th/9th edition terminology (`HQ`, `TROOPS`) with a partial 10th edition list.

+
#### Reference tab is placeholder text
The Reference tab contains four `<details>` accordion items with generic placeholder paragraphs, not actual game rules or faction data.

+
#### Profile tab is bare
The Profile tab has a dark/light toggle and the placeholder text "User profile and settings go here." No settings, no user-facing customisation beyond theme.

+ additionally we should add a behavior to the counter box where it changes to red if you go over the max points limit, but does not otherwise stop you.
#### No real-time points tracking visible in the army detail view
The army detail screen shows the army's *target* point limit, but has no running counter of how many points are currently committed to units.

+

## 4. Dependency / Config Notes

| Package | Installed Version | Notes |
|---|---|---|
| `next` | 15.4.1 | Current, good |
| `react` / `react-dom` | 19.1.0 | Current, good |
| `tailwindcss` | ^3.4.17 | v3, but `@tailwindcss/postcss` (v4 plugin) is also installed — conflicting |
| `@tailwindcss/postcss` | ^4.1.11 | v4 adapter — should be removed if staying on v3 |
| `typescript` | ^5 | Good |
| `eslint` | ^9 | Good |
| No state management lib | — | localStorage-only is fine for MVP |
| No testing framework | — | No unit or integration tests exist |

+
## 5. What the Tasks File Says vs. Reality

The `tasks/tasks.json` describes a 10-task roadmap. Checking actual status:

| Task | Planned Status | Actual State |
|---|---|---|
| 1 — Project Setup | `in-progress` | ✅ Essentially done |
| 2 — Core Data Models | `pending` | ✅ Largely done (`army.ts`) |
| 3 — Space Marines Faction Data | `pending` | 🔴 ~5% done (1 unit) |
| 4 — Basic UI Components | `pending` | 🟡 ~60% done (shell + cards + modal, missing unit card, stats display) |
| 5 — Points Calculation Engine | `pending` | 🟡 ~40% done (`unitUtils.ts` has the logic; UI doesn't use it) |
| 6 — Unit Selection Interface | `pending` | 🟡 ~30% done (expandable list, but no search/filter/stats) |
| 7 — Army Validation Rules | `pending` | 🔴 0% done |
| 8 — Local Storage | `pending` | ✅ Done (armies persist, theme persists) |
| 9 — Army List Management UI | `pending` | 🟡 ~40% done (create/view/delete; no edit) |
| 10 — Export & Sharing | `pending` | 🔴 0% done |

+
## 6. Recommended Priority Order for Resuming Work

1. **Fix the Tailwind v3/v4 conflict** — delete `postcss.config.mjs`, remove `@tailwindcss/postcss` from devDependencies, add `darkMode: 'class'` to `tailwind.config.js`. This unblocks reliable theming throughout the app.
2. **Fill out Space Marines unit data** — even 20–30 units across all roles would make the app genuinely usable. This is the single biggest gap between what the UI promises and what it can deliver.
3. **Wire up points tracking** — call `calculateArmyPoints` from `ArmyDetailTab`, display running total vs. army limit, prevent going over budget.
4. **Add unit removal** — a simple ✕ button on each added unit row.
5. **Add army editing** — let users rename an army or change its point limit from the detail screen.
6. **Clean up dead code** — delete `interfaces.ts`, `output.css`, `postcss.config.mjs`; fix README component list.
7. **Decide on Tailwind version** — either fully migrate to v4 (update config, rename utilities) or stay on v3 and clean up the v4 artefacts.
8. **Add faction filter to unit picker** — filter available units by the army's `faction` field.
9. **Add unit stats display** — when a user is picking a unit, show movement/toughness/save/wounds etc.
10. **Consider responsive layout** — the fixed 390×844 shell is a deliberate design choice (phone emulator aesthetic) but needs a graceful fallback for small viewports.

+
## 7. Overall Assessment

The project has a **solid foundation**: the tech stack choices are sound, the component architecture is clean and not over-engineered, the type system is well-thought-out, and the UI shell (navigation, modals, army cards) is functional. It is genuinely a good starting point.

The main problems are: (a) the Tailwind config conflict that breaks the dark mode theme silently, (b) the near-total absence of real game data, and (c) the gap between what the utilities can calculate and what the UI actually shows. None of these are difficult to fix — they are typical "summer side project" states where the scaffolding got built but the content layer and wiring never quite caught up.

With a focused effort of a few sessions, this could reach a genuinely usable Phase 1 MVP (one faction, working points tracking, unit add/remove).
