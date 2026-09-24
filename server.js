import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'leaderboard.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Clean initial leaderboard
const DEFAULT_LEADERBOARD = [];

function deduplicateLeaderboard(records) {
  if (!Array.isArray(records)) return [];
  const map = new Map();
  for (const s of records) {
    if (!s || !s.participantId) continue;
    if (!map.has(s.participantId)) {
      map.set(s.participantId, s);
    } else {
      const existing = map.get(s.participantId);
      const existingIsDefault = existing.name && existing.name.startsWith('Игрок #');
      const currentIsDefault = s.name && s.name.startsWith('Игрок #');

      if (existingIsDefault && !currentIsDefault) {
        // Upgrade entry with the player's custom nickname
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
        // Keep existing custom nickname, update stats if better
        if (s.score > existing.score) {
          existing.score = s.score;
          existing.accuracy = s.accuracy;
          existing.threats = s.threats;
        }
      } else {
        // Both custom or both default: take the higher score
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

function readLeaderboard() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_LEADERBOARD, null, 2), 'utf-8');
      return DEFAULT_LEADERBOARD;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const cleaned = deduplicateLeaderboard(Array.isArray(parsed) ? parsed : DEFAULT_LEADERBOARD);
    return cleaned;
  } catch (err) {
    console.error('Error reading leaderboard file:', err);
    return DEFAULT_LEADERBOARD;
  }
}

function writeLeaderboard(records) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing leaderboard file:', err);
  }
}

function generateParticipantId(existing) {
  const existingIds = new Set(existing.map((s) => s.participantId));
  // Pick random 4-digit participant ID
  for (let i = 0; i < 50; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const candidate = `#${num}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }
  return `#${Math.floor(1000 + Math.random() * 9000)}`;
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/healthz' || url.pathname === '/api/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // GET /api/leaderboard
  if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
    const scores = readLeaderboard();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, scores: scores.slice(0, 50) }));
    return;
  }

  // GET /api/participant/new
  if (req.method === 'GET' && url.pathname === '/api/participant/new') {
    const scores = readLeaderboard();
    const newId = generateParticipantId(scores);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, participantId: newId }));
    return;
  }

  // POST /api/leaderboard
  if (req.method === 'POST' && url.pathname === '/api/leaderboard') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        let scores = readLeaderboard();

        const participantId = payload.participantId && /^#\d{3,5}$/.test(payload.participantId)
          ? payload.participantId
          : generateParticipantId(scores);

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const newScore = Math.max(0, Math.floor(Number(payload.score) || 0));
        const newAccuracy = Math.min(100, Math.max(0, Math.round(Number(payload.accuracy) || 0)));
        const newThreats = Math.max(0, Math.floor(Number(payload.threats) || 0));
        const customName = payload.name && payload.name.trim() ? payload.name.trim().substring(0, 24) : null;

        const existingIdx = scores.findIndex(s => s.participantId === participantId);

        let targetRecord;
        if (existingIdx !== -1) {
          targetRecord = scores[existingIdx];
          // If a custom name is supplied, update the name
          if (customName) {
            targetRecord.name = customName;
          }
          // Update score and stats if new score is >= existing, or if current was 0
          if (newScore >= targetRecord.score) {
            targetRecord.score = newScore;
            targetRecord.accuracy = newAccuracy;
            targetRecord.threats = newThreats;
            targetRecord.timeStr = timeStr;
            targetRecord.timestamp = Date.now();
          }
        } else {
          targetRecord = {
            id: Math.random().toString(36).substring(2, 9),
            participantId,
            name: customName || `Игрок ${participantId}`,
            score: newScore,
            accuracy: newAccuracy,
            threats: newThreats,
            timeStr,
            timestamp: Date.now()
          };
          scores.push(targetRecord);
        }

        scores = deduplicateLeaderboard(scores);

        // Keep top 100 historical
        const trimmed = scores.slice(0, 100);
        writeLeaderboard(trimmed);

        const rank = trimmed.findIndex(s => s.participantId === participantId) + 1;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          rank: rank > 0 ? rank : 1,
          participantId,
          entry: targetRecord,
          scores: trimmed.slice(0, 20)
        }));
      } catch (err) {
        console.error('Error processing POST /api/leaderboard:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid payload' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Verigram Leaderboard API running on http://0.0.0.0:${PORT}`);
});
