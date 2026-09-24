import { defineConfig, Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function leaderboardDevPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, 'data');
  const dataFile = path.resolve(dataDir, 'leaderboard.json');

  const defaultScores: any[] = [];

  function getScores() {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify(defaultScores, null, 2), 'utf-8');
      return defaultScores;
    }
    try {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      return Array.isArray(data) ? data : defaultScores;
    } catch {
      return defaultScores;
    }
  }

  function saveScores(scores: any[]) {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(scores, null, 2), 'utf-8');
  }

  return {
    name: 'leaderboard-dev-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/api/leaderboard' && req.method === 'GET') {
          const scores = getScores();
          scores.sort((a: any, b: any) => b.score - a.score);
          res.end(JSON.stringify({ success: true, scores: scores.slice(0, 50) }));
          return;
        }

        if (req.url === '/api/participant/new' && req.method === 'GET') {
          const scores = getScores();
          const existingIds = new Set(scores.map((s: any) => s.participantId));
          let num = Math.floor(1000 + Math.random() * 9000);
          while (existingIds.has(`#${num}`)) {
            num = Math.floor(1000 + Math.random() * 9000);
          }
          res.end(JSON.stringify({ success: true, participantId: `#${num}` }));
          return;
        }

        if (req.url === '/api/leaderboard' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const scores = getScores();

              const participantId = payload.participantId || `#${Math.floor(1000 + Math.random() * 9000)}`;
              const now = new Date();
              const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              const newRecord = {
                id: Math.random().toString(36).substring(2, 9),
                participantId,
                name: (payload.name || `Игрок ${participantId}`).trim().substring(0, 24),
                score: Math.max(0, Math.floor(Number(payload.score) || 0)),
                accuracy: Math.min(100, Math.max(0, Math.round(Number(payload.accuracy) || 0))),
                threats: Math.max(0, Math.floor(Number(payload.threats) || 0)),
                timeStr,
                timestamp: Date.now()
              };

              scores.push(newRecord);
              scores.sort((a: any, b: any) => b.score - a.score);
              const trimmed = scores.slice(0, 100);
              saveScores(trimmed);

              const rank = trimmed.findIndex((s: any) => s.id === newRecord.id) + 1;
              res.end(JSON.stringify({
                success: true,
                rank,
                participantId,
                entry: newRecord,
                scores: trimmed.slice(0, 20)
              }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Bad Request' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [leaderboardDevPlugin()],
  server: {
    host: true,
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  },
  build: {
    target: 'esnext'
  }
});
