export interface GameAssets {
  validSelfie: HTMLImageElement;
  kzIdCard: HTMLImageElement;
  kzVnjCard: HTMLImageElement;
  siliconeMask: HTMLImageElement;
  deepfakeFace: HTMLImageElement;
  cameraEmulator: HTMLImageElement;
  brandLogo: HTMLImageElement;
}

export class AssetLoader {
  private static instance: AssetLoader;
  public assets: Partial<GameAssets> = {};
  public isLoaded = false;

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  public async loadAll(): Promise<GameAssets> {
    if (this.isLoaded && this.isAllReady()) {
      return this.assets as GameAssets;
    }

    const imagePaths = {
      validSelfie: './assets/valid_selfie.jpg',
      kzIdCard: './assets/kz_id.jpg',
      kzVnjCard: './assets/kz_vnj.jpg',
      siliconeMask: './assets/silicone_mask.jpg',
      deepfakeFace: './assets/deepfake_face.jpg',
      cameraEmulator: './assets/camera_emulator.jpg',
      brandLogo: './logo.svg'
    };

    const entries = Object.entries(imagePaths);
    const promises = entries.map(([key, src]) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          (this.assets as Record<string, HTMLImageElement>)[key] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`Asset failed to load: ${src}, generating fallback`);
          const fallback = this.createFallbackTexture(key);
          (this.assets as Record<string, HTMLImageElement>)[key] = fallback;
          resolve();
        };
      });
    });

    await Promise.all(promises);
    this.isLoaded = true;
    return this.assets as GameAssets;
  }

  private isAllReady(): boolean {
    return !!(
      this.assets.validSelfie &&
      this.assets.kzIdCard &&
      this.assets.kzVnjCard &&
      this.assets.siliconeMask &&
      this.assets.deepfakeFace &&
      this.assets.cameraEmulator &&
      this.assets.brandLogo
    );
  }

  private createFallbackTexture(name: string): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#3C8DFC';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 240, 240);

    ctx.fillStyle = '#00FFA3';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DILSHAM5', 128, 110);
    ctx.fillText(name.toUpperCase(), 128, 150);

    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }
}

export const assetLoader = AssetLoader.getInstance();
