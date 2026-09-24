export interface SessionScore {
  id: string;
  participantId: string;
  name: string;
  score: number;
  accuracy: number;
  threats: number;
  timeStr: string;
  timestamp: number;
}

export interface ScoreSubmissionResult {
  rank: number;
  participantId: string;
  isTop10: boolean;
  isTop3: boolean;
  entry: SessionScore;
  scores: SessionScore[];
}

const STORAGE_KEY = 'verigram_deepfake_ninja_session_scores_v2';
const PARTICIPANT_KEY = 'verigram_participant_id_v2';

export class SessionLeaderboard {
  private scores: SessionScore[] = [];
  private participantId: string = '';
  private listeners: Array<(scores: SessionScore[]) => void> = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastHash: string = '';

  constructor() {
    this.initParticipant();
    this.loadLocal();
    this.fetchRemote();
    this.startAutoSync(3000);
  }

  public startAutoSync(intervalMs: number = 3000): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(async () => {
      if (document.hidden) return;
      await this.fetchRemote();
    }, intervalMs);
  }

  public stopAutoSync(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private initParticipant(): void {
    // Generate an initial unique ID for the first screen load
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.participantId = `#${randomNum}`;
    // Asynchronously try to get a guaranteed unique server-issued participant ID
    this.generateNewParticipant().catch(() => {});
  }

  public async generateNewParticipant(): Promise<string> {
    try {
      const res = await fetch('/api/participant/new', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.participantId) {
          this.participantId = json.participantId;
          return this.participantId;
        }
      }
    } catch (e) {
      console.warn('Could not fetch server participant ID, using local generation:', e);
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.participantId = `#${randomNum}`;
    return this.participantId;
  }

  public getParticipantId(): string {
    return this.participantId;
  }

  public setParticipantId(id: string): void {
    if (id && id.trim()) {
      const clean = id.trim().startsWith('#') ? id.trim() : `#${id.trim()}`;
      this.participantId = clean;
    }
  }

  private deduplicate(scores: SessionScore[]): SessionScore[] {
    if (!Array.isArray(scores)) return [];
    const map = new Map<string, SessionScore>();
    for (const s of scores) {
      if (!s || !s.participantId) continue;
      if (!map.has(s.participantId)) {
        map.set(s.participantId, s);
      } else {
        const existing = map.get(s.participantId)!;
        const existingIsDefault = existing.name && existing.name.startsWith('Игрок #');
        const currentIsDefault = s.name && s.name.startsWith('Игрок #');

        if (existingIsDefault && !currentIsDefault) {
          map.set(s.participantId, {
            ...existing,
            name: s.name,
            score: Math.max(existing.score, s.score),
            accuracy: Math.max(existing.accuracy, s.accuracy),
            threats: Math.max(existing.threats, s.threats),
            timeStr: s.timeStr || existing.timeStr,
            timestamp: Math.max(existing.timestamp, s.timestamp)
          });
        } else if (!existingIsDefault && currentIsDefault) {
          if (s.score > existing.score) {
            existing.score = s.score;
            existing.accuracy = s.accuracy;
            existing.threats = s.threats;
          }
        } else {
          if (s.score > existing.score || (s.score === existing.score && s.timestamp >= existing.timestamp)) {
            map.set(s.participantId, s);
          }
        }
      }
    }
    const result = Array.from(map.values());
    result.sort((a, b) => b.score - a.score);
    return result;
  }

  private loadLocal(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.scores = this.deduplicate(JSON.parse(data));
      }
    } catch (e) {
      console.warn('Failed to load local session scores:', e);
      this.scores = [];
    }
  }

  private saveLocal(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
    } catch (e) {
      console.warn('Failed to save local session scores:', e);
    }
  }

  public subscribe(cb: (scores: SessionScore[]) => void): () => void {
    this.listeners.push(cb);
    cb(this.scores);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.scores);
    }
  }

  public async fetchRemote(): Promise<SessionScore[]> {
    try {
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.scores)) {
          const newHash = JSON.stringify(json.scores);
          if (newHash !== this.lastHash) {
            this.lastHash = newHash;
            this.scores = json.scores;
            this.saveLocal();
            this.notify();
          }
          return this.scores;
        }
      }
    } catch (err) {
      console.warn('Leaderboard server offline, using local cache:', err);
    }
    return this.scores;
  }

  public async submitScore(
    score: number,
    accuracy: number,
    threats: number,
    playerName?: string
  ): Promise<ScoreSubmissionResult> {
    const participantId = this.participantId;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const localEntry: SessionScore = {
      id: Math.random().toString(36).substring(2, 9),
      participantId,
      name: (playerName || `Игрок ${participantId}`).trim().substring(0, 24),
      score,
      accuracy,
      threats,
      timeStr,
      timestamp: Date.now()
    };

    // 1. Try sending to remote server
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          name: playerName,
          score,
          accuracy,
          threats
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const rank = json.rank || 1;
          this.scores = json.scores || this.scores;
          this.saveLocal();
          this.notify();
          return {
            rank,
            participantId: json.participantId || participantId,
            isTop10: rank <= 10,
            isTop3: rank <= 3,
            entry: json.entry || localEntry,
            scores: this.scores
          };
        }
      }
    } catch (e) {
      console.warn('Network submit failed, falling back to local leaderboard:', e);
    }

    // 2. Fallback to local storage calculation
    const existingIdx = this.scores.findIndex(s => s.participantId === participantId);
    let finalEntry = localEntry;
    if (existingIdx !== -1) {
      const existing = this.scores[existingIdx];
      if (playerName && playerName.trim()) {
        existing.name = playerName.trim().substring(0, 24);
      }
      if (score >= existing.score) {
        existing.score = score;
        existing.accuracy = accuracy;
        existing.threats = threats;
        existing.timeStr = timeStr;
        existing.timestamp = Date.now();
      }
      finalEntry = existing;
    } else {
      this.scores.push(localEntry);
    }
    this.scores = this.deduplicate(this.scores);
    if (this.scores.length > 50) {
      this.scores = this.scores.slice(0, 50);
    }
    this.saveLocal();
    this.notify();

    const rank = this.scores.findIndex(s => s.participantId === participantId) + 1;
    return {
      rank: rank > 0 ? rank : 1,
      participantId,
      isTop10: rank <= 10,
      isTop3: rank <= 3,
      entry: finalEntry,
      scores: this.scores
    };
  }

  public getTopScores(): SessionScore[] {
    return [...this.scores];
  }
}

export const sessionLeaderboard = new SessionLeaderboard();
