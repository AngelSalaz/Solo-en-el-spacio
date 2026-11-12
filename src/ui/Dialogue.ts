import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';

/** Cuadro de texto inferior con cola de mensajes (monólogo de León). Espacio para saltar. */
export class Dialogue {
  private box: Phaser.GameObjects.Rectangle;
  private txt: Phaser.GameObjects.Text;
  private queue: string[] = [];
  private busy = false;
  private timer?: Phaser.Time.TimerEvent;

  constructor(private scene: Phaser.Scene) {
    const y = GAME_H - 130;
    this.box = scene.add
      .rectangle(GAME_W / 2, y, 960, 64, 0x05070c, 0.85)
      .setStrokeStyle(2, COLORS.steel)
      .setDepth(60)
      .setVisible(false);
    this.txt = scene.add
      .text(GAME_W / 2, y, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#e6e1d6',
        align: 'center',
        wordWrap: { width: 920 },
      })
      .setOrigin(0.5)
      .setDepth(61)
      .setVisible(false);
    // El cuadro no captura clics (no tapa hotspots); se salta con Espacio.
    scene.input.keyboard?.on('keydown-SPACE', () => this.skip());
  }

  say(text: string): void {
    this.queue.push(text);
    if (!this.busy) this.next();
  }

  private next(): void {
    const t = this.queue.shift();
    if (t === undefined) {
      this.busy = false;
      this.box.setVisible(false);
      this.txt.setVisible(false);
      return;
    }
    this.busy = true;
    this.txt.setText(t).setVisible(true);
    this.box.setVisible(true).setSize(960, Math.max(64, this.txt.height + 28));
    this.timer = this.scene.time.delayedCall(1700 + t.length * 45, () => this.next());
  }

  skip(): void {
    this.timer?.remove();
    this.next();
  }
}
