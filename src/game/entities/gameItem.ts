import { settingsManager } from '../settings';
import { itemTranslations } from '../../i18n/translations';

export type ItemType =
  | 'VALID_ID'
  | 'VALID_VNJ'
  | 'VALID_SELFIE'
  | 'SPOOF_MASK'
  | 'SPOOF_DEEPFAKE'
  | 'SPOOF_EMULATOR'
  | 'BONUS_SHIELD';

export type ItemCategory = 'valid' | 'spoof' | 'bonus';

export interface SlicedHalf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  clipSide: 'left' | 'right';
}

export class GameItem {
  public id: string;
  public type: ItemType;
  public category: ItemCategory;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public rotation: number = 0;
  public vRot: number = 0;
  public isSliced: boolean = false;
  public sliceAngle: number = 0;
  public half1: SlicedHalf | null = null;
  public half2: SlicedHalf | null = null;
  public image: HTMLImageElement | null = null;
  public glowColor: string;
  public label: string;
  public scoreValue: number;
  public width: number;
  public height: number;
  public pulsePhase: number = 0;

  constructor(
    type: ItemType,
    x: number,
    y: number,
    vx: number,
    vy: number,
    image: HTMLImageElement | null
  ) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.image = image;
    this.rotation = (Math.random() - 0.5) * 0.4;
    this.vRot = (Math.random() - 0.5) * 2.2;

    switch (type) {
      case 'VALID_ID':
        this.category = 'valid';
        this.glowColor = '#00FFA3';
        this.label = '🇰🇿 ҚР ЖЕКЕ КУӘЛІК';
        this.scoreValue = 60;
        this.width = 180;
        this.height = 120;
        this.radius = 75;
        break;
      case 'VALID_VNJ':
        this.category = 'valid';
        this.glowColor = '#00FFA3';
        this.label = '🇰🇿 ҚР ВНЖ ҚҰЖАТЫ';
        this.scoreValue = 60;
        this.width = 180;
        this.height = 122;
        this.radius = 75;
        break;
      case 'VALID_SELFIE':
        this.category = 'valid';
        this.glowColor = '#00FFA3';
        this.label = 'LIVE SELFIE (ТІРІ АДАМ)';
        this.scoreValue = 50;
        this.width = 148;
        this.height = 148;
        this.radius = 74;
        break;
      case 'SPOOF_MASK':
        this.category = 'spoof';
        this.glowColor = '#FF0055';
        this.label = '3D MASK ATTACK';
        this.scoreValue = 100;
        this.width = 148;
        this.height = 148;
        this.radius = 74;
        break;
      case 'SPOOF_DEEPFAKE':
        this.category = 'spoof';
        this.glowColor = '#FF2E63';
        this.label = 'DEEPFAKE INJECTION';
        this.scoreValue = 150;
        this.width = 148;
        this.height = 148;
        this.radius = 74;
        break;
      case 'SPOOF_EMULATOR':
        this.category = 'spoof';
        this.glowColor = '#FF3366';
        this.label = 'VIRTUAL CAM SPOOF';
        this.scoreValue = 120;
        this.width = 170;
        this.height = 125;
        this.radius = 75;
        break;
      case 'BONUS_SHIELD':
        this.category = 'bonus';
        this.glowColor = '#7C63FA';
        this.label = 'VERIGRAM OVERDRIVE';
        this.scoreValue = 200;
        this.width = 130;
        this.height = 130;
        this.radius = 65;
        break;
    }
  }

  public update(dt: number, gravity: number = 700): void {
    this.pulsePhase += dt * 4;

    if (!this.isSliced) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy += gravity * dt;
      this.rotation += this.vRot * dt;
    } else {
      if (this.half1) {
        this.half1.x += this.half1.vx * dt;
        this.half1.y += this.half1.vy * dt;
        this.half1.vy += (gravity * 1.25) * dt;
        this.half1.rotation += this.half1.vRot * dt;
      }
      if (this.half2) {
        this.half2.x += this.half2.vx * dt;
        this.half2.y += this.half2.vy * dt;
        this.half2.vy += (gravity * 1.25) * dt;
        this.half2.rotation += this.half2.vRot * dt;
      }
    }
  }

  public slice(cutAngle: number, slashSpeed: number): void {
    if (this.isSliced) return;
    this.isSliced = true;
    this.sliceAngle = cutAngle;

    const normalAngle = cutAngle + Math.PI / 2;
    const impulse = Math.min(380, Math.max(160, slashSpeed * 0.35));

    const nx = Math.cos(normalAngle);
    const ny = Math.sin(normalAngle);

    this.half1 = {
      x: this.x - nx * 12,
      y: this.y - ny * 12,
      vx: this.vx - nx * impulse,
      vy: this.vy - ny * impulse - 90,
      rotation: this.rotation,
      vRot: this.vRot - 3.8,
      clipSide: 'left'
    };

    this.half2 = {
      x: this.x + nx * 12,
      y: this.y + ny * 12,
      vx: this.vx + nx * impulse,
      vy: this.vy + ny * impulse - 90,
      rotation: this.rotation,
      vRot: this.vRot + 3.8,
      clipSide: 'right'
    };
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (!this.isSliced) {
      this.drawIntact(ctx);
    } else {
      this.drawHalves(ctx);
    }

    ctx.restore();
  }

  private drawIntact(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const w = this.width;
    const h = this.height;

    // Glowing aura
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 18 + Math.sin(this.pulsePhase) * 6;

    if (this.image && this.image.complete && this.image.naturalWidth > 0) {
      // Draw rounded card image
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 18);
      ctx.clip();
      ctx.drawImage(this.image, -w / 2, -h / 2, w, h);

      // Cyber scan grid line over genuine document / selfie
      if (this.category === 'valid') {
        const scanY = (-h / 2) + ((this.pulsePhase * 35) % h);
        ctx.strokeStyle = 'rgba(0, 255, 163, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-w / 2, scanY);
        ctx.lineTo(w / 2, scanY);
        ctx.stroke();

        // Holographic corner stamp
        ctx.fillStyle = 'rgba(0, 255, 163, 0.2)';
        ctx.fillRect(w / 2 - 38, -h / 2 + 8, 30, 30);
      }
    } else {
      ctx.fillStyle = this.category === 'valid' ? '#0F2C24' : '#2D0F18';
      ctx.strokeStyle = this.glowColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.label, 0, 5);
    }

    // Border HUD reticle
    ctx.restore();
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 18);
    ctx.stroke();

    // High-tech corner brackets
    const cornerSize = 22;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#FFFFFF';

    // Top-left
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 4, -h / 2 + cornerSize);
    ctx.lineTo(-w / 2 - 4, -h / 2 - 4);
    ctx.lineTo(-w / 2 + cornerSize, -h / 2 - 4);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w / 2 + 4, h / 2 - cornerSize);
    ctx.lineTo(w / 2 + 4, h / 2 + 4);
    ctx.lineTo(w / 2 - cornerSize, h / 2 + 4);
    ctx.stroke();

    // Bottom badge label
    ctx.shadowBlur = 0;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.glowColor;
    const currentLang = settingsManager.get().language;
    const localizedLabel = itemTranslations[currentLang]?.[this.type] || this.label;
    ctx.fillText(localizedLabel, 0, h / 2 + 22);

    ctx.restore();
  }

  private drawHalves(ctx: CanvasRenderingContext2D): void {
    const halves = [this.half1, this.half2];
    const w = this.width;
    const h = this.height;

    for (const half of halves) {
      if (!half) continue;
      ctx.save();
      ctx.translate(half.x, half.y);
      ctx.rotate(half.rotation);

      ctx.beginPath();
      if (half.clipSide === 'left') {
        ctx.rect(-w, -h, w, h * 2);
      } else {
        ctx.rect(0, -h, w, h * 2);
      }
      ctx.clip();

      if (this.image && this.image.complete && this.image.naturalWidth > 0) {
        ctx.drawImage(this.image, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = this.glowColor;
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }

      // Hot laser edge
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00FFA3';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.lineTo(0, h);
      ctx.stroke();

      ctx.restore();
    }
  }

  public isOutOfBounds(canvasHeight: number): boolean {
    if (!this.isSliced) {
      return this.y > canvasHeight + 150 && this.vy > 0;
    } else {
      const h1Out = !this.half1 || (this.half1.y > canvasHeight + 180);
      const h2Out = !this.half2 || (this.half2.y > canvasHeight + 180);
      return h1Out && h2Out;
    }
  }
}
