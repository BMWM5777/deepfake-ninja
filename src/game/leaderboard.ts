export interface SessionScore {
  id: string;
  score: number;
  accuracy: number;
  threats: number;
  timeStr: string;
  timestamp: number;
}

const STORAGE_KEY = 'dilsham5_deepfake_ninja_session_scores_v1';

export class SessionLeaderboard {
  private scores: SessionScore[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.scores = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load session scores:', e);
      this.scores = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
    } catch (e) {
      console.warn('Failed to save session scores:', e);
    }
  }

  public addScore(score: number, accuracy: number, threats: number): number {
    if (score <= 0 && threats <= 0) return -1;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const entry: SessionScore = {
      id: Math.random().toString(36).substring(2, 8),
      score,
      accuracy,
      threats,
      timeStr,
      timestamp: Date.now()
    };

    this.scores.push(entry);
    // Sort descending by score
    this.scores.sort((a, b) => b.score - a.score);

    // Keep top 10
    if (this.scores.length > 10) {
      this.scores = this.scores.slice(0, 10);
    }

    this.save();
    return this.scores.findIndex(s => s.id === entry.id) + 1;
  }

  public getTopScores(): SessionScore[] {
    return [...this.scores];
  }

  public clear(): void {
    this.scores = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const sessionLeaderboard = new SessionLeaderboard();
