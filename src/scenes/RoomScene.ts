import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';
import roomsData from '../data/rooms.json';
import puzzlesData from '../data/puzzles.json';
import { runActions } from '../systems/ActionRunner';
import type { ActionHost } from '../systems/ActionRunner';
import type { GameState } from '../systems/GameState';
import type { InventorySystem } from '../systems/InventorySystem';
import { ShadowSystem } from '../systems/ShadowSystem';
import { refreshTension } from '../systems/StressSystem';
import type { Hotspot, PuzzleDef, RoomView } from '../types';
import { Dialogue } from '../ui/Dialogue';
import { Hud } from '../ui/Hud';

const ROOMS = roomsData as unknown as RoomView[];
const PUZZLES = puzzlesData as unknown as Record<string, PuzzleDef>;

interface PuzzleResult {
  id: string;
  solved: boolean;
  cancelled: boolean;
}

/** Sala point-and-click: fondo ilustrado + hotspots + inventario + sombras. */
export default class RoomScene extends Phaser.Scene {
  private state!: GameState;
  private inv!: InventorySystem;
  private hud!: Hud;
  private dialogue!: Dialogue;
  private shadows!: ShadowSystem;
  private host!: ActionHost;
  private bg?: Phaser.GameObjects.Image;
  private zones: Phaser.GameObjects.GameObject[] = [];
  private outline!: Phaser.GameObjects.Graphics;
  private debugG?: Phaser.GameObjects.Graphics;
  private current?: RoomView;
  private selected: string | null = null;
  private debug = false;

  constructor() {
    super('Room');
  }

  create(): void {
    this.state = this.registry.get('state') as GameState;
    this.inv = this.registry.get('inventory') as InventorySystem;
    this.input.mouse?.disableContextMenu();
    this.debug = new URLSearchParams(window.location.search).has('debug');

    this.outline = this.add.graphics().setDepth(10);
    this.add.image(GAME_W / 2, GAME_H / 2, 'vignette').setDepth(50);
    this.dialogue = new Dialogue(this);
    this.hud = new Hud(this, this.state, this.inv, (id) => this.onInventoryClick(id));
    this.shadows = new ShadowSystem(this, this.state, (t) => this.dialogue.say(t));

    this.host = {
      state: this.state,
      say: (t) => this.dialogue.say(t),
      goto: (v) => this.enterView(v),
      openPuzzle: (id) => this.openPuzzle(id),
      onMemory: (id) => this.dialogue.say(`Recuerdo desbloqueado: ${id}`),
      itemName: (id) => this.inv.def(id).name,
    };

    const off = this.state.onChange(() => {
      refreshTension(this.state);
      this.hud.refresh();
      this.shadows.refresh();
      if (this.current) this.buildHotspots();
    });
    this.game.events.on('puzzle-result', this.onPuzzleResult, this);
    this.events.once('shutdown', () => {
      off();
      this.game.events.off('puzzle-result', this.onPuzzleResult, this);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.select(null);
    });

    this.enterView(this.state.currentView);
    this.cameras.main.fadeIn(900, 0, 0, 0);
  }

  update(_time: number, delta: number): void {
    this.shadows.update(delta);
  }

  // ---------- vistas ----------
  private enterView(id: string): void {
    const view = ROOMS.find((r) => r.id === id);
    if (!view) {
      console.warn(`Vista no encontrada: ${id}`);
      return;
    }
    this.current = view;
    if (!this.bg) this.bg = this.add.image(GAME_W / 2, GAME_H / 2, view.background).setDepth(0);
    else this.bg.setTexture(view.background);
    this.select(null);
    this.state.setView(id); // emite cambio → reconstruye hotspots
    this.shadows.showForView(view);
    if (view.onEnter) runActions(view.onEnter, this.host);
  }

  private buildHotspots(): void {
    for (const z of this.zones) z.destroy();
    this.zones = [];
    this.debugG?.destroy();
    this.outline.clear();
    this.hud.setHover('');
    if (!this.current) return;

    if (this.debug) this.debugG = this.add.graphics().setDepth(11);

    for (const h of this.current.hotspots) {
      if (!this.state.check(h.showIf)) continue;
      const { x, y, w, h: hh } = h.rect;
      const zone = this.add
        .zone(x + w / 2, y + hh / 2, w, hh)
        .setDepth(5)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => {
        this.outline.clear().lineStyle(2, COLORS.amber, 0.45).strokeRect(x, y, w, hh);
        this.hud.setHover(this.selected ? `Usar sobre: ${h.label ?? h.id}` : (h.label ?? ''));
      });
      zone.on('pointerout', () => {
        this.outline.clear();
        this.hud.setHover('');
      });
      zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) return;
        this.onHotspot(h);
      });
      this.zones.push(zone);
      this.debugG?.lineStyle(1, COLORS.green, 0.7).strokeRect(x, y, w, hh);
    }
  }

  // ---------- interacción ----------
  private onHotspot(h: Hotspot): void {
    if (this.selected) {
      const rule = h.use?.find((u) => u.item === this.selected && this.state.check(u.showIf));
      this.select(null);
      if (rule) runActions(rule.actions, this.host);
      else this.dialogue.say('Eso no funciona aquí.');
      return;
    }
    runActions(h.actions, this.host);
  }

  private onInventoryClick(id: string): void {
    if (this.selected && this.selected !== id) {
      const a = this.selected;
      this.select(null);
      const recipe = this.inv.combine(this.state, a, id);
      this.dialogue.say(recipe ? recipe.text : 'No parecen servir juntos.');
      return;
    }
    this.select(this.selected === id ? null : id);
  }

  private select(id: string | null): void {
    this.selected = id;
    this.hud.setSelected(id);
    this.input.setDefaultCursor(id ? 'crosshair' : 'default');
  }

  // ---------- puzzles ----------
  private openPuzzle(id: string): void {
    if (!PUZZLES[id]) {
      console.warn(`Puzzle no encontrado: ${id}`);
      return;
    }
    this.scene.launch('LockPuzzle', { id });
    this.scene.pause();
  }

  private onPuzzleResult(res: PuzzleResult): void {
    this.scene.resume();
    const def = PUZZLES[res.id];
    if (!def) return;
    if (res.solved) runActions(def.onSolve, this.host);
    else if (!res.cancelled) runActions(def.onFail, this.host);
  }
}
