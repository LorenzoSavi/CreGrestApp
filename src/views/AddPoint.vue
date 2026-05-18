<template>
  <!-- Header -->
  <header class="ap-header">
    <div class="ap-header-inner">
      <div class="ap-brand">
        <span class="ap-trophy">🏆</span>
        <div>
          <div class="ap-title">Aggiungi Punti</div>
          <div class="ap-sub" v-if="currentUser">{{ currentUser.username }}</div>
        </div>
      </div>
      <button @click="handleLogout" class="ap-logout" aria-label="Logout">
        <i class="fas fa-sign-out-alt"></i>
      </button>
    </div>
  </header>

  <!-- STEP 1: Squadra -->
  <section class="ap-section">
    <div class="ap-section-label">1 — Squadra</div>
    <div class="team-grid">
      <button
        v-for="team in teams"
        :key="team.id"
        type="button"
        class="team-tile"
        :class="[team.id + '-tile', { 'team-tile--active': selectedTeam === team.id }]"
        @click="selectedTeam = team.id"
      >
        <span class="team-tile-dot" :class="team.id + '-dot'"></span>
        <span class="team-tile-name">{{ team.name }}</span>
        <span v-if="selectedTeam === team.id" class="team-tile-check">✓</span>
      </button>
    </div>
  </section>

  <!-- STEP 2: Ciclo -->
  <section class="ap-section">
    <div class="ap-section-label">2 — Ciclo</div>
    <div class="cycle-row">
      <button
        v-for="c in cycles"
        :key="c.id"
        type="button"
        class="cycle-btn"
        :class="{ 'cycle-btn--active': selectedCycle === c.id }"
        @click="selectCycle(c.id)"
      >
        {{ c.name }}
      </button>
    </div>
  </section>

  <!-- STEP 3: Gioco -->
  <section class="ap-section" :class="{ 'ap-section--disabled': !selectedCycle }">
    <div class="ap-section-label">3 — Gioco <span v-if="!selectedCycle" class="ap-hint">(seleziona prima il ciclo)</span></div>
    <div class="game-list">
      <button
        v-for="game in availableGames"
        :key="game.id"
        type="button"
        class="game-btn"
        :class="{ 'game-btn--active': selectedGame === game.id }"
        @click="selectedGame = game.id"
      >
        {{ game.name }}
      </button>
      <div v-if="!selectedCycle" class="game-placeholder">—</div>
    </div>
  </section>

  <!-- STEP 4: Punti -->
  <section class="ap-section">
    <div class="ap-section-label">4 — Punti</div>
    <div class="pts-quick">
      <button
        v-for="p in quickPoints"
        :key="p"
        type="button"
        class="pts-quick-btn"
        :class="{ 'pts-quick-btn--active': pointsToAdd === p }"
        @click="pointsToAdd = p"
      >{{ p }}</button>
    </div>
    <div class="pts-manual">
      <button type="button" class="pts-stepper" @click="pointsToAdd = Math.max(0, pointsToAdd - 1)">−</button>
      <input
        class="pts-manual-input"
        type="number"
        v-model.number="pointsToAdd"
        min="0"
        inputmode="numeric"
        placeholder="0"
      />
      <button type="button" class="pts-stepper" @click="pointsToAdd++">+</button>
    </div>
  </section>

  <!-- ERRORE -->
  <div v-if="error" class="ap-error">{{ error }}</div>

  <!-- CTA fissa in basso -->
  <div class="ap-cta">
    <!-- Preview selezione -->
    <div class="ap-preview" v-if="selectedTeam || selectedGame || pointsToAdd > 0">
      <span v-if="selectedTeam" class="prev-tag" :class="selectedTeam + '-tag'">{{ teamName }}</span>
      <span v-if="selectedCycle" class="prev-tag prev-tag--neutral">{{ cycleName }}</span>
      <span v-if="selectedGame" class="prev-tag prev-tag--neutral">{{ gameName }}</span>
      <span v-if="pointsToAdd > 0" class="prev-pts">+{{ pointsToAdd }} pt</span>
    </div>
    <button class="ap-submit" @click="addPoints" :disabled="isLoading">
      <span v-if="!isLoading"><i class="fas fa-bolt"></i>&nbsp; Aggiungi Punti</span>
      <span v-else><i class="fas fa-spinner fa-spin"></i>&nbsp; Salvataggio...</span>
    </button>
  </div>

  <!-- SUCCESS MODAL -->
  <transition name="smodal">
    <div v-if="showSuccessModal" class="success-overlay" :style="{ '--team-color': overlayColor }">
      <div class="success-box">
        <div class="success-emoji">🎉</div>
        <div class="success-pts">+{{ lastPoints }} pt</div>
        <div class="success-msg">{{ successMessage }}</div>
      </div>
    </div>
  </transition>
</template>

<script>
import { db } from '../firebase';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { useLogout } from '@/composables/useLogout'

export default {
  name: 'AddPoint',
  setup() {
    const { logout } = useLogout()
    return { handleLogout: logout }
  },
  data() {
    return {
      selectedTeam: '',
      selectedCycle: '',
      selectedGame: '',
      pointsToAdd: 0,
      lastPoints: 0,
      successMessage: '',
      showSuccessModal: false,
      overlayColor: '#667eea',
      isLoading: false,
      error: '',
      teams: [
        { id: 'rossi',     name: 'Rossi',     color: '#DC3545' },
        { id: 'verdi',     name: 'Verdi',     color: '#28A745' },
        { id: 'arancioni', name: 'Arancioni', color: '#FD7E14' },
        { id: 'blu',       name: 'Blu',       color: '#007BFF' },
        { id: 'fucsia',    name: 'Fucsia',    color: '#E83E8C' },
        { id: 'gialli',    name: 'Gialli',    color: '#c8960c' },
      ],
      cycles: [
        { id: 'primo',   name: 'I Ciclo'   },
        { id: 'secondo', name: 'II Ciclo'  },
        { id: 'terzo',   name: 'III Ciclo' },
      ],
      gamesByCycle: {
        primo: [
          { id: 'bandierina', name: 'Bandierina' },
          { id: 'lupo-ghiaccio', name: 'Lupo Ghiaccio' },
          { id: 'aste-in-movimento', name: 'Aste in Movimento' },
          { id: 'lupo-coda', name: 'Lupo Coda' },
          { id: 'staffetta-a-ostacoli-i-ciclo', name: 'Staffetta Ostacoli' },
          { id: 'sfonda-la-porta', name: 'Sfonda la Porta' },
          { id: 'nella-palude-tronco-o-liana', name: 'Nella Palude' },
          { id: 'domina-i-cerchi', name: 'Domina i Cerchi' },
        ],
        secondo: [
          { id: 'tiro-alla-fune', name: 'Tiro alla Fune' },
          { id: 'bandierina-mix', name: 'Bandierina Mix' },
          { id: 'castelli', name: 'Castelli' },
          { id: 'pallamano', name: 'Pallamano' },
          { id: 'staffetta-a-ostacoli-ii-ciclo', name: 'Staffetta Ostacoli' },
          { id: 'lupo-ghiaccio', name: 'Lupo Ghiaccio' },
          { id: 'aste-in-movimento', name: 'Aste in Movimento' },
          { id: 'lupo-coda', name: 'Lupo Coda' },
          { id: 'palla-prigioniera', name: 'Palla Prigioniera' },
          { id: 'tchoukball', name: 'Tchoukball' },
          { id: 'nella-palude-tronco-o-liana', name: 'Nella Palude' },
          { id: '10-tappe', name: '10 Tappe' },
        ],
        terzo: [
          { id: 'dai-fai-canestro', name: 'Fai Canestro' },
          { id: 'pallamano', name: 'Pallamano' },
          { id: 'castelli', name: 'Castelli' },
          { id: 'tchoukball', name: 'Tchoukball' },
          { id: 'tiro-alla-fune', name: 'Tiro alla Fune' },
          { id: '10-tappe', name: '10 Tappe' },
          { id: 'palla-prigioniera', name: 'Palla Prigioniera' },
          { id: 'bandierina-mix', name: 'Bandierina Mix' },
          { id: 'calcetto', name: 'Calcetto' },
        ],
      },
      quickPoints: [20, 50, 100],
    };
  },
  computed: {
    availableGames() {
      return this.selectedCycle ? this.gamesByCycle[this.selectedCycle] : [];
    },
    currentUser() {
      return JSON.parse(localStorage.getItem('loggedInUser')) || JSON.parse(sessionStorage.getItem('loggedInUser'));
    },
    teamName() { return this.teams.find(t => t.id === this.selectedTeam)?.name ?? ''; },
    cycleName() { return this.cycles.find(c => c.id === this.selectedCycle)?.name ?? ''; },
    gameName()  { return this.availableGames.find(g => g.id === this.selectedGame)?.name ?? ''; },
  },
  watch: {
    selectedCycle() { this.selectedGame = ''; }
  },
  methods: {
    selectCycle(id) {
      this.selectedCycle = id;
      this.selectedGame = '';
    },
    async addPoints() {
      if (!this.selectedTeam || !this.selectedCycle || !this.selectedGame || this.pointsToAdd <= 0) {
        this.error = 'Completa tutti i campi e inserisci almeno 1 punto.';
        setTimeout(() => { this.error = ''; }, 3500);
        return;
      }
      this.isLoading = true;
      this.error = '';
      try {
        const ref = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, { [this.selectedTeam]: (snap.data()[this.selectedTeam] || 0) + this.pointsToAdd });
          await this.addHistory();
          const team = this.teams.find(t => t.id === this.selectedTeam);
          this.lastPoints = this.pointsToAdd;
          this.successMessage = `${team.name} — ${this.gameName}`;
          this.overlayColor = team.color;
          this.showSuccessModal = true;
          this.selectedTeam = '';
          this.selectedCycle = '';
          this.selectedGame = '';
          this.pointsToAdd = 0;
          setTimeout(() => { this.showSuccessModal = false; }, 2800);
        }
      } catch (e) {
        this.error = 'Errore durante il salvataggio. Riprova.';
      } finally {
        this.isLoading = false;
      }
    },
    async addHistory() {
      const ref = doc(db, 'points', 'history');
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const user = this.currentUser;
      await updateDoc(ref, {
        history: arrayUnion({
          username: user?.username ?? 'sconosciuto',
          team: this.selectedTeam,
          game: this.selectedGame,
          cycle: this.selectedCycle,
          points: this.pointsToAdd,
          timestamp: new Date()
        })
      });
    },
  }
}
</script>

<style scoped>
/* ── HEADER ── */
.ap-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3);
}
.ap-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  max-width: 640px;
  margin: 0 auto;
}
.ap-brand { display: flex; align-items: center; gap: 0.65rem; }
.ap-trophy { font-size: 1.6rem; filter: drop-shadow(0 0 8px rgba(255,200,0,0.5)); }
.ap-title  { font-size: 1.05rem; font-weight: 800; color: #fff; line-height: 1.2; }
.ap-sub    { font-size: 0.72rem; color: rgba(255,255,255,0.45); }
.ap-logout {
  background: rgba(220,53,69,0.15);
  border: 1.5px solid rgba(220,53,69,0.4);
  color: #ff6b6b;
  border-radius: 10px;
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s;
}
.ap-logout:active { background: rgba(220,53,69,0.4); }

/* ── SECTIONS ── */
.ap-section {
  padding: 1.25rem 1.25rem 0;
  max-width: 640px;
  margin: 0 auto;
}
.ap-section--disabled { opacity: 0.45; pointer-events: none; }
.ap-section-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
  margin-bottom: 0.65rem;
}
.ap-hint { font-weight: 400; text-transform: none; font-size: 0.7rem; color: #aaa; }

/* ── TEAM GRID ── */
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}
.team-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.85rem 0.5rem;
  border-radius: 14px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.15s, border-color 0.15s;
  font-size: 0.9rem;
  font-weight: 700;
  -webkit-tap-highlight-color: transparent;
  min-height: 72px;
}
.team-tile:active { transform: scale(0.95); }
.team-tile-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
}
.team-tile-name { line-height: 1; }
.team-tile-check {
  position: absolute;
  top: 6px; right: 8px;
  font-size: 0.7rem;
  font-weight: 900;
}

/* Team tile colors */
.rossi-tile     { background: #fff0f1; color: #DC3545; border-color: rgba(220,53,69,0.2); }
.verdi-tile     { background: #f0fbf3; color: #28A745; border-color: rgba(40,167,69,0.2); }
.arancioni-tile { background: #fff8f0; color: #FD7E14; border-color: rgba(253,126,20,0.2); }
.blu-tile       { background: #f0f8ff; color: #007BFF; border-color: rgba(0,123,255,0.2); }
.fucsia-tile    { background: #fff0f8; color: #E83E8C; border-color: rgba(232,62,140,0.2); }
.gialli-tile    { background: #fffde0; color: #a07800; border-color: rgba(200,150,12,0.2); }

.rossi-tile.team-tile--active     { background: #ffe0e3; border-color: #DC3545; box-shadow: 0 4px 16px rgba(220,53,69,0.25); }
.verdi-tile.team-tile--active     { background: #d8f5e1; border-color: #28A745; box-shadow: 0 4px 16px rgba(40,167,69,0.25); }
.arancioni-tile.team-tile--active { background: #ffe8d0; border-color: #FD7E14; box-shadow: 0 4px 16px rgba(253,126,20,0.25); }
.blu-tile.team-tile--active       { background: #d5ecff; border-color: #007BFF; box-shadow: 0 4px 16px rgba(0,123,255,0.25); }
.fucsia-tile.team-tile--active    { background: #ffd5ec; border-color: #E83E8C; box-shadow: 0 4px 16px rgba(232,62,140,0.25); }
.gialli-tile.team-tile--active    { background: #fff5b0; border-color: #c8960c; box-shadow: 0 4px 16px rgba(200,150,12,0.25); }

/* Dots */
.rossi-dot     { background: #DC3545; }
.verdi-dot     { background: #28A745; }
.arancioni-dot { background: #FD7E14; }
.blu-dot       { background: #007BFF; }
.fucsia-dot    { background: #E83E8C; }
.gialli-dot    { background: #c8960c; }

/* ── CYCLE BUTTONS ── */
.cycle-row {
  display: flex;
  gap: 0.6rem;
}
.cycle-btn {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border-radius: 12px;
  border: 2px solid rgba(102,126,234,0.2);
  background: #f4f5ff;
  color: #667eea;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  min-height: 48px;
}
.cycle-btn:active { transform: scale(0.95); }
.cycle-btn--active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
  box-shadow: 0 4px 14px rgba(102,126,234,0.35);
}

/* ── GAME LIST ── */
.game-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.game-btn {
  padding: 0.55rem 1rem;
  border-radius: 22px;
  border: 1.5px solid rgba(0,0,0,0.1);
  background: #f8f8f8;
  color: #444;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  min-height: 40px;
}
.game-btn:active { transform: scale(0.95); }
.game-btn--active {
  background: #1a1a2e;
  color: #fff;
  border-color: #1a1a2e;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
}
.game-placeholder { color: #ccc; font-size: 0.85rem; padding: 0.5rem 0; }

/* ── POINTS ── */
.pts-quick {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.85rem;
}
.pts-quick-btn {
  flex: 1;
  padding: 0.7rem 0;
  border-radius: 12px;
  border: 2px solid rgba(102,126,234,0.2);
  background: #f4f5ff;
  color: #667eea;
  font-weight: 800;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  min-height: 50px;
}
.pts-quick-btn:active { transform: scale(0.95); }
.pts-quick-btn--active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
  box-shadow: 0 4px 14px rgba(102,126,234,0.35);
}
.pts-manual {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.pts-stepper {
  width: 52px; height: 52px;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  background: #f8f8f8;
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #555;
  transition: all 0.15s;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
.pts-stepper:active { background: #667eea; border-color: #667eea; color: #fff; transform: scale(0.93); }
.pts-manual-input {
  flex: 1;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 900;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 0.6rem 0;
  outline: none;
  transition: border-color 0.2s;
  -moz-appearance: textfield;
  min-height: 52px;
}
.pts-manual-input::-webkit-inner-spin-button,
.pts-manual-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.pts-manual-input:focus { border-color: #667eea; }

/* ── ERROR ── */
.ap-error {
  max-width: 640px;
  margin: 0.75rem auto 0;
  padding: 0.75rem 1.25rem;
  background: #ffe8e8;
  border-radius: 10px;
  color: #c0392b;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

/* ── CTA BAR ── */
.ap-cta {
  position: fixed;
  bottom: 0;
  left: 0; right: 0;
  padding: 0.75rem 1.25rem max(0.75rem, env(safe-area-inset-bottom));
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(0,0,0,0.08);
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 640px;
  margin: 0 auto;
  /* full bleed */
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
}
/* Safari fix: sticky bottom across full width */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .ap-cta {
    left: 0;
    transform: none;
    max-width: 100%;
  }
}
.ap-preview {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  min-height: 24px;
}
.prev-tag {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
}
.prev-tag--neutral { background: #f0f0f0; color: #555; }
.rossi-tag     { background: #ffe0e3; color: #DC3545; }
.verdi-tag     { background: #d8f5e1; color: #28A745; }
.arancioni-tag { background: #ffe8d0; color: #FD7E14; }
.blu-tag       { background: #d5ecff; color: #007BFF; }
.fucsia-tag    { background: #ffd5ec; color: #E83E8C; }
.gialli-tag    { background: #fff5b0; color: #a07800; }
.prev-pts { font-size: 1rem; font-weight: 900; color: #667eea; margin-left: auto; }

.ap-submit {
  width: 100%;
  min-height: 54px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 14px;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(102,126,234,0.4);
  transition: transform 0.12s, opacity 0.2s;
  -webkit-tap-highlight-color: transparent;
  letter-spacing: 0.02em;
}
.ap-submit:active:not(:disabled) { transform: scale(0.97); }
.ap-submit:disabled { opacity: 0.6; cursor: not-allowed; }

/* Space for fixed CTA */
.ap-section:last-of-type { padding-bottom: 0.5rem; }
body { padding-bottom: 140px; }

/* ── SUCCESS OVERLAY ── */
.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.success-box {
  background: #fff;
  border-radius: 24px;
  padding: 2.5rem 2rem;
  text-align: center;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: popIn 0.35s cubic-bezier(.16,1,.3,1);
  border-top: 6px solid var(--team-color, #667eea);
}
.success-emoji { font-size: 3.5rem; margin-bottom: 0.5rem; }
.success-pts {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--team-color, #667eea);
  line-height: 1;
  margin-bottom: 0.5rem;
}
.success-msg { font-size: 1rem; color: #555; font-weight: 600; }

.smodal-enter-active, .smodal-leave-active { transition: opacity 0.25s; }
.smodal-enter-from, .smodal-leave-to { opacity: 0; }

@keyframes popIn {
  0%   { opacity: 0; transform: scale(0.7); }
  60%  { transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}

/* ── DARK MODE ── */
@media (prefers-color-scheme: dark) {
  .ap-section-label { color: #666; }
  .ap-hint { color: #555; }

  .team-tile {
    filter: brightness(0.8);
  }
  .rossi-tile     { background: #2d1517; color: #ff6b6b; border-color: rgba(220,53,69,0.25); }
  .verdi-tile     { background: #172d1e; color: #51cf66; border-color: rgba(40,167,69,0.25); }
  .arancioni-tile { background: #2d1e0d; color: #ff922b; border-color: rgba(253,126,20,0.25); }
  .blu-tile       { background: #0d1e2d; color: #74c0fc; border-color: rgba(0,123,255,0.25); }
  .fucsia-tile    { background: #2d0e1e; color: #f78cc6; border-color: rgba(232,62,140,0.25); }
  .gialli-tile    { background: #2d2800; color: #ffd43b; border-color: rgba(200,150,12,0.25); }
  .rossi-tile.team-tile--active     { background: #5c1520; border-color: #ff6b6b; }
  .verdi-tile.team-tile--active     { background: #1a4d25; border-color: #51cf66; }
  .arancioni-tile.team-tile--active { background: #5c3210; border-color: #ff922b; }
  .blu-tile.team-tile--active       { background: #0a2e5c; border-color: #74c0fc; }
  .fucsia-tile.team-tile--active    { background: #5c0f2f; border-color: #f78cc6; }
  .gialli-tile.team-tile--active    { background: #5c5000; border-color: #ffd43b; }

  .cycle-btn { background: #232530; color: #848ae8; border-color: rgba(102,126,234,0.2); }
  .cycle-btn--active { background: #667eea; color: #fff; }

  .game-btn { background: #1e2028; color: #ccc; border-color: rgba(255,255,255,0.08); }
  .game-btn--active { background: #667eea; color: #fff; border-color: #667eea; }

  .pts-quick-btn { background: #232530; color: #848ae8; border-color: rgba(102,126,234,0.2); }
  .pts-quick-btn--active { background: #667eea; color: #fff; }
  .pts-stepper  { background: #2a2c36; border-color: #3a3c46; color: #ccc; }
  .pts-manual-input { background: #2a2c36; border-color: #3a3c46; color: #fff; }

  .ap-cta {
    background: rgba(26,26,40,0.96);
    border-top-color: rgba(255,255,255,0.08);
  }
  .prev-tag--neutral { background: #2a2c36; color: #aaa; }
  .success-box { background: #1e2028; }
  .success-msg { color: #aaa; }
}
</style>
