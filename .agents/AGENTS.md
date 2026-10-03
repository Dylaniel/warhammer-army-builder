# OpenForge — Agent Rules & Standards

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

- **Tailwind utility classes only** — no inline `style={{}}` objects except for truly dynamic values that Tailwind cannot express (e.g. pixel-precise `gridTemplateRows`). See `OpenForgeApp.tsx` for the current approved exception pattern.
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

- Army state lives at the top of `OpenForgeApp.tsx` and is passed down as props. **Do not introduce a global store** (Redux, Zustand, Context for army state) without explicit discussion — the current prop-drilling depth is intentional and sufficient at this scale.
- **`localStorage` is the persistence layer.** The load/save `useEffect` pair in `OpenForgeApp.tsx` is the canonical pattern. Any new persistent state must follow it.
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
- **Zero Uncommitted Changes (Orchestrator Hygiene):** The Lead Orchestrator must never conclude its execution cycle with an unclean working directory. Immediately before shutting down, the Orchestrator must run `git status`. If any modifications exist (including updates to `AGENTS.md` or other configuration files), the Orchestrator must stage, commit, and push them to the remote repository.

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

### 0. Model Agnosticism / Claude Code Exception

This routing policy was authored assuming a Gemini-based orchestrator (e.g., Antigravity) driving Google-native sub-agents. When **Claude Code** is the acting agent, the requirement to route sub-agent or script execution through specific Google/Gemini models is **waived**: Claude Code executes tasks natively using Anthropic's models via its own CLI, file-editing tools, sub-agent spawning, and standard Node.js scripts. Any instruction elsewhere in this document that names a specific Google model for a task, parsing script, or QA pass should be read as "use Claude Code's native execution tools" instead when Claude Code is doing the work.

This exception applies only to *which model/tooling performs the work*. The concurrency caps in §2 and §3, the File Blast Radius Filter, the Dependency Verification rule, and the QA hand-off protocol in §6 all remain fully in force.

**Standing authorization (granted by the repo owner, 2026-08-05):** the human-authorization requirements elsewhere in this policy — High Tier spawns, Haiku/Sonnet sub-agent allocation, and merges/pushes to shared branches — are **pre-approved** and must not be re-confirmed per action. The sole spawning exception is **Opus**, which always goes through the escalation protocol in §1a. The orchestrator operates autonomously: assess tier and caps, then act. Traceability comes from atomic, immediately-pushed commits, which make any unwanted change trivially revertible. Genuinely destructive git operations (force-push, hard reset, history rewrite) are excluded from this standing authorization and must still be raised before use, since they defeat the revert path the authorization relies on.

**Model currency:** this policy names model **families**, never versions. Always use the **most up-to-date model available in the chosen family**, and spawn by family alias (e.g. `haiku`, `sonnet`) rather than a hardcoded version id so new releases are picked up automatically. Any specific version that still appears elsewhere in this document (for example in the §5 commit-message examples) is a historical example, not a pin. **Commit signatures** must name the model that actually did the work at the time (`[Model: <real current model name>]`), never a version copied from this document. The **orchestrator** is whichever model the owner has selected for the session.

### 1. Multi-Agent Complexity-Based Routing Matrix
Before spawning any sub-agent, evaluate the nature and complexity of the task and pick a tier. The tier describes **the task**, not how important it feels.

**Model families, cheapest to most expensive within each provider:**

| Provider | Light | Standard | Heavy |
|---|---|---|---|
| Anthropic | Haiku | Sonnet | Opus |
| Google | Gemini Flash Lite | Gemini Flash | Gemini Pro |
| OpenAI | GPT Luna | GPT Terra | GPT Sol |

The **Heavy** column is each provider's flagship. Heavy families are never assigned by tier — they are reachable only through the escalation protocol in §1a.

**Tiers:**

| Tier | Typical work | Permitted families | Authorization |
|---|---|---|---|
| **Low** (Utility & Automation) | Unit test generation, script execution, data hydration, typos, boilerplate, documentation, mechanical renames | **Haiku**, Gemini Flash Lite, GPT Luna | Auto-approve |
| **Medium** (Component & Layout) | Single-file implementation, isolated UI layout changes, component refinement, standalone helper functions, re-verification of a narrow, already-specified fix | **Haiku** or **Sonnet**, Gemini Flash Lite or Flash, GPT Luna or Terra | Auto-approve |
| **High** (Architecture & Core Logic) | Multi-file refactoring, core business logic, schema changes, data pipelines, complex state machines, adversarial QA of any of these | **Sonnet**, Gemini Flash, GPT Terra | Auto-approve (standing authorization, §0) |
| **Escalated** (Precision & Context) | Work that has been *shown* to exceed High Tier — see §1a | **Opus**, Gemini Pro, GPT Sol | **Owner approval required, per task** |

**Selection rules:**

*   **Cheapest family that can do the task reliably.** Within Medium Tier, use **Haiku** when the task is fully specified, confined to one file, and has a mechanical check (build, type-check, a named test); use **Sonnet** when it needs design judgment, touches state or points logic, or parses untrusted input.
*   **Escalate on evidence, not in advance.** If a lighter family's attempt fails verification for a capability reason (not a bad brief), rerun it one family up. Do not start a task on a heavier family "to be safe."
*   **Keep briefs tight.** Sub-agent cost is driven by scope as much as by family: batch checks, name the files, and state what is out of scope.

### 1a. Heavy-Model (Opus) Escalation Protocol

This protocol is written in terms of Opus, the Heavy family Claude Code can actually spawn, and applies identically to every Heavy family (Gemini Pro, GPT Sol) under any other orchestrator.

Opus has valid uses, but it is never a default and never a tier a task is simply assigned to. The only valid framing is: **"this task requires Opus for great precision and context."** Opus sub-agents previously exhausted the session usage limit twice and killed runs mid-task, so every use must be justified and approved individually.

1.  **Raise.** A sub-agent or the orchestrator may conclude a task needs Opus. A sub-agent cannot spawn Opus itself — it stops and returns an escalation request to the orchestrator stating why.
2.  **Evaluate.** The orchestrator independently evaluates the request rather than forwarding it. Valid grounds are things like: the task requires holding a large, tightly coupled context in mind at once and cannot be split; a Standard-family attempt has already failed verification for reasons of reasoning rather than specification; or a subtle error would be costly and hard to detect (e.g. a schema migration or the data pipeline). **Not** valid grounds: the task is High Tier, the task is important, speed, or habit.
3.  **Display.** The orchestrator shows the owner its evaluation: the task, the specific evidence that a Standard family is insufficient, the expected scope and usage cost, the alternatives considered (splitting the task, a tighter brief, another Sonnet pass), and its own recommendation — which may be "not warranted."
4.  **Ask.** The orchestrator then prompts the owner to allow or deny. Opus is spawned only on an explicit yes.
5.  **Scope.** Approval covers that one task. It is not a standing approval and does not carry to later tasks or later loops of the same task. If denied, proceed with Sonnet, split the task, or halt and report.

This protocol is an explicit **exception to the standing authorization in §0**.

### 2. Intelligent Spawning & Throttling Guardrails
You must actively throttle background agent invocation based on workspace safety, rather than blindly scaling to maximum capacities:

*   **Approval Lock:** Low, Medium and High Tier allocations run without confirmation under the standing authorization (§0). The one allocation that always requires manual owner confirmation is **Opus**, via the escalation protocol in §1a, to prevent usage-limit exhaustion.
*   **File Blast Radius Filter:** If multiple pending tasks touch the exact same file or tightly coupled directory, parallel execution is strictly forbidden. Force these tasks to run sequentially on a single sub-agent thread to guarantee zero Git merge conflicts.
*   **Dependency Verification:** Always parse the task tracking list for sequential prerequisites. Never spawn sub-agents for downstream tasks until their upstream dependencies are fully merged and validated.
*   **Parallel-By-Default:** Dependency Verification gates what *cannot* run yet; it is not a licence to run everything one at a time. Whenever a set of tasks has no remaining unmet prerequisite, dispatch them to separate concurrent agents rather than sequentially, up to the standing caps (§3, and the Diminishing Returns cap above). Serialize **only** for a genuine blocker — an unmet dependency, the File Blast Radius Filter, or the Single-Checkout Constraint below. Re-evaluate after **each** task completes and passes verification, not just at batch boundaries: the moment a task unblocks another, dispatch it. This applies identically to implementation work and to QA (both passes) — the deciding question is always "does this depend on something unfinished, or share blast radius with something in flight," never "is this QA." When something does run sequentially, record which of the three blockers caused it.
*   **Diminishing Returns Cap:** Even if multiple completely independent tasks are available, cap immediate parallel execution at **5 sub-agents max** to preserve system performance and prevent cognitive overhead during code reviews.
*   **Single-Checkout Constraint (Claude Code):** Raising a concurrency cap does not by itself make parallel execution possible. Claude Code sub-agents share one working directory, so two agents cannot sit on different branches at once; and per the File Blast Radius Filter, agents touching the same files must not run concurrently regardless of headroom. Parallelism is therefore only available for tasks that are both on the same branch and file-disjoint, or that use separate git worktrees. Note that a fresh worktree has no `node_modules`, so any agent required to run `npm run build` cannot verify its work there without a separate install.

    A further consequence: even *file-disjoint* agents sharing one working directory contend on git's `.git/index.lock` when they stage or commit concurrently. So same-branch parallelism is safe for agents that only **read and edit** files, but agents that each need to **commit** their own work must either be serialized or given separate worktrees.

*   **Shared Runtime Constraint:** "Read-only" is not the same as "isolated." Concurrent agents also share the **dev server, browser profile, and `localStorage`** — so two browser-driving QA agents will clobber each other's seeded state, and one stopping the server breaks the other. This was observed in practice: two concurrent Pass-1 testers each reported the other creating and deleting armies mid-assertion. Static/analytical work (reading code, scripting over data files, `tsc`, greps) genuinely parallelizes freely. Browser-driving work does **not** — either serialize it, or require each agent to open its own tab and re-verify `localStorage` immediately before every assertion, and to leave the shared dev server running on exit. Any agent that browser-tests concurrently must disclose the contention in its report so results can be weighed accordingly.

### 3. Absolute Provider Caps
When parallel scaling *is* valid and authorized, the total background pool must strictly respect these hard limits. **Note:** These limits apply ONLY to Implementation/Development sub-agents:
*   **Anthropic Hard Ceiling:** Max **4 active sub-agents** concurrently across any Claude variants.
*   **Google Hard Ceiling:** Max **5 active sub-agents** concurrently.
*   **Global Workspace Ceiling:** The total combination of *all* active sub-agents across all providers combined must **never exceed 7**.

### 4. Execution Verification
*   Every sub-agent must append its runtime signature to its atomic commit log using the format: `[Model: <Model Name>]`.

### 5. Git Isolation & Commit Protocol

*   **Branch Isolation:** Every sub-agent must spin up its own isolated Git branch or separate worktree named after the specific task ID (e.g., `task-0.2-cleanup`). Under no circumstances should two sub-agents commit directly to the same branch.
*   **Atomic Commits:** Sub-agents must make highly atomic commits focused on single changes, appended with their runtime signature (e.g., `git commit -m "feat: added points validator [Model: Sonnet]"`).
*   **Orchestrator Review & Auto-Merge:** Sub-agents must push their completed branches to remote/local stashes and signal the Lead Orchestrator. The Orchestrator (`Gemini 3.1 Pro`) holds the responsibility for running tests via QA sub-agents. If a QA test passes (either during Pass 1 or Pass 2), the Orchestrator must **automatically merge** the feature branch into `main` and push to the remote. Do not halt and ask for permission to merge. **The Orchestrator must ensure they are updating task tracking lists (e.g., `tasks.md`) to verify task completion as the final step before making their merge commits. The Orchestrator must immediately push its commits to the remote (`git push`) at the end of all merges to ensure changes reflect for the user.**
*   **Worktree Cleanup:** If utilizing git worktrees for sub-agents, the Orchestrator must ensure they are removed (`git worktree remove`) after the branches are merged to prevent IDE clutter.

## 6. Phase Verification & QA Hand-Off

This protocol enforces a maximum of one self-correction loop per user prompt to prevent infinite token-drain loops and ensure human oversight.

### 1. Initial Test Pass & Changelog Generation
Whenever an implementation sub-agent completes an initial assignment:
*   **Generate Changelog:** The Lead Orchestrator compiles a brief, bulleted "Initial Changelog & Test Criteria" summary detailing exactly what UI elements, state changes, or data mutations were built.
*   **Spawn QA Sub-Agent:** The Orchestrator spawns a dedicated testing agent.
    *   *QA Model:* chosen by the routing matrix (§1 of the routing policy) like any other task. Adversarial QA of High Tier work is itself High Tier (**Sonnet**, Gemini Flash, GPT Terra); re-verifying a narrow, already-specified fix is Medium Tier and may run on **Haiku** or Gemini Flash.
    *   *Authorization Rule:* auto-approved under the standing authorization. QA never runs on Opus except through the escalation protocol (§1a).
*   **Test Execution & Adversarial Mandate:** The QA Sub-Agent uses integrated browser/terminal tools to verify the local development server (e.g., `localhost:3000`), testing the exact items listed in the initial changelog.
    *   **Adversarial Mindset:** The primary objective of the QA Sub-Agent is **to fail the implementation, not to pass it.** The agent must actively attempt to break the UI, bypass state gating, and prove that the implementation is flawed.
    *   **Beyond the Happy Path:** While the QA agent must verify the items listed in the Changelog, it must intentionally test edge cases, invalid inputs, rapid/out-of-order clicks, and boundary conditions to ensure the application does not crash under duress.
    *   **Burden of Proof:** A test pass is only considered successful if the implementation survives deliberate attempts to break the specific logic being tested.

### 2. The Self-Correction Loop (The "Two-Strike" Rule)
If QA detects any failures, errors, or broken visual/state logic, the system is permitted **up to two** automated fix-and-reverify loops per user prompt (raised from one). Each loop follows the fresh-tester and structured-handoff protocol below.
*   **Reroute to Orchestrator:** The failure list passes back to the Lead Orchestrator, which modifies the implementation to resolve the specific defects found.
*   **Generate Fixes Changelog:** The Orchestrator must generate a dedicated "Fixes Changelog" detailing the exact lines, logic, or components altered during that correction step, with commit hashes.
*   **Reverify:** A **freshly spawned** tester re-checks the work (see below).

#### Fresh Tester & Structured Hand-Off (mandatory every loop)
Each loop's tester must be a **new agent spawn with no memory of the prior loop** — never the same session continuing. A tester that recalls its own earlier conclusions about code that has since changed is itself a hallucination risk; every loop starts from zero trust in what the last one believed.

The Orchestrator hands the new tester exactly four artifacts, and nothing more:
1. **The prior failure list** — defect, file/function/line, repro steps.
2. **The Fixes Changelog** — what changed per defect, with commit hashes.
3. **The actual diff** between the pre-fix and post-fix commits — not merely the changelog's description of itself. The tester must independently confirm the diff matches the changelog's claims and look for side effects outside the stated scope, rather than trusting the fixer's self-report.
4. **An explicit scope note** — which defects this loop is re-verifying. Out-of-scope areas are neither assumed fine (there is no memory to trust) nor re-audited from scratch (that wastes the loop); flag anything suspicious noticed in passing, but the verification burden is the listed defects.

**Must not carry forward:** the prior tester's raw exploration transcript, tool-call history, or reasoning about why it believed something passed or failed. Only the four artifacts above.

#### Two-Loop Ceiling
If Loop 2 also fails, that is a **harder halt** than a single-loop failure. The report to the user must explicitly state that the defect class survived two independent fix attempts, and that this signals a scope or design gap rather than something worth a third automated patch. **No third loop under any circumstances**, however small Loop 2's failure appears. The report must also distinguish whether Loop 2's failure was a *narrow continuation* of Loop 1's defect (e.g. a generalization that still misses cases) or a *freshly discovered, unrelated* defect — both consume the same budget, but they imply different next steps for the human.

### 3. Post-Merge Reporting Gate & Hard Halt Exception
If a QA test passes at any loop, the Orchestrator will automatically merge the feature branch into `main`. The Orchestrator will present the final report (and any Fixes Changelog) *after* the merge is complete. If the automated fixes are incorrect, the user will manually instruct a Git revert.
*   **Hard Halt Exception:** Halt and refuse to merge if QA explicitly fails with unresolved critical bugs, or if the two-loop budget in §2 is exhausted. In this scenario, the system must completely freeze background operations and present a comprehensive report of the remaining failures to the user. No further automated fixing is allowed without new user prompting.

### 4. QA Concurrency Limits

**"Strictly 1 agent" means one agent per *check*, not one agent per pass.** The rule exists to prevent two or more agents testing the same thing, which would produce a non-linear or conflicting log for that check. It was never meant to serialize independent checks.

*   **One owner per check:** each individual QA check — one defect, one area of functionality, one branch — is owned by exactly one agent for its entire lifecycle. No redundant or duplicate agents re-testing the same check.
*   **Independent checks run concurrently:** multiple checks with no unmet dependency and no blast-radius overlap may and should run in parallel, up to the standing caps (§3, and the §2 Diminishing Returns cap). This holds for **both** the Initial Test Pass and the Final Test Pass; Pass 2's limit reads as "one agent per check, dependency- and blast-radius-gated like everything else," not a hard global cap of 1 for the whole pass.
*   **Pass 1 note:** the historical cap of 2 concurrent QA sub-agents is superseded by the standing caps in §3.
*   QA is read-only and therefore parallelizes freely under the Single-Checkout Constraint (§2) — it is the best use of spare concurrency headroom.

### 5. Sub-Agent Lifecycle & Termination Protocol
*   **Graceful Teardown:** Sub-agents must never be left running idle. However, the Lead Orchestrator must not forcefully "kill" a sub-agent that has successfully completed its objective. Instead, the Orchestrator must use the appropriate graceful shutdown mechanism (e.g., instructing the agent to self-terminate with a success code, resolving the agent's task promise, or using a `.dismiss()`/`.complete()` API). 
*   **UI Status Requirement:** The teardown method chosen must result in the Antigravity workspace UI displaying the agent's final status as a successful completion state (e.g., "Completed") rather than a forced "Killed" state. Hard terminations should be strictly reserved for rogue, hung, or failing agents.