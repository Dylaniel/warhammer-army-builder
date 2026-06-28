# BattleForge — Agent Rules & Standards

These rules govern all AI-assisted work in this repository. They are **living standards**: update them when a better pattern emerges from the codebase, not on a schedule.

---

## 1. Code Style & Structure

### TypeScript & React

- **Prefer explicit types over inference** for all function signatures, props, and data-shape boundaries. `any` is banned; use `unknown` and narrow it.
- **Export types from `src/types/`** — never inline complex type definitions inside component files. The canonical source of truth for domain shapes is `army.ts`.
- **Component files are for rendering only.** Business logic (point calculations, validation, unit lookups) belongs in `src/utils/`. Do not duplicate logic already present in `unitUtils.ts`.
- Use **named exports** for components, not default where avoidable. Default exports are acceptable only for Next.js page/layout files required by the framework.
- Keep components **focused and flat**. If a component exceeds ~150 lines it almost certainly needs to be split.

```typescript
// ✅ DO: typed props, logic delegated to utils
import { calculateUnitPoints } from '../utils/unitUtils';

interface UnitCardProps {
  unit: Unit;
  selectedOptions: string[];
}

export function UnitCard({ unit, selectedOptions }: UnitCardProps) {
  const points = calculateUnitPoints(unit, selectedOptions);
  // ...
}

// ❌ DON'T: inline business logic inside components, untyped props
export default function UnitCard({ unit, opts }: any) {
  const points = unit.basePoints + opts.reduce((t: number, id: any) => ...);
}
```

### Styling

- **Tailwind utility classes only** — no inline `style={{}}` objects except for truly dynamic values that Tailwind cannot express (e.g. pixel-precise `gridTemplateRows`). See `BattleForgeApp.tsx` for the current approved exception pattern.
- Do not introduce a new CSS file unless absolutely necessary. The project uses Tailwind; keep it that way.
- Theme-aware styling uses the `useTheme()` hook from `ThemeContext.tsx`. Never hardcode light/dark color values — always branch on `theme`.

---

## 2. Data Layer — `src/data/` and `src/types/`

### The `units.json` Schema

Every entry in `src/data/units.json` **must** conform to the `Unit` interface in `src/types/army.ts`. Before adding or modifying a unit entry, verify all fields are present and correctly typed:

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | kebab-case, globally unique, e.g. `"sm-infernus-squad"` |
| `name` | `string` | Display name, Title Case |
| `faction` | `string` | Must match the faction string used on the `Army` object |
| `role` | `UnitRole` | One of the enum values in `army.ts` |
| `basePoints` | `number` | Base cost with no options applied |
| `stats` | `UnitStats` | All six stat fields required |
| `options` | `UnitOption[]` | Empty array `[]` is valid; never omit the key |
| `weapons` | `Weapon[]` | All weapon fields required per `Weapon` interface |
| `abilities` | `string[]` | Empty array `[]` is valid; never omit the key |

```jsonc
// ✅ DO: complete, schema-valid entry
{
  "id": "sm-infernus-squad",
  "faction": "Space Marines",
  "role": "TROOPS",
  "basePoints": 90,
  "stats": { "movement": 6, "toughness": 4, "save": "3+", "wounds": 2, "leadership": "6+", "objectiveControl": 1 },
  "options": [],
  "weapons": [{ "id": "bolt-pistol", "name": "Bolt Pistol", "type": "Pistol", ... }],
  "abilities": ["Incendiary Terror"]
}

// ❌ DON'T: missing keys, wrong role casing, bad stat types
{
  "id": "infer-sq",
  "role": "Troops",    // wrong — must be "TROOPS"
  "save": 3,           // wrong — should be "3+" per existing convention
  "abilities": null    // wrong — must be an array, even if empty
}
```

### Type Evolution

- When a new field is needed across **3 or more units**, promote it to the `Unit` interface in `army.ts` (use `?:` if backward-compatible, required if non-nullable for all units).
- Never widen an existing field type (e.g. `number` → `any`). Introduce a proper union instead, following the existing pattern: `number | string` for dice-notation fields like `attacks` and `damage`.

---

## 3. State Management

- Army state lives at the top of `BattleForgeApp.tsx` and is passed down as props. **Do not introduce a global store** (Redux, Zustand, Context for army state) without explicit discussion — the current prop-drilling depth is intentional and sufficient at this scale.
- **`localStorage` is the persistence layer.** The load/save `useEffect` pair in `BattleForgeApp.tsx` is the canonical pattern. Any new persistent state must follow it.
- Always wrap `localStorage` access in a `typeof window !== 'undefined'` guard. Next.js may render on the server.

```typescript
// ✅ DO: SSR-safe localStorage access inside a useEffect
useEffect(() => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('armies');
    if (raw) setArmies(JSON.parse(raw));
  }
}, []);

// ❌ DON'T: bare localStorage at module or render scope
const data = localStorage.getItem('armies'); // ReferenceError on server
```

---

## 4. When to Add or Update Rules

A new rule section is warranted when a pattern appears in **3 or more files**, or when the same code-review feedback surfaces twice. When writing rules:

- Always pull a **real example from this codebase**, not a hypothetical.
- State the **why**, not just the what.
- Collapse duplicate guidance — if two bullets say the same thing, merge them.
- Update an existing section before creating a new one.

---

## 5. Git Discipline

Every commit made by an AI agent in this repository must follow this format:

```
<imperative summary line, ≤72 chars>

<optional body — what changed and why, wrapped at 72 chars>

[Model: <model name>]
```

### Rules

- **Commit atomically.** One logical change per commit. Do not bundle unrelated edits.
- **Always stage specific files** (`git add <file> <file>`). Never `git add .` or `git add -A` without first running `git status` to verify exactly what is staged.
- The `[Model: ...]` line is the **final line** of every commit message. It records which model authored the commit for traceability — it is not an assertion of correctness. **Include as many details as possible** in the model name (e.g., `[Model: Google Gemini 3.1 Pro (High)]` or `[Model: Anthropic Claude Sonnet 4.6 (Thinking)]`). This convention should be the standard always.
- Human reviewers must verify AI-authored changes before merging to main.

```bash
# ✅ DO: targeted staging, atomic commit, model tag
git status
git add src/data/units.json scripts/hydrate-units.js
git commit -m "feat: add hydrate-units script and Infernus Squad data entry

Adds standalone Node.js utility to parse Warhammer datasheet text
and safely append normalized unit objects to src/data/units.json.

[Model: Anthropic Claude Sonnet 4.6 (Thinking)]"

# ❌ DON'T: bulk-stage, vague message, no model tag
git add .
git commit -m "stuff"
```

## Workspace Execution & Model Routing Policy

### 1. Multi-Agent Workspace Routing Matrix
*   **Lead Orchestrator (Branch Splitting, Code Review, Context Ingestion):** 
    *   *Primary:* `Gemini 3.1 Pro (High)`
*   **Feature Implementation Agents (Deep Code Writing & Refactoring):** 
    *   *Primary:* `Claude Sonnet 4.6 (Thinking)`
    *   *Failover:* `Gemini 3.1 Pro (High)` (Fallback if Claude returns a 429 rate limit or quota exhaustion error)
*   **Utility & Automation Agents (Data Hydration, Script Execution, Unit Tests):** 
    *   *Primary:* `Gemini 3.5 Flash (High)`
    *   *Failover:* `Gemini 3.5 Flash (Medium)`

### 2. Agent Concurrency Limits
*   **Anthropic Hard Ceiling:** Under no circumstances should more than **3 Anthropic sub-agents** run concurrently. This cap applies universally across all Claude model variants.
*   **Google Hard Ceiling:** Allow up to **5 Google sub-agents** to run concurrently.
*   **Global Workspace Ceiling:** The total number of active sub-agents across *all* providers combined must **never exceed 5**.

Your parallel distribution must dynamically scale to conform to these rules. Valid permutations include:
*   3 Anthropic Agents + 2 Google Agents (Global Max)
*   0 Anthropic Agents + 5 Google Agents (Google Max)
*   2 Anthropic Agents + 3 Google Agents
*   *(Any other combination where Anthropic <= 3, Google <= 5, and Total <= 5)*

*   **Reasoning:** Prevents excessive file conflicts across Git worktrees and keeps a tight handle on token consumption while maximizing multi-provider throughput.

### 3. Execution Verification
*   Every sub-agent must append its runtime signature to its atomic commit log using the format: `[Model: <Model Name>]`.

### 4. Git Isolation & Commit Protocol

*   **Branch Isolation:** Every sub-agent must spin up its own isolated Git branch or separate worktree named after the specific task ID (e.g., `task-0.2-cleanup`). Under no circumstances should two sub-agents commit directly to the same branch.
*   **Atomic Commits:** Sub-agents must make highly atomic commits focused on single changes, appended with their runtime signature (e.g., `git commit -m "feat: added points validator [Model: Sonnet]"`).
*   **Orchestrator Review:** Sub-agents must push their completed branches to remote/local stashes and signal the Lead Orchestrator. The Orchestrator (`Gemini 3.1 Pro`) holds the ultimate responsibility for reviewing the code quality, running tests, and safely merging the branches sequentially back into the main development branch. **The Orchestrator must ensure they are updating task tracking lists (e.g., `tasks.md`) to verify task completion as the final step before making their merge commits. The Orchestrator must immediately push its commits to the remote (`git push`) at the end of all merges to ensure changes reflect for the user.**
*   **Worktree Cleanup:** If utilizing git worktrees for sub-agents, the Orchestrator must ensure they are removed (`git worktree remove`) after the branches are merged to prevent IDE clutter.