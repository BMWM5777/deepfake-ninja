import { BladeSegment } from './blade';
import { GameItem } from '../game/entities/gameItem';

export interface SliceHit {
  item: GameItem;
  cutAngle: number;
  slashSpeed: number;
  hitX: number;
  hitY: number;
}

export class SliceEngine {
  // Check collision between active blade segments and game items
  public static checkCollisions(segments: BladeSegment[], items: GameItem[]): SliceHit[] {
    const hits: SliceHit[] = [];

    for (const item of items) {
      if (item.isSliced) continue;

      for (const seg of segments) {
        const ax = seg.p1.x;
        const ay = seg.p1.y;
        const bx = seg.p2.x;
        const by = seg.p2.y;

        const abx = bx - ax;
        const aby = by - ay;
        const abLenSq = abx * abx + aby * aby;
        if (abLenSq === 0) continue;

        const acx = item.x - ax;
        const acy = item.y - ay;

        // Project C onto AB
        const t = Math.max(0, Math.min(1, (acx * abx + acy * aby) / abLenSq));
        const closestX = ax + t * abx;
        const closestY = ay + t * aby;

        const distSq = (item.x - closestX) ** 2 + (item.y - closestY) ** 2;

        if (distSq <= (item.radius * 1.1) ** 2) {
          const cutAngle = Math.atan2(aby, abx);
          hits.push({
            item,
            cutAngle,
            slashSpeed: seg.speed,
            hitX: closestX,
            hitY: closestY
          });
          break; // Avoid double hitting the same item in the same frame
        }
      }
    }

    return hits;
  }
}
