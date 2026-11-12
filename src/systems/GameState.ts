import type { Cond, Tension } from '../types';

type Listener = () => void;

export interface SaveData {
  flags: string[];
  items: string[];
  memories: string[];
  battery: number;
  co2: number;
  view: string;
}

/** Estado global del juego. Lógica pura (sin Phaser) para poder probarla con Vitest. */
export class GameState {
  flags = new Set<string>();
  items: string[] = [];
  memories = new Set<string>();
  battery = 100;
  co2 = 0;
  tension: Tension = 'inquietud';
  currentView: string;
  private listeners: Listener[] = [];

  constructor(startView: string) {
    this.currentView = startView;
  }

  onChange(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }

  hasFlag(f: string): boolean {
    return this.flags.has(f);
  }
  setFlag(f: string, value = true): void {
    if (value) this.flags.add(f);
    else this.flags.delete(f);
    this.emit();
  }

  hasItem(id: string): boolean {
    return this.items.includes(id);
  }
  addItem(id: string): boolean {
    if (this.hasItem(id)) return false;
    this.items.push(id);
    this.emit();
    return true;
  }
  removeItem(id: string): boolean {
    const i = this.items.indexOf(id);
    if (i < 0) return false;
    this.items.splice(i, 1);
    this.emit();
    return true;
  }

  unlockMemory(id: string): boolean {
    if (this.memories.has(id)) return false;
    this.memories.add(id);
    this.emit();
    return true;
  }

  consumeBattery(amount: number): void {
    this.battery = Math.max(0, Math.min(100, this.battery - amount));
    this.emit();
  }

  setTension(t: Tension): void {
    if (t === this.tension) return;
    this.tension = t;
    this.emit();
  }

  setView(id: string): void {
    this.currentView = id;
    this.emit();
  }

  /** Evalúa una lista de condiciones (todas deben cumplirse). */
  check(conds?: Cond[]): boolean {
    if (!conds || conds.length === 0) return true;
    return conds.every((c) => this.evalCond(c));
  }

  private evalCond(raw: Cond): boolean {
    const negate = raw.startsWith('!');
    const c = negate ? raw.slice(1) : raw;
    const [kind, value] = c.split(':');
    let result = false;
    if (kind === 'flag') result = this.hasFlag(value);
    else if (kind === 'item') result = this.hasItem(value);
    else if (kind === 'state') result = this.tension === value;
    else if (kind === 'memory') result = this.memories.has(value);
    return negate ? !result : result;
  }

  serialize(): SaveData {
    return {
      flags: [...this.flags],
      items: [...this.items],
      memories: [...this.memories],
      battery: this.battery,
      co2: this.co2,
      view: this.currentView,
    };
  }

  restore(data: SaveData): void {
    this.flags = new Set(data.flags);
    this.items = [...data.items];
    this.memories = new Set(data.memories);
    this.battery = data.battery;
    this.co2 = data.co2;
    this.currentView = data.view;
    this.emit();
  }
}
