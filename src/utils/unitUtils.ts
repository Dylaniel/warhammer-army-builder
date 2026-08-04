import { Unit, UnitOption } from '../types/army';
import unitsData from '../data/units.json';

/**
 * Official supported factions for dropdowns and lazy loading
 */
export const SUPPORTED_FACTIONS = [
  'Space Marines',
  'Adepta Sororitas',
  'Adeptus Custodes',
  'Adeptus Mechanicus',
  'Aeldari',
  'Agents of the Imperium',
  'Astra Militarum',
  'Black Templars',
  'Blood Angels',
  'Chaos Daemons',
  'Chaos Knights',
  'Chaos Space Marines',
  'Dark Angels',
  'Death Guard',
  'Deathwatch',
  'Drukhari',
  'Genestealer Cults',
  'Grey Knights',
  'Imperial Knights',
  'Leagues of Votann',
  'Necrons',
  'Orks',
  'Space Wolves',
  "T'au Empire",
  'Thousand Sons',
  'Tyranids',
  'World Eaters',
];

/**
 * Get all available generic units (from units.json)
 */
export const getAllUnits = (): Unit[] => {
  return unitsData as Unit[];
};

/**
 * Get units by role
 */
export const getUnitsByRole = (role: Unit['role']): Unit[] => {
  return getAllUnits().filter((unit) => unit.role === role);
};

/**
 * Find a specific unit by ID
 */
export const getUnitById = (id: string): Unit | undefined => {
  return getAllUnits().find((unit) => unit.id === id);
};

/**
 * Calculate total points for a unit with selected options
 */
export const calculateUnitPoints = (unit: Unit, selectedOptionIds: string[] = []): number => {
  const optionPoints = selectedOptionIds.reduce((total, optionId) => {
    const option = unit.options.find((opt) => opt.id === optionId);
    return total + (option?.points || 0);
  }, 0);

  let baseCost = unit.basePoints;

  // 10th edition tiered point costing based on total models in the unit
  if (unit.pointsTiers && unit.pointsTiers.length > 0) {
    let totalModels = 0;
    if (unit.composition && Object.keys(unit.composition).length > 0) {
      totalModels = Object.values(unit.composition).reduce((a, b) => a + b, 0);
    } else if (unit.quantity) {
      totalModels = unit.quantity;
    } else if (unit.profiles) {
      totalModels = unit.profiles.reduce((sum, p) => sum + p.minQuantity, 0);
    } else {
      totalModels = 1;
    }

    // Sort tiers by models ascending
    const sortedTiers = [...unit.pointsTiers].sort((a, b) => a.models - b.models);

    // Find the tier that accommodates the total models
    const applicableTier = sortedTiers.find((tier) => totalModels <= tier.models);

    // If we exceed the max tier, use the highest tier cost (or a custom formula, but typically max tier)
    if (applicableTier) {
      baseCost = applicableTier.points;
    } else {
      baseCost = sortedTiers[sortedTiers.length - 1].points;
    }
  }

  return baseCost + optionPoints;
};

/**
 * Get selected options for a unit
 */
export const getSelectedOptions = (unit: Unit, selectedOptionIds: string[]): UnitOption[] => {
  return unit.options.filter((option) => selectedOptionIds.includes(option.id));
};

/**
 * Create an army unit from a base unit with selected options
 */
export const createArmyUnit = (
  unit: Unit,
  selectedOptionIds: string[] = [],
  quantity: number = 1
): Unit => {
  const totalPoints = calculateUnitPoints(unit, selectedOptionIds);

  return {
    ...unit,
    id: `${unit.id}-${Date.now()}`, // Generate unique ID
    selectedOptions: selectedOptionIds,
    totalPoints,
    quantity,
  };
};

/**
 * Validate if selected options are valid for a unit
 */
export const validateUnitOptions = (unit: Unit, selectedOptionIds: string[]): boolean => {
  return selectedOptionIds.every((optionId) =>
    unit.options.some((option) => option.id === optionId)
  );
};

/**
 * Get total points for an army
 */
export const calculateArmyPoints = (armyUnits: Unit[]): number => {
  return armyUnits.reduce((total, armyUnit) => {
    return total + (armyUnit.totalPoints || armyUnit.basePoints);
  }, 0);
};
