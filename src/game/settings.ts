import { Language, detectSystemLanguage } from '../i18n/translations';

export type CameraMode = 'mirror' | 'void';
export type InputMode = 'hands' | 'mouse';

export interface GameSettings {
  language: Language;
  cameraMode: CameraMode;
  inputMode: InputMode;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
}

const STORAGE_KEY = 'dilsham5_deepfake_ninja_settings_v1';

class SettingsManager {
  private settings: GameSettings;
  private listeners: Array<(settings: GameSettings) => void> = [];

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): GameSettings {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaultLang = detectSystemLanguage();

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          language: parsed.language || defaultLang,
          cameraMode: parsed.cameraMode || 'mirror',
          inputMode: parsed.inputMode || 'hands',
          sfxEnabled: parsed.sfxEnabled ?? true,
          musicEnabled: parsed.musicEnabled ?? true,
          volume: parsed.volume ?? 0.8
        };
      } catch (e) {
        console.warn('Failed to parse saved settings, using defaults', e);
      }
    }

    return {
      language: defaultLang,
      cameraMode: 'mirror',
      inputMode: 'hands',
      sfxEnabled: true,
      musicEnabled: true,
      volume: 0.8
    };
  }

  public get(): GameSettings {
    return { ...this.settings };
  }

  public update(partial: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...partial };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.notify();
  }

  public subscribe(callback: (settings: GameSettings) => void): () => void {
    this.listeners.push(callback);
    callback(this.settings);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.settings);
    }
  }
}

export const settingsManager = new SettingsManager();
