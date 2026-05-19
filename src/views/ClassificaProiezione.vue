<template>
  <div class="cp-root" @click="handleClick" :class="{ 'cp-finale': phase === 'finale', 'cp-ready': revealStarted }">

    <!-- SCHERMATA SELEZIONE FASE -->
    <transition name="phase-fade">
      <div v-if="showPhaseSelector" class="cp-phase-screen" @click.stop>
        <div class="cp-phase-inner">
          <div class="cp-phase-logo">🏆</div>
          <h1 class="cp-phase-title">Cre Grest</h1>
          <p class="cp-phase-sub">Classifica Proiezione</p>
          <div class="cp-phase-grid">
            <button
              v-for="p in phases"
              :key="p.id"
              class="cp-phase-btn"
              :class="{ 'cp-phase-btn--finale': p.id === 'finale' }"
              @click="selectPhase(p.id)"
            >
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

    <!-- CLASSIFICA PROIEZIONE -->
    <transition name="phase-fade">
      <div v-if="!showPhaseSelector && teams.length" class="cp-stage">

        <!-- Header fisso -->
        <div class="cp-header">
          <div class="cp-header-left">
            <span class="cp-trophy">🏆</span>
            <div>
              <div class="cp-header-title">Cre Grest {{ currentYear }}</div>
              <div class="cp-header-phase">{{ currentPhaseLabel }}</div>
            </div>
          </div>
          <div class="cp-header-right">
            <div v-if="!revealStarted" class="cp-hint">Tocca lo schermo per rivelare</div>
            <div v-else-if="revealedCount < sortedTeams.length" class="cp-hint cp-hint--active">
              {{ revealedCount }}/{{ sortedTeams.length }} squadre rivelate
            </div>
            <div v-else class="cp-hint cp-hint--done">🎉 Classifica completa!</div>
            <button class="cp-back-btn" @click.stop="resetView" title="Torna alla selezione">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </div>

        <!-- Area classifica -->
        <div class="cp-ranking-area">

          <!-- Loading -->
          <div v-if="isLoading" class="cp-loading">
            <div class="cp-spinner"></div>
            <p>Caricamento dati...</p>
          </div>

          <!-- Cards squadre -->
          <template v-else>
            <transition-group name="card-reveal" tag="div" class="cp-cards-container">
              <div
                v-for="team in visibleTeams"
                :key="team.id"
                class="cp-card"
                :class="[
                  'cp-card--' + team.id,
                  {
                    'cp-card--first': team.rank === 1 && revealedCount === sortedTeams.length,
                    'cp-card--podium': team.rank <= 3 && revealedCount === sortedTeams.length
                  }
                ]"
              >
                <!-- Rank badge -->
                <div class="cp-card-rank">
                  <span v-if="team.rank === 1 && revealedCount === sortedTeams.length" class="cp-medal">🥇</span>
                  <span v-else-if="team.rank === 2 && revealedCount === sortedTeams.length" class="cp-medal">🥈</span>
                  <span v-else-if="team.rank === 3 && revealedCount === sortedTeams.length" class="cp-medal">🥉</span>
                  <span v-else class="cp-rank-num">#{{ team.rank }}</span>
                </div>

                <!-- Info squadra -->
                <div class="cp-card-info">
                  <div class="cp-card-name" :class="'cp-name--' + team.id">{{ team.name }}</div>
                  <div class="cp-card-bar-wrap">
                    <div class="cp-card-bar" :class="'cp-bar--' + team.id" :style="{ width: barWidth(team.points) + '%' }"></div>
                  </div>
                </div>

                <!-- Punteggio -->
                <div class="cp-card-score">
                  <span class="cp-score-num" :class="'cp-name--' + team.id">{{ team.points }}</span>
                  <span class="cp-score-unit">pt</span>
                </div>

                <!-- Scintille primo posto finale -->
                <div v-if="team.rank === 1 && revealedCount === sortedTeams.length && phase === 'finale'" class="cp-fireworks">
                  <span v-for="n in 8" :key="n" class="cp-spark" :style="sparkStyle(n)"></span>
                </div>
              </div>
            </transition-group>

            <!-- Stato iniziale -->
            <div v-if="!revealStarted" class="cp-tap-invite">
              <div class="cp-tap-icon">👆</div>
              <div class="cp-tap-text">Tocca per rivelare</div>
              <div class="cp-tap-sub">dal {{ sortedTeams.length }}° al 1° posto</div>
            </div>

            <!-- Finale: vittoria overlay -->
            <transition name="winner-fade">
              <div v-if="revealedCount === sortedTeams.length && phase === 'finale'" class="cp-winner-banner">
                <div class="cp-winner-confetti">
                  <span v-for="n in 20" :key="n" class="cp-confetti" :style="confettiStyle(n)"></span>
                </div>
                <div class="cp-winner-content">
                  <div class="cp-winner-crown">👑</div>
                  <div class="cp-winner-label">CAMPIONE CREGREST {{ currentYear }}</div>
                  <div class="cp-winner-name" :class="'cp-name--' + sortedTeams[0].id">{{ sortedTeams[0].name }}</div>
                  <div class="cp-winner-pts">{{ sortedTeams[0].points }} punti</div>
                </div>
              </div>
            </transition>
          </template>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default {
  name: 'ClassificaProiezione',
  data() {
    return {
      showPhaseSelector: true,
      phase: null,
      isLoading: false,
      revealStarted: false,
      revealedCount: 0,
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
    sortedTeams() {
      return [...this.teams]
        .sort((a, b) => b.points - a.points)
        .map((t, i) => ({ ...t, rank: i + 1 }));
    },
    visibleTeams() {
      if (!this.revealStarted) return [];
      const total = this.sortedTeams.length;
      const start = total - this.revealedCount;
      // Dal peggiore al migliore (ultimo posto prima)
      return this.sortedTeams.slice(start).reverse();
    },
    maxPoints() {
      const pts = this.teams.map(t => t.points);
      return Math.max(...pts, 1);
    },
  },
  methods: {
    getPointsForPhase(teamId) {
      if (!this.pointsData) return 0;
      if (this.phase === 'finale') {
        return this.pointsData[teamId] || 0;
      }
      const weekMap = { settimana1: 'week1', settimana2: 'week2', settimana3: 'week3' };
      const phaseKey = weekMap[this.phase];
      const weekEntries = this.historyData.filter(e => e.phase === phaseKey && e.team === teamId);
      if (weekEntries.length === 0) {
        return this.pointsData[teamId] || 0;
      }
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
      try {
        const [pSnap, hSnap] = await Promise.all([
          getDoc(doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ')),
          getDoc(doc(db, 'points', 'history'))
        ]);
        if (pSnap.exists()) this.pointsData = pSnap.data();
        if (hSnap.exists()) this.historyData = hSnap.data().history || [];
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoading = false;
      }
    },
    handleClick() {
      if (this.showPhaseSelector || this.isLoading) return;
      if (this.revealedCount >= this.sortedTeams.length) return;
      this.revealStarted = true;
      this.revealedCount++;
    },
    resetView() {
      this.showPhaseSelector = true;
      this.phase = null;
      this.revealStarted = false;
      this.revealedCount = 0;
      this.pointsData = null;
      this.historyData = [];
    },
    handleLogout() {
      sessionStorage.removeItem('loggedInUser');
      localStorage.removeItem('loggedInUser');
      this.$router.push('/login');
    },
    sparkStyle(n) {
      const angle = (n / 8) * 360;
      return { '--angle': angle + 'deg', animationDelay: (n * 0.1) + 's' };
    },
    confettiStyle(n) {
      return {
        '--color': ['#ff6b6b','#ffd43b','#51cf66','#74c0fc','#f78cc6','#ffa94d','#fff'][n % 7],
        '--duration': (2 + (n % 3)) + 's',
        '--delay': (n * 0.1) + 's',
        animationDelay: 'var(--delay)',
        animationDuration: 'var(--duration)',
        left: (n * 5) + 'vw',
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
  min-height: 100dvh;
  width: 100%;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  position: relative;
}

/* ══ SELEZIONE FASE ══ */
.cp-phase-screen {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: #050508;
  z-index: 100;
  cursor: default;
}
.cp-phase-inner {
  display: flex; flex-direction: column; align-items: center;
  gap: 1.5rem; padding: 2rem 1.5rem;
  max-width: 480px; width: 100%;
}
.cp-phase-logo {
  font-size: 4rem;
  filter: drop-shadow(0 0 24px rgba(255,215,0,0.7));
  animation: floatLogo 3s ease-in-out infinite;
}
@keyframes floatLogo {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
.cp-phase-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(3rem, 10vw, 5rem);
  letter-spacing: 0.12em;
  color: #fff;
  text-shadow: 0 0 40px rgba(255,215,0,0.35);
  line-height: 1;
}
.cp-phase-sub {
  font-size: 0.85rem; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  margin-top: -0.75rem;
}
.cp-phase-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  width: 100%;
}
.cp-phase-btn {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 1.25rem 1rem;
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  color: #fff; font-family: 'Nunito', sans-serif;
  font-size: 0.9rem; font-weight: 800;
  cursor: pointer; transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.cp-phase-btn:hover, .cp-phase-btn:active {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.3);
  transform: scale(1.03);
}
.cp-phase-btn--finale {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1));
  border-color: rgba(255,215,0,0.4);
  padding: 1.5rem 1rem;
}
.cp-phase-btn--finale:hover, .cp-phase-btn--finale:active {
  background: linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,165,0,0.18));
  border-color: rgba(255,215,0,0.7);
}
.cp-phase-btn-icon { font-size: 1.75rem; }
.cp-phase-btn-label { font-size: 0.88rem; font-weight: 900; letter-spacing: 0.03em; }
.cp-logout-btn {
  display: flex; align-items: center; gap: 0.5rem;
  background: none; border: 1.5px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.35); border-radius: 99px;
  padding: 0.45rem 1rem; font-size: 0.78rem; font-weight: 700;
  cursor: pointer; font-family: 'Nunito', sans-serif;
  transition: all 0.2s; margin-top: 0.5rem;
}
.cp-logout-btn:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.6); }

/* ══ STAGE ══ */
.cp-stage {
  display: flex; flex-direction: column;
  min-height: 100dvh;
  position: relative;
}

/* ── HEADER ── */
.cp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.5rem;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
  z-index: 10;
}
.cp-header-left { display: flex; align-items: center; gap: 0.75rem; }
.cp-trophy { font-size: 1.6rem; filter: drop-shadow(0 0 8px rgba(255,200,0,0.5)); }
.cp-header-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; letter-spacing: 0.1em; color: #fff; line-height: 1.1; }
.cp-header-phase { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
.cp-header-right { display: flex; align-items: center; gap: 0.85rem; }
.cp-hint {
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: rgba(255,255,255,0.3);
  animation: pulse 2s ease-in-out infinite;
}
.cp-hint--active { color: rgba(255,215,0,0.6); animation: none; }
.cp-hint--done { color: rgba(80,200,120,0.8); animation: none; }
@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
.cp-back-btn {
  background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5); border-radius: 10px;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.cp-back-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

/* ── RANKING AREA ── */
.cp-ranking-area {
  flex: 1; display: flex; flex-direction: column;
  justify-content: flex-end;
  padding: 1rem 1.5rem 2rem;
  position: relative;
  overflow: hidden;
}

/* ── LOADING ── */
.cp-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 1rem; flex: 1;
  color: rgba(255,255,255,0.4);
}
.cp-spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: rgba(255,215,0,0.6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── TAP INVITE ── */
.cp-tap-invite {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.75rem;
  flex: 1; padding: 2rem;
  color: rgba(255,255,255,0.25);
}
.cp-tap-icon { font-size: 3rem; animation: tapBounce 1.6s ease-in-out infinite; }
@keyframes tapBounce {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-12px); }
}
.cp-tap-text { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2rem, 6vw, 3.5rem); letter-spacing: 0.15em; color: rgba(255,255,255,0.2); }
.cp-tap-sub { font-size: 0.82rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }

/* ── CARDS CONTAINER ── */
.cp-cards-container {
  display: flex; flex-direction: column-reverse;
  gap: 0.6rem; width: 100%; max-width: 780px; margin: 0 auto;
}

/* ── CARD ── */
.cp-card {
  display: flex; align-items: center; gap: 1rem;
  background: #0f0f1a;
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 18px;
  padding: 1rem 1.25rem;
  position: relative; overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.16,1,0.3,1),
              box-shadow 0.4s cubic-bezier(0.16,1,0.3,1),
              background 0.4s;
}
.cp-card--rossi     { border-color: rgba(220,53,69,0.4); }
.cp-card--verdi     { border-color: rgba(40,167,69,0.4); }
.cp-card--arancioni { border-color: rgba(253,126,20,0.4); }
.cp-card--blu       { border-color: rgba(0,123,255,0.4); }
.cp-card--fucsia    { border-color: rgba(232,62,140,0.4); }
.cp-card--gialli    { border-color: rgba(200,150,12,0.4); }
.cp-card--podium { background: rgba(255,255,255,0.06); }
.cp-card--first {
  background: rgba(255,215,0,0.08);
  border-color: rgba(255,215,0,0.5);
  box-shadow: 0 0 40px rgba(255,215,0,0.15), inset 0 0 20px rgba(255,215,0,0.05);
  transform: scale(1.02);
}

/* ── RANK BADGE ── */
.cp-card-rank { flex-shrink: 0; width: 48px; text-align: center; font-size: 1.6rem; line-height: 1; }
.cp-rank-num { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; color: rgba(255,255,255,0.2); letter-spacing: 0.05em; }
.cp-medal { font-size: 2rem; }

/* ── CARD INFO ── */
.cp-card-info { flex: 1; min-width: 0; }
.cp-card-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  letter-spacing: 0.08em; line-height: 1.1;
  margin-bottom: 0.35rem;
}
.cp-card-bar-wrap { height: 5px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; }
.cp-card-bar { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(0.16,1,0.3,1); }

/* ── SCORE ── */
.cp-card-score { flex-shrink: 0; text-align: right; }
.cp-score-num { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2rem, 5vw, 3rem); letter-spacing: 0.04em; line-height: 1; }
.cp-score-unit { display: block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-top: 0.1rem; }

/* ── COLORI TESTO SQUADRA ── */
.cp-name--rossi     { color: #ff6b6b; }
.cp-name--verdi     { color: #51cf66; }
.cp-name--arancioni { color: #ffa94d; }
.cp-name--blu       { color: #74c0fc; }
.cp-name--fucsia    { color: #f78cc6; }
.cp-name--gialli    { color: #ffd43b; }

/* ── COLORI BARRA ── */
.cp-bar--rossi     { background: linear-gradient(90deg, #DC3545, #ff6b6b); }
.cp-bar--verdi     { background: linear-gradient(90deg, #28A745, #51cf66); }
.cp-bar--arancioni { background: linear-gradient(90deg, #FD7E14, #ffa94d); }
.cp-bar--blu       { background: linear-gradient(90deg, #007BFF, #74c0fc); }
.cp-bar--fucsia    { background: linear-gradient(90deg, #E83E8C, #f78cc6); }
.cp-bar--gialli    { background: linear-gradient(90deg, #c8960c, #ffd43b); }

/* ── ANIMAZIONE REVEAL ── */
.card-reveal-enter-active { transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.card-reveal-enter-from { opacity: 0; transform: translateY(60px) scale(0.92); }
.card-reveal-leave-active { transition: opacity 0.3s; }
.card-reveal-leave-to { opacity: 0; }

/* ── WINNER BANNER ── */
.cp-winner-banner {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(12px);
  pointer-events: none;
}
.cp-winner-content { text-align: center; animation: winnerPop 0.8s cubic-bezier(0.16,1,0.3,1) both; }
@keyframes winnerPop {
  from { transform: scale(0.7); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
.cp-winner-crown { font-size: 5rem; filter: drop-shadow(0 0 30px rgba(255,215,0,0.8)); animation: floatLogo 3s ease-in-out infinite; }
.cp-winner-label {
  font-size: clamp(0.75rem, 2vw, 1rem);
  font-weight: 900; letter-spacing: 0.3em;
  text-transform: uppercase; color: rgba(255,255,255,0.5);
  margin: 0.5rem 0;
}
.cp-winner-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(3.5rem, 12vw, 8rem);
  letter-spacing: 0.1em; line-height: 1;
  text-shadow: 0 0 60px currentColor;
}
.cp-winner-pts { font-size: clamp(1rem, 3vw, 1.5rem); font-weight: 700; color: rgba(255,215,0,0.8); margin-top: 0.5rem; }

/* ── CONFETTI ── */
.cp-winner-confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
.cp-confetti {
  position: absolute; top: -10px;
  width: 10px; height: 10px;
  background: var(--color);
  border-radius: 2px;
  animation: confettiFall var(--duration, 3s) ease-in var(--delay, 0s) infinite;
}
@keyframes confettiFall {
  0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
}

/* ── FIREWORKS ── */
.cp-fireworks { position: absolute; inset: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.cp-spark {
  position: absolute; width: 6px; height: 6px;
  border-radius: 50%; background: #ffd43b;
  animation: sparkFly 1.2s ease-out infinite;
  --angle: 0deg;
}
@keyframes sparkFly {
  0%   { transform: rotate(var(--angle)) translateX(0) scale(1); opacity: 1; }
  100% { transform: rotate(var(--angle)) translateX(80px) scale(0); opacity: 0; }
}

/* ── TRANSITIONS ── */
.phase-fade-enter-active, .phase-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1);
}
.phase-fade-enter-from { opacity: 0; transform: scale(1.03); }
.phase-fade-leave-to   { opacity: 0; transform: scale(0.97); position: absolute; inset: 0; }
.winner-fade-enter-active { transition: opacity 0.5s ease; }
.winner-fade-enter-from   { opacity: 0; }
</style>
