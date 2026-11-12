import type { Tension } from '../types';
import type { GameState } from './GameState';

export const CO2_ALUCINACION = 70;

/** Calcula el estado de tensión a partir del estado de la nave. */
export function computeTension(s: Pick<GameState, 'co2' | 'hasFlag'>): Tension {
  if (s.co2 >= CO2_ALUCINACION) return 'alucinacion';
  if (s.hasFlag('sistemas_estables')) return 'calma';
  return 'inquietud';
}

export function refreshTension(state: GameState): void {
  state.setTension(computeTension(state));
}
