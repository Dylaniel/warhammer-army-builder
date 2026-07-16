# Warhammer 40,000 10th Edition - Core Tabletop Rules

This document serves as the domain knowledge anchor for all AI agents working on the Warhammer Army Builder. It distills the official 10th Edition Core Rules into machine-readable logic constraints.

## 1. Core Concepts: Units, Models, and Profiles

### The Unit Container
Models move and fight in **Units**. A Unit is a container for one or more Models from a single datasheet.
- **CRITICAL ARCHITECTURE RULE:** A Unit is a container for Models. A Unit does not have a single flat statline if it contains mixed models. Instead, a Unit contains **Profiles** (e.g., Sergeant, Heavy Weapons Specialist, Standard Troop), and each Profile defines the specific characteristics (M, T, SV, W, LD, OC) for that model type.
- Example: A "Space Marine Intercessor Squad" is the Unit. It contains 1 "Intercessor Sergeant" Profile and 4 "Intercessor" Profiles. 

### Point Scaling (Tier-Based)
- **CRITICAL POINT RULE:** In 10th Edition, points are **strictly tier-based by total squad size** (e.g., 5 models cost 90 pts, 10 models cost 180 pts). Points are **NEVER** calculated on a per-model basis (e.g., you cannot buy 6 models for 108 pts).
- Wargear options are generally free and included in the tier cost.

## 2. Datasheet Anatomy

Every Unit datasheet contains:
1. **Profiles (Characteristics):**
   - **M (Move):** Speed in inches.
   - **T (Toughness):** Resilience against physical harm.
   - **Sv (Save):** Protection from armour.
   - **W (Wounds):** Damage a model can sustain before being destroyed.
   - **Ld (Leadership):** Courage/determination (used for Battle-shock tests).
   - **OC (Objective Control):** Effectiveness at controlling objectives.
2. **Weapons:** 
   - Ranged and Melee weapons with Range, A (Attacks), WS/BS, S (Strength), AP (Armour Penetration), and D (Damage).
   - Weapons can have abilities like `[LETHAL HITS]`, `[BLAST]`, `[IGNORES COVER]`.
3. **Abilities:** Core rules (e.g., Deep Strike), Faction rules, and bespoke datasheet abilities.
4. **Unit Composition:** Defines exactly how many of each Profile are in the unit (min and max quantities).
5. **Wargear Options:** Rules dictating which weapons a profile can swap out.

## 3. The Battle Round

The game is played in Battle Rounds, each consisting of player turns. A turn is divided into 5 phases:

1. **Command Phase:** Gain 1 CP. Take Battle-shock tests (roll 2D6 >= Ld) for units Below Half-strength.
2. **Movement Phase:** 
   - Move Units: Normal move (up to M"), Advance (M + D6", cannot shoot/charge), Remain Stationary, or Fall Back (move out of Engagement Range, cannot shoot/charge).
   - Reinforcements: Set up Reserves units on the battlefield.
3. **Shooting Phase:** Eligible units select targets and make ranged attacks.
4. **Charge Phase:** Units within 12" of an enemy can roll 2D6 to attempt to move into Engagement Range (base-to-base or within 1").
5. **Fight Phase:** 
   - Split into two steps: **Fights First** (including units that charged) and **Remaining Combats**.
   - Players alternate selecting units to Pile In (move up to 3"), Make Melee Attacks, and Consolidate (move up to 3").

## 4. Making Attacks

1. **Hit Roll:** Roll D6 >= BS (Ranged) or WS (Melee). Unmodified 6 is a Critical Hit.
2. **Wound Roll:** Compare attack's Strength to target's Toughness:
   - S >= 2 * T = 2+
   - S > T = 3+
   - S == T = 4+
   - S < T = 5+
   - S <= T / 2 = 6+
   - Unmodified 6 is a Critical Wound.
3. **Allocate Attack:** Defending player allocates the attack to a model in the target unit.
4. **Saving Throw:** Roll D6 modified by weapon's AP. If result >= model's Save (or Invulnerable Save), attack is saved.
5. **Inflict Damage:** Model loses wounds equal to the weapon's Damage characteristic. If Wounds <= 0, the model is destroyed.

## 5. Keywords
- **Faction Keywords:** Used to build armies (e.g., ADEPTUS ASTARTES).
- **Other Keywords:** Tag models for specific rule interactions (e.g., INFANTRY, VEHICLE, MONSTER, CHARACTER).

## Summary Mandate for AI Agents
When defining game logic or schemas:
1. Always map a Unit as a parent container of Profiles.
2. Ensure point calculations strictly follow tier brackets based on the total model count (sum of all profiles).
3. Do not invent rules; rely on verbatim text.
