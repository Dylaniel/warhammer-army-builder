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

### 1. Multi-Agent Complexity-Based Routing Matrix
Before spawning any sub-agent, you must evaluate the nature and complexity of the task to determine the appropriate compute tier:

*   **High Tier (Architecture & Core Logic):** Multi-file refactoring, core business logic, schema changes, or complex state/combat machines.
    *   *Primary Model:* `Claude Sonnet 4.6 (Thinking)`
    *   *Failover Model:* `Gemini 3.1 Pro (High)`
    *   *Human Authorization:* **REQUIRED**. You must prompt the user and obtain explicit permission via the interface before spawning.
*   **Medium Tier (Component & Layout):** Single-file implementation, isolated UI layout modifications, component refinement, or standalone helper functions.
    *   *Primary Model:* `Gemini 3.1 Pro (High)`
    *   *Failover Model:* `Gemini 3.5 Flash (High)`
    *   *Human Authorization:* **Auto-Approve**. You are permitted to execute these silently within concurrency limits.
*   **Low Tier (Utility & Automation):** Unit test generation, script execution, data hydration, typos, boilerplate, or documentation.
    *   *Primary Model:* `Gemini 3.5 Flash (High)`
    *   *Failover Model:* `Gemini 3.5 Flash (Medium)`
    *   *Human Authorization:* **Auto-Approve**. You are permitted to execute these silently within concurrency limits.

### 2. Intelligent Spawning & Throttling Guardrails
You must actively throttle background agent invocation based on workspace safety, rather than blindly scaling to maximum capacities:

*   **Asymmetric Approval Lock:** All Anthropic/Claude allocations are highly intentional and strictly require manual user confirmation to prevent accidental token/quota exhaustion. All native Google/Gemini allocations are granted auto-execution privileges.
*   **File Blast Radius Filter:** If multiple pending tasks touch the exact same file or tightly coupled directory, parallel execution is strictly forbidden. Force these tasks to run sequentially on a single sub-agent thread to guarantee zero Git merge conflicts.
*   **Dependency Verification:** Always parse the task tracking list for sequential prerequisites. Never spawn sub-agents for downstream tasks until their upstream dependencies are fully merged and validated.
*   **Diminishing Returns Cap:** Even if multiple completely independent tasks are available, cap immediate parallel execution at **3 sub-agents max** to preserve system performance and prevent cognitive overhead during code reviews.

### 3. Absolute Provider Caps
When parallel scaling *is* valid and authorized, the total background pool must strictly respect these hard limits:
*   **Anthropic Hard Ceiling:** Max **2 active sub-agents** concurrently across any Claude variants.
*   **Google Hard Ceiling:** Max **5 active sub-agents** concurrently.
*   **Global Workspace Ceiling:** The total combination of *all* active sub-agents across all providers combined must **never exceed 5**.

### 4. Execution Verification
*   Every sub-agent must append its runtime signature to its atomic commit log using the format: `[Model: <Model Name>]`.

### 5. Git Isolation & Commit Protocol

*   **Branch Isolation:** Every sub-agent must spin up its own isolated Git branch or separate worktree named after the specific task ID (e.g., `task-0.2-cleanup`). Under no circumstances should two sub-agents commit directly to the same branch.
*   **Atomic Commits:** Sub-agents must make highly atomic commits focused on single changes, appended with their runtime signature (e.g., `git commit -m "feat: added points validator [Model: Sonnet]"`).
*   **Orchestrator Review:** Sub-agents must push their completed branches to remote/local stashes and signal the Lead Orchestrator. The Orchestrator (`Gemini 3.1 Pro`) holds the ultimate responsibility for reviewing the code quality, running tests, and safely merging the branches sequentially back into the main development branch. **The Orchestrator must ensure they are updating task tracking lists (e.g., `tasks.md`) to verify task completion as the final step before making their merge commits. The Orchestrator must immediately push its commits to the remote (`git push`) at the end of all merges to ensure changes reflect for the user.**
*   **Worktree Cleanup:** If utilizing git worktrees for sub-agents, the Orchestrator must ensure they are removed (`git worktree remove`) after the branches are merged to prevent IDE clutter.

## 6. Phase Verification & QA Hand-Off

This protocol enforces a maximum of one self-correction loop per user prompt to prevent infinite token-drain loops and ensure human oversight.

### 1. Initial Test Pass & Changelog Generation
Whenever an implementation sub-agent completes an initial assignment:
*   **Generate Changelog:** The Lead Orchestrator compiles a brief, bulleted "Initial Changelog & Test Criteria" summary detailing exactly what UI elements, state changes, or data mutations were built.
*   **Spawn QA Sub-Agent:** The Orchestrator spawns a dedicated testing agent.
    *   *Designated QA Model:* `Gemini 3.5 Flash (Medium)` OR `GPT-OSS 120B (Medium)`.
    *   *Authorization Rule:* **Auto-Approve is STRICTLY EXCLUSIVE to native Google models (e.g., Gemini).** Because `GPT-OSS 120B (Medium)` shares the premium Claude/GPT quota pool, if it (or any other non-Google model) is selected, **explicit manual user authorization is REQUIRED** before spawning. NEVER auto-approve a GPT or Claude model.
*   **Test Execution:** The QA Sub-Agent uses integrated browser/terminal tools to verify the local development server (e.g., `localhost:3000`), testing the exact items listed in the initial changelog.

### 2. The Single Self-Correction Loop (The "One-Strike" Rule)
If the QA Sub-Agent detects any failures, errors, or broken visual/state logic during the initial pass, the system is permitted **exactly one** automated fix attempt per user prompt:
*   **Reroute to Orchestrator (Pass 2):** The QA sub-agent passes the failure logs back to the Lead Orchestrator. The Orchestrator modifies the implementation files exactly *one time* to resolve the specific bugs found.
*   **Generate Fixes Changelog:** The Orchestrator must generate a dedicated "Fixes Changelog" detailing the exact lines, logic, or components altered during this correction step.
*   **Final Test Pass:** The Orchestrator hands the project back to the QA Sub-Agent along with an updated summary. The QA Sub-Agent runs its test suite a second time (strictly adhering to the authorization rules outlined in Step 1).

### 3. Absolute Hard Halt & Reporting Gate
Immediately following the second test pass, the multi-agent system must completely freeze background operations and present a comprehensive report to the user. No further automated fixing is allowed without new user prompting. The final output to the user must explicitly include:
*   **Remaining Failures Summary:** Any issues that the agents could not recognize or failed to fix on the second pass must be surfaced clearly so they can be inspected manually by sentient eyes.
*   **The Fixes Changelog:** A clear summary of the changes made during the single auto-fix loop, allowing the user to verify the validity of those automated changes before performing a manual check and final Git commit.