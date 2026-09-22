import { soundEngine } from './audio';

export interface BladePoint {
  x: number;
  y: number;
  time: number;
}

export interface BladeSegment {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  speed: number;
  handId: number;
}

export class BladeManager {
  private trails: Map<number, BladePoint[]> = new Map();
  private maxTrailAgeMs = 180; // milliseconds to keep trail visible
  private minSlashSpeed = 450; // pixels per second to count as a cutting slash
  private maxAllowedJump = 220; // maximum pixels between frames to prevent cross-screen teleports/swaps
  private lastWhooshTime: Map<number, number> = new Map();

  // Add new tracked point for hand or mouse
  public addPoint(handId: number, x: number, y: number, now: number = performance.now()): void {
    let points = this.trails.get(handId);
    if (!points) {
      points = [];
      this.trails.set(handId, points);
    }

    // Filter old points
    const fresh = points.filter(p => now - p.time <= this.maxTrailAgeMs);

    // Calculate speed if there was a previous point
    if (fresh.length > 0) {
      const prev = fresh[fresh.length - 1];
      const dt = (now - prev.time) / 1000;
      const dx = x - prev.x;
      const dy = y - prev.y;
      const dist = Math.hypot(dx, dy);

      // JUMP / DISCONTINUITY REJECTION:
      // If position jumped across screen (>220px in ~16ms) or frames dropped (>120ms),
      // it is a hand-swap or re-detection jump. Reset previous points so we NEVER
      // draw a connecting line across the screen!
      if (dist > this.maxAllowedJump || dt > 0.12) {
        fresh.length = 0;
      } else if (dt > 0.001) {
        const speed = dist / dt;

        // Play whoosh if speed is high enough and throttled
        if (speed > this.minSlashSpeed * 1.5) {
          const lastWhoosh = this.lastWhooshTime.get(handId) || 0;
          if (now - lastWhoosh > 220) {
            soundEngine.playSlash(Math.min(2.5, speed / this.minSlashSpeed));
            this.lastWhooshTime.set(handId, now);
          }
        }
      }
    }

    fresh.push({ x, y, time: now });
    this.trails.set(handId, fresh);
  }

  // Update trails and purge expired points
  public update(now: number = performance.now()): void {
    for (const [handId, points] of this.trails.entries()) {
      const fresh = points.filter(p => now - p.time <= this.maxTrailAgeMs);
      if (fresh.length === 0) {
        this.trails.delete(handId);
      } else {
        this.trails.set(handId, fresh);
      }
    }
  }

  // Retrieve active cutting segments for collision detection
  public getActiveSegments(_now: number = performance.now()): BladeSegment[] {
    const segments: BladeSegment[] = [];

    for (const [handId, points] of this.trails.entries()) {
      if (points.length < 2) continue;

      for (let i = points.length - 1; i >= 1; i--) {
        const p2 = points[i];
        const p1 = points[i - 1];
        const dt = (p2.time - p1.time) / 1000;
        if (dt <= 0) continue;

        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        // Ignore teleport jumps between hands
        if (dist > this.maxAllowedJump) continue;

        const speed = dist / dt;

        if (speed >= this.minSlashSpeed) {
          segments.push({
            p1: { x: p1.x, y: p1.y },
            p2: { x: p2.x, y: p2.y },
            speed,
            handId
          });
        }
      }
    }

    return segments;
  }

  // Render glowing neon cyber-blade trails onto canvas
  public draw(ctx: CanvasRenderingContext2D, now: number = performance.now()): void {
    ctx.save();

    for (const [, points] of this.trails.entries()) {
      if (points.length < 2) continue;

      // Draw outer cyber glow
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const stepDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        // Never connect points across a teleport jump
        if (stepDist > this.maxAllowedJump) continue;
        const age = now - p2.time;
        const progress = Math.max(0, 1 - age / this.maxTrailAgeMs); // 1 = newest, 0 = oldest

        const width = progress * 14;

        // Outer glow
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(124, 99, 250, ${progress * 0.45})`; // Cyber violet
        ctx.lineWidth = width * 2.2;
        ctx.shadowColor = '#7C63FA';
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Inner neon cyan
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(60, 141, 252, ${progress * 0.85})`; // Cyber blue
        ctx.lineWidth = width * 1.2;
        ctx.shadowColor = '#3C8DFC';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Hot white core
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${progress * 0.95})`;
        ctx.lineWidth = width * 0.4 + 1.5;
        ctx.shadowBlur = 0;
        ctx.stroke();
      }

      // Draw bright cutting point at the head of the blade
      const head = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(head.x, head.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#00FFA3';
      ctx.shadowBlur = 15;
      ctx.fill();
    }

    ctx.restore();
  }

  public clear(): void {
    this.trails.clear();
  }
}

export const bladeManager = new BladeManager();
