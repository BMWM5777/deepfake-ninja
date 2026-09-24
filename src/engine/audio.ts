import { settingsManager } from '../game/settings';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  private initCtx(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Whoosh sound when player slashes quickly
  public playSlash(intensity: number = 1): void {
    const settings = settingsManager.get();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      const startFreq = 600 * Math.min(2, Math.max(0.5, intensity));
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.16);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.16);

      const vol = 0.15 * settings.volume;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.17);
    } catch (e) {
      console.warn('Audio playSlash error', e);
    }
  }

  // Sci-fi high-energy laser cut when a spoof is sliced
  public playLaserCut(combo: number = 1): void {
    const settings = settingsManager.get();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = this.initCtx();
      const baseFreq = 800 + Math.min(combo * 150, 1200);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'square';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.2);

      osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.2);

      const vol = 0.25 * settings.volume;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.22);
      osc2.stop(ctx.currentTime + 0.22);
    } catch (e) {
      console.warn('Audio playLaserCut error', e);
    }
  }

  // False Rejection alarm buzzer (player sliced a genuine user)
  public playFalseRejection(): void {
    const settings = settingsManager.get();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.2);

      const vol = 0.3 * settings.volume;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio playFalseRejection error', e);
    }
  }

  // Security breach alarm (spoof fell through unsliced)
  public playBreach(): void {
    const settings = settingsManager.get();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.25);

      const vol = 0.3 * settings.volume;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio playBreach error', e);
    }
  }

  // Pleasant verification chime when genuine user leaves screen safely
  public playValidPassed(): void {
    const settings = settingsManager.get();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5

      const vol = 0.15 * settings.volume;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn('Audio playValidPassed error', e);
    }
  }

  // High-tech Combo fanfare
  public playComboFanfare(count: number): void {
    const settings = settingsManager.get();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = this.initCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const countClamped = Math.min(count, 4);

      for (let i = 0; i < countClamped; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[i], ctx.currentTime + i * 0.06);

        const vol = 0.2 * settings.volume;
        gain.gain.setValueAtTime(vol, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.18);
      }
    } catch (e) {
      console.warn('Audio playComboFanfare error', e);
    }
  }

  // High-tech sound when game starts (button, space, or dual-palm hold)
  public playGameStart(): void {
    const settings = settingsManager.get();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = this.initCtx();
      const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        const vol = 0.22 * settings.volume;
        gain.gain.setValueAtTime(vol, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.26);
      });
    } catch (e) {
      console.warn('Audio playGameStart error', e);
    }
  }

  // Celebratory victory fanfare for podium / top-10 achievements
  public playPodiumCelebration(rank: number): void {
    const settings = settingsManager.get();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = this.initCtx();
      const notes = rank === 1
        ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] // C5, E5, G5, C6, E6, G6
        : rank <= 3
        ? [523.25, 659.25, 783.99, 1046.50] // Major arpeggio
        : [587.33, 739.99, 880.00]; // Top 10 chime

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = rank === 1 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        const vol = 0.28 * settings.volume;
        gain.gain.setValueAtTime(vol, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + (rank === 1 ? 0.45 : 0.3));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + (rank === 1 ? 0.46 : 0.32));
      });
    } catch (e) {
      console.warn('Audio playPodiumCelebration error', e);
    }
  }

  public unlockAudio(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Ambient cyber-rhythm background synth loop
  public startMusic(): void {
    const settings = settingsManager.get();
    if (!settings.musicEnabled || this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    const bassLine = [65.41, 65.41, 77.78, 87.31, 65.41, 98.00, 87.31, 73.42]; // C2, Eb2, F2, G2...
    const tempoMs = 280;

    this.musicInterval = window.setInterval(() => {
      const currentSettings = settingsManager.get();
      if (!currentSettings.musicEnabled) {
        this.stopMusic();
        return;
      }

      try {
        const ctx = this.initCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        const freq = bassLine[this.musicStep % bassLine.length];
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);

        const vol = 0.08 * currentSettings.volume;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.25);

        this.musicStep++;
      } catch (e) {
        // Audio suspended until interaction
      }
    }, tempoMs);
  }

  public stopMusic(): void {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
