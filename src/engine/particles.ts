export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  type: 'spark' | 'binary' | 'shard';
  char?: string;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
  scale: number;
  maxAge: number;
  age: number;
}

export class ParticleEngine {
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private floatingTexts: FloatingText[] = [];
  private screenFlashColor: string | null = null;
  private screenFlashAlpha: number = 0;
  public screenShakeIntensity: number = 0;

  public triggerScreenShake(intensity: number = 14): void {
    this.screenShakeIntensity = intensity;
  }

  public triggerScreenFlash(color: string, alpha: number = 0.4): void {
    this.screenFlashColor = color;
    this.screenFlashAlpha = alpha;
  }

  public addShockwave(x: number, y: number, color: string = '#00FFA3', maxRadius: number = 140): void {
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius,
      color,
      alpha: 0.9,
      lineWidth: 4
    });
  }

  public addSliceSparks(x: number, y: number, color: string = '#3C8DFC', count: number = 26): void {
    // Add radial shockwave
    this.addShockwave(x, y, color, 120);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 480;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 4.5,
        color: Math.random() > 0.35 ? color : '#FFFFFF',
        alpha: 1,
        decay: 1.6 + Math.random() * 2.2,
        rotation: 0,
        vRot: 0,
        type: 'spark'
      });
    }

    // Add binary data streams
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 14 + Math.random() * 6,
        color: Math.random() > 0.5 ? '#00FFA3' : '#7C63FA',
        alpha: 1,
        decay: 1.3 + Math.random() * 1.5,
        rotation: (Math.random() - 0.5) * 0.4,
        vRot: (Math.random() - 0.5) * 2,
        type: 'binary',
        char: Math.random() > 0.5 ? '1' : '0'
      });
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string = '#00FFA3', scale: number = 1): void {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -60,
      scale,
      maxAge: 1.3,
      age: 0
    });
  }

  public update(dt: number): void {
    // Decay screen shake
    if (this.screenShakeIntensity > 0) {
      this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - dt * 45);
    }

    // Decay screen flash
    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - dt * 2.0);
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * dt * 9 + 40 * dt;
      sw.alpha -= dt * 1.6;
      sw.lineWidth = Math.max(1, sw.lineWidth - dt * 3);

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt;
      p.rotation += p.vRot * dt;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.age += dt;
      t.y += t.vy * dt;
      t.alpha = Math.max(0, 1 - (t.age / t.maxAge));

      if (t.age >= t.maxAge) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Draw shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, Math.max(1, sw.radius), 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();
    }

    // Draw screen flash if active
    if (this.screenFlashColor && this.screenFlashAlpha > 0.01) {
      ctx.fillStyle = this.screenFlashColor;
      ctx.globalAlpha = this.screenFlashAlpha;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalAlpha = 1;
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'binary' && p.char) {
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.size}px 'JetBrains Mono', monospace`;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
      }

      ctx.restore();
    }

    // Draw floating texts
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.font = `800 ${Math.round(22 * t.scale)}px 'Outfit', 'Inter', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 14;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(6, 10, 20, 0.9)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);

      ctx.restore();
    }

    ctx.restore();
  }

  public clear(): void {
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.screenFlashAlpha = 0;
    this.screenShakeIntensity = 0;
  }
}

export const particleEngine = new ParticleEngine();
