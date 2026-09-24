import { gameState } from '../game/gameState';
import { settingsManager } from '../game/settings';
import { translations, itemTranslations } from '../i18n/translations';
import { sessionLeaderboard } from '../game/leaderboard';
import { soundEngine } from '../engine/audio';

export class HUD {
  private container: HTMLElement;
  private onStartCallback: (() => void) | null = null;
  private isSettingsOpen = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    gameState.subscribe(() => {
      this.updateHUD();
      this.renderLeaderboard();
    });
    settingsManager.subscribe(() => {
      this.updateSettingsUI();
      this.updateAllLanguageStrings();
    });
    sessionLeaderboard.subscribe(() => {
      this.renderLeaderboard();
    });
  }

  public setOnStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  public render(): void {
    const lang = settingsManager.get().language;
    const t = translations[lang];
    const settings = settingsManager.get();
    const pid = sessionLeaderboard.getParticipantId();

    this.container.innerHTML = `
      <!-- Top Telemetry Header during Gameplay -->
      <div id="hud-top" class="hud-top ${gameState.status === 'playing' ? 'visible' : 'hidden'}">
        <div class="hud-brand">
          <img src="./logo.svg" alt="Verigram Logo" class="hud-logo" />
          <div class="hud-title-wrap">
            <span class="hud-brand-name">VERIGRAM</span>
            <span class="hud-sub-name">LIVENESS GUARDIAN</span>
          </div>
        </div>

        <!-- Center Shields & Biometric Pulse -->
        <div class="hud-shields-container">
          <div class="hud-status-bar-top">
            <span class="hud-label" id="label-shields">${t.shields}</span>
            <div class="biometric-pulse-bars">
              <span class="bar bar-1"></span>
              <span class="bar bar-2"></span>
              <span class="bar bar-3"></span>
              <span class="bar bar-4"></span>
            </div>
          </div>
          <div class="hud-shields" id="hud-shields-list">
            ${this.renderShieldsHtml(gameState.shields, gameState.maxShields)}
          </div>
        </div>

        <!-- Right Score & Settings -->
        <div class="hud-score-container">
          <div class="hud-participant-tag" title="${t.participantNumber}">
            <span class="chip-label">ID</span>
            <span class="chip-num" id="hud-participant-id">${pid}</span>
          </div>
          <div class="hud-score-wrap">
            <span class="hud-label" id="label-score">${t.score}</span>
            <span class="hud-score-number" id="hud-score-val">${gameState.score}</span>
          </div>
          <div id="hud-combo-badge" class="hud-combo-badge ${gameState.combo > 1 ? 'active' : ''}">
            ${gameState.combo}x ${t.combo}!
          </div>
          <button id="btn-open-settings" class="btn-icon" title="${t.settings}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Bottom Guidance HUD during game -->
      <div id="hud-bottom" class="hud-bottom ${gameState.status === 'playing' ? 'visible' : 'hidden'}">
        <div class="hud-pill pill-danger">
          <span class="pill-dot red"></span>
          <span id="text-rule-cut">${t.ruleCutSpoofs}</span>
        </div>
        <div class="hud-pill pill-success">
          <span class="pill-dot green"></span>
          <span id="text-rule-protect">${t.ruleProtectValid}</span>
        </div>
      </div>

      <!-- Start Screen / Hub -->
      <div id="start-menu" class="attractor-hub ${gameState.status === 'menu' ? 'active' : ''}">
        <!-- Top Ticker Bar -->
        <div class="expo-ticker-bar">
          <div class="ticker-badge">
            <span class="pulsing-led"></span>
            <span id="expo-booth-title">${t.boothStandTitle}</span>
          </div>
          <div class="ticker-participant">
            <span class="chip-label" id="ticker-participant-label">${t.participantNumber}:</span>
            <span class="chip-id" id="ticker-participant-id">${pid}</span>
          </div>
          <div class="ticker-telemetry">
            <span>VERIGRAM VISION</span>
            <span class="divider">/</span>
            <span>60 FPS</span>
            <span class="divider">/</span>
            <span class="telemetry-highlight">AI EDGE ACCELERATED</span>
          </div>
          <button id="btn-hero-settings" class="btn-icon-small" title="${t.settings}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>

        <!-- 3-Column Display (Adaptive grid) -->
        <div class="expo-main-container">
          <!-- Left Column: Biometric Target Matrix -->
          <div class="expo-panel target-matrix-panel">
            <div class="panel-header">
              <div class="panel-header-top">
                <span class="panel-tag danger">TARGET MATRIX</span>
              </div>
              <h3 id="text-target-header">${t.targetIntelTitle}</h3>
            </div>

            <div class="intel-cards-stack">
              <div class="intel-card spoof-card">
                <img src="./assets/deepfake_face.jpg" alt="Deepfake" class="intel-thumb" />
                <div class="intel-info">
                  <div class="intel-title-row">
                    <span class="intel-name" id="label-deepfake">${itemTranslations[lang]['SPOOF_DEEPFAKE']}</span>
                    <span class="badge-cut">${t.badgeCut}</span>
                  </div>
                  <p class="intel-desc">AI generated synthetic identity injection</p>
                </div>
              </div>

              <div class="intel-card spoof-card">
                <img src="./assets/silicone_mask.jpg" alt="Mask" class="intel-thumb" />
                <div class="intel-info">
                  <div class="intel-title-row">
                    <span class="intel-name" id="label-mask">${itemTranslations[lang]['SPOOF_MASK']}</span>
                    <span class="badge-cut">${t.badgeCut}</span>
                  </div>
                  <p class="intel-desc">Physical 3D volumetric silicone mask attack</p>
                </div>
              </div>

              <div class="intel-card spoof-card">
                <img src="./assets/camera_emulator.jpg" alt="Emulator" class="intel-thumb" />
                <div class="intel-info">
                  <div class="intel-title-row">
                    <span class="intel-name" id="label-emulator">${itemTranslations[lang]['SPOOF_EMULATOR']}</span>
                    <span class="badge-cut">${t.badgeCut}</span>
                  </div>
                  <p class="intel-desc">Virtual media loop & synthetic camera driver</p>
                </div>
              </div>

              <div class="intel-card valid-card">
                <img src="./assets/kz_id.jpg" alt="KZ ID" class="intel-thumb" />
                <div class="intel-info">
                  <div class="intel-title-row">
                    <span class="intel-name" id="label-kzid">${itemTranslations[lang]['VALID_ID']}</span>
                    <span class="badge-protect">${t.badgeProtect}</span>
                  </div>
                  <p class="intel-desc">Official Citizen ID // Verified Document</p>
                </div>
              </div>

              <div class="intel-card valid-card">
                <img src="./assets/kz_vnj.jpg" alt="KZ VNJ" class="intel-thumb" />
                <div class="intel-info">
                  <div class="intel-title-row">
                    <span class="intel-name" id="label-kzvnj">${itemTranslations[lang]['VALID_VNJ']}</span>
                    <span class="badge-protect">${t.badgeProtect}</span>
                  </div>
                  <p class="intel-desc">KZ Residence Permit // Verified Document</p>
                </div>
              </div>

              <div class="intel-card valid-card">
                <img src="./assets/valid_selfie.jpg" alt="Live Selfie" class="intel-thumb" />
                <div class="intel-info">
                  <div class="intel-title-row">
                    <span class="intel-name" id="label-selfie">${itemTranslations[lang]['VALID_SELFIE']}</span>
                    <span class="badge-protect">${t.badgeProtect}</span>
                  </div>
                  <p class="intel-desc">Active 3D Liveness Detection confirmed</p>
                </div>
              </div>

              <!-- Bonus Verigram Life/Shield Item -->
              <div class="intel-card bonus-card">
                <img src="./logo.svg" alt="Verigram Shield" class="intel-thumb bonus-thumb" />
                <div class="intel-info">
                  <div class="intel-title-row">
                    <span class="intel-name" id="label-bonus">${itemTranslations[lang]['BONUS_SHIELD']}</span>
                    <span class="badge-bonus">${t.badgeBonus}</span>
                  </div>
                  <p class="intel-desc" id="desc-bonus">${t.bonusShieldDesc}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Center Column: Holographic Verigram Core & Start Action -->
          <div class="expo-center-showcase">
            <div class="hologram-portal-container">
              <div class="hologram-ring ring-outer"></div>
              <div class="hologram-ring ring-middle"></div>
              <div class="hologram-ring ring-inner"></div>
              
              <div class="core-brand-emblem">
                <img src="./logo.svg" alt="Verigram Core" class="core-logo" />
              </div>
            </div>

            <div class="hero-text-block">
              <h1 class="portal-main-title" id="portal-title">${t.gameTitle}</h1>
              <p class="portal-subtitle" id="portal-subtitle">${t.gameSubtitle}</p>
              <div class="verigram-verified-chip">
                <span class="shield-badge-icon">VERIFIED</span>
                <span id="portal-tagline">${t.verigramTagline}</span>
              </div>
            </div>

            <!-- Arcade Play CTA Trigger -->
            <div class="arcade-action-wrap">
              <button id="btn-start-game" class="btn-arcade-start">
                <span class="btn-glare"></span>
                <span class="btn-text" id="btn-start-text">${t.startGame}</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
              <span class="keyboard-prompt" id="keyboard-prompt">${t.pressSpaceToStart}</span>
            </div>

            <!-- Standby Camera & AI Status -->
            <div class="booth-sensor-status" id="menu-system-status">
              <span class="sensor-indicator ready"></span>
              <span id="system-status-text">${t.readyToSlice}</span>
            </div>
          </div>

          <!-- Right Column: Shared Leaderboard -->
          <div class="expo-panel leaderboard-panel">
            <div class="panel-header lb-header-panel">
              <div class="panel-header-top">
                <span class="panel-tag cyan">GLOBAL RANKINGS</span>
                <div class="panel-header-actions">
                  <span class="live-pulse-badge"><span class="pulse-dot"></span> LIVE</span>
                  <button id="btn-refresh-leaderboard" class="btn-icon-refresh" title="Синхронизировать">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M23 4v6h-6"></path>
                      <path d="M1 20v-6h6"></path>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <h3 id="text-leaderboard-header">${t.globalLeaderboardTitle}</h3>
            </div>

            <div class="leaderboard-table" id="leaderboard-list">
              <!-- Rendered dynamically -->
            </div>

            <div class="booth-live-pulse-card">
              <div class="pulse-title">VERIGRAM LIVENESS TELEMETRY</div>
              <div class="metric-row">
                <span>Anti-Spoofing Detection:</span>
                <strong class="green-text">99.98%</strong>
              </div>
              <div class="metric-row">
                <span>Latency per frame:</span>
                <strong>&lt; 12 ms</strong>
              </div>
              <div class="metric-row">
                <span>Compliance Standard:</span>
                <strong class="blue-text">iBeta Level 2 Compliant</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Over Modal with Celebrations and Participant ID -->
      <div id="game-over-modal" class="overlay-modal ${gameState.status === 'gameover' ? 'active' : ''}">
        <div class="modal-card gameover-card">
          <div class="gameover-header">
            <span class="gameover-badge">VERIFICATION REPORT // VERIGRAM</span>
            <h2 class="gameover-title" id="go-title">${t.gameOverTitle}</h2>
          </div>

          <!-- Participant Unique ID Badge Banner -->
          <div class="participant-badge-banner">
            <span class="p-badge-label" id="go-badge-label">${t.participantNumber}</span>
            <span class="p-badge-id" id="go-participant-id">${pid}</span>
          </div>

          <!-- Dynamic Rank Celebration Banner -->
          <div class="rank-celebration-banner" id="go-rank-banner">
            <span class="rank-badge-text">...</span>
          </div>

          <div class="stats-grid">
            <div class="stat-box primary">
              <span class="stat-label" id="go-label-score">${t.finalScore}</span>
              <span class="stat-value" id="go-score">${gameState.score}</span>
            </div>
            <div class="stat-box accent">
              <span class="stat-label" id="go-label-acc">${t.livenessAccuracy}</span>
              <span class="stat-value" id="go-accuracy">${gameState.getAccuracy()}%</span>
            </div>
            <div class="stat-box danger">
              <span class="stat-label" id="go-label-threats">${t.threatsNeutralizedCount}</span>
              <span class="stat-value" id="go-threats">${gameState.threatsNeutralized}</span>
            </div>
            <div class="stat-box success">
              <span class="stat-label" id="go-label-valid">${t.validProtectedCount}</span>
              <span class="stat-value" id="go-valid">${gameState.validProtected}</span>
            </div>
          </div>

          <!-- Save to Shared Leaderboard Form -->
          <div class="leaderboard-save-box" id="go-save-box">
            <input type="text" id="player-name-input" class="cyber-input" placeholder="${t.enterNamePrompt}" maxlength="20" />
            <button id="btn-save-score" class="btn-save-record">
              <span id="btn-save-text">${t.saveScoreBtn}</span>
            </button>
          </div>

          <div class="gameover-actions">
            <button id="btn-play-again" class="btn-arcade-start">
              <span id="btn-play-again-text">${t.playAgain}</span>
            </button>
            <span class="keyboard-prompt" id="gameover-restart-prompt">${t.pressSpaceToStart}</span>
            <button id="btn-back-menu" class="btn-secondary-glass">
              <span id="btn-back-menu-text">${t.backToMenu}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Settings Modal -->
      <div id="settings-modal" class="overlay-modal">
        <div class="modal-card settings-card" id="settings-card-content">
          <div class="settings-header">
            <h2 id="settings-title">${t.settings}</h2>
            <button id="btn-close-settings" class="btn-icon-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="settings-body">
            <!-- Language Selection -->
            <div class="setting-group">
              <label class="setting-title" id="label-lang">${t.language}</label>
              <div class="segmented-control" id="lang-control">
                <button class="seg-btn ${settings.language === 'kk' ? 'active' : ''}" data-lang="kk">Қазақша</button>
                <button class="seg-btn ${settings.language === 'ru' ? 'active' : ''}" data-lang="ru">Русский</button>
                <button class="seg-btn ${settings.language === 'en' ? 'active' : ''}" data-lang="en">English</button>
              </div>
            </div>

            <!-- Camera Mode -->
            <div class="setting-group">
              <label class="setting-title" id="label-cam-mode">${t.cameraMode}</label>
              <div class="segmented-control" id="cam-control">
                <button class="seg-btn ${settings.cameraMode === 'mirror' ? 'active' : ''}" data-cam="mirror">${t.cameraMirror}</button>
                <button class="seg-btn ${settings.cameraMode === 'void' ? 'active' : ''}" data-cam="void">${t.cameraVoid}</button>
              </div>
              <p class="setting-hint" id="cam-hint">${settings.cameraMode === 'mirror' ? t.cameraMirrorDesc : t.cameraVoidDesc}</p>
            </div>

            <!-- Input Mode -->
            <div class="setting-group">
              <label class="setting-title" id="label-input">${t.inputMode}</label>
              <div class="segmented-control" id="input-control">
                <button class="seg-btn ${settings.inputMode === 'hands' ? 'active' : ''}" data-input="hands">
                  🖐️ ${t.inputHands}
                </button>
                <button class="seg-btn ${settings.inputMode === 'mouse' ? 'active' : ''}" data-input="mouse">
                  🖱️ ${t.inputMouse}
                </button>
              </div>
              <p class="setting-hint" id="input-hint">${settings.inputMode === 'hands' ? t.inputHandsDesc : t.inputMouseDesc}</p>
            </div>

            <!-- Audio Controls -->
            <div class="setting-group">
              <label class="setting-title" id="label-audio">${t.audio}</label>
              <div class="toggle-row">
                <span id="label-sfx">${t.soundEnabled}</span>
                <input type="checkbox" id="toggle-sfx" ${settings.sfxEnabled ? 'checked' : ''} class="cyber-switch" />
              </div>
              <div class="toggle-row">
                <span id="label-music">${t.musicEnabled}</span>
                <input type="checkbox" id="toggle-music" ${settings.musicEnabled ? 'checked' : ''} class="cyber-switch" />
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderLeaderboard();
  }

  private renderLeaderboard(): void {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    const lang = settingsManager.get().language;
    const t = translations[lang];
    const scores = sessionLeaderboard.getTopScores();

    if (scores.length === 0) {
      list.innerHTML = `
        <div class="lb-empty-state">
          <span>${t.noSessionsYet}</span>
        </div>
      `;
      return;
    }

    let html = '';
    const currentPid = sessionLeaderboard.getParticipantId();

    scores.slice(0, 10).forEach((entry, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      const isSelf = entry.participantId === currentPid;

      html += `
        <div class="lb-row ${rankClass} ${isSelf ? 'is-self' : ''}">
          <div class="lb-rank">${medal}</div>
          <div class="lb-player">
            <div class="p-name-line">
              <span class="p-pid-tag">${entry.participantId || ''}</span>
              <span class="p-name">${entry.name || 'Игрок ' + entry.participantId}</span>
            </div>
            <span class="p-tag">${entry.timeStr} // ${entry.accuracy}% ACCURACY</span>
          </div>
          <div class="lb-score">${entry.score.toLocaleString()}</div>
        </div>
      `;
    });

    list.innerHTML = html;
  }

  private renderShieldsHtml(current: number, max: number): string {
    let html = '';
    for (let i = 0; i < max; i++) {
      const active = i < current;
      html += `
        <div class="shield-icon ${active ? 'active' : 'broken'}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="${active ? '#00FFA3' : 'none'}" stroke="${active ? '#00FFA3' : '#475569'}" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
      `;
    }
    return html;
  }

  private updateHUD(): void {
    const scoreVal = document.getElementById('hud-score-val');
    if (scoreVal) scoreVal.innerText = gameState.score.toString();

    const shieldsList = document.getElementById('hud-shields-list');
    if (shieldsList) {
      shieldsList.innerHTML = this.renderShieldsHtml(gameState.shields, gameState.maxShields);
    }

    const comboBadge = document.getElementById('hud-combo-badge');
    if (comboBadge) {
      if (gameState.combo > 1) {
        const lang = settingsManager.get().language;
        comboBadge.innerText = `${gameState.combo}x ${translations[lang].combo}!`;
        comboBadge.classList.add('active');
      } else {
        comboBadge.classList.remove('active');
      }
    }

    const hudTop = document.getElementById('hud-top');
    const hudBottom = document.getElementById('hud-bottom');
    const startMenu = document.getElementById('start-menu');
    const gameOver = document.getElementById('game-over-modal');

    if (gameState.status === 'playing') {
      hudTop?.classList.add('visible');
      hudBottom?.classList.add('visible');
      startMenu?.classList.remove('active');
      gameOver?.classList.remove('active');
    } else if (gameState.status === 'menu') {
      hudTop?.classList.remove('visible');
      hudBottom?.classList.remove('visible');
      startMenu?.classList.add('active');
      gameOver?.classList.remove('active');
      this.renderLeaderboard();
    } else if (gameState.status === 'gameover') {
      hudTop?.classList.remove('visible');
      hudBottom?.classList.remove('visible');
      startMenu?.classList.remove('active');
      gameOver?.classList.add('active');

      const goScore = document.getElementById('go-score');
      if (goScore) goScore.innerText = gameState.score.toString();
      const goAcc = document.getElementById('go-accuracy');
      if (goAcc) goAcc.innerText = `${gameState.getAccuracy()}%`;
      const goThreats = document.getElementById('go-threats');
      if (goThreats) goThreats.innerText = gameState.threatsNeutralized.toString();
      const goValid = document.getElementById('go-valid');
      if (goValid) goValid.innerText = gameState.validProtected.toString();

      // Display participant ID
      const goPartId = document.getElementById('go-participant-id');
      if (goPartId) {
        goPartId.textContent = gameState.lastSubmission?.participantId || sessionLeaderboard.getParticipantId();
      }

      // Display Rank Celebration Banner
      const goRankBanner = document.getElementById('go-rank-banner');
      if (goRankBanner) {
        const rank = gameState.lastSubmission?.rank;
        const lang = settingsManager.get().language;
        const t = translations[lang];

        if (rank !== undefined) {
          goRankBanner.className = 'rank-celebration-banner active';
          if (rank === 1) {
            goRankBanner.classList.add('rank-first');
            goRankBanner.innerHTML = `<span class="trophy-anim">🏆</span> <span class="rank-text-highlight">${t.rankFirst}</span>`;
          } else if (rank === 2) {
            goRankBanner.classList.add('rank-second');
            goRankBanner.innerHTML = `<span class="trophy-anim">🥈</span> <span class="rank-text-highlight">${t.rankSecond}</span>`;
          } else if (rank === 3) {
            goRankBanner.classList.add('rank-third');
            goRankBanner.innerHTML = `<span class="trophy-anim">🥉</span> <span class="rank-text-highlight">${t.rankThird}</span>`;
          } else if (rank <= 10) {
            goRankBanner.classList.add('rank-top10');
            goRankBanner.innerHTML = `<span class="trophy-anim">🎖️</span> <span class="rank-text-highlight">${t.rankTop10} (${t.rankTitle}: #${rank})</span>`;
          } else {
            goRankBanner.classList.add('rank-participant');
            goRankBanner.innerHTML = `<span class="rank-text-norm">${t.rankParticipant}: <strong>#${rank}</strong></span>`;
          }
        }
      }

      // Reset save button state
      const btnSave = document.getElementById('btn-save-score') as HTMLButtonElement | null;
      const btnSaveText = document.getElementById('btn-save-text');
      const nameInput = document.getElementById('player-name-input') as HTMLInputElement | null;
      if (btnSave && btnSaveText) {
        btnSave.disabled = false;
        const lang = settingsManager.get().language;
        btnSaveText.textContent = translations[lang].saveScoreBtn;
      }
      if (nameInput) {
        nameInput.disabled = false;
        nameInput.value = '';
      }

      this.renderLeaderboard();
    }
  }

  public updateSystemStatus(text: string, isReady: boolean = false): void {
    const statusText = document.getElementById('system-status-text');
    const dot = document.querySelector('#menu-system-status .sensor-indicator');
    if (statusText) statusText.innerText = text;
    if (dot) {
      if (isReady) {
        dot.classList.add('ready');
      } else {
        dot.classList.remove('ready');
      }
    }
  }

  private updateSettingsUI(): void {
    const settings = settingsManager.get();

    document.querySelectorAll('#lang-control .seg-btn').forEach((btn) => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === settings.language) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('#cam-control .seg-btn').forEach((btn) => {
      const btnCam = btn.getAttribute('data-cam');
      if (btnCam === settings.cameraMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('#input-control .seg-btn').forEach((btn) => {
      const btnInput = btn.getAttribute('data-input');
      if (btnInput === settings.inputMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const sfxCheck = document.getElementById('toggle-sfx') as HTMLInputElement | null;
    if (sfxCheck) sfxCheck.checked = settings.sfxEnabled;

    const musicCheck = document.getElementById('toggle-music') as HTMLInputElement | null;
    if (musicCheck) musicCheck.checked = settings.musicEnabled;
  }

  public updateAllLanguageStrings(): void {
    const lang = settingsManager.get().language;
    const t = translations[lang];

    const portalTitle = document.getElementById('portal-title');
    if (portalTitle) portalTitle.textContent = t.gameTitle;
    const portalSub = document.getElementById('portal-subtitle');
    if (portalSub) portalSub.textContent = t.gameSubtitle;
    const portalTagline = document.getElementById('portal-tagline');
    if (portalTagline) portalTagline.textContent = t.verigramTagline;
    const btnStart = document.getElementById('btn-start-text');
    if (btnStart) btnStart.textContent = t.startGame;
    const keyPrompt = document.getElementById('keyboard-prompt');
    if (keyPrompt) keyPrompt.textContent = t.pressSpaceToStart;

    const labelShields = document.getElementById('label-shields');
    if (labelShields) labelShields.textContent = t.shields;
    const labelScore = document.getElementById('label-score');
    if (labelScore) labelScore.textContent = t.score;
    const ruleCut = document.getElementById('text-rule-cut');
    if (ruleCut) ruleCut.textContent = t.ruleCutSpoofs;
    const ruleProtect = document.getElementById('text-rule-protect');
    if (ruleProtect) ruleProtect.textContent = t.ruleProtectValid;

    const targetHeader = document.getElementById('text-target-header');
    if (targetHeader) targetHeader.textContent = t.targetIntelTitle;
    const lbHeader = document.getElementById('text-leaderboard-header');
    if (lbHeader) lbHeader.textContent = t.globalLeaderboardTitle;
    const boothTitle = document.getElementById('expo-booth-title');
    if (boothTitle) boothTitle.textContent = t.boothStandTitle;

    const tickerPLabel = document.getElementById('ticker-participant-label');
    if (tickerPLabel) tickerPLabel.textContent = `${t.participantNumber}:`;

    // Target Intel cards
    const lblDeepfake = document.getElementById('label-deepfake');
    if (lblDeepfake) lblDeepfake.textContent = itemTranslations[lang]['SPOOF_DEEPFAKE'];
    const lblMask = document.getElementById('label-mask');
    if (lblMask) lblMask.textContent = itemTranslations[lang]['SPOOF_MASK'];
    const lblEmulator = document.getElementById('label-emulator');
    if (lblEmulator) lblEmulator.textContent = itemTranslations[lang]['SPOOF_EMULATOR'];
    const lblKzId = document.getElementById('label-kzid');
    if (lblKzId) lblKzId.textContent = itemTranslations[lang]['VALID_ID'];
    const lblKzVnj = document.getElementById('label-kzvnj');
    if (lblKzVnj) lblKzVnj.textContent = itemTranslations[lang]['VALID_VNJ'];
    const lblSelfie = document.getElementById('label-selfie');
    if (lblSelfie) lblSelfie.textContent = itemTranslations[lang]['VALID_SELFIE'];
    const lblBonus = document.getElementById('label-bonus');
    if (lblBonus) lblBonus.textContent = itemTranslations[lang]['BONUS_SHIELD'];
    const descBonus = document.getElementById('desc-bonus');
    if (descBonus) descBonus.textContent = t.bonusShieldDesc;

    document.querySelectorAll('.badge-cut').forEach((b) => (b.textContent = t.badgeCut));
    document.querySelectorAll('.badge-protect').forEach((b) => (b.textContent = t.badgeProtect));
    document.querySelectorAll('.badge-bonus').forEach((b) => (b.textContent = t.badgeBonus));

    // Settings
    const setHeader = document.getElementById('settings-title');
    if (setHeader) setHeader.textContent = t.settings;
    const lblLang = document.getElementById('label-lang');
    if (lblLang) lblLang.textContent = t.language;
    const lblCam = document.getElementById('label-cam-mode');
    if (lblCam) lblCam.textContent = t.cameraMode;
    const lblInput = document.getElementById('label-input');
    if (lblInput) lblInput.textContent = t.inputMode;
    const lblAudio = document.getElementById('label-audio');
    if (lblAudio) lblAudio.textContent = t.audio;
    const lblSfx = document.getElementById('label-sfx');
    if (lblSfx) lblSfx.textContent = t.soundEnabled;
    const lblMusic = document.getElementById('label-music');
    if (lblMusic) lblMusic.textContent = t.musicEnabled;

    const btnHands = document.querySelector('[data-input="hands"]');
    if (btnHands) btnHands.innerHTML = `🖐️ ${t.inputHands}`;
    const btnMouse = document.querySelector('[data-input="mouse"]');
    if (btnMouse) btnMouse.innerHTML = `🖱️ ${t.inputMouse}`;

    const btnMirror = document.querySelector('[data-cam="mirror"]');
    if (btnMirror) btnMirror.textContent = t.cameraMirror;
    const btnVoid = document.querySelector('[data-cam="void"]');
    if (btnVoid) btnVoid.textContent = t.cameraVoid;

    const camHint = document.getElementById('cam-hint');
    if (camHint) camHint.textContent = settingsManager.get().cameraMode === 'mirror' ? t.cameraMirrorDesc : t.cameraVoidDesc;
    const inputHint = document.getElementById('input-hint');
    if (inputHint) inputHint.textContent = settingsManager.get().inputMode === 'hands' ? t.inputHandsDesc : t.inputMouseDesc;

    // Game Over Modal
    const goTitle = document.getElementById('go-title');
    if (goTitle) goTitle.textContent = t.gameOverTitle;
    const goBadgeLabel = document.getElementById('go-badge-label');
    if (goBadgeLabel) goBadgeLabel.textContent = t.participantNumber;
    const goScore = document.getElementById('go-label-score');
    if (goScore) goScore.textContent = t.finalScore;
    const goAcc = document.getElementById('go-label-acc');
    if (goAcc) goAcc.textContent = t.livenessAccuracy;
    const goThreats = document.getElementById('go-label-threats');
    if (goThreats) goThreats.textContent = t.threatsNeutralizedCount;
    const goValid = document.getElementById('go-label-valid');
    if (goValid) goValid.textContent = t.validProtectedCount;
    const btnPlayAgain = document.getElementById('btn-play-again-text');
    if (btnPlayAgain) btnPlayAgain.textContent = t.playAgain;
    const goRestartPrompt = document.getElementById('gameover-restart-prompt');
    if (goRestartPrompt) goRestartPrompt.textContent = t.pressSpaceToStart;
    const btnBackMenu = document.getElementById('btn-back-menu-text');
    if (btnBackMenu) btnBackMenu.textContent = t.backToMenu;

    const nameInput = document.getElementById('player-name-input') as HTMLInputElement | null;
    if (nameInput) nameInput.placeholder = t.enterNamePrompt;
    const btnSaveText = document.getElementById('btn-save-text');
    if (btnSaveText) btnSaveText.textContent = t.saveScoreBtn;

    this.renderLeaderboard();
  }

  public updateGameOverPalmProgress(progress: number): void {
    const prompt = document.getElementById('gameover-restart-prompt');
    const btn = document.getElementById('btn-play-again');
    if (!prompt || !btn) return;

    const lang = settingsManager.get().language;
    const t = translations[lang];

    if (progress > 0) {
      const pct = Math.floor(progress * 100);
      prompt.textContent = `${t.holdPalmsToStart} ${pct}%`;
      prompt.style.color = '#00FFA3';
      prompt.style.fontWeight = '700';
      btn.style.background = `linear-gradient(90deg, #00FFA3 ${pct}%, #3C8DFC ${pct}%)`;
    } else {
      prompt.textContent = t.pressSpaceToStart;
      prompt.style.color = '';
      prompt.style.fontWeight = '';
      btn.style.background = '';
    }
  }

  public updateParticipantUI(newId: string): void {
    const elTicker = document.getElementById('ticker-participant');
    if (elTicker) elTicker.textContent = newId;
    const elHud = document.getElementById('hud-participant-tag');
    if (elHud) elHud.textContent = newId;
    const elGo = document.getElementById('go-participant-id');
    if (elGo) elGo.textContent = newId;
  }

  private bindEvents(): void {
    const unlock = () => soundEngine.unlockAudio();
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });

    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      unlock();
      if (this.onStartCallback) this.onStartCallback();
    });

    document.getElementById('btn-play-again')?.addEventListener('click', () => {
      unlock();
      if (this.onStartCallback) this.onStartCallback();
    });

    document.getElementById('btn-back-menu')?.addEventListener('click', async () => {
      unlock();
      const newPid = await sessionLeaderboard.generateNewParticipant();
      this.updateParticipantUI(newPid);
      gameState.status = 'menu';
      this.updateHUD();
    });

    document.getElementById('btn-refresh-leaderboard')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      unlock();
      const btn = document.getElementById('btn-refresh-leaderboard');
      btn?.classList.add('spinning');
      await sessionLeaderboard.fetchRemote();
      this.renderLeaderboard();
      setTimeout(() => btn?.classList.remove('spinning'), 600);
    });

    // Save record to shared leaderboard
    document.getElementById('btn-save-score')?.addEventListener('click', async () => {
      unlock();
      const input = document.getElementById('player-name-input') as HTMLInputElement | null;
      const btn = document.getElementById('btn-save-score') as HTMLButtonElement | null;
      const btnText = document.getElementById('btn-save-text');
      const name = input?.value?.trim();
      if (!name) {
        input?.focus();
        return;
      }

      if (btnText) btnText.textContent = '...';
      if (btn) btn.disabled = true;

      try {
        await sessionLeaderboard.submitScore(
          gameState.score,
          gameState.getAccuracy(),
          gameState.threatsNeutralized,
          name
        );
        const lang = settingsManager.get().language;
        if (btnText) btnText.textContent = translations[lang].scoreSaved;
        if (input) input.disabled = true;
        this.renderLeaderboard();
      } catch (e) {
        console.warn('Failed to save record:', e);
        if (btn) btn.disabled = false;
      }
    });

    // Smart TV and Keyboard navigation (Space and Enter)
    window.addEventListener('keydown', (e) => {
      unlock();
      if ((e.code === 'Space' || e.code === 'Enter') && (gameState.status === 'menu' || gameState.status === 'gameover') && !this.isSettingsOpen) {
        if (document.activeElement?.id === 'player-name-input' && e.code === 'Space') {
          return; // Let user type spaces in their name
        }
        e.preventDefault();
        if (this.onStartCallback) this.onStartCallback();
      }
    });

    const settingsModal = document.getElementById('settings-modal');
    const openSettings = () => {
      this.isSettingsOpen = true;
      settingsModal?.classList.add('active');
    };
    const closeSettings = () => {
      this.isSettingsOpen = false;
      settingsModal?.classList.remove('active');
    };

    document.getElementById('btn-open-settings')?.addEventListener('click', openSettings);
    document.getElementById('btn-hero-settings')?.addEventListener('click', openSettings);
    document.getElementById('btn-close-settings')?.addEventListener('click', closeSettings);

    settingsModal?.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeSettings();
      }
    });

    document.getElementById('settings-card-content')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        unlock();
        const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang') as 'kk' | 'en' | 'ru';
        settingsManager.update({ language: lang });
      });
    });

    document.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        unlock();
        const mode = (e.currentTarget as HTMLElement).getAttribute('data-cam') as 'mirror' | 'void';
        settingsManager.update({ cameraMode: mode });
      });
    });

    document.querySelectorAll('[data-input]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        unlock();
        const mode = (e.currentTarget as HTMLElement).getAttribute('data-input') as 'hands' | 'mouse';
        settingsManager.update({ inputMode: mode });
      });
    });

    document.getElementById('toggle-sfx')?.addEventListener('change', (e) => {
      e.stopPropagation();
      unlock();
      settingsManager.update({ sfxEnabled: (e.target as HTMLInputElement).checked });
    });

    document.getElementById('toggle-music')?.addEventListener('change', (e) => {
      e.stopPropagation();
      unlock();
      settingsManager.update({ musicEnabled: (e.target as HTMLInputElement).checked });
    });
  }
}
