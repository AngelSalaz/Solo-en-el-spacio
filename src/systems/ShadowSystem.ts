import Phaser from 'phaser';
import { GAZE_MS, SHADOW_COOLDOWN_MS } from '../config';
import type { RoomView, ShadowSlot } from '../types';
import type { GameState } from './GameState';

interface ActiveShadow {
  slot: ShadowSlot;
  img: Phaser.GameObjects.Image;
  gazeMs: number;
  echoed: boolean;
}

let lastRandomAt = 0; // marca de tiempo del último susto aleatorio (persiste entre vistas)

/**
 * Sombras de la tripulación: aparecen en puntos de observación de cada vista.
 * - scripted: siempre que se cumpla showIf.
 * - aleatoria: solo en Inquietud/Alucinación, con probabilidad y enfriamiento.
 * Mirar una sombra con eco durante 3 s lanza su "eco de oficio" (pista gratuita).
 * Las sombras nunca hacen daño ni bloquean la interacción.
 */
export class ShadowSystem {
  private active: ActiveShadow[] = [];

  constructor(
    private scene: Phaser.Scene,
    private state: GameState,
    private onEcho: (text: string) => void,
  ) {}

  showForView(view: RoomView): void {
    this.clear();
    for (const slot of view.shadows ?? []) {
      if (!this.state.check(slot.showIf)) continue;
      if (!slot.scripted) {
        if (this.state.tension === 'calma') continue;
        const now = Date.now();
        if (now - lastRandomAt < SHADOW_COOLDOWN_MS) continue;
        if (Math.random() > (slot.chance ?? 0.3)) continue;
        lastRandomAt = now;
      }
      this.spawn(slot);
    }
  }

  private spawn(slot: ShadowSlot): void {
    const img = this.scene.add
      .image(slot.x, slot.y, 'shadow')
      .setScale(slot.scale ?? 1)
      .setAlpha(0)
      .setDepth(20);
    this.scene.tweens.add({ targets: img, alpha: 0.88, duration: 900 });
    const entry: ActiveShadow = { slot, img, gazeMs: 0, echoed: false };
    this.active.push(entry);
    if (!slot.scripted) {
      // Los sustos aleatorios se desvanecen solos.
      this.scene.time.delayedCall(5000, () => this.remove(entry));
    }
  }

  /** Quita las sombras cuyo showIf ya no se cumple (p. ej., al obtener la linterna). */
  refresh(): void {
    for (const a of [...this.active]) {
      if (!this.state.check(a.slot.showIf)) this.remove(a);
    }
  }

  private remove(entry: ActiveShadow): void {
    if (!this.active.includes(entry)) return;
    this.active = this.active.filter((a) => a !== entry);
    this.scene.tweens.add({
      targets: entry.img,
      alpha: 0,
      duration: 700,
      onComplete: () => entry.img.destroy(),
    });
  }

  /** Detecta la mirada fija con la posición del puntero (no bloquea los hotspots). */
  update(delta: number): void {
    const p = this.scene.input.activePointer;
    for (const a of this.active) {
      if (!a.slot.echo || a.echoed) continue;
      const inside = Phaser.Geom.Rectangle.Contains(a.img.getBounds(), p.worldX, p.worldY);
      a.gazeMs = inside ? a.gazeMs + delta : 0;
      if (a.gazeMs >= GAZE_MS) {
        a.echoed = true;
        this.onEcho(a.slot.echo);
      }
    }
  }

  clear(): void {
    for (const a of this.active) a.img.destroy();
    this.active = [];
  }
}
