import { Army } from '../types/army';

interface ReferenceTabProps {
  army: Army | null;
}

export default function ReferenceTab({ army }: ReferenceTabProps) {
  return (
    <section className="mx-4">
      <h2 className="text-2xl font-bold uppercase mb-4">Rules</h2>
      <p className="text-gray-400 mb-4">and faction reference goes here.</p>

      <details className="bg-gray-800 bg-opacity-80 rounded-md p-4 mb-2">
        <summary className="cursor-pointer font-semibold">Army Building</summary>
        <p className="mt-2 text-gray-400 text-sm">
          Choose units within your point limit; each unit must match your chosen faction.
        </p>
      </details>

      <details className="bg-gray-800 bg-opacity-80 rounded-md p-4 mb-2">
        <summary className="cursor-pointer font-semibold">Deployment</summary>
        <p className="mt-2 text-gray-400 text-sm">
          Alternate placing units on the battlefield until all deployments are complete.
        </p>
      </details>

      <details className="bg-gray-800 bg-opacity-80 rounded-md p-4 mb-2">
        <summary className="cursor-pointer font-semibold">Turn Sequence</summary>
        <p className="mt-2 text-gray-400 text-sm">
          Each turn: Command Phase, Movement Phase, Shooting Phase, Charge Phase, Fight Phase,
          Morale Phase.
        </p>
      </details>

      <details className="bg-gray-800 bg-opacity-80 rounded-md p-4 mb-2">
        <summary className="cursor-pointer font-semibold">Combat & Actions</summary>
        <p className="mt-2 text-gray-400 text-sm">
          Use unit stats and dice rolls to resolve attacks, saves, and special abilities.
        </p>
      </details>

      <details className="bg-gray-800 bg-opacity-80 rounded-md p-4 mb-2">
        <summary className="cursor-pointer font-semibold">Victory Conditions</summary>
        <p className="mt-2 text-gray-400 text-sm">
          Win by mission objectives, controlling key locations, or eliminating enemy units.
        </p>
      </details>
    </section>
  );
}
