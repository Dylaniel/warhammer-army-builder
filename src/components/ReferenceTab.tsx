interface ReferenceTabProps {
  // armies: Army[]; // Removed unused prop
}

export default function ReferenceTab({}: ReferenceTabProps) {
  return (
    <section className="mx-4">
      <h2 className="text-2xl font-bold uppercase mb-4 dark:text-white text-gray-900">Rules</h2>
      <p className="mb-4 dark:text-gray-400 text-gray-700">and faction reference goes here.</p>

      <details className="bg-gray-800 bg-opacity-80 rounded-md p-4 mb-2 text-gray-200">
        <summary className="cursor-pointer font-semibold">Army Building</summary>
        <p className="mt-2 text-sm text-gray-400">
          Choose units within your point limit; each unit must match your chosen faction.
        </p>
      </details>

      <details className="bg-gray-800 bg-opacity-80 rounded-md p-4 mb-2 text-gray-200">
        <summary className="cursor-pointer font-semibold">Deployment</summary>
        <p className="mt-2 text-sm text-gray-400">
          Alternate placing units on the battlefield until all deployments are complete.
        </p>
      </details>

      <details className="bg-gray-800 bg-opacity-80 rounded-md p-4 mb-2 text-gray-200">
        <summary className="cursor-pointer font-semibold">Turn Sequence</summary>
        <p className="mt-2 text-sm text-gray-400">
          Each turn: Command Phase, Movement Phase, Shooting Phase, Charge Phase, Fight Phase,
          Morale Phase.
        </p>
      </details>

      <details className="bg-gray-800 bg-opacity-80 rounded-md p-4 mb-2 text-gray-200">
        <summary className="cursor-pointer font-semibold">Combat & Actions</summary>
        <p className="mt-2 text-sm text-gray-400">
          Use unit stats and dice rolls to resolve attacks, saves, and special abilities.
        </p>
      </details>

      <details className="bg-gray-800 bg-opacity-80 rounded-md p-4 mb-2 text-gray-200">
        <summary className="cursor-pointer font-semibold">Victory Conditions</summary>
        <p className="mt-2 text-sm text-gray-400">
          Win by mission objectives, controlling key locations, or eliminating enemy units.
        </p>
      </details>
    </section>
  );
}
