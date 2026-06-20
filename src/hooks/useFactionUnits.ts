import { useState, useEffect } from 'react';
import { Unit } from '../types/army';
import genericUnits from '../data/units.json';

interface UseFactionUnitsResult {
  units: Unit[];
  loading: boolean;
  error: Error | null;
}

export function useFactionUnits(faction: string): UseFactionUnitsResult {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFactionData() {
      if (!faction) {
        if (isMounted) {
          setUnits(genericUnits as Unit[]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Normalize the faction name to match the JSON file name (e.g., "Space Marines" -> "space-marines")
        const normalizedFaction = faction.toLowerCase().replace(/\s+/g, '-');

        let factionUnits = [];
        try {
          // Fallback to static if dynamic is breaking Next.js client bundling
          if (normalizedFaction === 'space-marines') {
            const data = await import('../data/factions/space-marines.json');
            factionUnits = data.default || data;
          } else {
            const factionData = await import(`../data/factions/${normalizedFaction}.json`);
            factionUnits = factionData.default || factionData;
          }
        } catch (importError) {
          console.warn(`Could not load specific data for faction: ${faction}`, importError);
          // If the specific faction JSON doesn't exist, we fallback to just generics
        }

        if (isMounted) {
          // Merge specific faction units with the generic units
          setUnits([...factionUnits, ...(genericUnits as Unit[])]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading faction units:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load faction units'));
          setUnits(genericUnits as Unit[]); // Fallback to just generics
          setLoading(false);
        }
      }
    }

    loadFactionData();

    return () => {
      isMounted = false;
    };
  }, [faction]);

  return { units, loading, error };
}
