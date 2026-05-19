<template>
  <div class="cp-root" @click="handleClick" :class="{ 'cp-finale': phase === 'finale' }">

    <!-- SCHERMATA SELEZIONE FASE -->
    <transition name="phase-fade">
      <div v-if="showPhaseSelector" class="cp-phase-screen" @click.stop>
        <div class="cp-phase-inner">
          <div class="cp-phase-logo">🏆</div>
          <h1 class="cp-phase-title">Cre Grest</h1>
          <p class="cp-phase-sub">Classifica Proiezione</p>
          <div class="cp-phase-grid">
            <button v-for="p in phases" :key="p.id" class="cp-phase-btn" :class="{ 'cp-phase-btn--finale': p.id === 'finale' }" @click="selectPhase(p.id)">
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

    <!-- CLASSIFICA -->
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
            <div v-if="!revealStarted" class="cp-hint">Tocca per rivelare</div>
            <div v-else-if="revealedCount < sortedTeams.length" class="cp-hint cp-hint--active">{{ revealedCount }}/{{ sortedTeams.length }}</div>
            <div v-else class="cp-hint cp-hint--done">🎉 Completata!</div>
            <button class="cp-back-btn" @click.stop="resetView">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </div>

        <div class="cp-ranking-area">

          <transition name="fade">
            <div v-if="!revealStarted" class="cp-tap-invite">
              <div class="cp-tap-icon">👆</div>
              <div class="cp-tap-text">Tocca per rivelare</div>
              <div class="cp-tap-sub">dal 6° al 1° posto</div>
            </div>
          </transition>

          <!-- Cards: mostrate in ordine 6°→1° (sortedTeams al contrario) -->
          <div class="cp-cards-container">
            <div class="cp-cards-inner">
              <!-- Mostriamo le ultime N squadre della lista sortedTeams (dal fondo = dal 6° al 1°) -->
              <template v-for="team in displayedTeams" :key="team.id">
                <div
                  class="cp-card"
                  :class="[
                    'cp-card--' + team.id,
                    {
                      'cp-card--winner': team.rank === 1 && revealedCount === sortedTeams.length,
                      'cp-card--podium': team.rank <= 3 && revealedCount === sortedTeams.length && phase === 'finale',
                      'cp-card--shaking': shakingCards.has(team.id),
                      'cp-card--crazy': crazyActive && team.rank === 1,
                    }
                  ]"
                >
                  <!-- Overlay shake bianco -->
                  <div v-if="shakingCards.has(team.id)" class="cp-card-shake-overlay"></div>

                  <!-- Rank -->
                  <div class="cp-card-rank">
                    <span v-if="revealedCount === sortedTeams.length && team.rank === 1" class="cp-medal">🥇</span>
                    <span v-else-if="revealedCount === sortedTeams.length && team.rank === 2" class="cp-medal">🥈</span>
                    <span v-else-if="revealedCount === sortedTeams.length && team.rank === 3" class="cp-medal">🥉</span>
                    <span v-else class="cp-rank-num">#{{ team.rank }}</span>
                  </div>

                  <!-- Info -->
                  <div class="cp-card-info">
                    <div class="cp-card-name" :class="'cp-name--' + team.id">{{ team.name }}</div>
                    <div class="cp-card-bar-wrap">
                      <div class="cp-card-bar" :class="'cp-bar--' + team.id" :style="{ width: shakingCards.has(team.id) ? '0%' : barWidth(team.points) + '%' }"></div>
                    </div>
                  </div>

                  <!-- Score -->
                  <div class="cp-card-score">
                    <span v-if="shakingCards.has(team.id)" class="cp-score-num cp-score-hidden">???</span>
                    <span v-else class="cp-score-num" :class="'cp-name--' + team.id">{{ team.points }}</span>
                    <span class="cp-score-unit">pt</span>
                  </div>

                  <!-- Scintille 1° posto (finale) -->
                  <div v-if="phase === 'finale' && team.rank === 1 && revealedCount === sortedTeams.length && !shakingCards.has(team.id)" class="cp-sparks">
                    <span v-for="n in 10" :key="n" class="cp-spark" :style="sparkStyle(n)"></span>
                  </div>

                  <!-- Stelle 1° posto (settimana) -->
                  <div v-if="phase !== 'finale' && team.rank === 1 && revealedCount === sortedTeams.length && !shakingCards.has(team.id)" class="cp-stars">
                    <span v-for="n in 5" :key="n" class="cp-star" :style="starStyle(n)">✦</span>
                  </div>

                  <!-- Crazy burst (1° posto) -->
                  <div v-if="crazyActive && team.rank === 1" class="cp-crazy-burst">
                    <span v-for="n in 16" :key="n" class="cp-burst-particle" :style="burstStyle(n)"></span>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Winner banner finale -->
          <transition name="winner-fade">
            <div v-if="revealedCount === sortedTeams.length && phase === 'finale' && !winnerClosed" class="cp-winner-banner" @click.stop>
              <div class="cp-confetti-wrap">
                <span v-for="n in 30" :key="n" class="cp-confetto" :style="confettiStyle(n)"></span>
              </div>
              <div class="cp-winner-content">
                <div class="cp-winner-crown">👑</div>
                <div class="cp-winner-label">CAMPIONE CREGREST {{ currentYear }}</div>
                <div class="cp-winner-name" :class="'cp-name--' + sortedTeams[0].id">{{ sortedTeams[0].name }}</div>
                <div class="cp-winner-pts">{{ sortedTeams[0].points }} punti</div>
                <button class="cp-winner-close" @click="winnerClosed = true">Chiudi</button>
              </div>
            </div>
          </transition>

          <!-- Week banner settimana -->
          <transition name="winner-fade">
            <div v-if="revealedCount === sortedTeams.length && phase !== 'finale' && !weekBannerClosed" class="cp-week-banner" @click.stop>
              <div class="cp-week-stars">
                <span v-for="n in 14" :key="n" class="cp-week-star" :style="weekStarStyle(n)">★</span>
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

        </div>
      </div>
    </transition>

    <!-- Loading -->
    <transition name="fade">
      <div v-if="isLoading" class="cp-loading-overlay">
        <div class="cp-spinner"></div>
        <p>Caricamento...</p>
      </div>
    </transition>

  </div>
</template>

<script>
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const SHAKE_DURATION = 2200;   // ms shake bianco
const CRAZY_DURATION = 3500;   // ms animazione crazy 1° posto

export default {
  name: 'ClassificaProiezione',
  data() {
    return {
      showPhaseSelector: true,
      phase: null,
      isLoading: false,
      revealStarted: false,
      // quante squadre sono state rivelate (incluse quelle in shake)
      revealedCount: 0,
      // set degli id di squadre attualmente in shake
      shakingCards: new Set(),
      // se il 1° posto sta facendo la crazy animation
      crazyActive: false,
      winnerClosed: false,
      weekBannerClosed: false,
      // blocco click mentre una card sta shakando
      isRevealing: false,
      currentYear: new Date().getFullYear(),
      phases: [
        { id: 'settimana1', label: '1ª Settimana', icon: '1️⃣' },
        { id: 'settimana2', label: '2ª Settimana', icon: '2️⃣' },
        { id: 'settimana3', label: '3ª Settimana', icon: '3️⃣' },
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
      return this.allTeams.map(t => ({
        ...t,
        points: this.getPointsForPhase(t.id)
      }));
    },
    // sortedTeams: rank 1 = index 0 (il migliore)
    sortedTeams() {
      return [...this.teams]
        .sort((a, b) => b.points - a.points)
        .map((t, i) => ({ ...t, rank: i + 1 }));
    },
    // displayedTeams: le ultime revealedCount squadre della lista sortata
    // sortedTeams[5]=6°, [4]=5°, ... [0]=1°
    // dopo 1 click mostriamo il 6° (index 5)
    // dopo 2 click mostriamo 6° e 5° (index 5,4) — ma li vogliamo in ordine 6° in cima, 1° in fondo
    displayedTeams() {
      if (!this.revealStarted || this.revealedCount === 0) return [];
      const total = this.sortedTeams.length;
      // prendiamo dal fondo della lista: primo reveal = ultimo elemento
      const slice = this.sortedTeams.slice(total - this.revealedCount);
      // ordine visivo: 6° in cima → 1° in fondo (ordine rank decrescente = slice già OK)
      return slice.slice().reverse();
    },
    maxPoints() {
      const pts = this.teams.map(t => t.points);
      return Math.max(...pts, 1);
    },
  },
  methods: {
    getPointsForPhase(teamId) {
      if (!this.pointsData) return 0;
      if (this.phase === 'finale') return this.pointsData[teamId] || 0;
      const weekMap = { settimana1: 'week1', settimana2: 'week2', settimana3: 'week3' };
      const phaseKey = weekMap[this.phase];
      const weekEntries = this.historyData.filter(e => e.phase === phaseKey && e.team === teamId);
      if (weekEntries.length === 0) return this.pointsData[teamId] || 0;
      return weekEntries.reduce((sum, e) => sum + (e.points || 0), 0);
    },
    barWidth(pts) {
      return Math.max(6, Math.round((pts / this.maxPoints) * 100));
    },
    async selectPhase(phaseId) {
      this.phase = phaseId;
      this.isLoading = true;
      this.showPhaseSelector = false;
      this.revealStarted = false;
      this.revealedCount = 0;
      this.shakingCards = new Set();
      this.crazyActive = false;
      this.winnerClosed = false;
      this.weekBannerClosed = false;
      this.isRevealing = false;
      try {
        const [pSnap, hSnap] = await Promise.all([
          getDoc(doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ')),
          getDoc(doc(db, 'points', 'history'))
        ]);
        if (pSnap.exists()) this.pointsData = pSnap.data();
        if (hSnap.exists()) this.historyData = hSnap.data().history || [];
      } catch (e) { console.error(e); }
      finally { this.isLoading = false; }
    },
    handleClick() {
      if (this.showPhaseSelector || this.isLoading) return;
      if (this.isRevealing) return;                          // blocca durante shake
      if (this.revealedCount >= this.sortedTeams.length) return;

      this.isRevealing = true;
      this.revealStarted = true;
      this.revealedCount++;

      const total = this.sortedTeams.length;
      // la squadra appena rivelata è quella al posto (total - revealedCount) nella lista sortata
      const team = this.sortedTeams[total - this.revealedCount];
      const isFirst = team.rank === 1;

      // aggiungi al set delle shaking
      this.shakingCards = new Set([...this.shakingCards, team.id]);

      const shakeDur = isFirst ? CRAZY_DURATION : SHAKE_DURATION;

      setTimeout(() => {
        // rimuovi dallo shake set → reveal nome e punti
        const next = new Set(this.shakingCards);
        next.delete(team.id);
        this.shakingCards = next;

        if (isFirst) {
          this.crazyActive = true;
          setTimeout(() => { this.crazyActive = false; }, 2800);
        }

        this.isRevealing = false;
      }, shakeDur);
    },
    resetView() {
      this.showPhaseSelector = true;
      this.phase = null;
      this.revealStarted = false;
      this.revealedCount = 0;
      this.shakingCards = new Set();
      this.crazyActive = false;
      this.pointsData = null;
      this.historyData = [];
      this.winnerClosed = false;
      this.weekBannerClosed = false;
      this.isRevealing = false;
    },
    handleLogout() {
      sessionStorage.removeItem('loggedInUser');
      localStorage.removeItem('loggedInUser');
      this.$router.push('/login');
    },
    sparkStyle(n) {
      const angle = (n / 10) * 360;
      return { '--angle': angle + 'deg', animationDelay: (n * 0.1) + 's' };
    },
    starStyle(n) {
      return {
        '--x': (-50 + n * 25) + 'px',
        '--y': (-20 - (n % 3) * 15) + 'px',
        animationDelay: (n * 0.15) + 's',
        fontSize: (0.8 + (n % 2) * 0.5) + 'rem',
      };
    },
    burstStyle(n) {
      const angle = (n / 16) * 360;
      const colors = ['#ffd43b','#ff6b6b','#51cf66','#74c0fc','#f78cc6','#ffa94d'];
      return {
        '--angle': angle + 'deg',
        '--color': colors[n % colors.length],
        animationDelay: (n * 0.05) + 's',
      };
    },
    weekStarStyle(n) {
      return {
        left: ((n / 14) * 100) + '%',
        animationDelay: (n * 0.1) + 's',
        animationDuration: (2 + (n % 3) * 0.5) + 's',
        fontSize: (0.8 + (n % 3) * 0.4) + 'rem',
      };
    },
    confettiStyle(n) {
      return {
        '--color': ['#ff6b6b','#ffd43b','#51cf66','#74c0fc','#f78cc6','#ffa94d','#fff'][n % 7],
        '--duration': (2 + (n % 3)) + 's',
        '--delay': (n * 0.07) + 's',
        animationDelay: 'var(--delay)',
        animationDuration: 'var(--duration)',
        left: ((n / 30) * 100) + 'vw',
      };
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Bebas+Neue&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.cp-root {
  font-family: 'Nunito', sans-serif;
  background: #050508;
  color: #fff;
  height: 100dvh; width: 100%;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  position: relative;
  display: flex; flex-direction: column;
}

/* ── FASE SELECTOR ──────────────────────────────────── */
.cp-phase-screen {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: #050508; z-index: 100; cursor: default;
}
.cp-phase-inner {
  display: flex; flex-direction: column; align-items: center;
  gap: 1.2rem; padding: 2rem 1.5rem;
  max-width: 460px; width: 100%;
}
.cp-phase-logo { font-size: 3.5rem; filter: drop-shadow(0 0 24px rgba(255,215,0,.7)); animation: floatLogo 3s ease-in-out infinite; }
@keyframes floatLogo { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.cp-phase-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(2.5rem,9vw,4.5rem); letter-spacing:.12em; color:#fff; text-shadow:0 0 40px rgba(255,215,0,.35); line-height:1; }
.cp-phase-sub { font-size:.82rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.4); margin-top:-.6rem; }
.cp-phase-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; width:100%; }
.cp-phase-btn { display:flex; flex-direction:column; align-items:center; gap:.4rem; padding:1.1rem .75rem; background:rgba(255,255,255,.05); border:1.5px solid rgba(255,255,255,.1); border-radius:18px; color:#fff; font-family:'Nunito',sans-serif; font-size:.85rem; font-weight:800; cursor:pointer; transition:all .2s; -webkit-tap-highlight-color:transparent; }
.cp-phase-btn:hover,.cp-phase-btn:active { background:rgba(255,255,255,.12); border-color:rgba(255,255,255,.3); transform:scale(1.03); }
.cp-phase-btn--finale { grid-column:1/-1; background:linear-gradient(135deg,rgba(255,215,0,.15),rgba(255,165,0,.1)); border-color:rgba(255,215,0,.4); padding:1.3rem .75rem; }
.cp-phase-btn--finale:hover,.cp-phase-btn--finale:active { background:linear-gradient(135deg,rgba(255,215,0,.25),rgba(255,165,0,.18)); border-color:rgba(255,215,0,.7); }
.cp-phase-btn-icon { font-size:1.5rem; }
.cp-phase-btn-label { font-size:.82rem; font-weight:900; letter-spacing:.03em; }
.cp-logout-btn { display:flex; align-items:center; gap:.5rem; background:none; border:1.5px solid rgba(255,255,255,.12); color:rgba(255,255,255,.35); border-radius:99px; padding:.4rem 1rem; font-size:.75rem; font-weight:700; cursor:pointer; font-family:'Nunito',sans-serif; transition:all .2s; }
.cp-logout-btn:hover { border-color:rgba(255,255,255,.3); color:rgba(255,255,255,.6); }

/* ── STAGE ──────────────────────────────────────────── */
.cp-stage { display:flex; flex-direction:column; height:100dvh; overflow:hidden; }

.cp-header { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1.2rem; background:rgba(255,255,255,.03); border-bottom:1px solid rgba(255,255,255,.07); flex-shrink:0; }
.cp-header-left { display:flex; align-items:center; gap:.6rem; }
.cp-trophy { font-size:1.4rem; filter:drop-shadow(0 0 6px rgba(255,200,0,.5)); }
.cp-header-title { font-family:'Bebas Neue',sans-serif; font-size:1.25rem; letter-spacing:.1em; line-height:1.1; }
.cp-header-phase { font-size:.65rem; font-weight:800; letter-spacing:.15em; text-transform:uppercase; color:rgba(255,255,255,.4); }
.cp-header-right { display:flex; align-items:center; gap:.75rem; }
.cp-hint { font-size:.68rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:rgba(255,255,255,.3); animation:pulse 2s ease-in-out infinite; }
.cp-hint--active { color:rgba(255,215,0,.6); animation:none; }
.cp-hint--done { color:rgba(80,200,120,.8); animation:none; }
@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:.9} }
.cp-back-btn { background:rgba(255,255,255,.07); border:1.5px solid rgba(255,255,255,.1); color:rgba(255,255,255,.5); border-radius:9px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .2s; }
.cp-back-btn:hover { background:rgba(255,255,255,.14); color:#fff; }

.cp-ranking-area { flex:1; display:flex; flex-direction:column; justify-content:center; padding:.6rem 1rem; position:relative; overflow:hidden; min-height:0; }

/* TAP INVITE */
.cp-tap-invite { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.5rem; color:rgba(255,255,255,.22); pointer-events:none; }
.cp-tap-icon { font-size:2.5rem; animation:tapBounce 1.6s ease-in-out infinite; }
@keyframes tapBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.cp-tap-text { font-family:'Bebas Neue',sans-serif; font-size:clamp(1.8rem,5vw,3rem); letter-spacing:.15em; }
.cp-tap-sub { font-size:.78rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }

/* CARDS */
.cp-cards-container { width:100%; max-width:760px; margin:0 auto; display:flex; flex-direction:column; }
.cp-cards-inner { display:flex; flex-direction:column; gap:.45rem; }

.cp-card {
  display:flex; align-items:center; gap:.75rem;
  background:#0f0f1a;
  border:1.5px solid rgba(255,255,255,.09);
  border-radius:14px;
  padding:.6rem .9rem;
  position:relative; overflow:hidden;
  transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s, background .4s;
}
.cp-card--rossi     { border-color:rgba(220,53,69,.4); }
.cp-card--verdi     { border-color:rgba(40,167,69,.4); }
.cp-card--arancioni { border-color:rgba(253,126,20,.4); }
.cp-card--blu       { border-color:rgba(0,123,255,.4); }
.cp-card--fucsia    { border-color:rgba(232,62,140,.4); }
.cp-card--gialli    { border-color:rgba(200,150,12,.4); }

/* SHAKE: la card trema e ha overlay bianco */
.cp-card--shaking {
  animation: cardShake .18s ease-in-out infinite;
  background: #1a1a2e !important;
  border-color: rgba(255,255,255,.5) !important;
}
@keyframes cardShake {
  0%   { transform: translateX(0)   rotate(0deg); }
  20%  { transform: translateX(-6px) rotate(-.8deg); }
  40%  { transform: translateX(6px)  rotate(.8deg); }
  60%  { transform: translateX(-4px) rotate(-.5deg); }
  80%  { transform: translateX(4px)  rotate(.5deg); }
  100% { transform: translateX(0)   rotate(0deg); }
}

/* OVERLAY bianco pulsante durante shake */
.cp-card-shake-overlay {
  position:absolute; inset:0; border-radius:14px;
  background: rgba(255,255,255,.12);
  animation: overlayPulse .4s ease-in-out infinite alternate;
  pointer-events:none; z-index:2;
}
@keyframes overlayPulse { from{opacity:.05} to{opacity:.25} }

/* CRAZY: 1° posto — glow pulsante intenso + shake violento */
.cp-card--crazy {
  animation: crazyShake .1s ease-in-out infinite !important;
  border-color: rgba(255,215,0,.9) !important;
  box-shadow: 0 0 40px rgba(255,215,0,.5), 0 0 80px rgba(255,215,0,.2), inset 0 0 20px rgba(255,215,0,.08) !important;
  background: #1a1500 !important;
  z-index: 10;
}
@keyframes crazyShake {
  0%   { transform: translateX(0)    rotate(0deg)    scale(1); }
  10%  { transform: translateX(-10px) rotate(-1.5deg) scale(1.02); }
  20%  { transform: translateX(10px)  rotate(1.5deg)  scale(0.98); }
  30%  { transform: translateX(-8px)  rotate(-1deg)   scale(1.03); }
  40%  { transform: translateX(8px)   rotate(1deg)    scale(0.97); }
  50%  { transform: translateX(-5px)  rotate(-.5deg)  scale(1.01); }
  60%  { transform: translateX(5px)   rotate(.5deg)   scale(1); }
  70%  { transform: translateX(-3px)  rotate(-.3deg)  scale(1.02); }
  80%  { transform: translateX(3px)   rotate(.3deg)   scale(0.99); }
  100% { transform: translateX(0)    rotate(0deg)    scale(1); }
}

/* WINNER card */
.cp-card--winner {
  background: rgba(255,215,0,.08);
  border-color: rgba(255,215,0,.5) !important;
  box-shadow: 0 0 32px rgba(255,215,0,.12), inset 0 0 16px rgba(255,215,0,.04);
  transform: scale(1.015);
}
.cp-card--podium { background:rgba(255,255,255,.05); }

/* RANK */
.cp-card-rank { flex-shrink:0; width:40px; text-align:center; }
.cp-rank-num { font-family:'Bebas Neue',sans-serif; font-size:1.5rem; color:rgba(255,255,255,.2); letter-spacing:.05em; }
.cp-medal { font-size:1.6rem; }

/* INFO */
.cp-card-info { flex:1; min-width:0; }
.cp-card-name { font-family:'Bebas Neue',sans-serif; font-size:clamp(1.2rem,3vw,1.8rem); letter-spacing:.08em; line-height:1; margin-bottom:.25rem; }
.cp-card-bar-wrap { height:4px; background:rgba(255,255,255,.07); border-radius:99px; overflow:hidden; }
.cp-card-bar { height:100%; border-radius:99px; transition:width 1s cubic-bezier(.16,1,.3,1); }

/* SCORE */
.cp-card-score { flex-shrink:0; text-align:right; }
.cp-score-num { font-family:'Bebas Neue',sans-serif; font-size:clamp(1.6rem,4vw,2.4rem); letter-spacing:.04em; line-height:1; }
.cp-score-hidden { color:rgba(255,255,255,.15) !important; filter:blur(4px); }
.cp-score-unit { display:block; font-size:.62rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.3); }

/* COLORI */
.cp-name--rossi     { color:#ff6b6b; }
.cp-name--verdi     { color:#51cf66; }
.cp-name--arancioni { color:#ffa94d; }
.cp-name--blu       { color:#74c0fc; }
.cp-name--fucsia    { color:#f78cc6; }
.cp-name--gialli    { color:#ffd43b; }
.cp-bar--rossi      { background:linear-gradient(90deg,#DC3545,#ff6b6b); }
.cp-bar--verdi      { background:linear-gradient(90deg,#28A745,#51cf66); }
.cp-bar--arancioni  { background:linear-gradient(90deg,#FD7E14,#ffa94d); }
.cp-bar--blu        { background:linear-gradient(90deg,#007BFF,#74c0fc); }
.cp-bar--fucsia     { background:linear-gradient(90deg,#E83E8C,#f78cc6); }
.cp-bar--gialli     { background:linear-gradient(90deg,#c8960c,#ffd43b); }

/* SCINTILLE (finale 1°) */
.cp-sparks { position:absolute; inset:0; pointer-events:none; display:flex; align-items:center; justify-content:center; overflow:visible; }
.cp-spark { position:absolute; width:5px; height:5px; border-radius:50%; background:#ffd43b; animation:sparkFly 1.2s ease-out infinite; --angle:0deg; }
@keyframes sparkFly { 0%{transform:rotate(var(--angle)) translateX(0) scale(1);opacity:1} 100%{transform:rotate(var(--angle)) translateX(70px) scale(0);opacity:0} }

/* STELLE (settimana 1°) */
.cp-stars { position:absolute; right:.5rem; top:50%; transform:translateY(-50%); pointer-events:none; }
.cp-star { position:absolute; color:#ffd43b; animation:starPop .8s cubic-bezier(.16,1,.3,1) both,starFade 1.5s ease-in-out .5s infinite alternate; transform:translate(var(--x,0),var(--y,0)); }
@keyframes starPop  { from{transform:translate(var(--x,0),var(--y,0)) scale(0)} to{transform:translate(var(--x,0),var(--y,0)) scale(1)} }
@keyframes starFade { from{opacity:1} to{opacity:.4} }

/* CRAZY BURST PARTICLES */
.cp-crazy-burst { position:absolute; inset:0; pointer-events:none; display:flex; align-items:center; justify-content:center; overflow:visible; z-index:5; }
.cp-burst-particle {
  position:absolute; width:8px; height:8px;
  border-radius:50%;
  background: var(--color, #ffd43b);
  animation: burstFly 0.9s cubic-bezier(.16,1,.3,1) var(--delay, 0s) both;
  --angle: 0deg;
}
@keyframes burstFly {
  0%   { transform: rotate(var(--angle)) translateX(0)     scale(1.5); opacity:1; }
  60%  { opacity: 1; }
  100% { transform: rotate(var(--angle)) translateX(120px)  scale(0);   opacity:0; }
}

/* LOADING */
.cp-loading-overlay { position:fixed; inset:0; z-index:200; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; background:#050508; color:rgba(255,255,255,.4); }
.cp-spinner { width:34px; height:34px; border:3px solid rgba(255,255,255,.1); border-top-color:rgba(255,215,0,.6); border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }

/* WINNER BANNER */
.cp-winner-banner { position:fixed; inset:0; z-index:200; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.88); backdrop-filter:blur(14px); }
.cp-winner-content { text-align:center; animation:winnerPop .8s cubic-bezier(.16,1,.3,1) both; }
@keyframes winnerPop { from{transform:scale(.7);opacity:0} to{transform:scale(1);opacity:1} }
.cp-winner-crown { font-size:4.5rem; filter:drop-shadow(0 0 30px rgba(255,215,0,.8)); animation:floatLogo 3s ease-in-out infinite; }
.cp-winner-label { font-size:clamp(.7rem,1.8vw,.95rem); font-weight:900; letter-spacing:.3em; text-transform:uppercase; color:rgba(255,255,255,.45); margin:.5rem 0 .25rem; }
.cp-winner-name { font-family:'Bebas Neue',sans-serif; font-size:clamp(3rem,11vw,7.5rem); letter-spacing:.1em; line-height:1; text-shadow:0 0 60px currentColor; }
.cp-winner-pts { font-size:clamp(.9rem,2.5vw,1.4rem); font-weight:700; color:rgba(255,215,0,.8); margin-top:.4rem; }
.cp-winner-close { margin-top:1.5rem; background:rgba(255,255,255,.1); border:1.5px solid rgba(255,255,255,.2); color:rgba(255,255,255,.6); border-radius:99px; padding:.5rem 1.5rem; font-size:.82rem; font-weight:800; cursor:pointer; font-family:'Nunito',sans-serif; transition:all .2s; letter-spacing:.05em; }
.cp-winner-close:hover { background:rgba(255,255,255,.18); color:#fff; }

/* WEEK BANNER */
.cp-week-banner { position:fixed; inset:0; z-index:200; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.82); backdrop-filter:blur(10px); }
.cp-week-content { text-align:center; animation:winnerPop .7s cubic-bezier(.16,1,.3,1) both; }
.cp-week-icon { font-size:3.5rem; animation:floatLogo 3s ease-in-out infinite; }
.cp-week-label { font-size:clamp(.7rem,1.8vw,.95rem); font-weight:900; letter-spacing:.25em; text-transform:uppercase; color:rgba(255,255,255,.45); margin:.4rem 0 .2rem; }
.cp-week-winner { font-family:'Bebas Neue',sans-serif; font-size:clamp(2.5rem,9vw,6rem); letter-spacing:.1em; line-height:1; text-shadow:0 0 40px currentColor; }
.cp-week-pts { font-size:clamp(.85rem,2vw,1.2rem); font-weight:700; color:rgba(255,215,0,.7); margin-top:.3rem; }
.cp-week-stars { position:fixed; inset:0; pointer-events:none; overflow:hidden; }
.cp-week-star { position:absolute; top:-10%; color:#ffd43b; animation:weekStarFall linear infinite; opacity:0; }
@keyframes weekStarFall { 0%{transform:translateY(0) rotate(0deg);opacity:0} 10%{opacity:1} 90%{opacity:.7} 100%{transform:translateY(110vh) rotate(360deg);opacity:0} }

/* CONFETTI */
.cp-confetti-wrap { position:fixed; inset:0; pointer-events:none; overflow:hidden; }
.cp-confetto { position:absolute; top:-10px; width:9px; height:9px; background:var(--color); border-radius:2px; animation:confettiFall var(--duration,3s) ease-in var(--delay,0s) infinite; }
@keyframes confettiFall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(105vh) rotate(720deg);opacity:0} }

/* TRANSITIONS */
.phase-fade-enter-active,.phase-fade-leave-active { transition:opacity .4s ease,transform .4s cubic-bezier(.16,1,.3,1); }
.phase-fade-enter-from { opacity:0; transform:scale(1.03); }
.phase-fade-leave-to { opacity:0; transform:scale(.97); position:absolute; inset:0; }
.fade-enter-active,.fade-leave-active { transition:opacity .3s ease; }
.fade-enter-from,.fade-leave-to { opacity:0; }
.winner-fade-enter-active { transition:opacity .5s ease; }
.winner-fade-enter-from { opacity:0; }
.winner-fade-leave-active { transition:opacity .3s ease; }
.winner-fade-leave-to { opacity:0; }
</style>
