import type { Action } from '../types';
import type { GameState } from './GameState';

export interface ActionHost {
  state: GameState;
  say(text: string): void;
  goto(view: string): void;
  openPuzzle(id: string): void;
  onMemory(id: string): void;
  itemName(id: string): string;
}

/** Ejecuta una lista de acciones declaradas en los JSON de datos. */
export function runActions(actions: Action[], host: ActionHost): void {
  for (const a of actions) {
    switch (a.type) {
      case 'say':
        host.say(a.text);
        break;
      case 'setFlag':
        host.state.setFlag(a.flag, a.value ?? true);
        break;
      case 'give':
        if (host.state.addItem(a.item)) host.say(`Obtienes: ${host.itemName(a.item)}.`);
        break;
      case 'take':
        host.state.removeItem(a.item);
        break;
      case 'battery':
        host.state.consumeBattery(a.amount);
        break;
      case 'memory':
        if (host.state.unlockMemory(a.id)) host.onMemory(a.id);
        break;
      case 'puzzle':
        host.openPuzzle(a.id);
        break;
      case 'goto':
        host.goto(a.view);
        return; // tras cambiar de vista no se ejecutan más acciones
    }
  }
}
