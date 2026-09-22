import './style.css';
import { cameraService } from './engine/camera';
import { handTrackerService, PalmInfo } from './engine/handTracker';
import { bladeManager } from './engine/blade';
import { spawner } from './engine/spawner';
import { SliceEngine } from './engine/sliceEngine';
import { particleEngine } from './engine/particles';
import { assetLoader } from './assets/assetLoader';
import { gameState } from './game/gameState';
import { settingsManager } from './game/settings';
import { HUD } from './ui/hud';
import { GameItem } from './game/entities/gameItem';
import { translations } from './i18n/translations';
import { soundEngine } from './engine/audio';

class GameApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private video: HTMLVideoElement;
  private hud: HUD;
  private activeItems: GameItem[] = [];
  private lastFrameTime = performance.now();
  private isMouseDown = false;
  private isCameraReady = false;
  private palmHoldProgress = 0;
  private readonly palmHoldThreshold = 1.0;
  private currentPalms: PalmInfo[] = [];

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.video = document.getElementById('webcam-video') as HTMLVideoElement;

    const hudContainer = document.getElementById('hud-layer')!;
    this.hud = new HUD(hudContainer);

    this.hud.setOnStart(() => this.startGame());

    this.setupResize();
    this.setupMouseEvents();
    this.setupSettingsListener();
    this.initSystems();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private setupResize(): void {
    const handleResize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
  }

  private setupSettingsListener(): void {
    settingsManager.subscribe(async (settings) => {
      if (settings.cameraMode === 'void') {
        this.video.classList.add('void-mode');
      } else {
        this.video.classList.remove('void-mode');
      }

      if (settings.inputMode === 'hands') {
        if (!this.isCameraReady || !cameraService.isRunning()) {
          try {
            await cameraService.start(this.video);
            this.isCameraReady = true;
          } catch (e) {
            console.warn('Camera start failed on inputMode change:', e);
          }
        }
        if (!handTrackerService.isReady()) {
          try {
            await handTrackerService.initialize();
          } catch (e) {
            console.warn('Hand tracker init failed on inputMode change:', e);
          }
        }
      }
    });
  }

  private setupMouseEvents(): void {
    const onMove = (clientX: number, clientY: number) => {
      const settings = settingsManager.get();
      // In mouse mode or when dragging, mouse controls the blade
      if (settings.inputMode === 'mouse' || this.isMouseDown) {
        bladeManager.addPoint(-1, clientX, clientY);
      }
    };

    window.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      onMove(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      onMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    // Touch support for mobile / touchscreens
    window.addEventListener('touchstart', (e) => {
      this.isMouseDown = true;
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    });

    window.addEventListener('touchend', () => {
      this.isMouseDown = false;
    });
  }

  private async initSystems(): Promise<void> {
    const lang = settingsManager.get().language;
    const t = translations[lang];

    try {
      // 1. Load assets
      this.hud.updateSystemStatus('Loading biometric assets...');
      await assetLoader.loadAll();

      // 2. Start Camera
      this.hud.updateSystemStatus(t.cameraPermissionNeeded);
      try {
        await cameraService.start(this.video);
        this.isCameraReady = true;
        // Automatically ensure input mode is set to hands when webcam is ready
        settingsManager.update({ inputMode: 'hands' });
      } catch (camErr) {
        console.warn('Webcam permission denied or unavailable, defaulting to mouse mode:', camErr);
        settingsManager.update({ inputMode: 'mouse' });
        this.hud.updateSystemStatus(t.readyToSlice, true);
        return;
      }

      // 3. Initialize Hand Tracker
      this.hud.updateSystemStatus(t.loadingAI);
      try {
        await handTrackerService.initialize();
      } catch (trackerErr) {
        console.error('Hand tracker initialization failed, switching to mouse mode:', trackerErr);
        settingsManager.update({ inputMode: 'mouse' });
      }

      this.hud.updateSystemStatus(t.readyToSlice, true);
    } catch (err) {
      console.error('Initialization error:', err);
      this.hud.updateSystemStatus(t.readyToSlice, true);
    }
  }

  private startGame(): void {
    this.palmHoldProgress = 0;
    this.currentPalms = [];
    this.hud.updateGameOverPalmProgress(0);
    this.activeItems = [];
    spawner.reset();
    bladeManager.clear();
    particleEngine.clear();
    soundEngine.playGameStart();
    gameState.startRound();
  }

  private gameLoop(now: number): void {
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;

    let detectedBladePoints: Array<{ x: number; y: number }> = [];

    // Process Dual-Palm start gesture detection in menu or gameover
    const isWaitingForStart = gameState.status === 'menu' || gameState.status === 'gameover';
    const canTrackHands = this.isCameraReady && handTrackerService.isReady() && cameraService.isRunning();

    if (isWaitingForStart && canTrackHands) {
      const palmStatus = handTrackerService.getBothPalmsStatus(this.video, now);
      this.currentPalms = palmStatus.palms;

      if (palmStatus.bothOpen) {
        this.palmHoldProgress = Math.min(1, this.palmHoldProgress + dt / this.palmHoldThreshold);
        if (gameState.status === 'gameover') {
          this.hud.updateGameOverPalmProgress(this.palmHoldProgress);
        }
        if (this.palmHoldProgress >= 1) {
          this.hud.updateGameOverPalmProgress(0);
          this.startGame();
        }
      } else {
        // Smoothly decay if hands are lowered
        this.palmHoldProgress = Math.max(0, this.palmHoldProgress - dt * 2.5);
        if (gameState.status === 'gameover') {
          this.hud.updateGameOverPalmProgress(this.palmHoldProgress);
        }
      }
    } else if (!isWaitingForStart) {
      if (this.palmHoldProgress > 0) {
        this.hud.updateGameOverPalmProgress(0);
      }
      this.palmHoldProgress = 0;
      this.currentPalms = [];
    }

    // 1. Process Hand Tracking for slicing
    if (canTrackHands) {
      const bladePoints = handTrackerService.getBladePoints(this.video, now);
      for (const pt of bladePoints) {
        const screenX = pt.x * this.canvas.width;
        const screenY = pt.y * this.canvas.height;
        bladeManager.addPoint(pt.handIndex, screenX, screenY, now);
        detectedBladePoints.push({ x: screenX, y: screenY });
      }
    }

    // 2. Update Blade & Physics
    bladeManager.update(now);

    if (gameState.status === 'playing') {
      gameState.update(dt);

      // Spawn new items
      const newItems = spawner.update(dt, this.canvas.width, this.canvas.height);
      this.activeItems.push(...newItems);

      // Update active items
      for (const item of this.activeItems) {
        item.update(dt);
      }

      // Detect collisions with active blade segments
      const activeSegments = bladeManager.getActiveSegments(now);
      if (activeSegments.length > 0) {
        const hits = SliceEngine.checkCollisions(activeSegments, this.activeItems);
        for (const hit of hits) {
          hit.item.slice(hit.cutAngle, hit.slashSpeed);
          gameState.onItemSliced(hit.item, hit.hitX, hit.hitY);
        }
      }

      // Check items leaving screen
      for (let i = this.activeItems.length - 1; i >= 0; i--) {
        const item = this.activeItems[i];
        if (item.isOutOfBounds(this.canvas.height)) {
          if (!item.isSliced) {
            gameState.onItemPassedSafely(item);
          }
          this.activeItems.splice(i, 1);
        }
      }
    }

    // Update Particles
    particleEngine.update(dt);

    // 3. Render Canvas
    this.renderFrame(now, detectedBladePoints);

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private renderFrame(now: number, handPoints: Array<{ x: number; y: number }>): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    const settings = settingsManager.get();
    if (settings.cameraMode === 'void') {
      // Dark cyber background
      ctx.fillStyle = '#06080F';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.save();

    // Apply screen shake
    if (particleEngine.screenShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * particleEngine.screenShakeIntensity;
      const shakeY = (Math.random() - 0.5) * particleEngine.screenShakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // Render flying biometric items
    if (gameState.status === 'playing') {
      for (const item of this.activeItems) {
        item.draw(ctx);
      }
    }

    // Render particle effects, shockwaves & floating text
    particleEngine.draw(ctx);

    // Render glowing neon laser blade trails
    bladeManager.draw(ctx, now);

    // Draw holographic biometric hand target reticles
    for (const pt of handPoints) {
      this.drawHandReticle(ctx, pt.x, pt.y, now);
    }

    // Draw dual palm gesture recognition HUD in menu or gameover state
    if ((gameState.status === 'menu' || gameState.status === 'gameover') && this.currentPalms.length > 0) {
      this.renderPalmHoldUI(ctx, now, w, h);
    }

    ctx.restore();
  }

  private renderPalmHoldUI(ctx: CanvasRenderingContext2D, now: number, w: number, h: number): void {
    if (this.currentPalms.length === 0) return;

    const lang = settingsManager.get().language;
    const t = translations[lang];
    const openPalms = this.currentPalms.filter(p => p.isOpen);

    // Draw individual palm indicators
    for (const palm of this.currentPalms) {
      const px = palm.x * w;
      const py = palm.y * h;
      const r = 52;

      ctx.save();
      ctx.translate(px, py);

      if (palm.isOpen) {
        const color = '#00FFA3';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;

        // 4 corner cyber brackets
        const bSize = 16;
        const bOffset = r + 4;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(-bOffset, -bOffset + bSize);
        ctx.lineTo(-bOffset, -bOffset);
        ctx.lineTo(-bOffset + bSize, -bOffset);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(bOffset - bSize, -bOffset);
        ctx.lineTo(bOffset, -bOffset);
        ctx.lineTo(bOffset, -bOffset + bSize);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(-bOffset, bOffset - bSize);
        ctx.lineTo(-bOffset, bOffset);
        ctx.lineTo(-bOffset + bSize, bOffset);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bOffset - bSize, bOffset);
        ctx.lineTo(bOffset, bOffset);
        ctx.lineTo(bOffset, bOffset - bSize);
        ctx.stroke();

        // Background circle track
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 163, 0.25)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Filling circular progress arc
        if (this.palmHoldProgress > 0) {
          ctx.beginPath();
          ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.palmHoldProgress);
          ctx.strokeStyle = '#00FFA3';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Inner spinning dashed scanner
        ctx.save();
        ctx.rotate(now * 0.002);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(0, 255, 163, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r - 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Palm label badge
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(6, 13, 26, 0.9)';
        ctx.fillRect(-48, r + 10, 96, 22);
        ctx.strokeStyle = '#00FFA3';
        ctx.lineWidth = 1;
        ctx.strokeRect(-48, r + 10, 96, 22);
        ctx.fillStyle = '#00FFA3';
        ctx.fillText('PALM 5/5', 0, r + 26);
      } else {
        // Hand detected but fingers not extended (e.g. fist or loose)
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(6, 13, 26, 0.9)';
        ctx.fillRect(-60, r + 10, 120, 20);
        ctx.strokeStyle = '#EAB308';
        ctx.lineWidth = 1;
        ctx.strokeRect(-60, r + 10, 120, 20);
        ctx.fillStyle = '#EAB308';
        ctx.fillText('OPEN HAND (5)', 0, r + 24);
      }

      ctx.restore();
    }

    // If both palms open, draw central holographic progress HUD
    if (openPalms.length >= 2) {
      // Central Progress HUD Card (anchored at top center of screen)
      const midX = w * 0.5;
      const midY = 110;

      ctx.save();
      ctx.translate(midX, midY);

      const cardW = 440;
      const cardH = 74;

      // Glassmorphism card backdrop
      ctx.fillStyle = 'rgba(6, 13, 26, 0.92)';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
        ctx.fill();
      } else {
        ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
      }

      ctx.strokeStyle = this.palmHoldProgress > 0.8 ? '#00FFA3' : 'rgba(0, 255, 163, 0.6)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00FFA3';
      ctx.shadowBlur = 14;
      if (typeof ctx.roundRect === 'function') {
        ctx.stroke();
      } else {
        ctx.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH);
      }

      // Title text prompt
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(t.holdPalmsToStart, 0, -10);

      // Progress bar track
      const barW = 360;
      const barH = 10;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(-barW / 2, 8, barW, barH, 5);
        ctx.fill();
      } else {
        ctx.fillRect(-barW / 2, 8, barW, barH);
      }

      // Progress bar fill
      if (this.palmHoldProgress > 0) {
        ctx.fillStyle = '#00FFA3';
        ctx.shadowColor = '#00FFA3';
        ctx.shadowBlur = 10;
        const fillW = Math.max(8, barW * this.palmHoldProgress);
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(-barW / 2, 8, fillW, barH, 5);
          ctx.fill();
        } else {
          ctx.fillRect(-barW / 2, 8, fillW, barH);
        }
      }

      // Percentage label
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00FFA3';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.floor(this.palmHoldProgress * 100)}%`, barW / 2, 4);

      ctx.restore();
    } else if (openPalms.length === 1) {
      // Prompt guiding user to raise their second palm
      const single = openPalms[0];
      const sx = single.x * w;
      const sy = single.y * h - 74;

      ctx.save();
      ctx.translate(sx, Math.max(60, sy));
      ctx.fillStyle = 'rgba(6, 13, 26, 0.9)';
      const pW = 260;
      const pH = 32;
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(-pW / 2, -pH / 2, pW, pH, 8);
        ctx.fill();
      } else {
        ctx.fillRect(-pW / 2, -pH / 2, pW, pH);
      }

      ctx.strokeStyle = 'rgba(0, 255, 163, 0.6)';
      ctx.lineWidth = 1.5;
      if (typeof ctx.roundRect === 'function') {
        ctx.stroke();
      } else {
        ctx.strokeRect(-pW / 2, -pH / 2, pW, pH);
      }

      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00FFA3';
      const promptText = lang === 'kk' ? 'ЕКІНШІ АЛАҚАНДЫ КӨРСЕТІҢІЗ (2/2)' : (lang === 'ru' ? 'ПОКАЖИТЕ ВТОРУЮ ЛАДОНЬ (2/2)' : 'SHOW SECOND PALM (2/2)');
      ctx.fillText(promptText, 0, 4);
      ctx.restore();
    }
  }

  private drawHandReticle(ctx: CanvasRenderingContext2D, x: number, y: number, now: number): void {
    ctx.save();
    ctx.translate(x, y);

    const spin = (now / 1000) * 2;
    ctx.rotate(spin);

    ctx.strokeStyle = '#00FFA3';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00FFA3';
    ctx.shadowBlur = 10;

    // Outer reticle circle with gaps
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 0.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 20, Math.PI * 0.5, Math.PI * 0.9);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 20, Math.PI * 1.0, Math.PI * 1.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 20, Math.PI * 1.5, Math.PI * 1.9);
    ctx.stroke();

    // Center crosshair dot
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();
  }
}

// Start application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
