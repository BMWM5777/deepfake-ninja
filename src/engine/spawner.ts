import { GameItem, ItemType } from '../game/entities/gameItem';
import { assetLoader, GameAssets } from '../assets/assetLoader';

export class Spawner {
  private timer: number = 0;
  private waveInterval: number = 2.4;
  private gravity: number = 700;
  private waveCount: number = 0;

  public reset(): void {
    this.timer = 0.8;
    this.waveInterval = 2.4;
    this.waveCount = 0;
  }

  public update(dt: number, canvasWidth: number, canvasHeight: number): GameItem[] {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.waveCount++;
      this.waveInterval = Math.max(1.2, 2.4 - this.waveCount * 0.05);
      this.timer = this.waveInterval;

      return this.spawnWave(canvasWidth, canvasHeight);
    }
    return [];
  }

  private spawnWave(width: number, height: number): GameItem[] {
    const assets = assetLoader.assets as GameAssets;
    const items: GameItem[] = [];

    let count = 1;
    const rand = Math.random();
    if (this.waveCount > 6 && rand > 0.45) {
      count = 3;
    } else if (this.waveCount > 2 && rand > 0.3) {
      count = 2;
    }

    const spawnBonus = Math.random() < 0.08;

    for (let i = 0; i < count; i++) {
      const type = this.pickItemType(i === 0 && spawnBonus);
      const img = this.getImageForType(type, assets);

      const margin = width * 0.15;
      const x = margin + Math.random() * (width - 2 * margin);
      const y = height + 35;

      const targetApexY = height * (0.20 + Math.random() * 0.22);
      const apexDist = y - targetApexY;
      const vy = -Math.sqrt(2 * this.gravity * apexDist);

      const centerX = width * 0.5;
      const vx = ((centerX - x) / (width * 0.5)) * (90 + Math.random() * 130) + (Math.random() - 0.5) * 80;

      items.push(new GameItem(type, x, y, vx, vy, img));
    }

    return items;
  }

  private pickItemType(isBonus: boolean): ItemType {
    if (isBonus) {
      return 'BONUS_SHIELD';
    }

    // ~35% Valid Citizens (KZ ID, KZ VNJ, Live Selfie), ~65% Spoof attacks
    const r = Math.random();
    if (r < 0.35) {
      const validRand = Math.random();
      if (validRand < 0.4) {
        return 'VALID_ID'; // Kazakhstan National ID card
      } else if (validRand < 0.75) {
        return 'VALID_VNJ'; // Kazakhstan Residence Permit
      } else {
        return 'VALID_SELFIE'; // Live Selfie Video
      }
    } else if (r < 0.60) {
      return 'SPOOF_MASK';
    } else if (r < 0.85) {
      return 'SPOOF_DEEPFAKE';
    } else {
      return 'SPOOF_EMULATOR';
    }
  }

  private getImageForType(type: ItemType, assets: GameAssets): HTMLImageElement | null {
    if (!assets) return null;
    switch (type) {
      case 'VALID_ID':
        return assets.kzIdCard || assets.validSelfie;
      case 'VALID_VNJ':
        return assets.kzVnjCard || assets.kzIdCard;
      case 'VALID_SELFIE':
        return assets.validSelfie;
      case 'SPOOF_MASK':
        return assets.siliconeMask;
      case 'SPOOF_DEEPFAKE':
        return assets.deepfakeFace;
      case 'SPOOF_EMULATOR':
        return assets.cameraEmulator;
      case 'BONUS_SHIELD':
        return assets.brandLogo;
    }
  }
}

export const spawner = new Spawner();
