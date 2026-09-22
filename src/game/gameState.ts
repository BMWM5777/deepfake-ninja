import { GameItem } from './entities/gameItem';
import { soundEngine } from '../engine/audio';
import { particleEngine } from '../engine/particles';
import { translations, itemTranslations } from '../i18n/translations';
import { settingsManager } from './settings';
import { sessionLeaderboard } from './leaderboard';
import confetti from 'canvas-confetti';

export class GameStateManager {
  public status: 'menu' | 'playing' | 'gameover' = 'menu';
  public score: number = 0;
  public shields: number = 3;
  public maxShields: number = 3;
  public combo: number = 0;
  public comboTimer: number = 0;
  public maxCombo: number = 0;
  public threatsNeutralized: number = 0;
  public validProtected: number = 0;
  public validMistakenlySliced: number = 0;
  public spoofsMissed: number = 0;
  public isOverdriveActive: boolean = false;
  public overdriveTime: number = 0;

  private listeners: Array<() => void> = [];

  public startRound(): void {
    this.status = 'playing';
    this.score = 0;
    this.shields = 3;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.threatsNeutralized = 0;
    this.validProtected = 0;
    this.validMistakenlySliced = 0;
    this.spoofsMissed = 0;
    this.isOverdriveActive = false;
    this.overdriveTime = 0;

    soundEngine.startMusic();
    this.notify();
  }

  public update(dt: number): void {
    if (this.status !== 'playing') return;

    // Update combo timer
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.notify();
      }
    }

    // Update overdrive
    if (this.isOverdriveActive) {
      this.overdriveTime -= dt;
      if (this.overdriveTime <= 0) {
        this.isOverdriveActive = false;
        this.notify();
      }
    }
  }

  public onItemSliced(item: GameItem, hitX: number, hitY: number): void {
    if (this.status !== 'playing') return;
    const lang = settingsManager.get().language;
    const t = translations[lang];

    if (item.category === 'spoof') {
      // Threat eliminated!
      this.threatsNeutralized++;
      this.combo++;
      this.comboTimer = 1.4; // seconds to chain next slice
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      // Combo multiplier: 1x, 1.5x, 2x, 3x...
      const multiplier = this.combo > 1 ? 1 + (this.combo - 1) * 0.5 : 1;
      const points = Math.round(item.scoreValue * multiplier);
      this.score += points;

      // Audio & Particle FX
      soundEngine.playLaserCut(this.combo);
      particleEngine.addSliceSparks(hitX, hitY, item.glowColor, 28);

      const localizedLabel = itemTranslations[lang]?.[item.type] || item.label;
      let text = `+${points} ${localizedLabel}`;
      if (this.combo > 1) {
        text = `${this.combo}x ${t.combo}! +${points}`;
        soundEngine.playComboFanfare(this.combo);
      }
      particleEngine.addFloatingText(text, hitX, hitY, item.glowColor, this.combo > 1 ? 1.25 : 1.0);

    } else if (item.category === 'valid') {
      // Mistake! Player sliced a genuine user / ID card
      this.validMistakenlySliced++;
      this.combo = 0;
      this.shields = Math.max(0, this.shields - 1);

      soundEngine.playFalseRejection();
      particleEngine.triggerScreenShake(16);
      particleEngine.triggerScreenFlash('rgba(255, 0, 85, 0.45)', 0.45);
      particleEngine.addSliceSparks(hitX, hitY, '#FF0055', 35);
      particleEngine.addFloatingText(t.falseRejection, hitX, hitY, '#FF0055', 1.15);

      if (this.shields <= 0) {
        this.triggerGameOver();
      }

    } else if (item.category === 'bonus') {
      // Cyber Overdrive Bonus
      this.score += 200;
      this.shields = Math.min(this.maxShields, this.shields + 1);
      this.isOverdriveActive = true;
      this.overdriveTime = 4.5;

      soundEngine.playComboFanfare(4);
      particleEngine.triggerScreenFlash('rgba(124, 99, 250, 0.4)', 0.4);
      particleEngine.addSliceSparks(hitX, hitY, '#7C63FA', 40);
      particleEngine.addFloatingText(`CYBER OVERDRIVE! +1 SHIELD`, hitX, hitY, '#7C63FA', 1.3);
    }

    this.notify();
  }

  public onItemPassedSafely(item: GameItem): void {
    if (this.status !== 'playing' || item.isSliced) return;
    const lang = settingsManager.get().language;
    const t = translations[lang];

    if (item.category === 'valid') {
      // Successfully let genuine citizen pass
      this.validProtected++;
      this.score += 50;
      soundEngine.playValidPassed();
      particleEngine.addFloatingText(t.validVerified, item.x, Math.min(window.innerHeight - 80, item.y), '#00FFA3', 0.95);

    } else if (item.category === 'spoof') {
      // Spoof penetrated security!
      this.spoofsMissed++;
      this.shields = Math.max(0, this.shields - 1);
      soundEngine.playBreach();
      particleEngine.triggerScreenShake(12);
      particleEngine.triggerScreenFlash('rgba(255, 50, 50, 0.35)', 0.35);
      particleEngine.addFloatingText(t.spoofBreach, item.x, Math.min(window.innerHeight - 80, item.y), '#FF3366', 1.1);

      if (this.shields <= 0) {
        this.triggerGameOver();
      }
    }

    this.notify();
  }

  private triggerGameOver(): void {
    this.status = 'gameover';
    soundEngine.stopMusic();

    // Record real score in session leaderboard
    sessionLeaderboard.addScore(this.score, this.getAccuracy(), this.threatsNeutralized);

    const accuracy = this.getAccuracy();
    if (accuracy >= 80) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    }

    this.notify();
  }

  public getAccuracy(): number {
    const totalDecisions = this.threatsNeutralized + this.validProtected + this.validMistakenlySliced + this.spoofsMissed;
    if (totalDecisions === 0) return 100;
    const correct = this.threatsNeutralized + this.validProtected;
    return Math.round((correct / totalDecisions) * 100);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const gameState = new GameStateManager();
