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

        <!-- HEADER -->
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
            <div v-else-if="revealedCount < sortedTeams.length" class="cp-hint cp-hint--active">
              {{ sortedTeams.length - revealedCount }} rimanenti
            </div>
            <div v-else class="cp-hint cp-hint--done">🎉 Completata!</div>
            <button class="cp-back-btn" @click.stop="resetView">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </div>

        <!-- AREA RANKING -->
        <div class="cp-ranking-area">

          <!-- Invite iniziale -->
          <transition name="fade">
            <div v-if="!revealStarted" class="cp-tap-invite">
              <div class="cp-tap-icon">🖱️</div>
              <div class="cp-tap-text">Clicca per rivelare</div>
              <div class="cp-tap-sub">dal {{ sortedTeams.length }}° al 1° posto</div>
            </div>
          </transition>

          <!-- CARDS -->
          <div class="cp-cards-wrap">
            <div class="cp-cards-list">
              <div
                v-for="team in displayedTeams"
                :key="team.id"
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
                <!-- ██ RETTANGOLO BIANCO OPACO — copre tutto durante shake ██ -->
                <div v-if="shakingCards.has(team.id)" class="cp-card-cover">
                  <div class="cp-cover-question">?</div>
                </div>

                <!-- CONTENUTO visibile solo dopo lo shake -->
                <template v-else>
                  <!-- Rank / medaglia -->
                  <div class="cp-card-rank">
                    <span v-if="revealedCount === sortedTeams.length && team.rank === 1" class="cp-medal">🥇</span>
                    <span v-else-if="revealedCount === sortedTeams.length && team.rank === 2" class="cp-medal">🥈</span>
                    <span v-else-if="revealedCount === sortedTeams.length && team.rank === 3" class="cp-medal">🥉</span>
                    <span v-else class="cp-rank-num">#{{ team.rank }}</span>
                  </div>

                  <!-- Nome + barra -->
                  <div class="cp-card-info">
                    <div class="cp-card-name" :class="'cp-name--' + team.id">{{ team.name }}</div>
                    <div class="cp-card-bar-wrap">
                      <div class="cp-card-bar" :class="'cp-bar--' + team.id"
                        :style="{ width: barWidth(team.points) + '%' }"></div>
                    </div>
                  </div>

                  <!-- Punti -->
                  <div class="cp-card-score">
                    <span class="cp-score-num" :class="'cp-name--' + team.id">{{ team.points }}</span>
                    <span class="cp-score-unit">pt</span>
                  </div>

                  <!-- Scintille 1° finale -->
                  <div v-if="phase === 'finale' && team.rank === 1 && revealedCount === sortedTeams.length" class="cp-sparks">
                    <span v-for="n in 12" :key="n" class="cp-spark" :style="sparkStyle(n)"></span>
                  </div>

                  <!-- Stelle 1° settimana -->
                  <div v-if="phase !== 'finale' && team.rank === 1 && revealedCount === sortedTeams.length" class="cp-stars">
                    <span v-for="n in 5" :key="n" class="cp-star" :style="starStyle(n)">✦</span>
                  </div>

                  <!-- Burst crazy -->
                  <div v-if="crazyActive && team.rank === 1" class="cp-crazy-burst">
                    <span v-for="n in 20" :key="n" class="cp-burst-particle" :style="burstStyle(n)"></span>
                  </div>
                </template>
              </div>
            </div>
          </div>

        </div>
      </div>
    </transition>

    <!-- WINNER BANNER (finale) -->
    <transition name="winner-fade">
      <div v-if="revealedCount === sortedTeams.length && phase === 'finale' && !winnerClosed && !shakingCards.size" class="cp-winner-banner" @click.stop>
        <div class="cp-confetti-wrap">
          <span v-for="n in 36" :key="n" class="cp-confetto" :style="confettiStyle(n)"></span>
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

    <!-- WEEK BANNER (settimana) -->
    <transition name="winner-fade">
      <div v-if="revealedCount === sortedTeams.length && phase !== 'finale' && !weekBannerClosed && !shakingCards.size" class="cp-week-banner" @click.stop>
        <div class="cp-week-stars-wrap">
          <span v-for="n in 16" :key="n" class="cp-week-star" :style="weekStarStyle(n)">★</span>
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

const SHAKE_MS  = 2400;
const CRAZY_MS  = 3800;
const POST_CRAZY_MS = 2600;

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
      return [...this.teams]
        .sort((a, b) => b.points - a.points)
        .map((t, i) => ({ ...t, rank: i + 1 }));
    },
    // Reveal dal 6° al 1°: displayedTeams[0] = 6°, displayedTeams[last] = 1°
    displayedTeams() {
      if (!this.revealStarted || this.revealedCount === 0) return [];
      const total = this.sortedTeams.length;
      // slice dal fondo: dopo 1 click → [5], dopo 2 → [5,4], ecc.
      const slice = this.sortedTeams.slice(total - this.revealedCount);
      return slice.slice().reverse(); // 6° in cima, 1° in fondo
    },
    maxPoints() {
      return Math.max(...this.teams.map(t => t.points), 1);
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
      const team  = this.sortedTeams[total - this.revealedCount];
      const isFirst = team.rank === 1;
      const shakeDur = isFirst ? CRAZY_MS : SHAKE_MS;

      this.shakingCards = new Set([...this.shakingCards, team.id]);

      setTimeout(() => {
        const next = new Set(this.shakingCards);
        next.delete(team.id);
        this.shakingCards = next;

        if (isFirst) {
          this.crazyActive = true;
          setTimeout(() => { this.crazyActive = false; }, POST_CRAZY_MS);
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
      this.isRevealing = false;
      this.pointsData = null;
      this.historyData = [];
      this.winnerClosed = false;
      this.weekBannerClosed = false;
    },
    handleLogout() {
      sessionStorage.removeItem('loggedInUser');
      localStorage.removeItem('loggedInUser');
      this.$router.push('/login');
    },
    sparkStyle(n) {
      return { '--angle': ((n / 12) * 360) + 'deg', animationDelay: (n * 0.08) + 's' };
    },
    starStyle(n) {
      return {
        '--x': (-60 + n * 30) + 'px',
        '--y': (-25 - (n % 3) * 18) + 'px',
        animationDelay: (n * 0.15) + 's',
        fontSize: (1 + (n % 2) * 0.6) + 'rem',
      };
    },
    burstStyle(n) {
      const colors = ['#ffd43b','#ff6b6b','#51cf66','#74c0fc','#f78cc6','#ffa94d','#fff'];
      return {
        '--angle': ((n / 20) * 360) + 'deg',
        '--color': colors[n % colors.length],
        animationDelay: (n * 0.04) + 's',
      };
    },
    weekStarStyle(n) {
      return {
        left: ((n / 16) * 100) + '%',
        animationDelay: (n * 0.1) + 's',
        animationDuration: (2.2 + (n % 3) * 0.6) + 's',
        fontSize: (1 + (n % 3) * 0.5) + 'rem',
      };
    },
    confettiStyle(n) {
      return {
        '--color': ['#ff6b6b','#ffd43b','#51cf66','#74c0fc','#f78cc6','#ffa94d','#fff'][n % 7],
        '--duration': (2.5 + (n % 3) * 0.5) + 's',
        '--delay':    (n * 0.06) + 's',
        animationDelay: 'var(--delay)',
        animationDuration: 'var(--duration)',
        left: ((n / 36) * 100) + 'vw',
      };
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Bebas+Neue&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

/* ── ROOT ────────────────────────────────────────────────── */
.cp-root{
  font-family:'Nunito',sans-serif;
  background:#06060c;
  color:#fff;
  height:100dvh;width:100%;
  overflow:hidden;
  cursor:pointer;
  user-select:none;
  position:relative;
  display:flex;flex-direction:column;
}

/* ── FASE SELECTOR ───────────────────────────────────────── */
.cp-phase-screen{
  position:fixed;inset:0;
  display:flex;align-items:center;justify-content:center;
  background:#06060c;z-index:100;cursor:default;
}
.cp-phase-inner{
  display:flex;flex-direction:column;align-items:center;
  gap:clamp(1rem,2.5vh,1.8rem);
  padding:clamp(1.5rem,4vh,3rem) clamp(1.5rem,3vw,3rem);
  max-width:520px;width:100%;
}
.cp-phase-logo{
  font-size:clamp(3rem,7vh,5rem);
  filter:drop-shadow(0 0 28px rgba(255,215,0,.7));
  animation:floatLogo 3s ease-in-out infinite;
}
@keyframes floatLogo{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.cp-phase-title{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(3rem,8vw,5.5rem);
  letter-spacing:.12em;color:#fff;
  text-shadow:0 0 50px rgba(255,215,0,.35);line-height:1;
}
.cp-phase-sub{
  font-size:clamp(.75rem,1.2vw,1rem);font-weight:700;
  letter-spacing:.22em;text-transform:uppercase;
  color:rgba(255,255,255,.4);margin-top:-.5rem;
}
.cp-phase-grid{
  display:grid;grid-template-columns:1fr 1fr;
  gap:.9rem;width:100%;
}
.cp-phase-btn{
  display:flex;flex-direction:column;align-items:center;
  gap:.45rem;padding:clamp(1rem,2vh,1.4rem) .75rem;
  background:rgba(255,255,255,.05);
  border:1.5px solid rgba(255,255,255,.1);
  border-radius:20px;color:#fff;
  font-family:'Nunito',sans-serif;
  font-size:clamp(.82rem,1.2vw,.95rem);font-weight:800;
  cursor:pointer;transition:all .2s;
  -webkit-tap-highlight-color:transparent;
}
.cp-phase-btn:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.3);transform:scale(1.04);}
.cp-phase-btn--finale{
  grid-column:1/-1;
  background:linear-gradient(135deg,rgba(255,215,0,.15),rgba(255,165,0,.1));
  border-color:rgba(255,215,0,.45);
  padding:clamp(1.1rem,2.2vh,1.6rem) .75rem;
}
.cp-phase-btn--finale:hover{background:linear-gradient(135deg,rgba(255,215,0,.25),rgba(255,165,0,.18));border-color:rgba(255,215,0,.75);}
.cp-phase-btn-icon{font-size:clamp(1.5rem,3vh,2rem);}
.cp-phase-btn-label{font-size:clamp(.8rem,1.1vw,.92rem);font-weight:900;letter-spacing:.03em;}
.cp-logout-btn{
  display:flex;align-items:center;gap:.5rem;
  background:none;border:1.5px solid rgba(255,255,255,.12);
  color:rgba(255,255,255,.35);border-radius:99px;
  padding:.45rem 1.2rem;
  font-size:clamp(.72rem,1vw,.82rem);font-weight:700;
  cursor:pointer;font-family:'Nunito',sans-serif;transition:all .2s;
}
.cp-logout-btn:hover{border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.6);}

/* ── STAGE ───────────────────────────────────────────────── */
.cp-stage{display:flex;flex-direction:column;height:100dvh;overflow:hidden;}

/* ── HEADER ──────────────────────────────────────────────── */
.cp-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:clamp(.6rem,1.5vh,1rem) clamp(1rem,2.5vw,2.5rem);
  background:rgba(255,255,255,.025);
  border-bottom:1px solid rgba(255,255,255,.07);
  flex-shrink:0;
}
.cp-header-left{display:flex;align-items:center;gap:.75rem;}
.cp-trophy{
  font-size:clamp(1.4rem,3vh,2rem);
  filter:drop-shadow(0 0 8px rgba(255,200,0,.55));
}
.cp-header-title{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(1.2rem,2.5vw,1.8rem);
  letter-spacing:.1em;line-height:1.1;
}
.cp-header-phase{
  font-size:clamp(.6rem,1vw,.75rem);font-weight:800;
  letter-spacing:.15em;text-transform:uppercase;
  color:rgba(255,255,255,.4);
}
.cp-header-right{display:flex;align-items:center;gap:.9rem;}
.cp-hint{
  font-size:clamp(.62rem,.9vw,.75rem);font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;
  color:rgba(255,255,255,.3);
}
.cp-hint--pulse{animation:pulse 2s ease-in-out infinite;}
.cp-hint--active{color:rgba(255,215,0,.65);}
.cp-hint--done{color:rgba(80,200,120,.85);}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.9}}
.cp-back-btn{
  background:rgba(255,255,255,.07);
  border:1.5px solid rgba(255,255,255,.1);
  color:rgba(255,255,255,.5);border-radius:10px;
  width:clamp(32px,4vh,40px);height:clamp(32px,4vh,40px);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .2s;
}
.cp-back-btn:hover{background:rgba(255,255,255,.14);color:#fff;}

/* ── RANKING AREA ────────────────────────────────────────── */
.cp-ranking-area{
  flex:1;display:flex;flex-direction:column;
  justify-content:center;
  padding:clamp(.5rem,1.5vh,1.5rem) clamp(1rem,4vw,6rem);
  position:relative;overflow:hidden;min-height:0;
}

/* Invite -->
.cp-tap-invite{
  position:absolute;inset:0;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:.6rem;color:rgba(255,255,255,.2);pointer-events:none;
}
.cp-tap-icon{font-size:clamp(2rem,5vh,3.5rem);animation:tapBounce 1.6s ease-in-out infinite;}
@keyframes tapBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.cp-tap-text{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(2rem,5vw,4rem);letter-spacing:.15em;
}
.cp-tap-sub{
  font-size:clamp(.7rem,1.2vw,.9rem);font-weight:700;
  letter-spacing:.1em;text-transform:uppercase;
}

/* ── CARDS WRAPPER ───────────────────────────────────────── */
.cp-cards-wrap{
  width:100%;max-width:1100px;
  margin:0 auto;
}
.cp-cards-list{
  display:flex;flex-direction:column;
  gap:clamp(.4rem,1vh,.8rem);
}

/* ── SINGOLA CARD ────────────────────────────────────────── */
.cp-card{
  display:flex;align-items:center;
  gap:clamp(.6rem,1.5vw,1.5rem);
  background:#0e0e1c;
  border:2px solid rgba(255,255,255,.08);
  border-radius:clamp(12px,1.5vw,18px);
  padding:clamp(.55rem,1.3vh,1rem) clamp(.8rem,2vw,1.8rem);
  position:relative;overflow:hidden;
  transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s,background .4s;
  min-height:clamp(60px,9vh,90px);
  animation:cardSlideIn .5s cubic-bezier(.16,1,.3,1) both;
}
@keyframes cardSlideIn{
  from{opacity:0;transform:translateX(-60px) scale(.95);}
  to  {opacity:1;transform:translateX(0)     scale(1);}
}
/* Bordi colore squadra */
.cp-card--rossi    {border-color:rgba(220,53,69,.45);}
.cp-card--verdi    {border-color:rgba(40,167,69,.45);}
.cp-card--arancioni{border-color:rgba(253,126,20,.45);}
.cp-card--blu      {border-color:rgba(0,123,255,.45);}
.cp-card--fucsia   {border-color:rgba(232,62,140,.45);}
.cp-card--gialli   {border-color:rgba(200,150,12,.45);}

/* ── SHAKE: card trema, contenuto nascosto dal cover ─────── */
.cp-card--shaking{
  animation:cardShake .16s ease-in-out infinite !important;
  background:#111120 !important;
}
@keyframes cardShake{
  0%  {transform:translateX(0)   rotate(0deg);}
  20% {transform:translateX(-7px) rotate(-.7deg);}
  40% {transform:translateX(7px)  rotate(.7deg);}
  60% {transform:translateX(-5px) rotate(-.4deg);}
  80% {transform:translateX(5px)  rotate(.4deg);}
  100%{transform:translateX(0)   rotate(0deg);}
}

/* ██ RETTANGOLO BIANCO OPACO che copre tutto ██ */
.cp-card-cover{
  position:absolute;inset:0;
  border-radius:inherit;
  background:#ffffff;
  display:flex;align-items:center;justify-content:center;
  z-index:10;
  animation:coverPulse .5s ease-in-out infinite alternate;
}
@keyframes coverPulse{
  from{background:#ffffff;}
  to  {background:#e8e8ff;}
}
.cp-cover-question{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(2rem,5vw,4rem);
  color:rgba(0,0,0,.12);
  letter-spacing:.2em;
  animation:questionPulse .6s ease-in-out infinite alternate;
}
@keyframes questionPulse{from{transform:scale(1)}to{transform:scale(1.15)}}

/* ── CRAZY (1° posto) ────────────────────────────────────── */
.cp-card--crazy{
  animation:crazyShake .09s ease-in-out infinite !important;
  border-color:rgba(255,215,0,.95) !important;
  box-shadow:0 0 50px rgba(255,215,0,.55),0 0 100px rgba(255,215,0,.2),inset 0 0 24px rgba(255,215,0,.1) !important;
  background:#1a1400 !important;
  z-index:20;
}
@keyframes crazyShake{
  0%  {transform:translateX(0)    rotate(0deg)    scale(1);}
  10% {transform:translateX(-12px) rotate(-1.8deg) scale(1.02);}
  20% {transform:translateX(12px)  rotate(1.8deg)  scale(.98);}
  30% {transform:translateX(-9px)  rotate(-1.2deg) scale(1.03);}
  40% {transform:translateX(9px)   rotate(1.2deg)  scale(.97);}
  50% {transform:translateX(-6px)  rotate(-.6deg)  scale(1.01);}
  60% {transform:translateX(6px)   rotate(.6deg)   scale(1);}
  70% {transform:translateX(-3px)  rotate(-.3deg)  scale(1.02);}
  80% {transform:translateX(3px)   rotate(.3deg)   scale(.99);}
  100%{transform:translateX(0)    rotate(0deg)    scale(1);}
}

/* ── WINNER / PODIO ──────────────────────────────────────── */
.cp-card--winner{
  background:rgba(255,215,0,.08);
  border-color:rgba(255,215,0,.55) !important;
  box-shadow:0 0 40px rgba(255,215,0,.14),inset 0 0 20px rgba(255,215,0,.05);
  transform:scale(1.012);
}
.cp-card--podium{background:rgba(255,255,255,.04);}

/* ── RANK ────────────────────────────────────────────────── */
.cp-card-rank{
  flex-shrink:0;
  width:clamp(40px,5vw,64px);
  text-align:center;
}
.cp-rank-num{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(1.4rem,3vw,2.4rem);
  color:rgba(255,255,255,.18);letter-spacing:.05em;
}
.cp-medal{font-size:clamp(1.6rem,3.5vw,2.6rem);}

/* ── INFO ────────────────────────────────────────────────── */
.cp-card-info{flex:1;min-width:0;}
.cp-card-name{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(1.4rem,3.5vw,2.8rem);
  letter-spacing:.08em;line-height:1;
  margin-bottom:clamp(.2rem,.5vh,.4rem);
}
.cp-card-bar-wrap{
  height:clamp(4px,0.6vh,7px);
  background:rgba(255,255,255,.07);
  border-radius:99px;overflow:hidden;
}
.cp-card-bar{
  height:100%;border-radius:99px;
  transition:width 1.1s cubic-bezier(.16,1,.3,1);
}

/* ── SCORE ───────────────────────────────────────────────── */
.cp-card-score{flex-shrink:0;text-align:right;}
.cp-score-num{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(2rem,4.5vw,3.8rem);
  letter-spacing:.04em;line-height:1;
}
.cp-score-unit{
  display:block;
  font-size:clamp(.6rem,.9vw,.75rem);
  font-weight:700;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(255,255,255,.3);
}

/* ── COLORI ──────────────────────────────────────────────── */
.cp-name--rossi    {color:#ff6b6b;}
.cp-name--verdi    {color:#51cf66;}
.cp-name--arancioni{color:#ffa94d;}
.cp-name--blu      {color:#74c0fc;}
.cp-name--fucsia   {color:#f78cc6;}
.cp-name--gialli   {color:#ffd43b;}
.cp-bar--rossi     {background:linear-gradient(90deg,#DC3545,#ff6b6b);}
.cp-bar--verdi     {background:linear-gradient(90deg,#28A745,#51cf66);}
.cp-bar--arancioni {background:linear-gradient(90deg,#FD7E14,#ffa94d);}
.cp-bar--blu       {background:linear-gradient(90deg,#007BFF,#74c0fc);}
.cp-bar--fucsia    {background:linear-gradient(90deg,#E83E8C,#f78cc6);}
.cp-bar--gialli    {background:linear-gradient(90deg,#c8960c,#ffd43b);}

/* ── SCINTILLE (finale 1°) ───────────────────────────────── */
.cp-sparks{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:visible;}
.cp-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#ffd43b;animation:sparkFly 1.3s ease-out infinite;--angle:0deg;}
@keyframes sparkFly{0%{transform:rotate(var(--angle)) translateX(0) scale(1.5);opacity:1}100%{transform:rotate(var(--angle)) translateX(90px) scale(0);opacity:0}}

/* ── STELLE (settimana 1°) ───────────────────────────────── */
.cp-stars{position:absolute;right:1rem;top:50%;transform:translateY(-50%);pointer-events:none;}
.cp-star{position:absolute;color:#ffd43b;animation:starPop .8s cubic-bezier(.16,1,.3,1) both,starFade 1.5s ease-in-out .5s infinite alternate;transform:translate(var(--x,0),var(--y,0));}
@keyframes starPop {from{transform:translate(var(--x,0),var(--y,0)) scale(0)}to{transform:translate(var(--x,0),var(--y,0)) scale(1)}}
@keyframes starFade{from{opacity:1}to{opacity:.4}}

/* ── BURST CRAZY ─────────────────────────────────────────── */
.cp-crazy-burst{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:visible;z-index:5;}
.cp-burst-particle{position:absolute;width:10px;height:10px;border-radius:50%;background:var(--color,#ffd43b);animation:burstFly 1s cubic-bezier(.16,1,.3,1) var(--delay,0s) both;--angle:0deg;}
@keyframes burstFly{0%{transform:rotate(var(--angle)) translateX(0) scale(2);opacity:1}60%{opacity:1}100%{transform:rotate(var(--angle)) translateX(150px) scale(0);opacity:0}}

/* ── LOADING ─────────────────────────────────────────────── */
.cp-loading{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;background:#06060c;color:rgba(255,255,255,.4);}
.cp-spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.1);border-top-color:rgba(255,215,0,.65);border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── WINNER BANNER (finale) ──────────────────────────────── */
.cp-winner-banner{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.9);backdrop-filter:blur(16px);}
.cp-winner-content{text-align:center;animation:winnerPop .8s cubic-bezier(.16,1,.3,1) both;}
@keyframes winnerPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.cp-winner-crown{font-size:clamp(4rem,10vh,7rem);filter:drop-shadow(0 0 40px rgba(255,215,0,.9));animation:floatLogo 3s ease-in-out infinite;}
.cp-winner-label{font-size:clamp(.7rem,1.5vw,1rem);font-weight:900;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.45);margin:.6rem 0 .3rem;}
.cp-winner-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(4rem,12vw,9rem);letter-spacing:.1em;line-height:1;text-shadow:0 0 80px currentColor;}
.cp-winner-pts{font-size:clamp(.9rem,2vw,1.5rem);font-weight:700;color:rgba(255,215,0,.85);margin-top:.5rem;}
.cp-winner-close{margin-top:2rem;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.2);color:rgba(255,255,255,.65);border-radius:99px;padding:.55rem 1.8rem;font-size:clamp(.8rem,1.2vw,.9rem);font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .2s;letter-spacing:.05em;}
.cp-winner-close:hover{background:rgba(255,255,255,.2);color:#fff;}

/* ── WEEK BANNER ─────────────────────────────────────────── */
.cp-week-banner{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);}
.cp-week-content{text-align:center;animation:winnerPop .7s cubic-bezier(.16,1,.3,1) both;}
.cp-week-icon{font-size:clamp(3rem,8vh,5.5rem);animation:floatLogo 3s ease-in-out infinite;}
.cp-week-label{font-size:clamp(.7rem,1.5vw,1rem);font-weight:900;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.45);margin:.5rem 0 .25rem;}
.cp-week-winner{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,10vw,7rem);letter-spacing:.1em;line-height:1;text-shadow:0 0 50px currentColor;}
.cp-week-pts{font-size:clamp(.85rem,1.8vw,1.3rem);font-weight:700;color:rgba(255,215,0,.75);margin-top:.4rem;}
.cp-week-stars-wrap{position:fixed;inset:0;pointer-events:none;overflow:hidden;}
.cp-week-star{position:absolute;top:-10%;color:#ffd43b;animation:weekStarFall linear infinite;opacity:0;}
@keyframes weekStarFall{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:.7}100%{transform:translateY(110vh) rotate(360deg);opacity:0}}

/* ── CONFETTI ────────────────────────────────────────────── */
.cp-confetti-wrap{position:fixed;inset:0;pointer-events:none;overflow:hidden;}
.cp-confetto{position:absolute;top:-10px;width:10px;height:10px;background:var(--color);border-radius:2px;animation:confettiFall var(--duration,3s) ease-in var(--delay,0s) infinite;}
@keyframes confettiFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}

/* ── TRANSIZIONI ─────────────────────────────────────────── */
.phase-fade-enter-active,.phase-fade-leave-active{transition:opacity .4s ease,transform .4s cubic-bezier(.16,1,.3,1);}
.phase-fade-enter-from{opacity:0;transform:scale(1.03);}
.phase-fade-leave-to{opacity:0;transform:scale(.97);position:absolute;inset:0;}
.fade-enter-active,.fade-leave-active{transition:opacity .3s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
.winner-fade-enter-active{transition:opacity .5s ease;}
.winner-fade-enter-from{opacity:0;}
.winner-fade-leave-active{transition:opacity .3s ease;}
.winner-fade-leave-to{opacity:0;}
</style>
