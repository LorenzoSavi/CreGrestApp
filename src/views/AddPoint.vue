<template>
  <!-- HEADER -->
  <header class="ap-header">
    <div class="ap-header-inner">
      <div class="ap-brand">
        <span class="ap-trophy">🏆</span>
        <div>
          <div class="ap-title">Aggiungi Punti</div>
          <div class="ap-sub" v-if="currentUser">👤 {{ currentUser.username }}</div>
        </div>
      </div>
      <button @click="handleLogout" class="ap-logout" aria-label="Logout">
        <i class="fas fa-sign-out-alt"></i>
      </button>
    </div>
    <div class="ap-progress-bar">
      <div class="ap-progress-fill" :style="{ width: progressPct + '%' }"></div>
    </div>
  </header>

  <main class="ap-main">
    <section class="ap-section">
      <div class="ap-step-head">
        <div class="ap-step-num" :class="{ done: selectedTeam }">{{ selectedTeam ? '✓' : '1' }}</div>
        <div class="ap-step-title">Scegli la squadra</div>
      </div>
      <div class="team-grid">
        <button v-for="team in teams" :key="team.id" type="button" class="team-tile" :class="[team.id + '-tile', { 'team-tile--active': selectedTeam === team.id }]" @click="selectedTeam = team.id" :aria-pressed="selectedTeam === team.id">
          <span class="team-tile-emoji">{{ team.emoji }}</span>
          <span class="team-tile-name">{{ team.name }}</span>
          <span v-if="selectedTeam === team.id" class="team-tile-check">✓</span>
        </button>
      </div>
    </section>

    <section class="ap-section" :class="{ 'ap-section--locked': !selectedTeam }">
      <div class="ap-step-head">
        <div class="ap-step-num" :class="{ done: selectedCycle }">{{ selectedCycle ? '✓' : '2' }}</div>
        <div class="ap-step-title">Ciclo <span v-if="!selectedTeam" class="ap-hint">← prima scegli la squadra</span></div>
      </div>
      <div class="cycle-row">
        <button v-for="c in cycles" :key="c.id" type="button" class="cycle-btn" :class="{ 'cycle-btn--active': selectedCycle === c.id }" @click="selectCycle(c.id)" :aria-pressed="selectedCycle === c.id">
          <span class="cycle-num">{{ c.num }}</span>
          <span class="cycle-label">{{ c.name }}</span>
        </button>
      </div>
    </section>

    <section class="ap-section" :class="{ 'ap-section--locked': !selectedCycle }">
      <div class="ap-step-head">
        <div class="ap-step-num" :class="{ done: selectedGame }">{{ selectedGame ? '✓' : '3' }}</div>
        <div class="ap-step-title">Gioco <span v-if="!selectedCycle" class="ap-hint">← prima scegli il ciclo</span></div>
      </div>
      <transition name="games-fade">
        <div class="game-list" v-if="selectedCycle">
          <button v-for="game in availableGames" :key="game.id" type="button" class="game-btn" :class="{ 'game-btn--active': selectedGame === game.id }" @click="selectedGame = game.id" :aria-pressed="selectedGame === game.id">
            <i class="fas fa-gamepad"></i> {{ game.name }}
          </button>
        </div>
      </transition>
    </section>

    <section class="ap-section">
      <div class="ap-step-head">
        <div class="ap-step-num" :class="{ done: pointsToAdd > 0 }">{{ pointsToAdd > 0 ? '✓' : '4' }}</div>
        <div class="ap-step-title">Punti da assegnare</div>
      </div>
      <div class="pts-quick">
        <button v-for="p in quickPoints" :key="p" type="button" class="pts-quick-btn" :class="{ 'pts-quick-btn--active': pointsToAdd === p }" @click="pointsToAdd = p">
          <span class="pts-q-val">{{ p }}</span>
          <span class="pts-q-label">pt</span>
        </button>
      </div>
    </section>

    <transition name="err">
      <div v-if="error" class="ap-error" role="alert">
        <i class="fas fa-exclamation-triangle"></i> {{ error }}
      </div>
    </transition>

    <div class="ap-cta-inline">
      <div class="ap-preview" v-if="hasAnySelection">
        <transition-group name="tag" tag="div" class="ap-preview-inner">
          <span v-if="selectedTeam" :key="'t'" class="prev-tag" :class="selectedTeam + '-tag'">{{ teamName }}</span>
          <span v-if="selectedCycle" :key="'c'" class="prev-tag prev-tag--cycle">{{ cycleName }}</span>
          <span v-if="selectedGame" :key="'g'" class="prev-tag prev-tag--game">🎮 {{ gameName }}</span>
          <span v-if="pointsToAdd > 0" :key="'p'" class="prev-pts">+{{ pointsToAdd }}</span>
        </transition-group>
      </div>
      <button class="ap-submit" @click="addPoints" :disabled="isLoading || !canSubmit">
        <span v-if="!isLoading"><i class="fas fa-bolt"></i>&nbsp; Aggiungi Punti</span>
        <span v-else><i class="fas fa-spinner fa-spin"></i>&nbsp; Salvataggio...</span>
      </button>
    </div>

    <div style="height: 1.5rem"></div>
  </main>

  <transition name="smodal">
    <div v-if="showSuccessModal" class="success-overlay" @click="showSuccessModal = false">
      <div class="success-box" :style="{ '--team-color': overlayColor }">
        <div class="success-confetti">
          <span v-for="n in 8" :key="n" class="confetti-dot" :style="confettiStyle(n)"></span>
        </div>
        <div class="success-emoji">🎉</div>
        <div class="success-pts">+{{ lastPoints }}</div>
        <div class="success-label">punti assegnati!</div>
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
        { id: 'rossi',     name: 'Rossi',     color: '#DC3545', emoji: '🔴' },
        { id: 'verdi',     name: 'Verdi',     color: '#28A745', emoji: '🟢' },
        { id: 'arancioni', name: 'Arancioni', color: '#FD7E14', emoji: '🟠' },
        { id: 'gialli',    name: 'Gialli',    color: '#F5C400', emoji: '🟡' },
        { id: 'bianchi',   name: 'Bianchi',   color: '#E8E8E8', emoji: '⚪' },
        { id: 'blu',       name: 'Blu',       color: '#007BFF', emoji: '🔵' },
      ],
      cycles: [
        { id: 'primo',   name: 'Ciclo', num: 'I'   },
        { id: 'secondo', name: 'Ciclo', num: 'II'  },
        { id: 'terzo',   name: 'Ciclo', num: 'III' },
      ],
      gamesByCycle: {
        primo: [
          { id: 'bandierina',          name: 'Bandierina' },
          { id: 'lupo-ghiaccio',       name: 'Lupo Ghiaccio' },
          { id: 'lupo-coda',           name: 'Lupo Coda' },
          { id: 'staffetta-ostacoli',  name: 'Staffetta ad Ostacoli' },
          { id: 'sparviero',           name: 'Sparviero' },
          { id: 'bowling',             name: 'Bowling' },
        ],
        secondo: [
          { id: 'bandierina-mix',      name: 'Bandierina Mix' },
          { id: 'castelli',            name: 'Castelli' },
          { id: 'pallamano',           name: 'Pallamano' },
          { id: 'lupo-coda',           name: 'Lupo Coda' },
          { id: 'palla-prigioniera',   name: 'Palla Prigioniera' },
          { id: 'tchoukball',          name: 'Tchoukball' },
        ],
        terzo: [
          { id: 'pallamano',           name: 'Pallamano' },
          { id: 'castelli',            name: 'Castelli' },
          { id: 'tchoukball',          name: 'Tchoukball' },
          { id: 'palla-prigioniera',   name: 'Palla Prigioniera' },
          { id: 'bandierina',          name: 'Bandierina' },
          { id: 'tris',                name: 'Tris' },
        ],
      },
      quickPoints: [25, 50, 100, 150],
    };
  },
  computed: {
    availableGames() { return this.selectedCycle ? this.gamesByCycle[this.selectedCycle] : []; },
    currentUser() {
      return JSON.parse(localStorage.getItem('loggedInUser')) || JSON.parse(sessionStorage.getItem('loggedInUser'));
    },
    teamName()  { return this.teams.find(t => t.id === this.selectedTeam)?.name ?? ''; },
    cycleName() { const c = this.cycles.find(c => c.id === this.selectedCycle); return c ? c.num + ' Ciclo' : ''; },
    gameName()  { return this.availableGames.find(g => g.id === this.selectedGame)?.name ?? ''; },
    hasAnySelection() { return this.selectedTeam || this.selectedCycle || this.selectedGame || this.pointsToAdd > 0; },
    canSubmit() { return this.selectedTeam && this.selectedCycle && this.selectedGame && this.pointsToAdd > 0; },
    progressPct() {
      let s = 0;
      if (this.selectedTeam)    s += 25;
      if (this.selectedCycle)   s += 25;
      if (this.selectedGame)    s += 25;
      if (this.pointsToAdd > 0) s += 25;
      return s;
    },
  },
  watch: { selectedCycle() { this.selectedGame = ''; } },
  methods: {
    selectCycle(id) { this.selectedCycle = id; this.selectedGame = ''; },
    confettiStyle(n) {
      const colors = ['#DC3545','#28A745','#FD7E14','#F5C400','#E8E8E8','#007BFF','#667eea','#fff'];
      return { '--angle': ((n - 1) * 45) + 'deg', '--color': colors[(n-1) % colors.length] };
    },
    async addPoints() {
      if (!this.canSubmit) {
        this.error = 'Completa tutti i passaggi prima di confermare.';
        setTimeout(() => { this.error = ''; }, 3500);
        return;
      }
      this.isLoading = true; this.error = '';
      try {
        const ref = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, { [this.selectedTeam]: (snap.data()[this.selectedTeam] || 0) + this.pointsToAdd });
          await this.addHistory();
          const team = this.teams.find(t => t.id === this.selectedTeam);
          this.lastPoints = this.pointsToAdd;
          this.successMessage = team.name + ' — ' + this.gameName;
          this.overlayColor = team.color;
          this.showSuccessModal = true;
          this.selectedTeam = ''; this.selectedCycle = ''; this.selectedGame = ''; this.pointsToAdd = 0;
          setTimeout(() => { this.showSuccessModal = false; }, 2800);
        }
      } catch { this.error = 'Errore durante il salvataggio. Riprova.'; }
      finally { this.isLoading = false; }
    },
    async addHistory() {
      const ref = doc(db, 'points', 'history');
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const user = this.currentUser;
      await updateDoc(ref, {
        history: arrayUnion({
          username: user?.username ?? 'sconosciuto',
          team: this.selectedTeam, game: this.selectedGame,
          cycle: this.selectedCycle, points: this.pointsToAdd,
          timestamp: new Date()
        })
      });
    },
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
* { box-sizing: border-box; }

.ap-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
  position: sticky; top: 0; z-index: 50;
  box-shadow: 0 2px 20px rgba(0,0,0,0.3);
  flex-shrink: 0;
}
.ap-header-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.85rem 1.25rem; max-width: 640px; margin: 0 auto;
}
.ap-brand { display: flex; align-items: center; gap: 0.65rem; }
.ap-trophy { font-size: 1.7rem; filter: drop-shadow(0 0 8px rgba(255,200,0,0.5)); }
.ap-title  { font-size: 1.05rem; font-weight: 900; color: #fff; line-height: 1.2; font-family: 'Nunito', sans-serif; }
.ap-sub    { font-size: 0.72rem; color: rgba(255,255,255,0.45); }
.ap-logout {
  background: rgba(220,53,69,0.15); border: 1.5px solid rgba(220,53,69,0.4);
  color: #ff6b6b; border-radius: 12px; width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 1rem;
  -webkit-tap-highlight-color: transparent; transition: background 0.2s;
}
.ap-logout:active { background: rgba(220,53,69,0.4); }

.ap-progress-bar { height: 2px; background: rgba(102,126,234,0.15); }
.ap-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.5s cubic-bezier(.16,1,.3,1);
  border-radius: 0 2px 2px 0;
}

.ap-main {
  font-family: 'Nunito', sans-serif;
  flex: 1; overflow-y: auto; overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  background: #12122a;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.ap-section { padding: 1.1rem 1.25rem 0; max-width: 640px; margin: 0 auto; transition: opacity 0.25s; }
.ap-section--locked { opacity: 0.4; pointer-events: none; }

.ap-step-head { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.75rem; }
.ap-step-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: #232540; color: #667eea;
  font-size: 0.82rem; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.2s;
}
.ap-step-num.done { background: #667eea; color: #fff; }
.ap-step-title {
  font-size: 0.82rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: rgba(255,255,255,0.45); display: flex; align-items: center; gap: 0.5rem;
}
.ap-hint { font-weight: 600; text-transform: none; font-size: 0.72rem; color: rgba(255,255,255,0.25); }

.team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.55rem; }
.team-tile {
  position: relative; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0.3rem;
  padding: 0.9rem 0.4rem; border-radius: 16px;
  border: 2.5px solid transparent; cursor: pointer;
  transition: transform 0.12s, box-shadow 0.15s, border-color 0.15s;
  font-family: 'Nunito', sans-serif;
  -webkit-tap-highlight-color: transparent; min-height: 78px;
}
.team-tile:active { transform: scale(0.93); }
.team-tile-emoji { font-size: 1.5rem; line-height: 1; }
.team-tile-name  { font-size: 0.85rem; font-weight: 800; line-height: 1; }
.team-tile-check { position: absolute; top: 5px; right: 7px; font-size: 0.75rem; font-weight: 900; }

.rossi-tile     { background: rgba(220,53,69,0.15);  color: #ff6b6b; border-color: rgba(220,53,69,0.25); }
.verdi-tile     { background: rgba(40,167,69,0.15);  color: #51cf66; border-color: rgba(40,167,69,0.25); }
.arancioni-tile { background: rgba(253,126,20,0.15); color: #ffa94d; border-color: rgba(253,126,20,0.25); }
.gialli-tile    { background: rgba(245,196,0,0.15);  color: #F5C400; border-color: rgba(245,196,0,0.25); }
.bianchi-tile   { background: rgba(232,232,232,0.12); color: #E8E8E8; border-color: rgba(232,232,232,0.3); }
.blu-tile       { background: rgba(0,123,255,0.15);  color: #74c0fc; border-color: rgba(0,123,255,0.25); }

.rossi-tile.team-tile--active     { background: rgba(220,53,69,0.3);   border-color: #ff6b6b; box-shadow: 0 4px 18px rgba(220,53,69,0.35);   transform: translateY(-2px); }
.verdi-tile.team-tile--active     { background: rgba(40,167,69,0.3);   border-color: #51cf66; box-shadow: 0 4px 18px rgba(40,167,69,0.35);   transform: translateY(-2px); }
.arancioni-tile.team-tile--active { background: rgba(253,126,20,0.3);  border-color: #ffa94d; box-shadow: 0 4px 18px rgba(253,126,20,0.35);  transform: translateY(-2px); }
.gialli-tile.team-tile--active    { background: rgba(245,196,0,0.3);   border-color: #F5C400; box-shadow: 0 4px 18px rgba(245,196,0,0.35);   transform: translateY(-2px); }
.bianchi-tile.team-tile--active   { background: rgba(232,232,232,0.2); border-color: #E8E8E8; box-shadow: 0 4px 18px rgba(232,232,232,0.25); transform: translateY(-2px); }
.blu-tile.team-tile--active       { background: rgba(0,123,255,0.3);   border-color: #74c0fc; box-shadow: 0 4px 18px rgba(0,123,255,0.35);   transform: translateY(-2px); }

.cycle-row { display: flex; gap: 0.6rem; }
.cycle-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 0.7rem 0.5rem; border-radius: 14px;
  border: 2px solid rgba(102,126,234,0.2);
  background: rgba(102,126,234,0.1); color: #848ae8;
  font-family: 'Nunito', sans-serif;
  cursor: pointer; transition: all 0.15s;
  -webkit-tap-highlight-color: transparent; min-height: 56px;
}
.cycle-btn:active { transform: scale(0.95); }
.cycle-btn--active { background: #667eea; color: #fff; border-color: #667eea; box-shadow: 0 4px 16px rgba(102,126,234,0.38); }
.cycle-num   { font-size: 1rem; font-weight: 900; line-height: 1; }
.cycle-label { font-size: 0.7rem; font-weight: 700; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.05em; }

.game-list { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.game-btn {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 0.9rem; border-radius: 24px;
  border: 1.5px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7);
  font-size: 0.85rem; font-weight: 700;
  font-family: 'Nunito', sans-serif;
  cursor: pointer; transition: all 0.15s;
  -webkit-tap-highlight-color: transparent; min-height: 40px;
}
.game-btn i { font-size: 0.7rem; opacity: 0.6; }
.game-btn:active { transform: scale(0.94); }
.game-btn--active { background: #667eea; color: #fff; border-color: #667eea; box-shadow: 0 3px 12px rgba(102,126,234,0.35); }
.game-btn--active i { opacity: 1; }
.games-fade-enter-active { transition: opacity 0.3s, transform 0.3s; }
.games-fade-enter-from { opacity: 0; transform: translateY(6px); }

.pts-quick { display: flex; gap: 0.55rem; }
.pts-quick-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 1rem 0; border-radius: 14px;
  border: 2px solid rgba(102,126,234,0.2);
  background: rgba(102,126,234,0.1); color: #848ae8;
  cursor: pointer; transition: all 0.15s;
  font-family: 'Nunito', sans-serif;
  -webkit-tap-highlight-color: transparent; min-height: 72px;
}
.pts-quick-btn:active { transform: scale(0.95); }
.pts-quick-btn--active { background: #667eea; color: #fff; border-color: #667eea; box-shadow: 0 4px 16px rgba(102,126,234,0.38); }
.pts-q-val   { font-size: 1.5rem; font-weight: 900; line-height: 1; }
.pts-q-label { font-size: 0.7rem; font-weight: 700; opacity: 0.7; text-transform: uppercase; margin-top: 0.2rem; }

.ap-error {
  max-width: 640px; margin: 0.75rem auto 0;
  padding: 0.8rem 1.25rem;
  background: rgba(220,53,69,0.15); border-radius: 12px;
  color: #ff8b8b; font-size: 0.9rem; font-weight: 700; text-align: center;
}
.err-enter-active, .err-leave-active { transition: opacity 0.25s, transform 0.25s; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-6px); }

.ap-cta-inline { max-width: 640px; margin: 1rem auto 0; padding: 0 1.25rem; display: flex; flex-direction: column; gap: 0.55rem; }
.ap-preview { overflow: hidden; }
.ap-preview-inner { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; min-height: 26px; }
.prev-tag { font-size: 0.75rem; font-weight: 800; padding: 0.22rem 0.65rem; border-radius: 99px; }
.prev-tag--cycle { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
.prev-tag--game  { background: rgba(255,255,255,0.15); color: #fff; }
.rossi-tag     { background: rgba(220,53,69,0.25);  color: #ff6b6b; }
.verdi-tag     { background: rgba(40,167,69,0.25);  color: #51cf66; }
.arancioni-tag { background: rgba(253,126,20,0.25); color: #ffa94d; }
.gialli-tag    { background: rgba(245,196,0,0.25);  color: #F5C400; }
.bianchi-tag   { background: rgba(232,232,232,0.15); color: #E8E8E8; }
.blu-tag       { background: rgba(0,123,255,0.25);  color: #74c0fc; }
.prev-pts { font-size: 1.1rem; font-weight: 900; color: #848ae8; margin-left: auto; }
.tag-enter-active, .tag-leave-active { transition: opacity 0.2s, transform 0.2s; }
.tag-enter-from, .tag-leave-to { opacity: 0; transform: scale(0.8); }

.ap-submit {
  width: 100%; min-height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none; border-radius: 16px;
  color: #fff; font-size: 1.05rem; font-weight: 900;
  font-family: 'Nunito', sans-serif;
  cursor: pointer; letter-spacing: 0.02em;
  box-shadow: 0 6px 22px rgba(102,126,234,0.42);
  transition: transform 0.12s, opacity 0.2s, box-shadow 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.ap-submit:active:not(:disabled) { transform: scale(0.97); }
.ap-submit:hover:not(:disabled)  { box-shadow: 0 10px 30px rgba(102,126,234,0.55); }
.ap-submit:disabled { opacity: 0.45; cursor: not-allowed; }

.success-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.success-box {
  background: #1e1e35; border-radius: 28px;
  padding: 2.5rem 2rem 2rem; text-align: center;
  max-width: 300px; width: 90%;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
  animation: popIn 0.35s cubic-bezier(.16,1,.3,1);
  border-top: 6px solid var(--team-color, #667eea);
  position: relative; overflow: hidden;
}
.success-confetti { position: absolute; inset: 0; pointer-events: none; }
.confetti-dot {
  position: absolute; width: 8px; height: 8px; border-radius: 50%;
  background: var(--color); top: 50%; left: 50%;
  animation: confettiBurst 0.6s ease-out forwards;
  transform-origin: 0 0;
  animation-delay: calc(var(--angle) * 1ms / 20);
}
@keyframes confettiBurst {
  0%   { transform: translate(-50%,-50%) rotate(var(--angle)) translateY(0) scale(1); opacity: 1; }
  100% { transform: translate(-50%,-50%) rotate(var(--angle)) translateY(-80px) scale(0); opacity: 0; }
}
.success-emoji { font-size: 3.5rem; margin-bottom: 0.3rem; }
.success-pts   { font-size: 3rem; font-weight: 900; color: var(--team-color, #667eea); line-height: 1; font-family: 'Nunito', sans-serif; }
.success-label { font-size: 0.85rem; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem; }
.success-msg   { font-size: 1rem; color: rgba(255,255,255,0.7); font-weight: 700; }
.smodal-enter-active, .smodal-leave-active { transition: opacity 0.25s; }
.smodal-enter-from, .smodal-leave-to { opacity: 0; }
@keyframes popIn {
  0%   { opacity: 0; transform: scale(0.7); }
  60%  { transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}

/* ══════════════════════════════════════════
   LIGHT MODE
══════════════════════════════════════════ */
@media (prefers-color-scheme: light) {
  .ap-header {
    background: linear-gradient(135deg, #3b4db8 0%, #2355a0 100%);
    box-shadow: 0 2px 16px rgba(60,80,180,0.18);
  }
  .ap-title { color: #fff; }
  .ap-sub   { color: rgba(255,255,255,0.7); }
  .ap-main { background: #f0f3ff; }
  .ap-step-num { background: #dde3ff; color: #4a5fd4; }
  .ap-step-num.done { background: #667eea; color: #fff; }
  .ap-step-title { color: #5a5f9a; }
  .ap-hint { color: #9399c2; }

  .rossi-tile     { background: rgba(220,53,69,0.1);   border-color: rgba(220,53,69,0.3); }
  .verdi-tile     { background: rgba(40,167,69,0.1);   border-color: rgba(40,167,69,0.3); }
  .arancioni-tile { background: rgba(253,126,20,0.1);  border-color: rgba(253,126,20,0.3); }
  .gialli-tile    { background: rgba(245,196,0,0.1);   border-color: rgba(245,196,0,0.3); color: #b8940a; }
  .bianchi-tile   { background: rgba(100,100,100,0.08); border-color: rgba(100,100,100,0.25); color: #555; }
  .blu-tile       { background: rgba(0,123,255,0.1);   border-color: rgba(0,123,255,0.3); }

  .cycle-btn { background: #e8ecff; color: #4a5fd4; border-color: rgba(102,126,234,0.3); }
  .game-btn { background: #fff; border-color: rgba(102,126,234,0.2); color: #3a3f7a; }
  .pts-quick-btn { background: #e8ecff; color: #4a5fd4; border-color: rgba(102,126,234,0.3); }
  .prev-tag--cycle { background: rgba(102,126,234,0.12); color: #4a5fd4; }
  .prev-tag--game  { background: rgba(102,126,234,0.15); color: #2d3580; }
  .prev-pts { color: #4a5fd4; }
  .ap-error { background: rgba(220,53,69,0.08); color: #c0392b; }
}
</style>
