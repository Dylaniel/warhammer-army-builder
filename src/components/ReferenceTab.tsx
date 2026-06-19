interface ReferenceTabProps {}

export default function ReferenceTab({}: ReferenceTabProps) {
  return (
    <section className="mx-4 pb-20">
      <h2 className="text-2xl font-bold uppercase mb-4 dark:text-white text-gray-900">
        Quick Reference
      </h2>

      <details className="bg-white dark:bg-gray-800 dark:bg-opacity-80 rounded-md p-4 mb-2 text-gray-900 dark:text-gray-200 shadow-sm">
        <summary className="cursor-pointer font-semibold uppercase tracking-wider">
          Turn Sequence (10th Ed)
        </summary>
        <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-400">
          <p>
            <strong>1. Command Phase:</strong> Gain 1 CP. Resolve &apos;Command phase&apos; rules.
            Take Battle-shock tests for units below Half-strength.
          </p>
          <p>
            <strong>2. Movement Phase:</strong> Move units (Normal, Advance, Fall Back). Arrive from
            Reserves.
          </p>
          <p>
            <strong>3. Shooting Phase:</strong> Select eligible shooters, declare targets, resolve
            attacks. Cannot shoot if Advance/Fall Back.
          </p>
          <p>
            <strong>4. Charge Phase:</strong> Declare charges (2D6&quot;). Must end within
            Engagement Range (1&quot;).
          </p>
          <p>
            <strong>5. Fight Phase:</strong> Fights First units, then alternating starting with
            defending player. Pile In (3&quot;), Make Melee Attacks, Consolidate (3&quot;).
          </p>
        </div>
      </details>

      <details className="bg-white dark:bg-gray-800 dark:bg-opacity-80 rounded-md p-4 mb-2 text-gray-900 dark:text-gray-200 shadow-sm">
        <summary className="cursor-pointer font-semibold uppercase tracking-wider">
          Attack Sequence
        </summary>
        <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-400">
          <p>
            <strong>1. Hit Roll:</strong> Roll 1D6. Compare to Weapon Skill (WS) or Ballistic Skill
            (BS). 1 always fails, 6 always hits.
          </p>
          <p>
            <strong>2. Wound Roll:</strong> Compare Strength (S) vs Toughness (T). <br />
            - S &gt;= 2x T: 2+ <br />
            - S &gt; T: 3+ <br />
            - S = T: 4+ <br />
            - S &lt; T: 5+ <br />- S &lt;= 1/2 T: 6+
          </p>
          <p>
            <strong>3. Saving Throw:</strong> Target rolls 1D6. Modify by AP. Compare to Save (Sv)
            or Invulnerable Save. 1 always fails.
          </p>
          <p>
            <strong>4. Inflict Damage:</strong> Subtract Damage (D) from model&apos;s Wounds. Damage
            does not spill over unless Mortal Wounds.
          </p>
        </div>
      </details>

      <details className="bg-white dark:bg-gray-800 dark:bg-opacity-80 rounded-md p-4 mb-2 text-gray-900 dark:text-gray-200 shadow-sm">
        <summary className="cursor-pointer font-semibold uppercase tracking-wider">
          Points & Limits
        </summary>
        <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-400">
          <p>
            <strong>Army Size:</strong> Incursion (1000 pts), Strike Force (2000 pts), Onslaught
            (3000 pts).
          </p>
          <p>
            <strong>Rule of 3:</strong> Max 3 of any unit datasheet, except BATTLELINE or DEDICATED
            TRANSPORT (max 6).
          </p>
          <p>
            <strong>Characters:</strong> Only 1 of each EPIC HERO allowed. Units can typically only
            have one Leader attached.
          </p>
          <p>
            <strong>Strategic Reserves:</strong> Max 25% of points limit. Not allowed turn 1.
            Destroyed if not deployed by end of turn 3.
          </p>
        </div>
      </details>

      <details className="bg-white dark:bg-gray-800 dark:bg-opacity-80 rounded-md p-4 mb-2 text-gray-900 dark:text-gray-200 shadow-sm">
        <summary className="cursor-pointer font-semibold uppercase tracking-wider">
          Detachment Rules Overview
        </summary>
        <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-400">
          <p>
            <strong>What is a Detachment?</strong> Dictates the flavor of your army. Provides a
            Detachment Rule, Enhancements, and Stratagems.
          </p>
          <p>
            <strong>Enhancements:</strong> Max 3 per army. Cannot be on Epic Heroes. Max 1 per
            character.
          </p>
          <p>
            <strong>Stratagems:</strong> 6 per detachment (plus Core Stratagems). Cost 1 or 2 CP to
            use.
          </p>
          <p>
            <em>Check your codex for specific Detachment Rules.</em>
          </p>
        </div>
      </details>
    </section>
  );
}
