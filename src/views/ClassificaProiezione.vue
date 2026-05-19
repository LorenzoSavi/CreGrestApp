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
              <div class="cp-tap-sub">dal {{ sortedTeams.length }}° al 2° posto… e poi il sorpresa!</div>
            </div>
          </transition>

          <div class="cp-cards-wrap">
            <!--
              LOGICA VISIVA:
              - displayedTeams: array ordinato [1°, 2°, 3°, 4°, 5°, 6°]
              - flex-direction: column-reverse  =>  il 6° (index 5) finisce in BASSO, il 1° (index 0) in CIMA
              - RIVELAZIONE con ordine personalizzato: 6 → 5 → 4 → 3 → 1 → 2
                Il SECONDO posto viene rivelato PER ULTIMO come colpo di scena finale!
            -->
            <transition-group tag="div" class="cp-cards-list" name="card-enter">
              <div
                v-for="team in displayedTeams" :key="team.id"
                class="cp-card"
                :class="[
                  'cp-card--' + team.id,
                  {
                    'cp-card--shaking': shakingCards.has(team.id),
                    'cp-card--crazy':   crazyActive && team.rank === 2,
                    'cp-card--winner':  team.rank === 1 && allRevealed && !shakingCards.has(team.id),
                  }
                ]"
              >
                <!-- Copertura bianca durante shake -->
                <div v-if="shakingCards.has(team.id)" class="cp-card-cover">
                  <span class="cp-cover-q">?</span>
                </div>

                <template v-else>
                  <!-- Strip colorata laterale sinistra -->
                  <div class="cp-color-strip" :class="'cp-strip--' + team.id"></div>

                  <!-- Rank -->
                  <div class="cp-card-rank">
                    <span v-if="allRevealed && team.rank === 1" class="cp-medal">🥇</span>
                    <span v-else-if="allRevealed && team.rank === 2" class="cp-medal">🥈</span>
                    <span v-else-if="allRevealed && team.rank === 3" class="cp-medal">🥉</span>
                    <span v-else class="cp-rank-num">#{{ team.rank }}</span>
                  </div>

                  <!-- Badge colore squadra -->
                  <div class="cp-team-badge" :class="'cp-badge--' + team.id">
                    <span class="cp-badge-dot"></span>
                    <span class="cp-badge-name">{{ team.name }}</span>
                  </div>

                  <!-- Bar + nome grande -->
                  <div class="cp-card-info">
                    <div class="cp-card-name" :class="'cp-name--' + team.id">{{ team.name }}</div>
                    <div class="cp-card-bar-wrap">
                      <div class="cp-card-bar" :class="'cp-bar--' + team.id" :style="{ width: barWidth(team.points) + '%' }"></div>
                    </div>
                  </div>

                  <!-- Score -->
                  <div class="cp-card-score">
                    <span class="cp-score-num" :class="'cp-name--' + team.id">{{ team.points }}</span>
                    <span class="cp-score-unit">pt</span>
                  </div>

                  <!-- Effetti 1° posto -->
                  <div v-if="phase==='finale' && team.rank===1 && allRevealed" class="cp-sparks">
                    <span v-for="n in 16" :key="n" class="cp-spark" :style="sparkStyle(n)"></span>
                  </div>
                  <div v-if="phase!=='finale' && team.rank===1 && allRevealed" class="cp-stars">
                    <span v-for="n in 6" :key="n" class="cp-star" :style="starStyle(n)">✦</span>
                  </div>
                  <!-- Effetto crazy sul 2° posto (ultimo rivelato = colpo di scena) -->
                  <div v-if="crazyActive && team.rank===2" class="cp-crazy-burst">
                    <span v-for="n in 24" :key="n" class="cp-burst-particle" :style="burstStyle(n)"></span>
                  </div>
                </template>
              </div>
            </transition-group>
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
      /*
        revealedCount = quante squadre sono state rivelate finora.

        ORDINE DI REVEAL PERSONALIZZATO: 6 → 5 → 4 → 3 → 1 → 2
        Il SECONDO posto viene rivelato PER ULTIMO come colpo di scena finale!

        revealOrder[0] = 6  (primo click)
        revealOrder[1] = 5
        revealOrder[2] = 4
        revealOrder[3] = 3
        revealOrder[4] = 1  (penultimo: il vincitore!)
        revealOrder[5] = 2  (ULTIMO: sorpresa, il secondo posto è il gran finale)
      */
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
    teams() {
      if (!this.pointsData) return [];
      return this.allTeams.map(t => ({ ...t, points: this.getPointsForPhase(t.id) }));
    },
    // sortedTeams: index 0 = 1° posto, index N-1 = ultimo posto
    sortedTeams() {
      return [...this.teams]
        .sort((a, b) => b.points - a.points)
        .map((t, i) => ({ ...t, rank: i + 1 }));
    },
    /*
      ORDINE DI REVEAL: 6 → 5 → 4 → 3 → 1 → 2
      Per N squadre generiamo l'array: [N, N-1, ..., 3, 1, 2]
      Esempio con 6: [6, 5, 4, 3, 1, 2]
      Il 2° posto è sempre l'ultimo colpo di scena!
    */
    revealOrder() {
      const N = this.sortedTeams.length;
      if (N <= 2) {
        // Con 1 o 2 squadre: ordine normale dal basso
        return Array.from({ length: N }, (_, i) => N - i);
      }
      // Dal 6° al 3°, poi 1°, poi 2° come gran finale
      const order = [];
      for (let r = N; r >= 3; r--) order.push(r);
      order.push(1); // penultimo: il vincitore
      order.push(2); // ULTIMO: il secondo posto, colpo di scena!
      return order;
    },
    /*
      displayedTeams contiene le squadre GIA' rivelate.
      Usiamo revealOrder per sapere quale rank è stato rivelato ad ogni step.
      Mostriamo tutte le squadre con rank incluso nei primi revealedCount elementi di revealOrder.
    */
    displayedTeams() {
      if (!this.revealStarted || this.revealedCount === 0) return [];
      const revealedRanks = new Set(this.revealOrder.slice(0, this.revealedCount));
      return this.sortedTeams.filter(t => revealedRanks.has(t.rank));
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
      if (val) this.$nextTick(() => { this.startCountUp(); this.startFireworks(); });
      else this.stopFireworks();
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

      // Il rank da rivelare ora è il prossimo nella sequenza personalizzata
      const rank = this.revealOrder[this.revealedCount];
      this.revealedCount++;

      const team = this.sortedTeams.find(t => t.rank === rank);
      if (!team) { this.isRevealing = false; return; }

      /*
        Shake durata:
        - rank 2 (l'ultimo rivelato, il gran finale) → CRAZY_MS, effetto esplosivo
        - rank 1 (il vincitore, penultimo) → SHAKE_MS normale
        - tutti gli altri → SHAKE_MS
      */
      const isGrandFinale = rank === 2;
      const shakeDur = isGrandFinale ? CRAZY_MS : SHAKE_MS;

      this.shakingCards = new Set([...this.shakingCards, team.id]);

      setTimeout(() => {
        const next = new Set(this.shakingCards);
        next.delete(team.id);
        this.shakingCards = next;
        if (isGrandFinale) {
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
      return { left:((n/18)*100)+'%', animationDelay:(n*0.09)+'s', animationDuration:(2+(n%3)*0.6)+'s', fontSize:(1+(n%3)*0.55)+'rem' };
    },
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

/* ─── STAGE / HEADER ───────────────────────────────── */
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

/* ─── RANKING AREA ───────────────────────────────────── */
.cp-ranking-area{
  flex:1;display:flex;flex-direction:column;justify-content:flex-end;
  padding:clamp(.5rem,1.5vh,1rem) clamp(1rem,4vw,5rem) clamp(.5rem,1.5vh,1rem);
  position:relative;overflow:hidden;min-height:0;
}
.cp-tap-invite{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;color:rgba(255,255,255,.2);pointer-events:none;}
.cp-tap-icon{font-size:clamp(2rem,5vh,3.5rem);animation:tapBounce 1.6s ease-in-out infinite;}
@keyframes tapBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.cp-tap-text{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,5vw,4rem);letter-spacing:.15em;}
.cp-tap-sub{font-size:clamp(.7rem,1.2vw,.9rem);font-weight:700;letter-spacing:.1em;text-transform:uppercase;}

.cp-cards-wrap{width:100%;max-width:1200px;margin:0 auto;}

/*
  flex-direction: column-reverse
  => displayedTeams è ordinato per rank (1°, 2°, ..., N°)
  => Con column-reverse: rankN appare in basso visivamente, rank1 in cima ✓
  => Ma siccome il 2° viene rivelato per ULTIMO, apparirà in CIMA (subito sotto il 1°)
     che è la posizione corretta nella classifica finale!
*/
.cp-cards-list{
  display:flex;
  flex-direction:column-reverse;
  gap:clamp(.35rem,.8vh,.7rem);
}

/* ─── SINGOLA CARD ──────────────────────────────────────── */
.cp-card{
  display:flex;align-items:center;
  gap:clamp(.5rem,1.2vw,1.2rem);
  background:#0c0c1a;
  border:2px solid rgba(255,255,255,.06);
  border-radius:clamp(10px,1.2vw,16px);
  padding:clamp(.5rem,1.2vh,.9rem) clamp(.7rem,1.5vw,1.4rem);
  position:relative;overflow:hidden;
  min-height:clamp(62px,9.5vh,92px);
  transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s,background .3s;
}

/* Bagliore di sfondo con il colore della squadra */
.cp-card--rossi    { background: linear-gradient(100deg, rgba(220,53,69,.18) 0%, #0c0c1a 40%); border-color: rgba(220,53,69,.35); }
.cp-card--verdi    { background: linear-gradient(100deg, rgba(40,167,69,.18) 0%, #0c0c1a 40%); border-color: rgba(40,167,69,.35); }
.cp-card--arancioni{ background: linear-gradient(100deg, rgba(253,126,20,.18) 0%, #0c0c1a 40%); border-color: rgba(253,126,20,.35); }
.cp-card--blu      { background: linear-gradient(100deg, rgba(0,123,255,.18) 0%, #0c0c1a 40%); border-color: rgba(0,123,255,.35); }
.cp-card--fucsia   { background: linear-gradient(100deg, rgba(232,62,140,.18) 0%, #0c0c1a 40%); border-color: rgba(232,62,140,.35); }
.cp-card--gialli   { background: linear-gradient(100deg, rgba(200,160,0,.18) 0%, #0c0c1a 40%); border-color: rgba(200,160,0,.35); }

/* Strip colorata sul bordo sinistro */
.cp-color-strip{
  position:absolute;left:0;top:0;bottom:0;
  width:clamp(6px,.6vw,10px);
  border-radius:inherit 0 0 inherit;
  flex-shrink:0;
}
.cp-strip--rossi    { background: linear-gradient(180deg, #ff4d4d, #DC3545); box-shadow: 4px 0 20px rgba(220,53,69,.6); }
.cp-strip--verdi    { background: linear-gradient(180deg, #51cf66, #28A745); box-shadow: 4px 0 20px rgba(40,167,69,.6); }
.cp-strip--arancioni{ background: linear-gradient(180deg, #ffa94d, #FD7E14); box-shadow: 4px 0 20px rgba(253,126,20,.6); }
.cp-strip--blu      { background: linear-gradient(180deg, #74c0fc, #007BFF); box-shadow: 4px 0 20px rgba(0,123,255,.6); }
.cp-strip--fucsia   { background: linear-gradient(180deg, #f78cc6, #E83E8C); box-shadow: 4px 0 20px rgba(232,62,140,.6); }
.cp-strip--gialli   { background: linear-gradient(180deg, #ffd43b, #c8960c); box-shadow: 4px 0 20px rgba(200,160,0,.6); }

/* Card enter animation */
.card-enter-enter-active{animation:cardBounceIn .55s cubic-bezier(.16,1,.3,1) both;}
@keyframes cardBounceIn{0%{opacity:0;transform:translateY(55px) scale(.93);}55%{opacity:1;transform:translateY(-7px) scale(1.02);}80%{transform:translateY(3px) scale(.99);}100%{opacity:1;transform:translateY(0) scale(1);}}

/* SHAKE */
.cp-card--shaking{animation:cardShake .15s ease-in-out infinite !important;background:#111120 !important;}
@keyframes cardShake{0%{transform:translateX(0);}25%{transform:translateX(-8px) rotate(-.6deg);}75%{transform:translateX(8px) rotate(.6deg);}100%{transform:translateX(0);}}

/* Copertura bianca */
.cp-card-cover{position:absolute;inset:0;border-radius:inherit;background:#fff;display:flex;align-items:center;justify-content:center;z-index:10;animation:coverPulse .5s ease-in-out infinite alternate;}
@keyframes coverPulse{from{background:#fff}to{background:#dde0ff}}
.cp-cover-q{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,5vw,4.5rem);color:rgba(0,0,0,.1);letter-spacing:.3em;animation:qBounce .45s ease-in-out infinite alternate;}
@keyframes qBounce{from{transform:scale(1)}to{transform:scale(1.25)}}

/* CRAZY 2° posto (l'ultimo colpo di scena!) */
.cp-card--crazy{animation:crazyShake .09s ease-in-out infinite !important;border-color:rgba(192,192,255,.95) !important;box-shadow:0 0 70px rgba(180,180,255,.7),0 0 140px rgba(180,180,255,.3),inset 0 0 30px rgba(180,180,255,.15) !important;background:#0a0a20 !important;z-index:20;}
@keyframes crazyShake{0%{transform:translateX(0) scale(1);}15%{transform:translateX(-14px) rotate(-2deg) scale(1.03);}30%{transform:translateX(14px) rotate(2deg) scale(.97);}45%{transform:translateX(-10px) rotate(-1.2deg) scale(1.04);}60%{transform:translateX(10px) rotate(1.2deg) scale(.96);}80%{transform:translateX(-5px) rotate(-.5deg);}100%{transform:translateX(0) scale(1);}}

/* Winner card (1° posto) */
.cp-card--winner{border-color:rgba(255,215,0,.7) !important;box-shadow:0 0 60px rgba(255,215,0,.25),inset 0 0 30px rgba(255,215,0,.08);transform:scale(1.018);}

/* ─── BADGE COLORE SQUADRA ──────────────────────── */
.cp-team-badge{
  display:flex;align-items:center;gap:.35rem;
  padding:.2rem .65rem .2rem .4rem;
  border-radius:99px;
  border:1.5px solid transparent;
  flex-shrink:0;
  margin-left:clamp(.1rem,.3vw,.4rem);
}
.cp-badge-dot{
  width:clamp(10px,1.2vw,14px);
  height:clamp(10px,1.2vw,14px);
  border-radius:50%;
  flex-shrink:0;
}
.cp-badge-name{
  font-size:clamp(.6rem,.8vw,.75rem);
  font-weight:900;
  letter-spacing:.06em;
  text-transform:uppercase;
  white-space:nowrap;
}
.cp-badge--rossi    { background:rgba(220,53,69,.2);  border-color:rgba(220,53,69,.5); }
.cp-badge--rossi    .cp-badge-dot  { background:#ff4d4d; box-shadow:0 0 8px rgba(255,77,77,.8); }
.cp-badge--rossi    .cp-badge-name { color:#ff8080; }

.cp-badge--verdi    { background:rgba(40,167,69,.2);  border-color:rgba(40,167,69,.5); }
.cp-badge--verdi    .cp-badge-dot  { background:#51cf66; box-shadow:0 0 8px rgba(81,207,102,.8); }
.cp-badge--verdi    .cp-badge-name { color:#69db7c; }

.cp-badge--arancioni{ background:rgba(253,126,20,.2); border-color:rgba(253,126,20,.5); }
.cp-badge--arancioni .cp-badge-dot { background:#ffa94d; box-shadow:0 0 8px rgba(255,169,77,.8); }
.cp-badge--arancioni .cp-badge-name{ color:#ffc078; }

.cp-badge--blu      { background:rgba(0,123,255,.2);  border-color:rgba(0,123,255,.5); }
.cp-badge--blu      .cp-badge-dot  { background:#74c0fc; box-shadow:0 0 8px rgba(116,192,252,.8); }
.cp-badge--blu      .cp-badge-name { color:#a5d8ff; }

.cp-badge--fucsia   { background:rgba(232,62,140,.2); border-color:rgba(232,62,140,.5); }
.cp-badge--fucsia   .cp-badge-dot  { background:#f78cc6; box-shadow:0 0 8px rgba(247,140,198,.8); }
.cp-badge--fucsia   .cp-badge-name { color:#faa2c1; }

.cp-badge--gialli   { background:rgba(200,150,0,.2);  border-color:rgba(200,150,0,.5); }
.cp-badge--gialli   .cp-badge-dot  { background:#ffd43b; box-shadow:0 0 8px rgba(255,212,59,.8); }
.cp-badge--gialli   .cp-badge-name { color:#ffe066; }

/* ─── RANK ────────────────────────────────────────────── */
.cp-card-rank{
  flex-shrink:0;
  width:clamp(44px,5vw,68px);
  text-align:center;
  margin-left:clamp(6px,1vw,14px);
}
.cp-rank-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.5rem,3.2vw,2.6rem);color:rgba(255,255,255,.2);letter-spacing:.05em;}
.cp-medal{font-size:clamp(1.7rem,3.5vw,2.8rem);}

/* ─── INFO (nome + barra) ─────────────────────────── */
.cp-card-info{flex:1;min-width:0;}
.cp-card-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.5rem,3.8vw,3rem);letter-spacing:.09em;line-height:1;margin-bottom:clamp(.18rem,.4vh,.35rem);}
.cp-card-bar-wrap{height:clamp(4px,.55vh,7px);background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;}
.cp-card-bar{height:100%;border-radius:99px;transition:width 1.1s cubic-bezier(.16,1,.3,1);}

/* ─── SCORE ──────────────────────────────────────────── */
.cp-card-score{flex-shrink:0;text-align:right;}
.cp-score-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.2rem,5vw,4rem);letter-spacing:.04em;line-height:1;}
.cp-score-unit{display:block;font-size:clamp(.6rem,.85vw,.72rem);font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.28);}

/* ─── COLORI TESTO + BARRE ───────────────────────────── */
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

/* Scintille + stelle + burst */
.cp-sparks{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:visible;}
.cp-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#ffd43b;animation:sparkFly 1.3s ease-out infinite;--angle:0deg;}
@keyframes sparkFly{0%{transform:rotate(var(--angle)) translateX(0) scale(1.5);opacity:1}100%{transform:rotate(var(--angle)) translateX(95px) scale(0);opacity:0}}
.cp-stars{position:absolute;right:1rem;top:50%;transform:translateY(-50%);pointer-events:none;}
.cp-star{position:absolute;color:#ffd43b;animation:starPop .8s cubic-bezier(.16,1,.3,1) both,starFade 1.5s ease-in-out .5s infinite alternate;transform:translate(var(--x,0),var(--y,0));}
@keyframes starPop{from{transform:translate(var(--x,0),var(--y,0)) scale(0)}to{transform:translate(var(--x,0),var(--y,0)) scale(1)}}
@keyframes starFade{from{opacity:1}to{opacity:.4}}
.cp-crazy-burst{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:visible;z-index:5;}
.cp-burst-particle{position:absolute;width:10px;height:10px;border-radius:50%;background:var(--color,#ffd43b);animation:burstFly 1s cubic-bezier(.16,1,.3,1) var(--delay,0s) both;}
@keyframes burstFly{0%{transform:rotate(var(--angle,0deg)) translateX(0) scale(2);opacity:1}60%{opacity:1}100%{transform:rotate(var(--angle,0deg)) translateX(170px) scale(0);opacity:0}}

/* ─── LOADING ─────────────────────────────────────── */
.cp-loading{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;background:#06060c;color:rgba(255,255,255,.4);font-size:1rem;font-weight:700;}
.cp-spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.1);border-top-color:rgba(255,215,0,.65);border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

/* ══════════════════════════════════════════════════════
   WINNER OVERLAY ULTRA
══════════════════════════════════════════════════════ */
.cp-winner-overlay{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.cp-win-bg{position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 50%,rgba(255,180,0,.18) 0%,transparent 70%),radial-gradient(ellipse 120% 120% at 50% 100%,rgba(30,10,60,.9) 0%,transparent 60%),#000;animation:bgPulse 3s ease-in-out infinite alternate;}
@keyframes bgPulse{from{opacity:.9}to{opacity:1}}
.cp-lasers{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;}
.cp-laser{position:absolute;width:3px;height:55vh;border-radius:99px;background:linear-gradient(to bottom,transparent 0%,hsla(calc(45 + var(--hue,0)),100%,70%,.9) 50%,transparent 100%);transform-origin:center bottom;transform:rotate(var(--angle,0deg)) translateY(-50%);animation:laserSweep 6s ease-in-out var(--delay,0s) infinite alternate;filter:blur(1.5px);mix-blend-mode:screen;}
@keyframes laserSweep{0%{opacity:0;transform:rotate(calc(var(--angle,0deg) - 15deg)) translateY(-50%) scaleX(.5);}30%{opacity:.9;}70%{opacity:.7;}100%{opacity:0;transform:rotate(calc(var(--angle,0deg) + 15deg)) translateY(-50%) scaleX(1.5);}}
.cp-shockwaves{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;}
.cp-shockwave{position:absolute;width:20px;height:20px;border-radius:50%;border:4px solid rgba(255,215,0,.9);animation:shockExpand 2.8s cubic-bezier(.2,.8,.4,1) infinite;}
@keyframes shockExpand{0%{transform:scale(0);opacity:1;border-width:4px;}60%{opacity:.4;}100%{transform:scale(50);opacity:0;border-width:1px;}}
.cp-gold-rain{position:fixed;inset:0;pointer-events:none;overflow:hidden;}
.cp-gold-drop{position:absolute;top:-2rem;color:#ffd43b;text-shadow:0 0 8px rgba(255,200,0,.8);animation:goldFall var(--duration,2s) ease-in var(--delay,0s) infinite;opacity:0;}
@keyframes goldFall{0%{transform:translateY(0) rotate(var(--rot,0deg));opacity:0;}8%{opacity:1;}90%{opacity:.8;}100%{transform:translateY(110vh) rotate(calc(var(--rot,0deg) + 540deg));opacity:0;}}
.cp-fireworks-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;}
.cp-confetti-wrap{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:2;}
.cp-confetto{position:absolute;top:-16px;background:var(--color);animation:confettiFall var(--duration,3s) ease-in var(--delay,0s) infinite;}
@keyframes confettiFall{0%{transform:translateY(0) rotate(var(--rot,0deg));opacity:1;}85%{opacity:1;}100%{transform:translateY(106vh) rotate(calc(var(--rot,0deg)+720deg));opacity:0;}}
.cp-win-center{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;text-align:center;padding:clamp(2rem,5vh,4rem) clamp(2rem,5vw,5rem);animation:winnerPop 1s cubic-bezier(.16,1,.3,1) both;}
@keyframes winnerPop{0%{transform:scale(.3) translateY(80px);opacity:0}55%{transform:scale(1.1) translateY(-14px);opacity:1}75%{transform:scale(.97) translateY(6px);}100%{transform:scale(1) translateY(0);opacity:1}}
.cp-win-halo{position:absolute;width:clamp(300px,55vw,700px);height:clamp(300px,55vw,700px);border-radius:50%;background:radial-gradient(circle,rgba(255,200,0,.22) 0%,rgba(255,150,0,.06) 50%,transparent 70%);animation:haloPulse 2s ease-in-out infinite alternate;pointer-events:none;top:50%;left:50%;transform:translate(-50%,-50%);}
@keyframes haloPulse{from{transform:translate(-50%,-50%) scale(1)}to{transform:translate(-50%,-50%) scale(1.25)}}
.cp-win-crown{font-size:clamp(5rem,14vh,10rem);filter:drop-shadow(0 0 40px rgba(255,215,0,1)) drop-shadow(0 0 80px rgba(255,150,0,.8));animation:crownFloat 2s ease-in-out infinite,crownSpin .4s ease-in-out 1;position:relative;z-index:2;margin-bottom:.2rem;}
@keyframes crownFloat{0%,100%{transform:translateY(0) rotate(-4deg) scale(1)}50%{transform:translateY(-18px) rotate(4deg) scale(1.06)}}
@keyframes crownSpin{0%{transform:rotateY(0deg) scale(.2)}60%{transform:rotateY(360deg) scale(1.2)}100%{transform:rotateY(360deg) scale(1)}}
.cp-win-pre{font-family:'Bebas Neue',sans-serif;font-size:clamp(.9rem,2.2vw,1.6rem);letter-spacing:.55em;color:rgba(255,215,0,.7);text-shadow:0 0 20px rgba(255,200,0,.5);margin-bottom:.1rem;animation:labelFadeIn .5s .3s both;}
.cp-win-year{font-family:'Bebas Neue',sans-serif;font-size:clamp(.75rem,1.5vw,1.1rem);letter-spacing:.35em;color:rgba(255,255,255,.35);margin-bottom:clamp(.6rem,1.5vh,1.2rem);animation:labelFadeIn .5s .5s both;}
@keyframes labelFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.cp-win-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(5rem,16vw,14rem);letter-spacing:.12em;line-height:.9;text-shadow:0 0 120px currentColor,0 0 60px currentColor,0 0 20px currentColor;animation:namePulse 1.8s ease-in-out infinite alternate;display:flex;flex-wrap:wrap;justify-content:center;margin-bottom:clamp(.5rem,1.5vh,1.2rem);}
@keyframes namePulse{from{text-shadow:0 0 60px currentColor,0 0 30px currentColor;filter:brightness(1);}to{text-shadow:0 0 160px currentColor,0 0 80px currentColor,0 0 30px #fff;filter:brightness(1.25);}}
.cp-win-char{display:inline-block;animation:charDrop .4s cubic-bezier(.16,1,.3,1) both;}
@keyframes charDrop{0%{transform:translateY(-60px) scale(1.4) rotate(-8deg);opacity:0;}60%{transform:translateY(6px) scale(.96);opacity:1;}100%{transform:translateY(0) scale(1) rotate(0deg);opacity:1;}}
.cp-win-pts{display:flex;align-items:baseline;gap:.5rem;animation:labelFadeIn .5s 1.2s both;margin-bottom:clamp(.5rem,1.5vh,1rem);}
.cp-win-pts-num{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,7vw,6rem);color:#ffd43b;text-shadow:0 0 40px rgba(255,200,0,.8);letter-spacing:.05em;line-height:1;}
.cp-win-pts-label{font-size:clamp(.7rem,1.5vw,1.1rem);font-weight:900;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,215,0,.5);}
.cp-win-stars{position:absolute;inset:0;pointer-events:none;}
.cp-win-star{position:absolute;color:#ffd43b;text-shadow:0 0 12px rgba(255,200,0,.9);transform:translate(-50%,-50%);animation:starOrbit 3s ease-in-out infinite alternate;}
@keyframes starOrbit{0%{opacity:0;transform:translate(-50%,-50%) scale(0);}20%{opacity:1;transform:translate(-50%,-50%) scale(1.3);}80%{opacity:.9;transform:translate(-50%,-50%) scale(.8);}100%{opacity:0;transform:translate(-50%,-50%) scale(0);}}
.cp-win-trophies{display:flex;gap:clamp(6rem,20vw,18rem);position:absolute;top:50%;transform:translateY(-50%);pointer-events:none;}
.cp-win-trophy-l,.cp-win-trophy-r{font-size:clamp(2rem,5vw,4rem);filter:drop-shadow(0 0 16px rgba(255,200,0,.7));animation:trophyBob 2.2s ease-in-out infinite;}
.cp-win-trophy-r{animation-delay:.6s;}
@keyframes trophyBob{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-12px) scale(1.08)}}
.cp-win-sub{font-size:clamp(.9rem,1.8vw,1.3rem);font-weight:700;color:rgba(255,255,255,.5);letter-spacing:.06em;margin-bottom:.8rem;animation:labelFadeIn .5s 1.6s both;}
.cp-winner-close{background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.2);color:rgba(255,255,255,.55);border-radius:99px;padding:.55rem 2rem;font-size:clamp(.8rem,1.2vw,.9rem);font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .2s;letter-spacing:.05em;animation:labelFadeIn .5s 2s both;}
.cp-winner-close:hover{background:rgba(255,255,255,.18);color:#fff;transform:scale(1.04);}

/* ─── WEEK BANNER ───────────────────────────────────── */
.cp-week-banner{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.87);backdrop-filter:blur(14px);}
.cp-week-content{text-align:center;animation:winnerPop .7s cubic-bezier(.16,1,.3,1) both;}
.cp-week-icon{font-size:clamp(3rem,8vh,6rem);animation:floatLogo 3s ease-in-out infinite;}
.cp-week-label{font-size:clamp(.7rem,1.5vw,1rem);font-weight:900;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.45);margin:.5rem 0 .25rem;}
.cp-week-winner{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,10vw,8rem);letter-spacing:.1em;line-height:1;text-shadow:0 0 60px currentColor;animation:namePulse 1.5s ease-in-out infinite alternate;}
.cp-week-pts{font-size:clamp(.85rem,1.8vw,1.3rem);font-weight:700;color:rgba(255,215,0,.8);margin-top:.4rem;}
.cp-week-stars-wrap{position:fixed;inset:0;pointer-events:none;overflow:hidden;}
.cp-week-star{position:absolute;top:-10%;color:#ffd43b;animation:weekStarFall linear infinite;opacity:0;}
@keyframes weekStarFall{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:.7}100%{transform:translateY(110vh) rotate(360deg);opacity:0}}

/* ─── TRANSIZIONI ───────────────────────────────────── */
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
