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
        <div class="cp-header">
          <div class="cp-header-left">
            <span class="cp-trophy">🏆</span>
            <div>
              <div class="cp-header-title">{{ currentPhaseLabel }}</div>
              <div class="cp-header-phase">Cre Grest {{ currentYear }}</div>
            </div>
          </div>
          <div class="cp-header-right">
            <div v-if="!revealStarted" class="cp-hint cp-hint--pulse">Clicca per iniziare</div>
            <div v-else-if="revealPhase === 'top-two-shake'" class="cp-hint cp-hint--suspense">⚡ Chi sarà?!</div>
            <div v-else-if="revealedCount < revealOrder.length" class="cp-hint cp-hint--active">{{ revealOrder.length - revealedCount }} rimanenti</div>
            <div v-else class="cp-hint cp-hint--done">🎉 Completata!</div>
            <button class="cp-back-btn" @click.stop="resetView">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </div>

        <div class="cp-ranking-area">
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
                    <div class="cp-team-badge" :class="'cp-badge--' + team.id">
                      <span class="cp-badge-dot"></span>
                      <span class="cp-badge-name">{{ team.name }}</span>
                    </div>
                    <div class="cp-card-info">
                      <div class="cp-card-name" :class="'cp-name--' + team.id">{{ team.name }}</div>
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
                  </template>
                </div>
              </template>

              <!-- PENDING CARDS (3°–6°) — mostrano il rettangolo bianco ? finché non rivelate -->
              <template v-if="revealStarted">
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
              <transition-group tag="div" class="cp-revealed-list" name="card-enter">
                <div
                  v-for="team in revealedTeamsTopFirst" :key="team.id"
                  class="cp-card"
                  :class="['cp-card--' + team.id]"
                >
                  <div class="cp-color-strip" :class="'cp-strip--' + team.id"></div>
                  <div class="cp-card-rank">
                    <span v-if="team.rank === 3" class="cp-medal">🥉</span>
                    <span v-else class="cp-rank-num">#{{ team.rank }}</span>
                  </div>
                  <div class="cp-team-badge" :class="'cp-badge--' + team.id">
                    <span class="cp-badge-dot"></span>
                    <span class="cp-badge-name">{{ team.name }}</span>
                  </div>
                  <div class="cp-card-info">
                    <div class="cp-card-name" :class="'cp-name--' + team.id">{{ team.name }}</div>
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
        <!-- sfondo con colore squadra vincitrice -->
        <div class="cp-week-bg" :class="'cp-week-bg--' + sortedTeams[0].id"></div>
        <!-- particelle stellari -->
        <div class="cp-week-stars-wrap">
          <span v-for="n in 30" :key="n" class="cp-week-star" :style="weekStarStyle(n)">★</span>
        </div>
        <!-- fuochi artificiali week -->
        <div class="cp-week-fireworks">
          <span v-for="n in 20" :key="n" class="cp-week-spark" :style="weekSparkStyle(n)"></span>
        </div>
        <div class="cp-week-content">
          <!-- etichetta settimana -->
          <div class="cp-week-label">Vincitore</div>
          <div class="cp-week-phase-name">{{ currentPhaseLabel }}</div>
          <!-- medaglia 🥇 sotto il titolo, sopra il nome -->
          <div class="cp-week-medal">🥇</div>
          <!-- nome squadra grande -->
          <div class="cp-week-winner" :class="'cp-name--' + sortedTeams[0].id">
            <span v-for="(ch, i) in weekWinnerChars" :key="i" class="cp-week-char" :style="{ animationDelay: (i * 0.06) + 's' }">
              {{ ch === ' ' ? '\u00a0' : ch }}
            </span>
          </div>
          <!-- punti -->
          <div class="cp-week-score-row">
            <span class="cp-week-pts-num" :class="'cp-name--' + sortedTeams[0].id">{{ displayedWeekPoints }}</span>
            <span class="cp-week-pts-label">punti</span>
          </div>
          <!-- podio mini (2° e 3°) -->
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
          <!-- countdown + bottone -->
          <div class="cp-banner-countdown">
            <div class="cp-banner-countdown-bar" :style="{ width: bannerCountdownPct + '%' }"></div>
          </div>
          <button class="cp-winner-close cp-week-close-btn" @click="closeWeekShowRanking">Mostra Classifica</button>
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

  </div>
</template>

<script>
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const SHAKE_MS       = 2400;
const CRAZY_MS       = 2500;
const POST_CRAZY     = 2500;
const BANNER_AUTO_MS = 10000;

export default {
  name: 'ClassificaProiezione',
  data() {
    return {
      showPhaseSelector: true,
      phase: null,
      isLoading: false,
      revealStarted: false,
      revealPhase: 'normal',
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
        { id: 'blu',       name: 'Blu',       color: '#74c0fc' },
        { id: 'fucsia',    name: 'Fucsia',    color: '#f78cc6' },
        { id: 'gialli',    name: 'Gialli',    color: '#ffd43b' },
      ],
      pointsData: null,
      historyData: [],
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
      return this.allTeams.map(t => ({ ...t, points: this.getPointsForPhase(t.id) }));
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
      return this.revealStarted && this.revealedCount >= this.revealOrder.length;
    },
    pendingRanks() {
      if (!this.revealStarted) return [];
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
    getPointsForPhase(teamId) {
      if (!this.pointsData) return 0;
      if (this.phase === 'finale') return this.pointsData[teamId] || 0;
      const map = { settimana1: 'week1', settimana2: 'week2', settimana3: 'week3' };
      const key = map[this.phase];
      const entries = this.historyData.filter(e => e.phase === key && e.team === teamId);
      if (!entries.length) return this.pointsData[teamId] || 0;
      return entries.reduce((s, e) => s + (e.points || 0), 0);
    },
    barWidth(pts) {
      return Math.max(4, Math.round((pts / this.maxPoints) * 100));
    },
    async selectPhase(phaseId) {
      this.phase = phaseId;
      this.isLoading = true;
      this.showPhaseSelector = false;
      this.revealStarted = false;
      this.revealedCount = 0;
      this.revealPhase = 'normal';
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
      this.stopBannerAutoClose();
      try {
        const [pSnap, hSnap] = await Promise.all([
          getDoc(doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ')),
          getDoc(doc(db, 'points', 'history')),
        ]);
        if (pSnap.exists()) this.pointsData = pSnap.data();
        if (hSnap.exists()) this.historyData = hSnap.data().history || [];
      } catch (e) { console.error(e); }
      finally { this.isLoading = false; }
    },

    handleClick() {
      if (this.showPhaseSelector || this.isLoading) return;

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
      this.revealStarted = true;

      if (this.revealedCount >= this.revealOrder.length) {
        this.revealPhase = 'top-two-shake';
        return;
      }

      this.isRevealing = true;
      const rank = this.revealOrder[this.revealedCount];
      this.shakingRank = rank;
      this.revealedCount++;
      const team = this.sortedTeams.find(t => t.rank === rank);
      if (!team) { this.isRevealing = false; this.shakingRank = null; return; }

      this.shakingCards = new Set([...this.shakingCards, team.id]);

      setTimeout(() => {
        const next = new Set(this.shakingCards);
        next.delete(team.id);
        this.shakingCards = next;
        this.shakingRank = null;
        this.isRevealing = false;

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
      this.showPhaseSelector = true;
      this.phase = null;
      this.revealStarted = false;
      this.revealedCount = 0;
      this.revealPhase = 'normal';
      this.shakingCards = new Set();
      this.shakingRank = null;
      this.crazyActive = false;
      this.isRevealing = false;
      this.isTopTwoRevealed = false;
      this.pointsData = null;
      this.historyData = [];
      this.winnerClosed = false;
      this.weekBannerClosed = false;
      this.displayedPoints = 0;
      this.displayedWeekPoints = 0;
      this.bannerReady = false;
      this.bannerCountdownPct = 100;
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
      const COLORS = ['#ffd43b','#ff6b6b','#51cf66','#74c0fc','#f78cc6','#ffa94d','#fff','#c084fc','#ff9f43'];
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
      const colors=['#ffd43b','#ff6b6b','#51cf66','#74c0fc','#f78cc6','#ffa94d','#fff','#c0f'];
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
      return { '--color':['#ff6b6b','#ffd43b','#51cf66','#74c0fc','#f78cc6','#ffa94d','#fff','#c084fc'][n%8], '--duration':(2.0+(n%5)*0.45)+'s', '--delay':(n*0.04)+'s', '--rot':(n*37)+'deg', animationDelay:'var(--delay)', animationDuration:'var(--duration)', left:((n/80)*100)+'vw', borderRadius:shapes[n%3]==='circle'?'50%':shapes[n%3]==='rect'?'2px':'3px', width:shapes[n%3]==='rect'?'5px':'10px', height:shapes[n%3]==='rect'?'16px':'10px' };
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
        '--color': ['#ffd43b','#fff','#51cf66','#74c0fc','#f78cc6','#ffa94d'][n % 6],
        animationDelay: 'var(--delay)',
      };
    },
  },
  beforeUnmount() {
    this.stopFireworks();
    this.stopBannerAutoClose();
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Bebas+Neue&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

.cp-root{font-family:'Nunito',sans-serif;background:#06060c;color:#fff;height:100dvh;width:100%;overflow:hidden;cursor:pointer;user-select:none;position:relative;display:flex;flex-direction:column;}

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
.cp-stage{display:flex;flex-direction:column;height:100dvh;overflow:hidden;}
.cp-header{display:flex;align-items:center;justify-content:space-between;padding:clamp(.4rem,1vh,.7rem) clamp(1rem,2.5vw,2.5rem);background:rgba(255,255,255,.025);border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;}
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
.cp-ranking-area{flex:1;display:flex;flex-direction:column;justify-content:center;padding:clamp(.5rem,1.5vh,1rem) clamp(1rem,4vw,5rem) clamp(.5rem,1.5vh,1rem);position:relative;overflow:hidden;min-height:0;}
.cp-tap-invite{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;color:rgba(255,255,255,.2);pointer-events:none;}
.cp-tap-icon{font-size:clamp(2rem,5vh,3.5rem);animation:tapBounce 1.6s ease-in-out infinite;}
@keyframes tapBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.cp-tap-text{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,5vw,4rem);letter-spacing:.15em;}
.cp-tap-sub{font-size:clamp(.7rem,1.2vw,.9rem);font-weight:700;letter-spacing:.1em;text-transform:uppercase;}

.cp-cards-wrap{width:100%;max-width:1200px;margin:0 auto;}
.cp-cards-list{display:flex;flex-direction:column;gap:clamp(.35rem,.8vh,.7rem);}
.cp-revealed-list{display:flex;flex-direction:column;gap:clamp(.35rem,.8vh,.7rem);margin-top:clamp(.35rem,.8vh,.7rem);}

/* ─── MYSTERY CARD ── */
.cp-card-mystery{background:#111120 !important;border:2px solid rgba(255,255,255,.1) !important;}

/* ─── SINGOLA CARD ──────────────────────────────── */
.cp-card{display:flex;align-items:center;gap:clamp(.5rem,1.2vw,1.2rem);background:#0c0c1a;border:2px solid rgba(255,255,255,.06);border-radius:clamp(10px,1.2vw,16px);padding:clamp(.5rem,1.2vh,.9rem) clamp(.7rem,1.5vw,1.4rem);position:relative;overflow:hidden;min-height:clamp(62px,9.5vh,92px);transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s,background .3s;}

.cp-card--rossi    {background:linear-gradient(100deg,rgba(220,53,69,.18) 0%,#0c0c1a 40%);border-color:rgba(220,53,69,.35);}
.cp-card--verdi    {background:linear-gradient(100deg,rgba(40,167,69,.18) 0%,#0c0c1a 40%);border-color:rgba(40,167,69,.35);}
.cp-card--arancioni{background:linear-gradient(100deg,rgba(253,126,20,.18) 0%,#0c0c1a 40%);border-color:rgba(253,126,20,.35);}
.cp-card--blu      {background:linear-gradient(100deg,rgba(0,123,255,.18) 0%,#0c0c1a 40%);border-color:rgba(0,123,255,.35);}
.cp-card--fucsia   {background:linear-gradient(100deg,rgba(232,62,140,.18) 0%,#0c0c1a 40%);border-color:rgba(232,62,140,.35);}
.cp-card--gialli   {background:linear-gradient(100deg,rgba(200,160,0,.18) 0%,#0c0c1a 40%);border-color:rgba(200,160,0,.35);}

.cp-color-strip{position:absolute;left:0;top:0;bottom:0;width:clamp(6px,.6vw,10px);border-radius:inherit 0 0 inherit;flex-shrink:0;}
.cp-strip--rossi    {background:linear-gradient(180deg,#ff4d4d,#DC3545);box-shadow:4px 0 20px rgba(220,53,69,.6);}
.cp-strip--verdi    {background:linear-gradient(180deg,#51cf66,#28A745);box-shadow:4px 0 20px rgba(40,167,69,.6);}
.cp-strip--arancioni{background:linear-gradient(180deg,#ffa94d,#FD7E14);box-shadow:4px 0 20px rgba(253,126,20,.6);}
.cp-strip--blu      {background:linear-gradient(180deg,#74c0fc,#007BFF);box-shadow:4px 0 20px rgba(0,123,255,.6);}
.cp-strip--fucsia   {background:linear-gradient(180deg,#f78cc6,#E83E8C);box-shadow:4px 0 20px rgba(232,62,140,.6);}
.cp-strip--gialli   {background:linear-gradient(180deg,#ffd43b,#c8960c);box-shadow:4px 0 20px rgba(200,160,0,.6);}

.card-enter-enter-active{animation:cardSlideDown .55s cubic-bezier(.16,1,.3,1) both;}
@keyframes cardSlideDown{0%{opacity:0;transform:translateY(-60px) scale(.93);}55%{opacity:1;transform:translateY(8px) scale(1.02);}80%{transform:translateY(-3px) scale(.99);}100%{opacity:1;transform:translateY(0) scale(1);}}

.cp-card--shaking{animation:cardShake .15s ease-in-out infinite !important;}
@keyframes cardShake{0%{transform:translateX(0);}25%{transform:translateX(-8px) rotate(-.6deg);}75%{transform:translateX(8px) rotate(.6deg);}100%{transform:translateX(0);}}

.cp-card--top-two-shake{
  animation:topTwoShake .13s ease-in-out infinite !important;
  background:#0a0900 !important;
  border-color:rgba(255,210,0,.75) !important;
  box-shadow:0 0 40px rgba(255,200,0,.35),0 0 80px rgba(255,180,0,.15),inset 0 0 20px rgba(255,210,0,.08) !important;
}
@keyframes topTwoShake{
  0%  {transform:translateX(0) rotate(0deg) scale(1);}
  20% {transform:translateX(-10px) rotate(-1.8deg) scale(1.018);}
  40% {transform:translateX(10px)  rotate(1.8deg)  scale(.982);}
  60% {transform:translateX(-8px)  rotate(-1.2deg) scale(1.012);}
  80% {transform:translateX(8px)   rotate(1.2deg)  scale(.988);}
  100%{transform:translateX(0) rotate(0deg) scale(1);}
}

.cp-card-cover{position:absolute;inset:0;border-radius:inherit;background:#fff;display:flex;align-items:center;justify-content:center;z-index:10;animation:coverPulse .5s ease-in-out infinite alternate;}
@keyframes coverPulse{from{background:#fff}to{background:#dde0ff}}
.cp-card-cover--gold{animation:coverPulseGold .4s ease-in-out infinite alternate !important;}
@keyframes coverPulseGold{from{background:#fffbe0}to{background:#ffe066}}
.cp-cover-q{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,5vw,4.5rem);color:rgba(0,0,0,.18);letter-spacing:.3em;animation:qBounce .45s ease-in-out infinite alternate;}
@keyframes qBounce{from{transform:scale(1)}to{transform:scale(1.25)}}
.cp-cover-q--gold{color:rgba(180,120,0,.25);}

.cp-card--crazy{animation:crazyShake .09s ease-in-out infinite !important;border-color:rgba(255,215,0,.95) !important;box-shadow:0 0 70px rgba(255,200,0,.7),0 0 140px rgba(255,200,0,.3),inset 0 0 30px rgba(255,200,0,.15) !important;background:#0a0a00 !important;z-index:20;}
@keyframes crazyShake{0%{transform:translateX(0) scale(1);}15%{transform:translateX(-14px) rotate(-2deg) scale(1.03);}30%{transform:translateX(14px) rotate(2deg) scale(.97);}45%{transform:translateX(-10px) rotate(-1.2deg) scale(1.04);}60%{transform:translateX(10px) rotate(1.2deg) scale(.96);}80%{transform:translateX(-5px) rotate(-.5deg);}100%{transform:translateX(0) scale(1);}}

.cp-card--winner{border-color:rgba(255,215,0,.7) !important;box-shadow:0 0 60px rgba(255,215,0,.25),inset 0 0 30px rgba(255,215,0,.08);transform:scale(1.018);}

/* ─── BADGE ──────────────────────────────────────── */
.cp-team-badge{display:flex;align-items:center;gap:.35rem;padding:.2rem .65rem .2rem .4rem;border-radius:99px;border:1.5px solid transparent;flex-shrink:0;margin-left:clamp(.1rem,.3vw,.4rem);}
.cp-badge-dot{width:clamp(10px,1.2vw,14px);height:clamp(10px,1.2vw,14px);border-radius:50%;flex-shrink:0;}
.cp-badge-name{font-size:clamp(.6rem,.8vw,.75rem);font-weight:900;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;}
.cp-badge--rossi    {background:rgba(220,53,69,.2);border-color:rgba(220,53,69,.5);}
.cp-badge--rossi    .cp-badge-dot {background:#ff4d4d;box-shadow:0 0 8px rgba(255,77,77,.8);}
.cp-badge--rossi    .cp-badge-name{color:#ff8080;}
.cp-badge--verdi    {background:rgba(40,167,69,.2);border-color:rgba(40,167,69,.5);}
.cp-badge--verdi    .cp-badge-dot {background:#51cf66;box-shadow:0 0 8px rgba(81,207,102,.8);}
.cp-badge--verdi    .cp-badge-name{color:#69db7c;}
.cp-badge--arancioni{background:rgba(253,126,20,.2);border-color:rgba(253,126,20,.5);}
.cp-badge--arancioni .cp-badge-dot{background:#ffa94d;box-shadow:0 0 8px rgba(255,169,77,.8);}
.cp-badge--arancioni .cp-badge-name{color:#ffc078;}
.cp-badge--blu      {background:rgba(0,123,255,.2);border-color:rgba(0,123,255,.5);}
.cp-badge--blu      .cp-badge-dot {background:#74c0fc;box-shadow:0 0 8px rgba(116,192,252,.8);}
.cp-badge--blu      .cp-badge-name{color:#a5d8ff;}
.cp-badge--fucsia   {background:rgba(232,62,140,.2);border-color:rgba(232,62,140,.5);}
.cp-badge--fucsia   .cp-badge-dot {background:#f78cc6;box-shadow:0 0 8px rgba(247,140,198,.8);}
.cp-badge--fucsia   .cp-badge-name{color:#faa2c1;}
.cp-badge--gialli   {background:rgba(200,150,0,.2);border-color:rgba(200,150,0,.5);}
.cp-badge--gialli   .cp-badge-dot {background:#ffd43b;box-shadow:0 0 8px rgba(255,212,59,.8);}
.cp-badge--gialli   .cp-badge-name{color:#ffe066;}

/* ─── RANK ──────────────────────────────────────── */
.cp-card-rank{flex-shrink:0;width:clamp(44px,5vw,68px);text-align:center;margin-left:clamp(6px,1vw,14px);}
.cp-rank-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.5rem,3.2vw,2.6rem);color:rgba(255,255,255,.2);letter-spacing:.05em;}
.cp-medal{font-size:clamp(1.7rem,3.5vw,2.8rem);}

/* ─── INFO ──────────────────────────────────────── */
.cp-card-info{flex:1;min-width:0;}
.cp-card-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.5rem,3.8vw,3rem);letter-spacing:.09em;line-height:1;margin-bottom:clamp(.18rem,.4vh,.35rem);}
.cp-card-bar-wrap{height:clamp(4px,.55vh,7px);background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;}
.cp-card-bar{height:100%;border-radius:99px;transition:width 1.1s cubic-bezier(.16,1,.3,1);}

/* ─── SCORE ─────────────────────────────────────── */
.cp-card-score{flex-shrink:0;text-align:right;}
.cp-score-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.2rem,5vw,4rem);letter-spacing:.04em;line-height:1;}
.cp-score-unit{display:block;font-size:clamp(.6rem,.85vw,.72rem);font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.28);}

/* ─── COLORI ─────────────────────────────────────── */
.cp-name--rossi    {color:#ff6b6b;}
.cp-name--verdi    {color:#51cf66;}
.cp-name--arancioni{color:#ffa94d;}
.cp-name--blu      {color:#74c0fc;}
.cp-name--fucsia   {color:#f78cc6;}
.cp-name--gialli   {color:#ffd43b;}

.cp-bar--rossi    {background:linear-gradient(90deg,#ff4d4d,#ff8080);}
.cp-bar--verdi    {background:linear-gradient(90deg,#51cf66,#8ce99a);}
.cp-bar--arancioni{background:linear-gradient(90deg,#ffa94d,#ffc078);}
.cp-bar--blu      {background:linear-gradient(90deg,#74c0fc,#a5d8ff);}
.cp-bar--fucsia   {background:linear-gradient(90deg,#f78cc6,#faa2c1);}
.cp-bar--gialli   {background:linear-gradient(90deg,#ffd43b,#ffe066);}

/* ─── SPARKS & STARS ────────────────────────────── */
.cp-sparks{position:absolute;inset:0;pointer-events:none;overflow:visible;}
.cp-spark{position:absolute;top:50%;left:50%;width:clamp(6px,.7vw,10px);height:clamp(6px,.7vw,10px);border-radius:50%;background:#ffd43b;transform-origin:50% 50%;animation:sparkOut 1.2s ease-out forwards;animation-delay:var(--delay,0s);}
@keyframes sparkOut{0%{opacity:1;transform:rotate(var(--angle)) translateX(0) scale(1);}100%{opacity:0;transform:rotate(var(--angle)) translateX(clamp(60px,8vw,120px)) scale(0);}}

.cp-stars{position:absolute;inset:0;pointer-events:none;overflow:visible;}
.cp-star{position:absolute;top:50%;left:50%;color:#ffd43b;text-shadow:0 0 10px #ffd43b;transform:translate(var(--x,0),var(--y,0));animation:starFloat 1.8s ease-out forwards;animation-delay:var(--delay,0s);}
@keyframes starFloat{0%{opacity:0;transform:translate(var(--x),var(--y)) scale(.5);}30%{opacity:1;transform:translate(var(--x),calc(var(--y) - 20px)) scale(1.3);}100%{opacity:0;transform:translate(var(--x),calc(var(--y) - 60px)) scale(.8);}}

.cp-crazy-burst{position:absolute;inset:0;pointer-events:none;overflow:visible;}
.cp-burst-particle{position:absolute;top:50%;left:50%;width:clamp(8px,1vw,14px);height:clamp(8px,1vw,14px);border-radius:50%;background:var(--color,#ffd43b);box-shadow:0 0 10px var(--color,#ffd43b);transform-origin:50% 50%;animation:burstOut .8s ease-out forwards;animation-delay:var(--delay,0s);}
@keyframes burstOut{0%{opacity:1;transform:rotate(var(--angle)) translateX(0) scale(1);}100%{opacity:0;transform:rotate(var(--angle)) translateX(clamp(80px,10vw,160px)) scale(0);}}

/* ─── WINNER BANNER ─────────────────────────────── */
.cp-winner-overlay{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.cp-win-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,#1a1200 0%,#06050a 60%,#000 100%);}
.cp-fireworks-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.cp-lasers{position:absolute;inset:0;pointer-events:none;}
.cp-laser{position:absolute;top:50%;left:50%;width:1px;height:55vh;transform-origin:50% 100%;background:linear-gradient(to top,transparent,oklch(0.75 0.18 calc(50 + var(--hue))));opacity:.3;animation:laserSpin 8s linear infinite;animation-delay:var(--animationDelay,0s);}
@keyframes laserSpin{from{transform:rotate(var(--angle)) scaleY(1);}50%{transform:rotate(calc(var(--angle) + 180deg)) scaleY(.6);}to{transform:rotate(calc(var(--angle) + 360deg)) scaleY(1);}}
.cp-shockwaves{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;}
.cp-shockwave{position:absolute;width:200px;height:200px;border-radius:50%;border:2px solid rgba(255,215,0,.5);animation:shockExpand 3s ease-out infinite;}
@keyframes shockExpand{0%{transform:scale(0);opacity:.8;}100%{transform:scale(10);opacity:0;}}
.cp-gold-rain{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.cp-gold-drop{position:absolute;top:-10%;animation:goldFall var(--duration,2s) linear infinite;animation-delay:var(--delay,0s);}
@keyframes goldFall{0%{transform:translateY(0) rotate(var(--rot));opacity:1;}100%{transform:translateY(110vh) rotate(calc(var(--rot) + 360deg));opacity:.2;}}
.cp-confetti-wrap{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.cp-confetto{position:absolute;top:-5%;background:var(--color,#ffd43b);animation:confettiFall var(--duration,2.2s) linear infinite;animation-delay:var(--delay,0s);}
@keyframes confettiFall{0%{transform:translateY(0) rotate(var(--rot));opacity:1;}100%{transform:translateY(110vh) rotate(calc(var(--rot) + 720deg));opacity:0;}}
.cp-win-center{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;gap:clamp(.3rem,.8vh,.7rem);text-align:center;padding:clamp(1.5rem,4vh,3rem) clamp(2rem,5vw,5rem);}
.cp-win-halo{position:absolute;width:clamp(300px,50vw,600px);height:clamp(300px,50vw,600px);border-radius:50%;background:radial-gradient(ellipse,rgba(255,200,0,.18) 0%,transparent 70%);pointer-events:none;animation:haloPulse 2.5s ease-in-out infinite;}
@keyframes haloPulse{0%,100%{transform:scale(1);opacity:.7;}50%{transform:scale(1.15);opacity:1;}}
.cp-win-crown{font-size:clamp(3rem,8vh,6rem);animation:crownBounce 1.2s ease-in-out infinite;filter:drop-shadow(0 0 20px rgba(255,215,0,.9));}
@keyframes crownBounce{0%,100%{transform:translateY(0) rotate(-5deg);}50%{transform:translateY(-16px) rotate(5deg);}}
.cp-win-pre{font-family:'Bebas Neue',sans-serif;font-size:clamp(.9rem,2vw,1.4rem);letter-spacing:.4em;color:rgba(255,215,0,.7);}
.cp-win-year{font-size:clamp(.65rem,1.1vw,.85rem);font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.3);}
.cp-win-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,10vw,8rem);letter-spacing:.1em;line-height:1;text-shadow:0 0 60px currentColor;display:flex;flex-wrap:wrap;justify-content:center;}
.cp-win-char{display:inline-block;animation:charDrop .5s cubic-bezier(.16,1,.3,1) both;}
@keyframes charDrop{from{opacity:0;transform:translateY(-40px) scale(1.4);}to{opacity:1;transform:none;}}
.cp-win-pts{display:flex;align-items:baseline;gap:.4rem;}
.cp-win-pts-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,7vw,5.5rem);color:#ffd43b;text-shadow:0 0 30px rgba(255,215,0,.8);}
.cp-win-pts-label{font-size:clamp(.7rem,1.2vw,.95rem);font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,215,0,.5);}
.cp-win-stars{position:absolute;width:100%;height:100%;pointer-events:none;}
.cp-win-star{position:absolute;color:#ffd43b;animation:winStarPulse 1.5s ease-in-out infinite;text-shadow:0 0 12px #ffd43b;}
@keyframes winStarPulse{0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(.8);}50%{opacity:1;transform:translate(-50%,-50%) scale(1.3);}}
.cp-win-trophies{display:flex;gap:clamp(1.5rem,4vw,4rem);}
.cp-win-trophy-l,.cp-win-trophy-r{font-size:clamp(1.5rem,3.5vh,2.5rem);animation:trophyRock 2s ease-in-out infinite;}
.cp-win-trophy-r{animation-delay:.5s;}
@keyframes trophyRock{0%,100%{transform:rotate(-8deg);}50%{transform:rotate(8deg);}}
.cp-win-sub{font-size:clamp(.75rem,1.3vw,1rem);font-weight:700;letter-spacing:.05em;color:rgba(255,255,255,.5);}
.cp-winner-close{margin-top:clamp(.3rem,.8vh,.6rem);background:rgba(255,215,0,.15);border:2px solid rgba(255,215,0,.5);color:#ffd43b;border-radius:99px;padding:clamp(.5rem,1.2vh,.8rem) clamp(1.5rem,3vw,2.5rem);font-family:'Nunito',sans-serif;font-size:clamp(.8rem,1.3vw,1rem);font-weight:800;cursor:pointer;letter-spacing:.05em;transition:all .2s;}
.cp-winner-close:hover{background:rgba(255,215,0,.3);border-color:rgba(255,215,0,.8);}

/* ─── WEEK BANNER ───────────────────────────────── */
.cp-week-banner{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.cp-week-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,#1a1200 0%,#06050a 60%,#000 100%);}
.cp-week-bg--rossi    {background:radial-gradient(ellipse at 50% 40%,rgba(220,53,69,.3) 0%,#06050a 60%,#000 100%);}
.cp-week-bg--verdi    {background:radial-gradient(ellipse at 50% 40%,rgba(40,167,69,.3) 0%,#06050a 60%,#000 100%);}
.cp-week-bg--arancioni{background:radial-gradient(ellipse at 50% 40%,rgba(253,126,20,.3) 0%,#06050a 60%,#000 100%);}
.cp-week-bg--blu      {background:radial-gradient(ellipse at 50% 40%,rgba(0,123,255,.3) 0%,#06050a 60%,#000 100%);}
.cp-week-bg--fucsia   {background:radial-gradient(ellipse at 50% 40%,rgba(232,62,140,.3) 0%,#06050a 60%,#000 100%);}
.cp-week-bg--gialli   {background:radial-gradient(ellipse at 50% 40%,rgba(200,160,0,.3) 0%,#06050a 60%,#000 100%);}
.cp-week-stars-wrap{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.cp-week-star{position:absolute;top:-5%;color:#ffd43b;animation:weekStarFall var(--duration,3s) linear infinite;animation-delay:var(--delay,0s);font-size:var(--size,1rem);opacity:.7;text-shadow:0 0 8px #ffd43b;}
@keyframes weekStarFall{0%{transform:translateY(0) rotate(0);opacity:.8;}100%{transform:translateY(110vh) rotate(360deg);opacity:0;}}
.cp-week-fireworks{position:absolute;inset:0;pointer-events:none;overflow:visible;}
.cp-week-spark{position:absolute;top:50%;left:50%;width:clamp(4px,.5vw,8px);height:clamp(4px,.5vw,8px);border-radius:50%;background:var(--color,#ffd43b);box-shadow:0 0 8px var(--color,#ffd43b);animation:weekSparkBurst 1.5s ease-out infinite;animation-delay:var(--delay,0s);transform-origin:0 0;}
@keyframes weekSparkBurst{0%{opacity:1;transform:rotate(var(--angle)) translateX(0) scale(1);}100%{opacity:0;transform:rotate(var(--angle)) translateX(clamp(60px,8vw,140px)) scale(0);}}
.cp-week-content{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;gap:clamp(.3rem,.7vh,.6rem);text-align:center;padding:clamp(1.5rem,4vh,3rem) clamp(2rem,5vw,5rem);}
.cp-week-label{font-size:clamp(.7rem,1.2vw,.9rem);font-weight:800;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.4);}
.cp-week-phase-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.2rem,3vw,2rem);letter-spacing:.2em;color:rgba(255,255,255,.75);}
.cp-week-medal{font-size:clamp(2.5rem,7vh,5rem);animation:medalBounce 1s ease-in-out infinite;filter:drop-shadow(0 0 20px rgba(255,215,0,.8));}
@keyframes medalBounce{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-12px) scale(1.08);}}
.cp-week-winner{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,10vw,7rem);letter-spacing:.1em;line-height:1;text-shadow:0 0 50px currentColor;display:flex;flex-wrap:wrap;justify-content:center;}
.cp-week-char{display:inline-block;animation:charDrop .5s cubic-bezier(.16,1,.3,1) both;}
.cp-week-score-row{display:flex;align-items:baseline;gap:.4rem;}
.cp-week-pts-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,5.5vw,4.5rem);color:#ffd43b;text-shadow:0 0 25px rgba(255,215,0,.8);}
.cp-week-pts-label{font-size:clamp(.65rem,1.1vw,.85rem);font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,215,0,.5);}
.cp-week-podium{display:flex;gap:clamp(.5rem,2vw,1.5rem);margin-top:clamp(.2rem,.5vh,.5rem);}
.cp-week-podium-item{display:flex;align-items:center;gap:.35rem;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.12);border-radius:99px;padding:.3rem .9rem .3rem .5rem;}
.cp-podium-medal{font-size:clamp(.9rem,1.6vh,1.3rem);}
.cp-podium-name{font-size:clamp(.7rem,1.1vw,.9rem);font-weight:800;}
.cp-podium-pts{font-size:clamp(.6rem,.9vw,.75rem);color:rgba(255,255,255,.4);font-weight:700;}
.cp-week-close-btn{background:rgba(255,215,0,.12);border:2px solid rgba(255,215,0,.4);color:#ffd43b;}
.cp-week-close-btn:hover{background:rgba(255,215,0,.25);border-color:rgba(255,215,0,.7);}

/* ─── COUNTDOWN BAR ─────────────────────────────── */
.cp-banner-countdown{width:clamp(140px,30vw,280px);height:3px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden;margin-top:clamp(.2rem,.5vh,.4rem);}
.cp-banner-countdown-bar{height:100%;background:linear-gradient(90deg,rgba(255,215,0,.8),rgba(255,165,0,.5));border-radius:99px;transition:width .1s linear;}

/* ─── LOADING ───────────────────────────────────── */
.cp-loading{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;background:#06060c;z-index:50;}
.cp-spinner{width:clamp(32px,5vw,48px);height:clamp(32px,5vw,48px);border:3px solid rgba(255,255,255,.1);border-top-color:#ffd43b;border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.cp-loading p{font-size:clamp(.8rem,1.3vw,1rem);color:rgba(255,255,255,.4);font-weight:700;letter-spacing:.1em;}

/* ─── TRANSITIONS ───────────────────────────────── */
.phase-fade-enter-active,.phase-fade-leave-active{transition:opacity .4s,transform .4s;}
.phase-fade-enter-from,.phase-fade-leave-to{opacity:0;transform:scale(.97);}
.winner-fade-enter-active{transition:opacity .5s,transform .5s cubic-bezier(.16,1,.3,1);}
.winner-fade-leave-active{transition:opacity .35s;}
.winner-fade-enter-from{opacity:0;transform:scale(.9);}
.winner-fade-leave-to{opacity:0;}
.fade-enter-active,.fade-leave-active{transition:opacity .3s;}
.fade-enter-from,.fade-leave-to{opacity:0;}
</style>
