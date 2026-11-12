/** Condiciones: 'flag:x', '!flag:x', 'item:x', '!item:x', 'state:inquietud', '!state:calma' */
export type Cond = string;

export type Tension = 'calma' | 'inquietud' | 'alucinacion';

export type Action =
  | { type: 'say'; text: string }
  | { type: 'setFlag'; flag: string; value?: boolean }
  | { type: 'give'; item: string }
  | { type: 'take'; item: string }
  | { type: 'goto'; view: string }
  | { type: 'puzzle'; id: string }
  | { type: 'memory'; id: string }
  | { type: 'battery'; amount: number };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UseRule {
  item: string;
  showIf?: Cond[];
  actions: Action[];
}

export interface Hotspot {
  id: string;
  label?: string;
  rect: Rect;
  showIf?: Cond[];
  actions: Action[];
  /** Reglas al usar un objeto del inventario sobre este hotspot. */
  use?: UseRule[];
  cursor?: 'look' | 'go';
}

export interface ShadowSlot {
  id: string;
  who: 'valdes' | 'brandt' | 'tanaka' | 'okafor' | 'ambiente';
  x: number;
  y: number;
  scale?: number;
  showIf?: Cond[];
  /** Si es true aparece siempre que se cumpla showIf; si no, es aleatoria y respeta el enfriamiento. */
  scripted?: boolean;
  chance?: number;
  /** Texto del "eco de oficio": pista gratuita al mirar fijamente 3 s. */
  echo?: string;
}

export interface RoomView {
  id: string;
  name: string;
  background: string;
  hotspots: Hotspot[];
  shadows?: ShadowSlot[];
  onEnter?: Action[];
}

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Recipe {
  a: string;
  b: string;
  result: string;
  text: string;
}

export interface SymbolLockPuzzle {
  type: 'symbolLock';
  title: string;
  symbols: string[];
  code: number[];
  onSolve: Action[];
  onFail: Action[];
}

export type PuzzleDef = SymbolLockPuzzle;
