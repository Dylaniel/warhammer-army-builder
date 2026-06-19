import { Unit, UnitOption } from '../types/army';
import unitsData from '../data/units.json';

/**
 * Official supported factions for dropdowns and lazy loading
 */
export const SUPPORTED_FACTIONS = ['Space Marines'];

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

  return unit.basePoints + optionPoints;
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
    return total + (armyUnit.totalPoints || armyUnit.basePoints) * (armyUnit.quantity || 1);
  }, 0);
};
