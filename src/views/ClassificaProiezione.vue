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
              <div class="cp-header-title">Cre Grest {{ currentYear }}</div>
              <div class="cp-header-phase">{{ currentPhaseLabel }}</div>
            </div>
          </div>
          <div class="cp-header-right">
            <div v-if="!revealStarted" class="cp-hint cp-hint--pulse">Clicca per iniziare</div>
            <div v-else-if="revealedCount < sortedTeams.length" class="cp-hint cp-hint--active">{{ sortedTeams.length - revealedCount }} rimanenti</div>
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
            <transition-group tag="div" class="cp-cards-list" name="card-enter">
              <div
                v-for="team in displayedTeams" :key="team.id"
                class="cp-card"
                :class="[
                  'cp-card--' + team.id,
                  {
                    'cp-card--shaking': shakingCards.has(team.id),
                    'cp-card--crazy':   crazyActive && team.rank === 1,
                    'cp-card--winner':  team.rank === 1 && revealedCount === sortedTeams.length && !shakingCards.has(team.id),
                    'cp-card--podium':  team.rank <= 3 && revealedCount === sortedTeams.length && phase === 'finale' && !shakingCards.has(team.id),
                  }
                ]"
              >
                <div v-if="shakingCards.has(team.id)" class="cp-card-cover">
                  <span class="cp-cover-q">?</span>
                </div>
                <template v-else>
                  <div class="cp-card-rank">
                    <span v-if="revealedCount === sortedTeams.length && team.rank === 1" class="cp-medal">🥇</span>
                    <span v-else-if="revealedCount === sortedTeams.length && team.rank === 2" class="cp-medal">🥈</span>
                    <span v-else-if="revealedCount === sortedTeams.length && team.rank === 3" class="cp-medal">🥉</span>
                    <span v-else class="cp-rank-num">#{{ team.rank }}</span>
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
                  <div v-if="phase==='finale' && team.rank===1 && revealedCount===sortedTeams.length" class="cp-sparks">
                    <span v-for="n in 14" :key="n" class="cp-spark" :style="sparkStyle(n)"></span>
                  </div>
                  <div v-if="phase!=='finale' && team.rank===1 && revealedCount===sortedTeams.length" class="cp-stars">
                    <span v-for="n in 5" :key="n" class="cp-star" :style="starStyle(n)">✦</span>
                  </div>
                  <div v-if="crazyActive && team.rank===1" class="cp-crazy-burst">
                    <span v-for="n in 20" :key="n" class="cp-burst-particle" :style="burstStyle(n)"></span>
                  </div>
                </template>
              </div>
            </transition-group>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══════════════════════════════════════════════════════
         WINNER BANNER ULTRA (finale)
    ═══════════════════════════════════════════════════════ -->
    <transition name="winner-fade">
      <div v-if="showWinnerBanner" class="cp-winner-overlay" @click.stop>

        <!-- 1. Sfondo + vignetta radiale -->
        <div class="cp-win-bg"></div>

        <!-- 2. Laser beams ruotanti -->
        <div class="cp-lasers">
          <div v-for="n in 12" :key="n" class="cp-laser" :style="laserStyle(n)"></div>
        </div>

        <!-- 3. Shockwave cerchi espansivi -->
        <div class="cp-shockwaves">
          <div v-for="n in 4" :key="n" class="cp-shockwave" :style="{ animationDelay: ((n-1)*0.55)+'s' }"></div>
        </div>

        <!-- 4. Pioggia oro (stelle + cerchi) -->
        <div class="cp-gold-rain">
          <span v-for="n in 60" :key="n" class="cp-gold-drop" :style="goldDropStyle(n)"></span>
        </div>

        <!-- 5. Fuochi d'artificio -->
        <canvas ref="fireworksCanvas" class="cp-fireworks-canvas"></canvas>

        <!-- 6. Confetti colorati -->
        <div class="cp-confetti-wrap">
          <span v-for="n in 80" :key="n" class="cp-confetto" :style="confettiStyle(n)"></span>
        </div>

        <!-- 7. Contenuto centrale -->
        <div class="cp-win-center">
          <!-- Halo dorato dietro -->
          <div class="cp-win-halo"></div>

          <!-- Corona animata -->
          <div class="cp-win-crown">👑</div>

          <!-- Scritta CAMPIONE con glitch -->
          <div class="cp-win-pre">CAMPIONE</div>
          <div class="cp-win-year">CREGREST {{ currentYear }}</div>

          <!-- Nome con typewriter + glow pulsante -->
          <div class="cp-win-name" :class="'cp-name--' + sortedTeams[0].id">
            <span v-for="(ch, i) in winnerNameChars" :key="i"
              class="cp-win-char"
              :style="{ animationDelay: (i * 0.07) + 's' }">
              {{ ch === ' ' ? '\u00a0' : ch }}
            </span>
          </div>

          <!-- Punti con count-up -->
          <div class="cp-win-pts">
            <span class="cp-win-pts-num">{{ displayedPoints }}</span>
            <span class="cp-win-pts-label">PUNTI</span>
          </div>

          <!-- Stelle decorative -->
          <div class="cp-win-stars">
            <span v-for="n in 7" :key="n" class="cp-win-star" :style="winStarStyle(n)">★</span>
          </div>

          <!-- Trofei laterali -->
          <div class="cp-win-trophies">
            <span class="cp-win-trophy-l">🏆</span>
            <span class="cp-win-trophy-r">🏆</span>
          </div>

          <div class="cp-win-sub">Congratulazioni! 🎉🎊🎉</div>
          <button class="cp-winner-close" @click="winnerClosed = true">Chiudi</button>
        </div>

      </div>
    </transition>

    <!-- WEEK BANNER -->
    <transition name="winner-fade">
      <div v-if="showWeekBanner" class="cp-week-banner" @click.stop>
        <div class="cp-week-stars-wrap">
          <span v-for="n in 18" :key="n" class="cp-week-star" :style="weekStarStyle(n)">★</span>
        </div>
        <div class="cp-week-content">
          <div class="cp-week-icon">🌟</div>
          <div class="cp-week-label">{{ currentPhaseLabel }}</div>
          <div class="cp-week-winner" :class="'cp-name--' + sortedTeams[0].id">{{ sortedTeams[0].name }}</div>
          <div class="cp-week-pts">{{ sortedTeams[0].points }} punti</div>
          <button class="cp-winner-close" @click="weekBannerClosed = true">Chiudi</button>
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

const SHAKE_MS   = 2400;
const CRAZY_MS   = 4200;
const POST_CRAZY = 3000;

export default {
  name: 'ClassificaProiezione',
  data() {
    return {
      showPhaseSelector: true,
      phase: null,
      isLoading: false,
      revealStarted: false,
      revealedCount: 0,
      shakingCards: new Set(),
      crazyActive: false,
      isRevealing: false,
      winnerClosed: false,
      weekBannerClosed: false,
      currentYear: new Date().getFullYear(),
      displayedPoints: 0,
      fireworksTimer: null,
      phases: [
        { id: 'settimana1', label: '1ª Settimana',     icon: '1️⃣' },
        { id: 'settimana2', label: '2ª Settimana',     icon: '2️⃣' },
        { id: 'settimana3', label: '3ª Settimana',     icon: '3️⃣' },
        { id: 'finale',    label: 'Classifica Finale', icon: '🏆' },
      ],
      allTeams: [
        { id: 'rossi',     name: 'Rossi' },
        { id: 'verdi',     name: 'Verdi' },
        { id: 'arancioni', name: 'Arancioni' },
        { id: 'blu',       name: 'Blu' },
        { id: 'fucsia',    name: 'Fucsia' },
        { id: 'gialli',    name: 'Gialli' },
      ],
      pointsData: null,
      historyData: [],
    };
  },
  computed: {
    currentPhaseLabel() {
      return this.phases.find(p => p.id === this.phase)?.label || '';
    },
    teams() {
      if (!this.pointsData) return [];
      return this.allTeams.map(t => ({ ...t, points: this.getPointsForPhase(t.id) }));
    },
    sortedTeams() {
      return [...this.teams].sort((a, b) => b.points - a.points).map((t, i) => ({ ...t, rank: i + 1 }));
    },
    displayedTeams() {
      if (!this.revealStarted || this.revealedCount === 0) return [];
      const total = this.sortedTeams.length;
      return this.sortedTeams.slice(total - this.revealedCount);
    },
    maxPoints() {
      return Math.max(...this.teams.map(t => t.points), 1);
    },
    allRevealed() {
      return this.revealedCount === this.sortedTeams.length && this.sortedTeams.length > 0;
    },
    noShaking() {
      return this.shakingCards.size === 0;
    },
    showWinnerBanner() {
      return this.allRevealed && this.noShaking && this.phase === 'finale' && !this.winnerClosed;
    },
    showWeekBanner() {
      return this.allRevealed && this.noShaking && this.phase !== 'finale' && !this.weekBannerClosed;
    },
    winnerNameChars() {
      if (!this.sortedTeams.length) return [];
      return this.sortedTeams[0].name.split('');
    },
  },
  watch: {
    showWinnerBanner(val) {
      if (val) {
        this.$nextTick(() => {
          this.startCountUp();
          this.startFireworks();
        });
      } else {
        this.stopFireworks();
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
      this.shakingCards = new Set();
      this.crazyActive = false;
      this.isRevealing = false;
      this.winnerClosed = false;
      this.weekBannerClosed = false;
      this.displayedPoints = 0;
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
      if (this.showPhaseSelector || this.isLoading || this.isRevealing) return;
      if (this.revealedCount >= this.sortedTeams.length) return;
      this.isRevealing = true;
      this.revealStarted = true;
      this.revealedCount++;
      const total = this.sortedTeams.length;
      const team = this.sortedTeams[total - this.revealedCount];
      const isFirst = team.rank === 1;
      const shakeDur = isFirst ? CRAZY_MS : SHAKE_MS;
      this.shakingCards = new Set([...this.shakingCards, team.id]);
      setTimeout(() => {
        const next = new Set(this.shakingCards);
        next.delete(team.id);
        this.shakingCards = next;
        if (isFirst) {
          this.crazyActive = true;
          setTimeout(() => { this.crazyActive = false; }, POST_CRAZY);
        }
        this.isRevealing = false;
      }, shakeDur);
    },
    resetView() {
      this.stopFireworks();
      this.showPhaseSelector = true;
      this.phase = null;
      this.revealStarted = false;
      this.revealedCount = 0;
      this.shakingCards = new Set();
      this.crazyActive = false;
      this.isRevealing = false;
      this.pointsData = null;
      this.historyData = [];
      this.winnerClosed = false;
      this.weekBannerClosed = false;
      this.displayedPoints = 0;
    },
    handleLogout() {
      sessionStorage.removeItem('loggedInUser');
      localStorage.removeItem('loggedInUser');
      this.$router.push('/login');
    },

    /* ── Count-up punti ─────────────────────────── */
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

    /* ── Fuochi d'artificio su Canvas ──────────── */
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
          particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color,
            size: 2 + Math.random() * 3,
            decay: 0.012 + Math.random() * 0.01,
          });
        }
      };

      // Lancia fuochi a intervalli casuali
      const launch = () => {
        const x = 80 + Math.random() * (window.innerWidth - 160);
        const y = 80 + Math.random() * (window.innerHeight * 0.6);
        explode(x, y);
      };

      // Esplosione iniziale massiccia
      for (let i = 0; i < 6; i++) setTimeout(launch, i * 220);

      this.fireworksTimer = setInterval(launch, 700);

      const draw = () => {
        if (!this.showWinnerBanner) return;
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.07; // gravità
          p.alpha -= p.decay;
          if (p.alpha <= 0) { particles.splice(i, 1); continue; }
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    },
    stopFireworks() {
      if (this.fireworksTimer) { clearInterval(this.fireworksTimer); this.fireworksTimer = null; }
    },

    /* ── Stili particelle ───────────────────────── */
    sparkStyle(n) {
      return { '--angle': ((n / 14) * 360) + 'deg', animationDelay: (n * 0.07) + 's' };
    },
    starStyle(n) {
      return { '--x': (-70 + n * 35) + 'px', '--y': (-28 - (n % 3) * 20) + 'px', animationDelay: (n * 0.14) + 's', fontSize: (1.1 + (n % 2) * 0.7) + 'rem' };
    },
    burstStyle(n) {
      const colors = ['#ffd43b','#ff6b6b','#51cf66','#74c0fc','#f78cc6','#ffa94d','#fff','#c0f'];
      return { '--angle': ((n / 20) * 360) + 'deg', '--color': colors[n % colors.length], animationDelay: (n * 0.04) + 's' };
    },
    laserStyle(n) {
      const angle = (n / 12) * 360;
      const hue   = (n / 12) * 60; // da oro a arancio
      return {
        '--angle': angle + 'deg',
        '--hue':   hue,
        animationDelay: (n * 0.18) + 's',
      };
    },
    goldDropStyle(n) {
      const shapes = ['★','✦','◆','●','✸'];
      return {
        left:            ((n / 60) * 105) + 'vw',
        '--duration':    (1.8 + (n % 5) * 0.4) + 's',
        '--delay':       (n * 0.08) + 's',
        '--rot':         (n * 53) + 'deg',
        '--size':        (0.6 + (n % 4) * 0.35) + 'rem',
        content: shapes[n % shapes.length],
        animationDelay: 'var(--delay)',
        animationDuration: 'var(--duration)',
        fontSize: 'var(--size)',
      };
    },
    confettiStyle(n) {
      const shapes = ['square','circle','rect'];
      return {
        '--color':    ['#ff6b6b','#ffd43b','#51cf66','#74c0fc','#f78cc6','#ffa94d','#fff','#c084fc'][n % 8],
        '--duration': (2.0 + (n % 5) * 0.45) + 's',
        '--delay':    (n * 0.04) + 's',
        '--rot':      (n * 37) + 'deg',
        animationDelay: 'var(--delay)',
        animationDuration: 'var(--duration)',
        left:  ((n / 80) * 100) + 'vw',
        borderRadius: shapes[n % 3] === 'circle' ? '50%' : shapes[n % 3] === 'rect' ? '2px' : '3px',
        width:  shapes[n % 3] === 'rect' ? '5px'  : '10px',
        height: shapes[n % 3] === 'rect' ? '16px' : '10px',
      };
    },
    winStarStyle(n) {
      const angles = [0, 51, 102, 153, 204, 255, 306];
      const r = 160 + (n % 2) * 40;
      const a = (angles[n - 1] * Math.PI) / 180;
      return {
        left: 'calc(50% + ' + Math.cos(a) * r + 'px)',
        top:  'calc(50% + ' + Math.sin(a) * r + 'px)',
        animationDelay: ((n - 1) * 0.12) + 's',
        fontSize: (1.2 + (n % 3) * 0.6) + 'rem',
      };
    },
    weekStarStyle(n) {
      return { left: ((n / 18) * 100) + '%', animationDelay: (n * 0.09) + 's', animationDuration: (2 + (n % 3) * 0.6) + 's', fontSize: (1 + (n % 3) * 0.55) + 'rem' };
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Bebas+Neue&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

.cp-root{font-family:'Nunito',sans-serif;background:#06060c;color:#fff;height:100dvh;width:100%;overflow:hidden;cursor:pointer;user-select:none;position:relative;display:flex;flex-direction:column;}

/* ─── FASE ───────────────────────────────────────────── */
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

/* ─── STAGE / HEADER ──────────────────────────────────── */
.cp-stage{display:flex;flex-direction:column;height:100dvh;overflow:hidden;}
.cp-header{display:flex;align-items:center;justify-content:space-between;padding:clamp(.6rem,1.5vh,1rem) clamp(1rem,2.5vw,2.5rem);background:rgba(255,255,255,.025);border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;}
.cp-header-left{display:flex;align-items:center;gap:.75rem;}
.cp-trophy{font-size:clamp(1.4rem,3vh,2rem);filter:drop-shadow(0 0 8px rgba(255,200,0,.55));}
.cp-header-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.2rem,2.5vw,1.8rem);letter-spacing:.1em;line-height:1.1;}
.cp-header-phase{font-size:clamp(.6rem,1vw,.75rem);font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.4);}
.cp-header-right{display:flex;align-items:center;gap:.9rem;}
.cp-hint{font-size:clamp(.62rem,.9vw,.75rem);font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.3);}
.cp-hint--pulse{animation:pulse 2s ease-in-out infinite;}
.cp-hint--active{color:rgba(255,215,0,.65);}
.cp-hint--done{color:rgba(80,200,120,.85);}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.9}}
.cp-back-btn{background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);border-radius:10px;width:clamp(32px,4vh,40px);height:clamp(32px,4vh,40px);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;}
.cp-back-btn:hover{background:rgba(255,255,255,.14);color:#fff;}

/* ─── RANKING AREA ─────────────────────────────────────── */
.cp-ranking-area{flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(.5rem,1.5vh,1.5rem) clamp(1rem,4vw,6rem) clamp(.5rem,1.5vh,1.5rem);position:relative;overflow:hidden;min-height:0;}
.cp-tap-invite{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;color:rgba(255,255,255,.2);pointer-events:none;}
.cp-tap-icon{font-size:clamp(2rem,5vh,3.5rem);animation:tapBounce 1.6s ease-in-out infinite;}
@keyframes tapBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.cp-tap-text{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,5vw,4rem);letter-spacing:.15em;}
.cp-tap-sub{font-size:clamp(.7rem,1.2vw,.9rem);font-weight:700;letter-spacing:.1em;text-transform:uppercase;}
.cp-cards-wrap{width:100%;max-width:1100px;margin:0 auto;}
.cp-cards-list{display:flex;flex-direction:column-reverse;gap:clamp(.4rem,1vh,.8rem);}

/* ─── CARD ─────────────────────────────────────────────── */
.cp-card{display:flex;align-items:center;gap:clamp(.6rem,1.5vw,1.5rem);background:#0e0e1c;border:2px solid rgba(255,255,255,.08);border-radius:clamp(12px,1.5vw,18px);padding:clamp(.55rem,1.3vh,1rem) clamp(.8rem,2vw,1.8rem);position:relative;overflow:hidden;min-height:clamp(60px,9vh,90px);transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s,background .3s;}
.cp-card--rossi    {border-color:rgba(220,53,69,.45);}
.cp-card--verdi    {border-color:rgba(40,167,69,.45);}
.cp-card--arancioni{border-color:rgba(253,126,20,.45);}
.cp-card--blu      {border-color:rgba(0,123,255,.45);}
.cp-card--fucsia   {border-color:rgba(232,62,140,.45);}
.cp-card--gialli   {border-color:rgba(200,150,12,.45);}
.card-enter-enter-active{animation:cardBounceIn .55s cubic-bezier(.16,1,.3,1) both;}
@keyframes cardBounceIn{0%{opacity:0;transform:translateY(60px) scale(.92);}60%{opacity:1;transform:translateY(-8px) scale(1.02);}80%{transform:translateY(4px) scale(.99);}100%{opacity:1;transform:translateY(0) scale(1);}}
.cp-card--shaking{animation:cardShake .16s ease-in-out infinite !important;background:#111120 !important;}
@keyframes cardShake{0%{transform:translateX(0) rotate(0deg);}20%{transform:translateX(-7px) rotate(-.7deg);}40%{transform:translateX(7px) rotate(.7deg);}60%{transform:translateX(-5px) rotate(-.4deg);}80%{transform:translateX(5px) rotate(.4deg);}100%{transform:translateX(0) rotate(0deg);}}
.cp-card-cover{position:absolute;inset:0;border-radius:inherit;background:#fff;display:flex;align-items:center;justify-content:center;z-index:10;animation:coverPulse .5s ease-in-out infinite alternate;}
@keyframes coverPulse{from{background:#fff}to{background:#e0e0ff}}
.cp-cover-q{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,5vw,4.5rem);color:rgba(0,0,0,.1);letter-spacing:.3em;animation:qBounce .5s ease-in-out infinite alternate;}
@keyframes qBounce{from{transform:scale(1)}to{transform:scale(1.2)}}
.cp-card--crazy{animation:crazyShake .09s ease-in-out infinite !important;border-color:rgba(255,215,0,.95) !important;box-shadow:0 0 60px rgba(255,215,0,.6),0 0 120px rgba(255,215,0,.25),inset 0 0 30px rgba(255,215,0,.12) !important;background:#1a1400 !important;z-index:20;}
@keyframes crazyShake{0%{transform:translateX(0) rotate(0deg) scale(1);}10%{transform:translateX(-12px) rotate(-1.8deg) scale(1.03);}20%{transform:translateX(12px) rotate(1.8deg) scale(.97);}30%{transform:translateX(-9px) rotate(-1.3deg) scale(1.04);}40%{transform:translateX(9px) rotate(1.3deg) scale(.96);}50%{transform:translateX(-6px) rotate(-.7deg) scale(1.02);}60%{transform:translateX(6px) rotate(.7deg) scale(1);}70%{transform:translateX(-4px) rotate(-.3deg) scale(1.01);}80%{transform:translateX(4px) rotate(.3deg) scale(.99);}100%{transform:translateX(0) rotate(0deg) scale(1);}}
.cp-card--winner{background:rgba(255,215,0,.09);border-color:rgba(255,215,0,.6) !important;box-shadow:0 0 50px rgba(255,215,0,.18),inset 0 0 24px rgba(255,215,0,.07);transform:scale(1.014);}
.cp-card--podium{background:rgba(255,255,255,.04);}
.cp-card-rank{flex-shrink:0;width:clamp(40px,5vw,64px);text-align:center;}
.cp-rank-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,3vw,2.4rem);color:rgba(255,255,255,.18);letter-spacing:.05em;}
.cp-medal{font-size:clamp(1.6rem,3.5vw,2.6rem);}
.cp-card-info{flex:1;min-width:0;}
.cp-card-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,3.5vw,2.8rem);letter-spacing:.08em;line-height:1;margin-bottom:clamp(.2rem,.5vh,.4rem);}
.cp-card-bar-wrap{height:clamp(4px,.6vh,7px);background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden;}
.cp-card-bar{height:100%;border-radius:99px;transition:width 1.1s cubic-bezier(.16,1,.3,1);}
.cp-card-score{flex-shrink:0;text-align:right;}
.cp-score-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,4.5vw,3.8rem);letter-spacing:.04em;line-height:1;}
.cp-score-unit{display:block;font-size:clamp(.6rem,.9vw,.75rem);font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.3);}
.cp-name--rossi    {color:#ff6b6b;}
.cp-name--verdi    {color:#51cf66;}
.cp-name--arancioni{color:#ffa94d;}
.cp-name--blu      {color:#74c0fc;}
.cp-name--fucsia   {color:#f78cc6;}
.cp-name--gialli   {color:#ffd43b;}
.cp-bar--rossi    {background:linear-gradient(90deg,#DC3545,#ff6b6b);}
.cp-bar--verdi    {background:linear-gradient(90deg,#28A745,#51cf66);}
.cp-bar--arancioni{background:linear-gradient(90deg,#FD7E14,#ffa94d);}
.cp-bar--blu      {background:linear-gradient(90deg,#007BFF,#74c0fc);}
.cp-bar--fucsia   {background:linear-gradient(90deg,#E83E8C,#f78cc6);}
.cp-bar--gialli   {background:linear-gradient(90deg,#c8960c,#ffd43b);}
.cp-sparks{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:visible;}
.cp-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#ffd43b;animation:sparkFly 1.3s ease-out infinite;--angle:0deg;}
@keyframes sparkFly{0%{transform:rotate(var(--angle)) translateX(0) scale(1.5);opacity:1}100%{transform:rotate(var(--angle)) translateX(90px) scale(0);opacity:0}}
.cp-stars{position:absolute;right:1rem;top:50%;transform:translateY(-50%);pointer-events:none;}
.cp-star{position:absolute;color:#ffd43b;animation:starPop .8s cubic-bezier(.16,1,.3,1) both,starFade 1.5s ease-in-out .5s infinite alternate;transform:translate(var(--x,0),var(--y,0));}
@keyframes starPop{from{transform:translate(var(--x,0),var(--y,0)) scale(0)}to{transform:translate(var(--x,0),var(--y,0)) scale(1)}}
@keyframes starFade{from{opacity:1}to{opacity:.4}}
.cp-crazy-burst{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:visible;z-index:5;}
.cp-burst-particle{position:absolute;width:10px;height:10px;border-radius:50%;background:var(--color,#ffd43b);animation:burstFly 1s cubic-bezier(.16,1,.3,1) var(--delay,0s) both;--angle:0deg;}
@keyframes burstFly{0%{transform:rotate(var(--angle)) translateX(0) scale(2);opacity:1}60%{opacity:1}100%{transform:rotate(var(--angle)) translateX(160px) scale(0);opacity:0}}

/* ─── LOADING ─────────────────────────────────────────── */
.cp-loading{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;background:#06060c;color:rgba(255,255,255,.4);font-size:1rem;font-weight:700;}
.cp-spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.1);border-top-color:rgba(255,215,0,.65);border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

/* ══════════════════════════════════════════════════════════
   WINNER OVERLAY ULTRA
══════════════════════════════════════════════════════════ */
.cp-winner-overlay{
  position:fixed;inset:0;z-index:300;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;
}

/* 1. Sfondo profondo con gradiente radiale dorato al centro */
.cp-win-bg{
  position:absolute;inset:0;
  background:
    radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,180,0,.18) 0%, transparent 70%),
    radial-gradient(ellipse 120% 120% at 50% 100%, rgba(30,10,60,.9) 0%, transparent 60%),
    #000;
  animation:bgPulse 3s ease-in-out infinite alternate;
}
@keyframes bgPulse{from{opacity:.9}to{opacity:1}}

/* 2. Laser beams */
.cp-lasers{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;}
.cp-laser{
  position:absolute;
  width:3px;
  height:55vh;
  border-radius:99px;
  background:linear-gradient(to bottom, transparent 0%, hsla(calc(45 + var(--hue,0)),100%,70%,.9) 50%, transparent 100%);
  transform-origin:center bottom;
  transform:rotate(var(--angle,0deg)) translateY(-50%);
  animation:laserSweep 6s ease-in-out var(--delay,0s) infinite alternate;
  filter:blur(1.5px);
  mix-blend-mode:screen;
}
@keyframes laserSweep{
  0%  {opacity:0;transform:rotate(calc(var(--angle,0deg) - 15deg)) translateY(-50%) scaleX(.5);}
  30% {opacity:.9;}
  70% {opacity:.7;}
  100%{opacity:0;transform:rotate(calc(var(--angle,0deg) + 15deg)) translateY(-50%) scaleX(1.5);}
}

/* 3. Shockwave */
.cp-shockwaves{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;}
.cp-shockwave{
  position:absolute;
  width:20px;height:20px;
  border-radius:50%;
  border:4px solid rgba(255,215,0,.9);
  animation:shockExpand 2.8s cubic-bezier(.2,.8,.4,1) infinite;
}
@keyframes shockExpand{
  0%  {transform:scale(0);opacity:1;border-width:4px;}
  60% {opacity:.4;}
  100%{transform:scale(50);opacity:0;border-width:1px;}
}

/* 4. Pioggia d'oro */
.cp-gold-rain{position:fixed;inset:0;pointer-events:none;overflow:hidden;}
.cp-gold-drop{
  position:absolute;
  top:-2rem;
  color:#ffd43b;
  text-shadow:0 0 8px rgba(255,200,0,.8);
  animation:goldFall var(--duration,2s) ease-in var(--delay,0s) infinite;
  transform-origin:center;
  opacity:0;
}
@keyframes goldFall{
  0%  {transform:translateY(0) rotate(var(--rot,0deg));opacity:0;}
  8%  {opacity:1;}
  90% {opacity:.8;}
  100%{transform:translateY(110vh) rotate(calc(var(--rot,0deg) + 540deg));opacity:0;}
}

/* 5. Canvas fuochi */
.cp-fireworks-canvas{
  position:absolute;inset:0;
  width:100%;height:100%;
  pointer-events:none;
  z-index:1;
}

/* 6. Confetti */
.cp-confetti-wrap{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:2;}
.cp-confetto{
  position:absolute;top:-16px;
  background:var(--color);
  animation:confettiFall var(--duration,3s) ease-in var(--delay,0s) infinite;
  transform-origin:center;
}
@keyframes confettiFall{
  0%  {transform:translateY(0) rotate(var(--rot,0deg));opacity:1;}
  85% {opacity:1;}
  100%{transform:translateY(106vh) rotate(calc(var(--rot,0deg)+720deg));opacity:0;}
}

/* 7. Contenuto centrale */
.cp-win-center{
  position:relative;z-index:10;
  display:flex;flex-direction:column;
  align-items:center;text-align:center;
  padding:clamp(2rem,5vh,4rem) clamp(2rem,5vw,5rem);
  animation:winnerPop 1s cubic-bezier(.16,1,.3,1) both;
}
@keyframes winnerPop{0%{transform:scale(.3) translateY(80px);opacity:0}55%{transform:scale(1.1) translateY(-14px);opacity:1}75%{transform:scale(.97) translateY(6px);}100%{transform:scale(1) translateY(0);opacity:1}}

/* Halo dorato */
.cp-win-halo{
  position:absolute;
  width:clamp(300px,55vw,700px);
  height:clamp(300px,55vw,700px);
  border-radius:50%;
  background:radial-gradient(circle, rgba(255,200,0,.22) 0%, rgba(255,150,0,.06) 50%, transparent 70%);
  animation:haloPulse 2s ease-in-out infinite alternate;
  pointer-events:none;
  top:50%;left:50%;transform:translate(-50%,-50%);
}
@keyframes haloPulse{from{transform:translate(-50%,-50%) scale(1)}to{transform:translate(-50%,-50%) scale(1.25)}}

/* Corona */
.cp-win-crown{
  font-size:clamp(5rem,14vh,10rem);
  filter:drop-shadow(0 0 40px rgba(255,215,0,1)) drop-shadow(0 0 80px rgba(255,150,0,.8));
  animation:crownFloat 2s ease-in-out infinite, crownSpin .4s ease-in-out 1;
  position:relative;z-index:2;
  margin-bottom:.2rem;
}
@keyframes crownFloat{0%,100%{transform:translateY(0) rotate(-4deg) scale(1)}50%{transform:translateY(-18px) rotate(4deg) scale(1.06)}}
@keyframes crownSpin{0%{transform:rotateY(0deg) scale(.2)}60%{transform:rotateY(360deg) scale(1.2)}100%{transform:rotateY(360deg) scale(1)}}

/* Pre-label CAMPIONE */
.cp-win-pre{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(.9rem,2.2vw,1.6rem);
  letter-spacing:.55em;
  color:rgba(255,215,0,.7);
  text-shadow:0 0 20px rgba(255,200,0,.5);
  margin-bottom:.1rem;
  animation:labelFadeIn .5s .3s both;
}
.cp-win-year{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(.75rem,1.5vw,1.1rem);
  letter-spacing:.35em;
  color:rgba(255,255,255,.35);
  margin-bottom:clamp(.6rem,1.5vh,1.2rem);
  animation:labelFadeIn .5s .5s both;
}
@keyframes labelFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

/* Nome con typewriter lettera per lettera */
.cp-win-name{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(5rem,16vw,14rem);
  letter-spacing:.12em;
  line-height:.9;
  text-shadow:0 0 120px currentColor, 0 0 60px currentColor, 0 0 20px currentColor;
  animation:namePulse 1.8s ease-in-out infinite alternate;
  display:flex;flex-wrap:wrap;justify-content:center;
  margin-bottom:clamp(.5rem,1.5vh,1.2rem);
}
@keyframes namePulse{
  from{text-shadow:0 0 60px currentColor,  0 0 30px currentColor;  filter:brightness(1);}
  to  {text-shadow:0 0 160px currentColor, 0 0 80px currentColor, 0 0 30px #fff;filter:brightness(1.25);}
}
.cp-win-char{
  display:inline-block;
  animation:charDrop .4s cubic-bezier(.16,1,.3,1) both;
}
@keyframes charDrop{
  0%  {transform:translateY(-60px) scale(1.4) rotate(-8deg);opacity:0;}
  60% {transform:translateY(6px) scale(.96);opacity:1;}
  100%{transform:translateY(0) scale(1) rotate(0deg);opacity:1;}
}

/* Count-up punti */
.cp-win-pts{
  display:flex;align-items:baseline;gap:.5rem;
  animation:labelFadeIn .5s 1.2s both;
  margin-bottom:clamp(.5rem,1.5vh,1rem);
}
.cp-win-pts-num{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(2.5rem,7vw,6rem);
  color:#ffd43b;
  text-shadow:0 0 40px rgba(255,200,0,.8);
  letter-spacing:.05em;
  line-height:1;
}
.cp-win-pts-label{
  font-size:clamp(.7rem,1.5vw,1.1rem);font-weight:900;
  letter-spacing:.3em;text-transform:uppercase;
  color:rgba(255,215,0,.5);
}

/* Stelle orbitanti */
.cp-win-stars{position:absolute;inset:0;pointer-events:none;}
.cp-win-star{
  position:absolute;
  color:#ffd43b;
  text-shadow:0 0 12px rgba(255,200,0,.9);
  transform:translate(-50%,-50%);
  animation:starOrbit 3s ease-in-out infinite alternate;
  font-size:1.5rem;
}
@keyframes starOrbit{
  0%  {opacity:0;transform:translate(-50%,-50%) scale(0);}
  20% {opacity:1;transform:translate(-50%,-50%) scale(1.3);}
  80% {opacity:.9;transform:translate(-50%,-50%) scale(.8);}
  100%{opacity:0;transform:translate(-50%,-50%) scale(0);}
}

/* Trofei laterali */
.cp-win-trophies{display:flex;gap:clamp(6rem,20vw,18rem);position:absolute;top:50%;transform:translateY(-50%);pointer-events:none;}
.cp-win-trophy-l,.cp-win-trophy-r{
  font-size:clamp(2rem,5vw,4rem);
  filter:drop-shadow(0 0 16px rgba(255,200,0,.7));
  animation:trophyBob 2.2s ease-in-out infinite;
}
.cp-win-trophy-r{animation-delay:.6s;}
@keyframes trophyBob{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-12px) scale(1.08)}}

/* Sub e chiudi */
.cp-win-sub{
  font-size:clamp(.9rem,1.8vw,1.3rem);font-weight:700;
  color:rgba(255,255,255,.5);letter-spacing:.06em;
  margin-bottom:.8rem;
  animation:labelFadeIn .5s 1.6s both;
}
.cp-winner-close{
  background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.2);
  color:rgba(255,255,255,.55);border-radius:99px;
  padding:.55rem 2rem;font-size:clamp(.8rem,1.2vw,.9rem);font-weight:800;
  cursor:pointer;font-family:'Nunito',sans-serif;transition:all .2s;letter-spacing:.05em;
  animation:labelFadeIn .5s 2s both;
}
.cp-winner-close:hover{background:rgba(255,255,255,.18);color:#fff;transform:scale(1.04);}

/* ─── WEEK BANNER ─────────────────────────────────────── */
.cp-week-banner{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.87);backdrop-filter:blur(14px);}
.cp-week-content{text-align:center;animation:winnerPop .7s cubic-bezier(.16,1,.3,1) both;}
.cp-week-icon{font-size:clamp(3rem,8vh,6rem);animation:floatLogo 3s ease-in-out infinite;}
.cp-week-label{font-size:clamp(.7rem,1.5vw,1rem);font-weight:900;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.45);margin:.5rem 0 .25rem;}
.cp-week-winner{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,10vw,8rem);letter-spacing:.1em;line-height:1;text-shadow:0 0 60px currentColor;animation:namePulse 1.5s ease-in-out infinite alternate;}
.cp-week-pts{font-size:clamp(.85rem,1.8vw,1.3rem);font-weight:700;color:rgba(255,215,0,.8);margin-top:.4rem;}
.cp-week-stars-wrap{position:fixed;inset:0;pointer-events:none;overflow:hidden;}
.cp-week-star{position:absolute;top:-10%;color:#ffd43b;animation:weekStarFall linear infinite;opacity:0;}
@keyframes weekStarFall{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:.7}100%{transform:translateY(110vh) rotate(360deg);opacity:0}}

/* ─── TRANSIZIONI ─────────────────────────────────────── */
.phase-fade-enter-active,.phase-fade-leave-active{transition:opacity .4s ease,transform .4s cubic-bezier(.16,1,.3,1);}
.phase-fade-enter-from{opacity:0;transform:scale(1.03);}
.phase-fade-leave-to{opacity:0;transform:scale(.97);position:absolute;inset:0;}
.fade-enter-active,.fade-leave-active{transition:opacity .3s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
.winner-fade-enter-active{transition:opacity .7s ease;}
.winner-fade-enter-from{opacity:0;}
.winner-fade-leave-active{transition:opacity .35s ease;}
.winner-fade-leave-to{opacity:0;}
</style>
