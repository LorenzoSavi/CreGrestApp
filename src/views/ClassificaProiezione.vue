<template>
  <div class="cp-root" @click="handleClick">

    <!-- SELEZIONE FASE -->
    <transition name="phase-fade">
      <div v-if="showPhaseSelector" class="cp-phase-screen" @click.stop>
        <div class="cp-phase-inner">
          <div class="cp-phase-logo">🏆</div>
          <h1 class="cp-phase-title">Cre Grest</h1>
          <p class="cp-phase-sub">Classifica Proiezione</p>
          <div class="cp-phase-grid">
            <button v-for="p in phases" :key="p.id"
              class="cp-phase-btn" :class="{ 'cp-phase-btn--finale': p.id === 'finale' }"
              @click="selectPhase(p.id)">
              <span class="cp-phase-btn-icon">{{ p.icon }}</span>
              <span class="cp-phase-btn-label">{{ p.label }}</span>
            </button>
          </div>
          <button class="cp-logout-btn" @click="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Esci
          </button>
        </div>
      </div>
    </transition>

    <!-- CLASSIFICA STAGE -->
    <transition name="phase-fade">
      <div v-if="!showPhaseSelector && !isLoading && teams.length" class="cp-stage">

        <!-- ✅ FIX 1: Header SEMPRE visibile durante tutta la proiezione -->
        <div class="cp-header" :class="{ 'cp-header--mystery': revealPhase === 'show-last-mystery' }">
          <div class="cp-header-left">
            <span class="cp-trophy">🏆</span>
            <div>
              <div class="cp-header-title">{{ currentPhaseLabel }}</div>
              <div class="cp-header-phase">Cre Grest {{ currentYear }}</div>
            </div>
          </div>
          <div class="cp-header-right">
            <div v-if="!revealStarted" class="cp-hint cp-hint--pulse">Clicca per iniziare</div>
            <div v-else-if="revealPhase === 'done'" class="cp-hint cp-hint--done">🎉 Completata!</div>
            <div v-else-if="revealPhase === 'top-two-shake'" class="cp-hint cp-hint--suspense">⚡ Chi sarà?!</div>
            <div v-else-if="revealedCount < revealOrder.length" class="cp-hint cp-hint--active">{{ revealOrder.length - revealedCount }} rimanenti — clicca</div>
            <div v-else class="cp-hint cp-hint--active">Clicca per rivelare</div>
            <button class="cp-back-btn" @click.stop="resetView">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </div>

        <div class="cp-ranking-area">
          <!-- TAP INVITE -->
          <transition name="fade">
            <div v-if="!revealStarted" class="cp-tap-invite">
              <div class="cp-tap-icon">🖱️</div>
              <div class="cp-tap-text">Clicca per rivelare</div>
              <div class="cp-tap-sub">dal {{ sortedTeams.length }}° al 1° posto</div>
            </div>
          </transition>

          <div class="cp-cards-wrap">
            <div class="cp-cards-list">

              <!-- MYSTERY CARD TOP 2 (1° e 2°) -->
              <template v-if="showTopTwoMystery">
                <div
                  v-for="team in topTwoByRank" :key="'mystery-' + team.id"
                  class="cp-card cp-card-mystery"
                  :class="{
                    'cp-card--top-two-shake': revealPhase === 'top-two-shake',
                    'cp-card--crazy':         crazyActive && team.rank === 1,
                    'cp-card--winner':        team.rank === 1 && allRevealed,
                    ['cp-card--' + team.id]:  isTopTwoRevealed,
                  }"
                >
                  <template v-if="!isTopTwoRevealed">
                    <div class="cp-card-cover" :class="{ 'cp-card-cover--gold': revealPhase === 'top-two-shake' || revealPhase === 'final-reveal' }">
                      <span class="cp-cover-q" :class="{ 'cp-cover-q--gold': revealPhase === 'top-two-shake' || revealPhase === 'final-reveal' }">?</span>
                    </div>
                  </template>

                  <template v-else>
                    <div class="cp-color-strip" :class="'cp-strip--' + team.id"></div>
                    <div class="cp-card-rank">
                      <span v-if="team.rank === 1" class="cp-medal">🥇</span>
                      <span v-else-if="team.rank === 2" class="cp-medal">🥈</span>
                    </div>
                    <div class="cp-card-row">
                      <div class="cp-card-name-line">
                        <div class="cp-team-badge" :class="'cp-badge--' + team.id">
                          <span class="cp-badge-dot"></span>
                          <span class="cp-badge-name">{{ team.name }}</span>
                        </div>
                        <div class="cp-card-name" :class="'cp-name--' + team.id">{{ team.name }}</div>
                      </div>
                      <div class="cp-card-bar-wrap">
                        <div class="cp-card-bar" :class="'cp-bar--' + team.id" :style="{ width: barWidth(team.points) + '%' }"></div>
                      </div>
                    </div>
                    <div class="cp-card-score">
                      <span class="cp-score-num" :class="'cp-name--' + team.id">{{ team.points }}</span>
                      <span class="cp-score-unit">pt</span>
                    </div>
                    <div v-if="phase==='finale' && team.rank===1 && allRevealed" class="cp-sparks">
                      <span v-for="n in 16" :key="n" class="cp-spark" :style="sparkStyle(n)"></span>
                    </div>
                    <div v-if="phase!=='finale' && team.rank===1 && allRevealed" class="cp-stars">
                      <span v-for="n in 6" :key="n" class="cp-star" :style="starStyle(n)">✦</span>
                    </div>
                    <div v-if="crazyActive && team.rank===1" class="cp-crazy-burst">
                      <span v-for="n in 24" :key="n" class="cp-burst-particle" :style="burstStyle(n)"></span>
                    </div>
                    <div v-if="team.rank===1 && allRevealed" class="cp-winner-glow-ring"></div>
                    <div v-if="team.rank===1 && allRevealed" class="cp-winner-crown-float">👑</div>
                    <div v-if="team.rank===1 && allRevealed" class="cp-winner-sparkline">
                      <span v-for="n in 10" :key="n" class="cp-sparkline-dot" :style="{ animationDelay: (n*0.08)+'s', left: (n*10-5)+'%' }"></span>
                    </div>
                  </template>
                </div>
              </template>

              <!-- MYSTERY CARD DEL 6° POSTO (fase show-last-mystery) -->
              <template v-if="revealPhase === 'show-last-mystery'">
                <div class="cp-card cp-card-mystery cp-card--last-waiting">
                  <div class="cp-card-cover">
                    <span class="cp-cover-q">?</span>
                  </div>
                </div>
              </template>

              <!-- PENDING CARDS (dal 6° in poi, dopo che il reveal normale è iniziato) -->
              <template v-if="revealStarted && revealPhase !== 'show-last-mystery'">
                <div
                  v-for="rank in pendingRanks" :key="'pending-' + rank"
                  class="cp-card cp-card-mystery"
                  :class="{
                    'cp-card--shaking': shakingRank === rank,
                  }"
                >
                  <div class="cp-card-cover">
                    <span class="cp-cover-q">?</span>
                  </div>
                </div>
              </template>

              <!-- REVEALED CARDS dal 3° al 6° posto -->
              <transition-group tag="div" class="cp-revealed-list" name="card-reveal">
                <div
                  v-for="team in revealedTeamsTopFirst" :key="team.id"
                  class="cp-card"
                  :class="['cp-card--' + team.id, { 'cp-card--just-revealed': justRevealedId === team.id }]"
                >
                  <!-- Burst flash al momento del reveal -->
                  <div v-if="justRevealedId === team.id" class="cp-reveal-flash"></div>
                  <div v-if="justRevealedId === team.id" class="cp-reveal-particles">
                    <span v-for="n in 12" :key="n" class="cp-reveal-particle" :style="revealParticleStyle(n, team.id)"></span>
                  </div>

                  <div class="cp-color-strip" :class="'cp-strip--' + team.id"></div>
                  <div class="cp-card-rank">
                    <span v-if="team.rank === 3" class="cp-medal">🥉</span>
                    <span v-else class="cp-rank-num">#{{ team.rank }}</span>
                  </div>
                  <div class="cp-card-row">
                    <div class="cp-card-name-line">
                      <div class="cp-team-badge" :class="'cp-badge--' + team.id">
                        <span class="cp-badge-dot"></span>
                        <span class="cp-badge-name">{{ team.name }}</span>
                      </div>
                      <div class="cp-card-name" :class="'cp-name--' + team.id">{{ team.name }}</div>
                    </div>
                    <div class="cp-card-bar-wrap">
                      <div class="cp-card-bar" :class="'cp-bar--' + team.id" :style="{ width: barWidth(team.points) + '%' }"></div>
                    </div>
                  </div>
                  <div class="cp-card-score">
                    <span class="cp-score-num" :class="'cp-name--' + team.id">{{ team.points }}</span>
                    <span class="cp-score-unit">pt</span>
                  </div>
                </div>
              </transition-group>

            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- WINNER BANNER ULTRA (finale) -->
    <transition name="winner-fade">
      <div v-if="showWinnerBanner" class="cp-winner-overlay" @click.stop>
        <div class="cp-win-bg"></div>
        <div class="cp-lasers">
          <div v-for="n in 12" :key="n" class="cp-laser" :style="laserStyle(n)"></div>
        </div>
        <div class="cp-shockwaves">
          <div v-for="n in 4" :key="n" class="cp-shockwave" :style="{ animationDelay: ((n-1)*0.55)+'s' }"></div>
        </div>
        <div class="cp-gold-rain">
          <span v-for="n in 60" :key="n" class="cp-gold-drop" :style="goldDropStyle(n)"></span>
        </div>
        <canvas ref="fireworksCanvas" class="cp-fireworks-canvas"></canvas>
        <div class="cp-confetti-wrap">
          <span v-for="n in 80" :key="n" class="cp-confetto" :style="confettiStyle(n)"></span>
        </div>
        <div class="cp-win-center">
          <div class="cp-win-halo"></div>
          <div class="cp-win-crown">👑</div>
          <div class="cp-win-pre">CAMPIONE</div>
          <div class="cp-win-year">CREGREST {{ currentYear }}</div>
          <div class="cp-win-name" :class="'cp-name--' + sortedTeams[0].id">
            <span v-for="(ch, i) in winnerNameChars" :key="i" class="cp-win-char" :style="{ animationDelay: (i * 0.07) + 's' }">
              {{ ch === ' ' ? '\u00a0' : ch }}
            </span>
          </div>
          <div class="cp-win-pts">
            <span class="cp-win-pts-num">{{ displayedPoints }}</span>
            <span class="cp-win-pts-label">PUNTI</span>
          </div>
          <div class="cp-win-stars">
            <span v-for="n in 7" :key="n" class="cp-win-star" :style="winStarStyle(n)">★</span>
          </div>
          <div class="cp-win-trophies">
            <span class="cp-win-trophy-l">🏆</span>
            <span class="cp-win-trophy-r">🏆</span>
          </div>
          <div class="cp-win-sub">Congratulazioni! 🎉🎊🎉</div>
          <div class="cp-banner-countdown">
            <div class="cp-banner-countdown-bar" :style="{ width: bannerCountdownPct + '%' }"></div>
          </div>
          <button class="cp-winner-close" @click="closeWinnerShowRanking">Mostra Classifica</button>
        </div>
      </div>
    </transition>

    <!-- WEEK BANNER (1ª 2ª 3ª settimana) -->
    <transition name="winner-fade">
      <div v-if="showWeekBanner" class="cp-week-banner" @click.stop>
        <!-- ✅ FIX 4: Sfondo molto più scuro con overlay nero sopra al colore squadra -->
        <div class="cp-week-bg cp-week-bg--dark" :style="weekBannerBgStyle"></div>
        <div class="cp-week-stars-wrap">
          <span v-for="n in 30" :key="n" class="cp-week-star" :style="weekStarStyle(n)">★</span>
        </div>
        <div class="cp-week-fireworks">
          <span v-for="n in 20" :key="n" class="cp-week-spark" :style="weekSparkStyle(n)"></span>
        </div>
        <div class="cp-week-card" :style="weekCardStyle">
          <div class="cp-week-content">
            <div class="cp-week-label">Vincitore</div>
            <div class="cp-week-phase-name">{{ currentPhaseLabel }}</div>
            <div class="cp-week-medal">🥇</div>
            <div class="cp-week-winner" :class="'cp-name--' + sortedTeams[0].id">
              <span v-for="(ch, i) in weekWinnerChars" :key="i" class="cp-week-char" :style="{ animationDelay: (i * 0.06) + 's' }">
                {{ ch === ' ' ? '\u00a0' : ch }}
              </span>
            </div>
            <div class="cp-week-score-row">
              <span class="cp-week-pts-num" :class="'cp-name--' + sortedTeams[0].id">{{ displayedWeekPoints }}</span>
              <span class="cp-week-pts-label">punti</span>
            </div>
            <div class="cp-week-podium">
              <div v-if="sortedTeams[1]" class="cp-week-podium-item cp-week-podium-item--2">
                <span class="cp-podium-medal">🥈</span>
                <span class="cp-podium-name" :class="'cp-name--' + sortedTeams[1].id">{{ sortedTeams[1].name }}</span>
                <span class="cp-podium-pts">{{ sortedTeams[1].points }}pt</span>
              </div>
              <div v-if="sortedTeams[2]" class="cp-week-podium-item cp-week-podium-item--3">
                <span class="cp-podium-medal">🥉</span>
                <span class="cp-podium-name" :class="'cp-name--' + sortedTeams[2].id">{{ sortedTeams[2].name }}</span>
                <span class="cp-podium-pts">{{ sortedTeams[2].points }}pt</span>
              </div>
            </div>
            <div class="cp-banner-countdown">
              <div class="cp-banner-countdown-bar" :style="{ width: bannerCountdownPct + '%' }"></div>
            </div>
            <button class="cp-winner-close cp-week-close-btn" @click="closeWeekShowRanking">Mostra Classifica</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- LOADING -->
    <transition name="fade">
      <div v-if="isLoading" class="cp-loading">
        <div class="cp-spinner"></div>
        <p>Caricamento classifica…</p>
      </div>
    </transition>

    <!-- WATERMARK -->
    <div class="cp-watermark" @click.stop>Fatto da Savi 🦞</div>

  </div>
</template>

<script>
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const SHAKE_MS       = 2400;
const CRAZY_MS       = 2500;
const POST_CRAZY     = 2500;
const BANNER_AUTO_MS = 10000;
// Durata dell'animazione "just revealed" sulle card
const REVEAL_ANIM_MS = 1800;

export default {
  name: 'ClassificaProiezione',
  data() {
    return {
      showPhaseSelector: true,
      phase: null,
      isLoading: false,
      revealStarted: false,
      revealPhase: 'idle',
      revealedCount: 0,
      isTopTwoRevealed: false,
      shakingCards: new Set(),
      shakingRank: null,
      crazyActive: false,
      isRevealing: false,
      winnerClosed: false,
      weekBannerClosed: false,
      currentYear: new Date().getFullYear(),
      displayedPoints: 0,
      displayedWeekPoints: 0,
      fireworksTimer: null,
      bannerReady: false,
      bannerCountdownPct: 100,
      bannerCountdownTimer: null,
      bannerAutoCloseTimer: null,
      // ID della squadra appena rivelata (per animazione flash)
      justRevealedId: null,
      justRevealedTimer: null,
      phases: [
        { id: 'settimana1', label: '1ª Settimana',     icon: '1️⃣' },
        { id: 'settimana2', label: '2ª Settimana',     icon: '2️⃣' },
        { id: 'settimana3', label: '3ª Settimana',     icon: '3️⃣' },
        { id: 'finale',    label: 'Classifica Finale', icon: '🏆' },
      ],
      allTeams: [
        { id: 'rossi',     name: 'Rossi',     color: '#ff4d4d' },
        { id: 'verdi',     name: 'Verdi',     color: '#51cf66' },
        { id: 'arancioni', name: 'Arancioni', color: '#ffa94d' },
        { id: 'gialli',    name: 'Gialli',    color: '#ffd43b' },
        { id: 'bianchi',   name: 'Bianchi',   color: '#E8E8E8' },
        { id: 'blu',       name: 'Blu',       color: '#74c0fc' },
      ],
      pointsData: null,
    };
  },
  computed: {
    currentPhaseLabel() {
      return this.phases.find(p => p.id === this.phase)?.label || '';
    },
    currentPhaseIcon() {
      return this.phases.find(p => p.id === this.phase)?.icon || '🌟';
    },
    teams() {
      if (!this.pointsData) return [];
      return this.allTeams.map(t => ({ ...t, points: this.pointsData[t.id] || 0 }));
    },
    sortedTeams() {
      return [...this.teams]
        .sort((a, b) => b.points - a.points)
        .map((t, i) => ({ ...t, rank: i + 1 }));
    },
    revealOrder() {
      const N = this.sortedTeams.length;
      const order = [];
      for (let r = N; r >= 3; r--) order.push(r);
      return order;
    },
    topTwoByRank() {
      return this.sortedTeams.filter(t => t.rank <= 2).sort((a, b) => a.rank - b.rank);
    },
    showTopTwoMystery() {
      return this.revealStarted
        && this.revealPhase !== 'idle'
        && this.revealPhase !== 'show-last-mystery'
        && this.revealedCount >= this.revealOrder.length;
    },
    pendingRanks() {
      if (!this.revealStarted || this.revealPhase === 'idle' || this.revealPhase === 'show-last-mystery') return [];
      const revealed = new Set(this.revealOrder.slice(0, this.revealedCount));
      return this.revealOrder.filter(r => !revealed.has(r));
    },
    revealedTeamsTopFirst() {
      if (!this.revealStarted || this.revealedCount === 0) return [];
      const revealedRanks = new Set(this.revealOrder.slice(0, this.revealedCount));
      return this.sortedTeams
        .filter(t => revealedRanks.has(t.rank))
        .sort((a, b) => a.rank - b.rank);
    },
    maxPoints() {
      return Math.max(...this.teams.map(t => t.points), 1);
    },
    allRevealed() {
      return this.revealPhase === 'done';
    },
    showWinnerBanner() {
      return this.bannerReady && this.phase === 'finale' && !this.winnerClosed;
    },
    showWeekBanner() {
      return this.bannerReady && this.phase !== 'finale' && !this.weekBannerClosed;
    },
    winnerNameChars() {
      if (!this.sortedTeams.length) return [];
      return this.sortedTeams[0].name.split('');
    },
    weekWinnerChars() {
      if (!this.sortedTeams.length) return [];
      return this.sortedTeams[0].name.split('');
    },
    // Colore squadra vincitrice (per week banner)
    winnerTeamColor() {
      if (!this.sortedTeams.length) return '#51cf66';
      return this.sortedTeams[0].color || '#51cf66';
    },
    // ✅ FIX 4: Sfondo molto più scuro — solo un tocco di colore nell'ombra esterna
    weekBannerBgStyle() {
      const c = this.winnerTeamColor;
      return {
        background: `radial-gradient(ellipse at center, ${c}18 0%, ${c}06 35%, #000 65%)`,
      };
    },
    // Bordo card week banner col colore vincitore
    weekCardStyle() {
      const c = this.winnerTeamColor;
      return {
        borderColor: `${c}55`,
        boxShadow: `0 0 40px ${c}22, 0 0 80px ${c}0a`,
      };
    },
  },
  watch: {
    showWinnerBanner(val) {
      if (val) {
        this.$nextTick(() => { this.startCountUp(); this.startFireworks(); });
        this.startBannerAutoClose();
      } else {
        this.stopFireworks();
        this.stopBannerAutoClose();
      }
    },
    showWeekBanner(val) {
      if (val) {
        this.$nextTick(() => { this.startWeekCountUp(); });
        this.startBannerAutoClose();
      } else {
        this.stopBannerAutoClose();
      }
    },
  },
  methods: {
    barWidth(pts) {
      return Math.max(4, Math.round((pts / this.maxPoints) * 100));
    },
    async selectPhase(phaseId) {
      this.phase = phaseId;
      this.isLoading = true;
      this.showPhaseSelector = false;
      this.revealStarted = false;
      this.revealedCount = 0;
      this.revealPhase = 'idle';
      this.shakingCards = new Set();
      this.shakingRank = null;
      this.crazyActive = false;
      this.isRevealing = false;
      this.isTopTwoRevealed = false;
      this.winnerClosed = false;
      this.weekBannerClosed = false;
      this.displayedPoints = 0;
      this.displayedWeekPoints = 0;
      this.bannerReady = false;
      this.bannerCountdownPct = 100;
      this.justRevealedId = null;
      this.stopBannerAutoClose();
      try {
        const snap = await getDoc(doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ'));
        if (snap.exists()) this.pointsData = snap.data();
      } catch (e) { console.error(e); }
      finally { this.isLoading = false; }
    },

    handleClick() {
      if (this.showPhaseSelector || this.isLoading) return;

      if (this.revealPhase === 'idle') {
        this.revealStarted = true;
        this.revealPhase = 'show-last-mystery';
        return;
      }

      if (this.revealPhase === 'show-last-mystery') {
        if (this.isRevealing) return;
        this.revealPhase = 'normal';
        this._revealNext();
        return;
      }

      if (this.revealPhase === 'normal') {
        if (this.isRevealing) return;
        this._revealNext();
        return;
      }

      if (this.revealPhase === 'top-two-shake') {
        this._triggerBannerFirst();
        return;
      }
    },

    _revealNext() {
      if (this.revealedCount >= this.revealOrder.length) {
        this.revealPhase = 'top-two-shake';
        return;
      }

      this.isRevealing = true;
      const rank = this.revealOrder[this.revealedCount];
      const team = this.sortedTeams.find(t => t.rank === rank);
      if (!team) { this.isRevealing = false; this.shakingRank = null; return; }

      // ✅ FIX 2: shake IMMEDIATAMENTE al click, poi dopo SHAKE_MS rivela il risultato
      this.shakingRank = rank;
      this.shakingCards = new Set([...this.shakingCards, team.id]);

      setTimeout(() => {
        // Reveal del risultato dopo lo shake
        this.revealedCount++;
        const next = new Set(this.shakingCards);
        next.delete(team.id);
        this.shakingCards = next;
        this.shakingRank = null;
        this.isRevealing = false;

        // Attiva la mini animazione "just revealed" sulla card appena svelata
        this.justRevealedId = team.id;
        if (this.justRevealedTimer) clearTimeout(this.justRevealedTimer);
        this.justRevealedTimer = setTimeout(() => {
          this.justRevealedId = null;
        }, REVEAL_ANIM_MS);

        if (this.revealedCount >= this.revealOrder.length) {
          this.revealPhase = 'top-two-shake';
        }
      }, SHAKE_MS);
    },

    _triggerBannerFirst() {
      if (this.revealPhase !== 'top-two-shake') return;
      this.revealPhase = 'final-reveal';
      this.bannerReady = true;
    },

    _revealTopTwoAfterBanner() {
      this.isTopTwoRevealed = true;
      this.revealPhase = 'done';
      this.crazyActive = true;
      setTimeout(() => { this.crazyActive = false; }, CRAZY_MS + POST_CRAZY);
    },

    startBannerAutoClose() {
      this.bannerCountdownPct = 100;
      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        const pct = Math.max(0, 100 - (elapsed / BANNER_AUTO_MS) * 100);
        this.bannerCountdownPct = pct;
        if (elapsed < BANNER_AUTO_MS) {
          this.bannerCountdownTimer = requestAnimationFrame(step);
        }
      };
      this.bannerCountdownTimer = requestAnimationFrame(step);
      this.bannerAutoCloseTimer = setTimeout(() => {
        if (this.phase === 'finale') this.closeWinnerShowRanking();
        else this.closeWeekShowRanking();
      }, BANNER_AUTO_MS);
    },
    stopBannerAutoClose() {
      if (this.bannerCountdownTimer) { cancelAnimationFrame(this.bannerCountdownTimer); this.bannerCountdownTimer = null; }
      if (this.bannerAutoCloseTimer) { clearTimeout(this.bannerAutoCloseTimer); this.bannerAutoCloseTimer = null; }
    },

    closeWinnerShowRanking() {
      this.stopFireworks();
      this.stopBannerAutoClose();
      this.winnerClosed = true;
      this.$nextTick(() => { this._revealTopTwoAfterBanner(); });
    },
    closeWeekShowRanking() {
      this.stopBannerAutoClose();
      this.weekBannerClosed = true;
      this.$nextTick(() => { this._revealTopTwoAfterBanner(); });
    },

    resetView() {
      this.stopFireworks();
      this.stopBannerAutoClose();
      if (this.justRevealedTimer) clearTimeout(this.justRevealedTimer);
      this.showPhaseSelector = true;
      this.phase = null;
      this.revealStarted = false;
      this.revealedCount = 0;
      this.revealPhase = 'idle';
      this.shakingCards = new Set();
      this.shakingRank = null;
      this.crazyActive = false;
      this.isRevealing = false;
      this.isTopTwoRevealed = false;
      this.pointsData = null;
      this.winnerClosed = false;
      this.weekBannerClosed = false;
      this.displayedPoints = 0;
      this.displayedWeekPoints = 0;
      this.bannerReady = false;
      this.bannerCountdownPct = 100;
      this.justRevealedId = null;
    },
    handleLogout() {
      sessionStorage.removeItem('loggedInUser');
      localStorage.removeItem('loggedInUser');
      this.$router.push('/login');
    },
    startCountUp() {
      const target = this.sortedTeams[0]?.points || 0;
      const duration = 2200;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        this.displayedPoints = Math.round(ease * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    startWeekCountUp() {
      const target = this.sortedTeams[0]?.points || 0;
      const duration = 1800;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        this.displayedWeekPoints = Math.round(ease * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    startFireworks() {
      const canvas = this.$refs.fireworksCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
      resize();
      window.addEventListener('resize', resize);
      const particles = [];
      const COLORS = ['#ffd43b','#ff6b6b','#51cf66','#74c0fc','#E8E8E8','#ffa94d','#fff','#c084fc','#ff9f43'];
      const explode = (x, y) => {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const count = 60 + Math.floor(Math.random() * 40);
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const speed = 2 + Math.random() * 5;
          particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, alpha:1, color, size: 2+Math.random()*3, decay: 0.012+Math.random()*0.01 });
        }
      };
      const launch = () => {
        const x = 80 + Math.random() * (window.innerWidth - 160);
        const y = 80 + Math.random() * (window.innerHeight * 0.6);
        explode(x, y);
      };
      for (let i = 0; i < 6; i++) setTimeout(launch, i * 220);
      this.fireworksTimer = setInterval(launch, 700);
      const draw = () => {
        if (!this.showWinnerBanner) return;
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.alpha -= p.decay;
          if (p.alpha <= 0) { particles.splice(i, 1); continue; }
          ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
          ctx.shadowColor = p.color; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    },
    stopFireworks() {
      if (this.fireworksTimer) { clearInterval(this.fireworksTimer); this.fireworksTimer = null; }
    },
    sparkStyle(n) {
      return { '--angle': ((n/16)*360)+'deg', animationDelay: (n*0.06)+'s' };
    },
    starStyle(n) {
      return { '--x': (-80+n*32)+'px', '--y': (-30-(n%3)*18)+'px', animationDelay: (n*0.12)+'s', fontSize: (1.1+(n%2)*0.7)+'rem' };
    },
    burstStyle(n) {
      const colors=['#ffd43b','#ff6b6b','#51cf66','#74c0fc','#E8E8E8','#ffa94d','#fff','#c0f'];
      return { '--angle': ((n/24)*360)+'deg', '--color': colors[n%colors.length], animationDelay: (n*0.035)+'s' };
    },
    laserStyle(n) {
      return { '--angle': ((n/12)*360)+'deg', '--hue': (n/12)*60, animationDelay: (n*0.18)+'s' };
    },
    goldDropStyle(n) {
      return { left: ((n/60)*105)+'vw', '--duration': (1.8+(n%5)*0.4)+'s', '--delay': (n*0.08)+'s', '--rot': (n*53)+'deg', '--size': (0.6+(n%4)*0.35)+'rem', animationDelay:'var(--delay)', animationDuration:'var(--duration)', fontSize:'var(--size)' };
    },
    confettiStyle(n) {
      const shapes=['square','circle','rect'];
      return { '--color':['#ff6b6b','#ffd43b','#51cf66','#74c0fc','#E8E8E8','#ffa94d','#fff','#c084fc'][n%8], '--duration':(2.0+(n%5)*0.45)+'s', '--delay':(n*0.04)+'s', '--rot':(n*37)+'deg', animationDelay:'var(--delay)', animationDuration:'var(--duration)', left:((n/80)*100)+'vw', borderRadius:shapes[n%3]==='circle'?'50%':shapes[n%3]==='rect'?'2px':'3px', width:shapes[n%3]==='rect'?'5px':'10px', height:shapes[n%3]==='rect'?'16px':'10px' };
    },
    winStarStyle(n) {
      const angles=[0,51,102,153,204,255,306];
      const r=160+(n%2)*40;
      const a=(angles[n-1]*Math.PI)/180;
      return { left:'calc(50% + '+(Math.cos(a)*r)+'px)', top:'calc(50% + '+(Math.sin(a)*r)+'px)', animationDelay:((n-1)*0.12)+'s', fontSize:(1.2+(n%3)*0.6)+'rem' };
    },
    weekStarStyle(n) {
      return {
        left: ((n / 30) * 110 - 5) + '%',
        '--delay': (n * 0.15) + 's',
        '--duration': (2.5 + (n % 4) * 0.5) + 's',
        '--size': (0.8 + (n % 3) * 0.4) + 'rem',
        animationDelay: 'var(--delay)',
        animationDuration: 'var(--duration)',
        fontSize: 'var(--size)',
      };
    },
    weekSparkStyle(n) {
      return {
        '--angle': ((n / 20) * 360) + 'deg',
        '--delay': (n * 0.12) + 's',
        '--color': ['#ffd43b','#fff','#51cf66','#74c0fc','#E8E8E8','#ffa94d'][n % 6],
        animationDelay: 'var(--delay)',
      };
    },
    // Particelle colorate col colore della squadra appena rivelata
    revealParticleStyle(n, teamId) {
      const team = this.allTeams.find(t => t.id === teamId);
      const color = team ? team.color : '#ffd43b';
      return {
        '--angle': ((n / 12) * 360) + 'deg',
        '--color': color,
        animationDelay: (n * 0.04) + 's',
      };
    },
  },
  beforeUnmount() {
    this.stopFireworks();
    this.stopBannerAutoClose();
    if (this.justRevealedTimer) clearTimeout(this.justRevealedTimer);
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Bebas+Neue&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

.cp-root{font-family:'Nunito',sans-serif;background:#06060c;color:#fff;height:100dvh;width:100%;overflow:hidden;cursor:pointer;user-select:none;position:relative;display:flex;flex-direction:column;}

/* ─── WATERMARK ────────────────────────────────── */
.cp-watermark{
  position:fixed;
  bottom:clamp(.6rem,1.2vh,1rem);
  right:clamp(.8rem,1.5vw,1.4rem);
  z-index:9999;
  font-family:'Nunito',sans-serif;
  font-size:clamp(.62rem,.85vw,.78rem);
  font-weight:700;
  letter-spacing:.04em;
  color:rgba(255,255,255,.13);
  pointer-events:none;
  user-select:none;
  white-space:nowrap;
}

/* ─── FASE ───────────────────────────────────────── */
.cp-phase-screen{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#06060c;z-index:100;cursor:default;}
.cp-phase-inner{display:flex;flex-direction:column;align-items:center;gap:clamp(1rem,2.5vh,1.8rem);padding:clamp(1.5rem,4vh,3rem) clamp(1.5rem,3vw,3rem);max-width:520px;width:100%;}
.cp-phase-logo{font-size:clamp(3rem,7vh,5rem);filter:drop-shadow(0 0 28px rgba(255,215,0,.7));animation:floatLogo 3s ease-in-out infinite;}
@keyframes floatLogo{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.cp-phase-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,8vw,5.5rem);letter-spacing:.12em;color:#fff;text-shadow:0 0 50px rgba(255,215,0,.35);line-height:1;}
.cp-phase-sub{font-size:clamp(.75rem,1.2vw,1rem);font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-top:-.5rem;}
.cp-phase-grid{display:grid;grid-template-columns:1fr 1fr;gap:.9rem;width:100%;}
.cp-phase-btn{display:flex;flex-direction:column;align-items:center;gap:.45rem;padding:clamp(1rem,2vh,1.4rem) .75rem;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);border-radius:20px;color:#fff;font-family:'Nunito',sans-serif;font-size:clamp(.82rem,1.2vw,.95rem);font-weight:800;cursor:pointer;transition:all .2s;-webkit-tap-highlight-color:transparent;}
.cp-phase-btn:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.3);transform:scale(1.04);}
.cp-phase-btn--finale{grid-column:1/-1;background:linear-gradient(135deg,rgba(255,215,0,.15),rgba(255,165,0,.1));border-color:rgba(255,215,0,.45);padding:clamp(1.1rem,2.2vh,1.6rem) .75rem;}
.cp-phase-btn--finale:hover{background:linear-gradient(135deg,rgba(255,215,0,.25),rgba(255,165,0,.18));border-color:rgba(255,215,0,.75);}
.cp-phase-btn-icon{font-size:clamp(1.5rem,3vh,2rem);}
.cp-phase-btn-label{font-size:clamp(.8rem,1.1vw,.92rem);font-weight:900;letter-spacing:.03em;}
.cp-logout-btn{display:flex;align-items:center;gap:.5rem;background:none;border:1.5px solid rgba(255,255,255,.12);color:rgba(255,255,255,.35);border-radius:99px;padding:.45rem 1.2rem;font-size:clamp(.72rem,1vw,.82rem);font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .2s;}
.cp-logout-btn:hover{border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.6);}

/* ─── STAGE / HEADER ─── */
/* ✅ FIX 1: header sempre visibile — rimosso v-if, sempre nella struttura */
.cp-stage{display:flex;flex-direction:column;height:100dvh;overflow:hidden;}
.cp-header{display:flex;align-items:center;justify-content:space-between;padding:clamp(.4rem,1vh,.7rem) clamp(1rem,2.5vw,2.5rem);background:rgba(255,255,255,.025);border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;}
.cp-header--mystery .cp-header-right .cp-hint{color:rgba(255,215,0,.7);animation:pulse 1.4s ease-in-out infinite;}
.cp-header-left{display:flex;align-items:center;gap:.6rem;}
.cp-trophy{font-size:clamp(1.2rem,2.5vh,1.6rem);filter:drop-shadow(0 0 8px rgba(255,200,0,.55));}
.cp-header-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.3rem,2.8vw,2rem);letter-spacing:.1em;line-height:1.1;}
.cp-header-phase{font-size:clamp(.6rem,1vw,.72rem);font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.35);}
.cp-header-right{display:flex;align-items:center;gap:.9rem;}
.cp-hint{font-size:clamp(.62rem,.9vw,.75rem);font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.3);}
.cp-hint--pulse{animation:pulse 2s ease-in-out infinite;}
.cp-hint--active{color:rgba(255,215,0,.65);}
.cp-hint--done{color:rgba(80,200,120,.85);}
.cp-hint--suspense{color:#ff6b6b;animation:suspensePulse .6s ease-in-out infinite;}
@keyframes suspensePulse{0%,100%{opacity:.5;transform:scale(1);}50%{opacity:1;transform:scale(1.08);}}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.9}}
.cp-back-btn{background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);border-radius:10px;width:clamp(30px,3.5vh,38px);height:clamp(30px,3.5vh,38px);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;}
.cp-back-btn:hover{background:rgba(255,255,255,.14);color:#fff;}

/* ─── RANKING AREA ─────────────────────────────── */
.cp-ranking-area{flex:1;display:flex;flex-direction:column;justify-content:center;padding:clamp(.4rem,1.2vh,.8rem) clamp(1rem,4vw,5rem) clamp(.4rem,1.2vh,.8rem);position:relative;overflow:hidden;min-height:0;}
.cp-tap-invite{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;color:rgba(255,255,255,.2);pointer-events:none;}
.cp-tap-icon{font-size:clamp(2rem,5vh,3.5rem);animation:tapBounce 1.6s ease-in-out infinite;}
@keyframes tapBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.cp-tap-text{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,5vw,4rem);letter-spacing:.15em;}
.cp-tap-sub{font-size:clamp(.7rem,1.2vw,.9rem);font-weight:700;letter-spacing:.1em;text-transform:uppercase;}

.cp-cards-wrap{width:100%;max-width:1200px;margin:0 auto;}
/* ✅ FIX 3: gap più stretto tra card */
.cp-cards-list{display:flex;flex-direction:column;gap:clamp(.25rem,.55vh,.5rem);}
.cp-revealed-list{display:flex;flex-direction:column;gap:clamp(.25rem,.55vh,.5rem);margin-top:clamp(.25rem,.55vh,.5rem);}

/* ─── MYSTERY CARD ── */
/* ✅ FIX 3: altezza ridotta — più snella e compatta */
.cp-card-mystery{
  background:#111120 !important;
  border:2px solid rgba(255,255,255,.1) !important;
  min-height:clamp(40px,5.5vh,58px) !important;
}

/* Mystery card del 6° in attesa del secondo click */
.cp-card--last-waiting{
  border-color:rgba(255,255,255,.18) !important;
  animation:lastWaitingPulse 1.6s ease-in-out infinite;
}
@keyframes lastWaitingPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.05);border-color:rgba(255,255,255,.18);}
  50%{box-shadow:0 0 18px 4px rgba(255,255,255,.08);border-color:rgba(255,255,255,.3);}
}

/* ─── SINGOLA CARD ────── */
/* ✅ FIX 3: padding e min-height ridotti — card più basse */
.cp-card{
  position:relative;
  display:flex;
  align-items:center;
  gap:clamp(.4rem,1vw,.8rem);
  padding:clamp(.35rem,.9vh,.65rem) clamp(.6rem,1.5vw,1.2rem);
  border-radius:clamp(10px,1.2vw,14px);
  border:1.5px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.04);
  transition:transform .25s,box-shadow .25s;
  overflow:hidden;
  min-height:clamp(40px,5.5vh,58px);
}
/* ✅ FIX 2: shake APPENA il click è rilevato (non dopo) — la card pending inizia a tremare immediatamente */
.cp-card--shaking{animation:cardShake .35s ease-in-out infinite;}
@keyframes cardShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.cp-card--top-two-shake{animation:topTwoShake .5s ease-in-out infinite;border-color:rgba(255,215,0,.4)!important;box-shadow:0 0 28px rgba(255,215,0,.2)!important;}
@keyframes topTwoShake{0%,100%{transform:scale(1) rotate(0deg)}25%{transform:scale(1.02) rotate(-1deg)}75%{transform:scale(1.02) rotate(1deg)}}

/* card colori squadra */
.cp-card--rossi    {background:rgba(255,77,77,.1);border-color:rgba(255,77,77,.3);}
.cp-card--verdi    {background:rgba(81,207,102,.1);border-color:rgba(81,207,102,.3);}
.cp-card--arancioni{background:rgba(255,169,77,.1);border-color:rgba(255,169,77,.3);}
.cp-card--gialli   {background:rgba(255,212,59,.1);border-color:rgba(255,212,59,.3);}
.cp-card--bianchi  {background:rgba(232,232,232,.07);border-color:rgba(232,232,232,.3);}
.cp-card--blu      {background:rgba(116,192,252,.1);border-color:rgba(116,192,252,.3);}

/* winner */
.cp-card--winner{animation:winnerPulse 1.8s ease-in-out infinite;border-color:rgba(255,215,0,.6)!important;box-shadow:0 0 40px rgba(255,215,0,.25),0 0 80px rgba(255,215,0,.1)!important;}
@keyframes winnerPulse{0%,100%{box-shadow:0 0 40px rgba(255,215,0,.25),0 0 80px rgba(255,215,0,.1)}50%{box-shadow:0 0 60px rgba(255,215,0,.45),0 0 120px rgba(255,215,0,.2)}}

/* crazy */
.cp-card--crazy{animation:crazyBounce .25s ease-in-out infinite!important;}
@keyframes crazyBounce{0%,100%{transform:scale(1) rotate(0deg)}33%{transform:scale(1.04) rotate(-2deg)}66%{transform:scale(1.04) rotate(2deg)}}

/* ─── MINI ANIMAZIONE REVEAL ─────────────────── */
.cp-reveal-flash{
  position:absolute;
  inset:0;
  border-radius:inherit;
  background:rgba(255,255,255,.55);
  pointer-events:none;
  z-index:5;
  animation:revealFlash 1.0s ease-out forwards;
}
@keyframes revealFlash{
  0%  {opacity:1;}
  35% {opacity:.3;}
  100%{opacity:0;}
}

.cp-card--just-revealed{
  animation:justRevealedPop 1.8s cubic-bezier(.16,1,.3,1) forwards !important;
}
@keyframes justRevealedPop{
  0%  {transform:scale(1.08);box-shadow:0 0 40px rgba(255,255,255,.35),0 0 70px rgba(255,255,255,.15);}
  40% {transform:scale(1.03);box-shadow:0 0 24px rgba(255,255,255,.2);}
  100%{transform:scale(1);box-shadow:none;}
}

.cp-reveal-particles{
  position:absolute;
  inset:0;
  pointer-events:none;
  overflow:visible;
  z-index:6;
}
.cp-reveal-particle{
  position:absolute;
  top:50%;
  left:50%;
  width:7px;
  height:7px;
  border-radius:50%;
  background:var(--color);
  animation:revealParticle 1.0s ease-out forwards;
}
@keyframes revealParticle{
  0%  {transform:rotate(var(--angle)) translateY(0) scale(1.4);opacity:1;}
  60% {opacity:.7;}
  100%{transform:rotate(var(--angle)) translateY(-90px) scale(0);opacity:0;}
}

/* color strip */
.cp-color-strip{position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:2px 0 0 2px;}
.cp-strip--rossi    {background:#ff4d4d;}
.cp-strip--verdi    {background:#51cf66;}
.cp-strip--arancioni{background:#ffa94d;}
.cp-strip--gialli   {background:#ffd43b;}
.cp-strip--bianchi  {background:#E8E8E8;}
.cp-strip--blu      {background:#74c0fc;}

/* rank */
.cp-card-rank{flex-shrink:0;min-width:clamp(24px,3vw,38px);display:flex;align-items:center;justify-content:center;}
.cp-medal{font-size:clamp(1.1rem,2vh,1.6rem);}
.cp-rank-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(1rem,2vw,1.5rem);color:rgba(255,255,255,.35);letter-spacing:.05em;}

/* card row */
.cp-card-row{flex:1;min-width:0;display:flex;flex-direction:column;gap:clamp(.15rem,.35vh,.3rem);}
.cp-card-name-line{display:flex;align-items:center;gap:.6rem;}
.cp-team-badge{display:none;}
.cp-card-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(1rem,2vw,1.5rem);letter-spacing:.08em;line-height:1;}
.cp-card-bar-wrap{height:clamp(3px,0.5vh,5px);background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;}
.cp-card-bar{height:100%;border-radius:4px;transition:width .6s cubic-bezier(.16,1,.3,1);}
.cp-bar--rossi    {background:#ff4d4d;}
.cp-bar--verdi    {