<template>
  <!-- Notifications -->
  <transition name="notif">
    <div v-if="successMessage || error" class="notif-bar" :class="error ? 'notif-error' : 'notif-success'">
      <i :class="error ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
      <span>{{ error || successMessage }}</span>
      <button class="notif-close" @click="error = ''; successMessage = ''" aria-label="Chiudi">&times;</button>
    </div>
  </transition>

  <!-- Inter Easter Egg -->
  <transition name="inter-fade">
    <div v-if="showInterAnimation" class="inter-overlay">
      <div class="inter-inner">
        <div class="inter-logo">🖤💙</div>
        <div class="inter-text">INTER</div>
        <div class="inter-sub">FORZA INTER!</div>
        <div class="inter-msg">Bentornato campione nerazzurro!</div>
      </div>
    </div>
  </transition>

  <!-- WRAPPER: occupa tutto lo spazio flex lasciato da #app, scorre internamente -->
  <div class="tp-root">

    <!-- HEADER sticky -->
    <header class="tp-header">
      <div class="tp-header-inner">
        <div class="tp-brand">
          <span class="tp-trophy">🏆</span>
          <div>
            <div class="tp-title">Cre Grest</div>
            <div class="tp-sub">Pannello Admin</div>
          </div>
        </div>
        <div class="tp-header-right">
          <div class="tp-user" v-if="currentUser">
            <span class="tp-avatar">{{ currentUser.username.charAt(0).toUpperCase() }}</span>
            <span class="tp-username">{{ currentUser.username }}</span>
          </div>
          <button @click="handleLogout" class="tp-logout" aria-label="Logout">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- TABS sticky -->
    <nav class="tp-tabs" role="tablist">
      <button class="tp-tab" role="tab" :class="{ 'tp-tab--active': activeTab === 'classifica' }" @click="activeTab = 'classifica'" :aria-selected="activeTab === 'classifica'">
        <i class="fas fa-trophy"></i><span>Classifica</span>
      </button>
      <button class="tp-tab" role="tab" :class="{ 'tp-tab--active': activeTab === 'punti' }" @click="activeTab = 'punti'" :aria-selected="activeTab === 'punti'">
        <i class="fas fa-bolt"></i><span>Punti</span>
      </button>
      <button class="tp-tab" role="tab" :class="{ 'tp-tab--active': activeTab === 'storico' }" @click="activeTab = 'storico'" :aria-selected="activeTab === 'storico'">
        <i class="fas fa-history"></i><span>Storico</span>
      </button>
    </nav>

    <!-- CONTENT: questo è l'unico elemento che scorre -->
    <div class="tp-content">

      <!-- TAB: CLASSIFICA -->
      <div v-show="activeTab === 'classifica'" class="tp-panel" role="tabpanel">
        <div v-if="isLoadingPoints" class="skeleton-list">
          <div v-for="n in 6" :key="n" class="skeleton-row">
            <div class="sk sk-circle"></div>
            <div class="sk sk-bar"></div>
            <div class="sk sk-num"></div>
          </div>
        </div>
        <div v-else-if="isRestrictedUser" class="lock-box">
          <div class="lock-icon">🔒</div>
          <h3>Classifica Riservata</h3>
          <p>Non hai i permessi per visualizzare i punteggi.</p>
        </div>
        <template v-else>
          <div v-if="sortedTeams.length" class="fp-card" :class="sortedTeams[0].id + '-fp'">
            <div class="fp-left">
              <span class="fp-medal">🥇</span>
              <div>
                <div class="fp-name" :class="sortedTeams[0].id + '-text'">{{ sortedTeams[0].name }}</div>
                <div class="fp-label">In testa!</div>
              </div>
            </div>
            <div class="fp-score">{{ sortedTeams[0].points }}<small> pt</small></div>
          </div>
          <div class="rank-list">
            <div v-for="(team, i) in sortedTeams" :key="team.id" class="rank-row" :class="{ 'rank-row--podium': i < 3 }">
              <div class="rank-pos">
                <span v-if="i===0">🥇</span>
                <span v-else-if="i===1">🥈</span>
                <span v-else-if="i===2">🥉</span>
                <span v-else class="rank-num">#{{ i+1 }}</span>
              </div>
              <div class="rank-info">
                <div class="rank-name" :class="team.id + '-text'">{{ team.name }}</div>
                <div class="rank-bar-track">
                  <div class="rank-bar" :class="team.id + '-bar'" :style="{ width: barWidth(team.points) + '%' }"></div>
                </div>
              </div>
              <div class="rank-score">{{ team.points }}<span class="rank-score-unit"> pt</span></div>
            </div>
          </div>
          <div class="stats-row">
            <div class="stat-card"><div class="stat-val">{{ totalPoints }}</div><div class="stat-label">Totali</div></div>
            <div class="stat-card"><div class="stat-val">{{ sortedHistory.length }}</div><div class="stat-label">Assegnazioni</div></div>
            <div class="stat-card"><div class="stat-val">{{ leadGap }}</div><div class="stat-label">Vantaggio</div></div>
          </div>
        </template>
      </div>

      <!-- TAB: PUNTI -->
      <div v-show="activeTab === 'punti'" class="tp-panel" role="tabpanel">
        <div class="form-card">
          <div class="fc-group">
            <div class="fc-label"><span class="fc-step">1</span> Squadra</div>
            <div class="team-pills">
              <button
                v-for="team in teams" :key="team.id"
                type="button"
                class="team-pill"
                :class="[team.id + '-pill', { 'team-pill--active': selectedTeam === team.id }]"
                @click="selectedTeam = team.id"
                :aria-pressed="selectedTeam === team.id"
              >
                <span class="tp-pill-dot"></span>{{ team.name }}
              </button>
            </div>
          </div>
          <div class="fc-group">
            <div class="fc-label"><span class="fc-step">2</span> Tipo operazione</div>
            <div class="game-pills">
              <button
                v-for="game in games" :key="game.id"
                type="button"
                class="game-pill"
                :class="{ 'game-pill--active': selectedGame === game.id, 'game-pill--penalty': game.id === 'penitenza' }"
                @click="selectedGame = game.id"
                :aria-pressed="selectedGame === game.id"
              >
                <i :class="game.id === 'penitenza' ? 'fas fa-minus-circle' : 'fas fa-star'"></i>
                {{ game.name }}
              </button>
            </div>
          </div>
          <div class="fc-group">
            <div class="fc-label"><span class="fc-step">3</span> Punti</div>
            <div class="pts-quick">
              <button v-for="q in [10, 25, 50, 100]" :key="q"
                type="button" class="pts-q"
                :class="{ 'pts-q--active': pointsToAdd === q }"
                @click="pointsToAdd = q"
              >{{ q }}</button>
            </div>
            <div class="pts-wrap">
              <button type="button" class="pts-btn" @click="pointsToAdd = Math.max(0, pointsToAdd - 1)" aria-label="Diminuisci">−</button>
              <input class="pts-input" type="number" v-model.number="pointsToAdd" min="0" inputmode="numeric" placeholder="0" />
              <button type="button" class="pts-btn" @click="pointsToAdd++" aria-label="Aumenta">+</button>
            </div>
          </div>
          <transition name="preview">
            <div v-if="selectedTeam && selectedGame && pointsToAdd > 0" class="pts-preview">
              <span :class="selectedTeam + '-text'" style="font-weight:800">{{ teamName(selectedTeam) }}</span>
              &nbsp;·&nbsp;
              <span>{{ gameName(selectedGame) }}</span>
              &nbsp;·&nbsp;
              <span :class="selectedGame === 'penitenza' ? 'neg-pts' : 'pos-pts'">
                {{ selectedGame === 'penitenza' ? '-' : '+' }}{{ pointsToAdd }} pt
              </span>
            </div>
          </transition>
          <button class="tp-submit" :disabled="isLoading || !selectedTeam || !selectedGame" @click="addPoints">
            <span v-if="!isLoading"><i class="fas fa-bolt"></i>&nbsp; Conferma</span>
            <span v-else><i class="fas fa-spinner fa-spin"></i>&nbsp; Salvataggio...</span>
          </button>
        </div>
      </div>

      <!-- TAB: STORICO -->
      <div v-show="activeTab === 'storico'" class="tp-panel" role="tabpanel">
        <div class="h-filters">
          <button class="h-filter-btn" :class="{ 'h-filter-btn--active': historyFilter === '' }" @click="historyFilter = ''">Tutti</button>
          <button v-for="t in teams" :key="t.id" class="h-filter-btn" :class="[t.id + '-filter', { 'h-filter-btn--active': historyFilter === t.id }]" @click="historyFilter = t.id">{{ t.name }}</button>
        </div>
        <div class="h-count">{{ filteredHistory.length }} voci</div>
        <div class="h-list">
          <transition-group name="h-item">
            <div v-for="(entry, index) in filteredHistory.slice(0, visibleHistory)" :key="entry.timestamp + index" class="h-entry" :class="{ 'h-entry--recent': index < 3 && historyFilter === '' }">
              <div class="h-dot" :class="entry.team + '-dot'"></div>
              <div class="h-main">
                <div class="h-top">
                  <span class="h-team" :class="entry.team + '-text'">{{ getTeamName(entry.team) }}</span>
                  <span class="h-sep">·</span>
                  <span class="h-game">{{ getGameName(entry.game) }}</span>
                </div>
                <div class="h-bottom">
                  <span class="h-user"><i class="fas fa-user-circle"></i> {{ entry.username }}</span>
                  <span class="h-sep">·</span>
                  <span class="h-date">{{ formatDate(entry.timestamp) }}</span>
                </div>
              </div>
              <div class="h-pts" :class="entry.points > 0 ? 'h-pts--pos' : 'h-pts--neg'">{{ entry.points > 0 ? '+' : '' }}{{ entry.points }}</div>
              <button v-if="canDeleteEntries" @click="deleteHistoryEntry(entry)" class="h-del" aria-label="Elimina voce"><i class="fas fa-trash"></i></button>
            </div>
          </transition-group>
        </div>
        <button v-if="filteredHistory.length > visibleHistory" class="h-loadmore" @click="visibleHistory += 20">
          <i class="fas fa-chevron-down"></i> Carica altri
        </button>
      </div>

    </div>
  </div>

  <!-- MODAL ELIMINA -->
  <transition name="modal">
    <div v-if="showDeleteModal" class="modal-bg" @click.self="closeDeleteModal" role="dialog" aria-modal="true">
      <div class="modal-box">
        <div class="modal-head">
          <i class="fas fa-exclamation-triangle"></i> Elimina voce
          <button class="modal-x" @click="closeDeleteModal" aria-label="Chiudi">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-details">
            <div class="md-row"><span>Squadra</span><strong :class="entryToDelete?.team + '-text'">{{ getTeamName(entryToDelete?.team) }}</strong></div>
            <div class="md-row"><span>Tipo</span><strong>{{ getGameName(entryToDelete?.game) }}</strong></div>
            <div class="md-row"><span>Punti</span><strong :class="entryToDelete?.points > 0 ? 'h-pts--pos' : 'h-pts--neg'">{{ entryToDelete?.points }}</strong></div>
            <div class="md-row"><span>Utente</span><strong>{{ entryToDelete?.username }}</strong></div>
          </div>
          <div class="modal-warn">⚠️ I punti verranno sottratti dal team. Azione irreversibile.</div>
        </div>
        <div class="modal-foot">
          <button class="modal-del" @click="confirmDelete" :disabled="deletingEntry">
            <i class="fas fa-trash"></i> {{ deletingEntry ? 'Eliminazione...' : 'Elimina' }}
          </button>
          <button class="modal-cancel" @click="closeDeleteModal" :disabled="deletingEntry">Annulla</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { db } from '../firebase';
import { doc, getDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import { useLogout } from '@/composables/useLogout'

export default {
  name: 'TeamPoints',
  setup() {
    const { logout } = useLogout()
    return { handleLogout: logout }
  },
  data() {
    return {
      activeTab: 'classifica',
      historyFilter: '',
      visibleHistory: 20,
      teams: [
        { id: 'rossi',     name: 'Rossi',     points: 0 },
        { id: 'verdi',     name: 'Verdi',     points: 0 },
        { id: 'arancioni', name: 'Arancioni', points: 0 },
        { id: 'blu',       name: 'Blu',       points: 0 },
        { id: 'fucsia',    name: 'Fucsia',    points: 0 },
        { id: 'gialli',    name: 'Gialli',    points: 0 },
      ],
      games: [
        { id: 'puntiSpeciali', name: 'Punti Speciali' },
        { id: 'penitenza',     name: 'Penitenza'      },
      ],
      selectedTeam: '',
      selectedGame: '',
      pointsToAdd: 0,
      error: '',
      successMessage: '',
      pointsHistory: [],
      isLoading: false,
      isLoadingPoints: true,
      showDeleteModal: false,
      entryToDelete: null,
      deletingEntry: false,
      restrictedUsers: ['FalcoCinese', 'AleVitali', 'BreVismara', 'FraTerrone'],
      showInterAnimation: false,
    };
  },
  computed: {
    sortedTeams() { return [...this.teams].sort((a, b) => b.points - a.points); },
    sortedHistory() {
      return [...this.pointsHistory].sort((a, b) => {
        const tA = a.timestamp?.seconds ?? new Date(a.timestamp).getTime() / 1000;
        const tB = b.timestamp?.seconds ?? new Date(b.timestamp).getTime() / 1000;
        return tB - tA;
      });
    },
    filteredHistory() {
      if (!this.historyFilter) return this.sortedHistory;
      return this.sortedHistory.filter(e => e.team === this.historyFilter);
    },
    currentUser() {
      try { return JSON.parse(localStorage.getItem('loggedInUser')) || JSON.parse(sessionStorage.getItem('loggedInUser')); }
      catch { return null; }
    },
    isRestrictedUser() { return this.currentUser && this.restrictedUsers.includes(this.currentUser.username); },
    canDeleteEntries() { return !this.isRestrictedUser; },
    isDonGio() { return this.currentUser?.username === 'DonGio'; },
    maxPoints() { return Math.max(...this.teams.map(t => t.points), 1); },
    totalPoints() { return this.teams.reduce((s, t) => s + t.points, 0); },
    leadGap() { const s = this.sortedTeams; return s.length < 2 ? 0 : s[0].points - s[1].points; },
  },
  async created() {
    await this.fetchTeamPoints();
    await this.fetchPointsHistory();
    if (this.isDonGio) { this.showInterAnimation = true; setTimeout(() => { this.showInterAnimation = false; }, 4000); }
  },
  methods: {
    barWidth(pts) { return Math.max(4, Math.round((pts / this.maxPoints) * 100)); },
    teamName(id)  { return this.teams.find(t => t.id === id)?.name ?? id; },
    gameName(id)  { return this.games.find(g => g.id === id)?.name ?? id; },
    getTeamName(id) { return this.teamName(id); },
    getGameName(id) { return this.gameName(id); },
    async fetchTeamPoints() {
      this.isLoadingPoints = true;
      try {
        const snap = await getDoc(doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ'));
        if (snap.exists()) this.teams.forEach(t => { t.points = snap.data()[t.id] || 0; });
      } catch { this.error = 'Errore caricamento punteggi.'; }
      finally { this.isLoadingPoints = false; }
    },
    async addPoints() {
      if (!this.selectedTeam || !this.selectedGame) {
        this.error = 'Seleziona squadra e tipo.'; setTimeout(() => { this.error = ''; }, 3000); return;
      }
      this.isLoading = true;
      try {
        const ref  = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          let pts = parseInt(this.pointsToAdd);
          if (this.selectedGame === 'penitenza' && pts > 0) pts = -pts;
          await updateDoc(ref, { [this.selectedTeam]: (snap.data()[this.selectedTeam] || 0) + pts });
          await this.addHistory(pts);
          this.successMessage = `${pts > 0 ? '+' : ''}${pts} pt a ${this.teamName(this.selectedTeam)}!`;
          this.selectedTeam = ''; this.selectedGame = ''; this.pointsToAdd = 0;
          await this.fetchTeamPoints(); await this.fetchPointsHistory();
          this.activeTab = 'classifica';
          setTimeout(() => { this.successMessage = ''; }, 4000);
        }
      } catch { this.error = 'Errore durante il salvataggio.'; }
      finally { this.isLoading = false; }
    },
    async addHistory(pts) {
      try {
        const ref = doc(db, 'points', 'history');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, { history: arrayUnion({ username: this.currentUser?.username ?? 'unknown', team: this.selectedTeam, game: this.selectedGame, points: pts, timestamp: new Date() }) });
        }
      // eslint-disable-next-line no-empty
      } catch {}
    },
    async fetchPointsHistory() {
      try {
        const snap = await getDoc(doc(db, 'points', 'history'));
        if (snap.exists()) this.pointsHistory = snap.data().history || [];
      // eslint-disable-next-line no-empty
      } catch {}
    },
    formatDate(ts) {
      if (!ts) return '';
      const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    },
    deleteHistoryEntry(entry) { this.entryToDelete = entry; this.showDeleteModal = true; },
    closeDeleteModal() { this.showDeleteModal = false; this.entryToDelete = null; this.deletingEntry = false; },
    async confirmDelete() {
      if (!this.entryToDelete) return;
      this.deletingEntry = true;
      try {
        const ref  = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const hRef = doc(db, 'points', 'history');
        const [snap, hSnap] = await Promise.all([getDoc(ref), getDoc(hRef)]);
        if (snap.exists() && hSnap.exists()) {
          const entry = this.entryToDelete;
          const newPts = (snap.data()[entry.team] || 0) - entry.points;
          const newHistory = hSnap.data().history.filter(h =>
            !(h.team === entry.team && h.game === entry.game && h.points === entry.points &&
              h.username === entry.username &&
              (h.timestamp?.seconds === entry.timestamp?.seconds ||
               new Date(h.timestamp).getTime() === new Date(entry.timestamp).getTime()))
          );
          await Promise.all([
            updateDoc(ref, { [entry.team]: newPts }),
            updateDoc(hRef, { history: newHistory })
          ]);
          await this.fetchTeamPoints();
          await this.fetchPointsHistory();
          this.successMessage = 'Voce eliminata.';
          setTimeout(() => { this.successMessage = ''; }, 3000);
        }
      } catch { this.error = 'Errore durante l\'eliminazione.'; }
      finally { this.closeDeleteModal(); }
    },
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
* { box-sizing: border-box; }

.tp-root {
  font-family: 'Nunito', sans-serif;
  background: #0f0f1a;
  color: #e8e8f0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.tp-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
  position: sticky; top: 0; z-index: 50;
  box-shadow: 0 2px 20px rgba(0,0,0,0.3);
  flex-shrink: 0;
}
.tp-header-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.85rem 1.25rem; max-width: 700px; margin: 0 auto;
}
.tp-brand { display: flex; align-items: center; gap: 0.65rem; }
.tp-trophy { font-size: 1.7rem; filter: drop-shadow(0 0 8px rgba(255,200,0,0.5)); }
.tp-title  { font-size: 1rem; font-weight: 900; color: #fff; line-height: 1.2; }
.tp-sub    { font-size: 0.72rem; color: rgba(255,255,255,0.45); }
.tp-header-right { display: flex; align-items: center; gap: 0.6rem; }
.tp-user { display: flex; align-items: center; gap: 0.45rem; }
.tp-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 900; color: #fff;
}
.tp-username { font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.7); }
.tp-logout {
  background: rgba(220,53,69,0.15); border: 1.5px solid rgba(220,53,69,0.4);
  color: #ff6b6b; border-radius: 12px; width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 0.95rem;
  -webkit-tap-highlight-color: transparent; transition: background 0.2s;
}
.tp-logout:active { background: rgba(220,53,69,0.4); }

.tp-tabs {
  display: flex;
  background: #131326;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
  position: sticky; top: 62px; z-index: 40;
}
.tp-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.85rem 0.5rem; font-size: 0.82rem; font-weight: 800;
  color: rgba(255,255,255,0.4); border-bottom: 2px solid transparent;
  cursor: pointer; transition: color 0.15s, border-color 0.15s;
  font-family: 'Nunito', sans-serif; -webkit-tap-highlight-color: transparent;
}
.tp-tab i { font-size: 0.9rem; }
.tp-tab--active { color: #667eea; border-bottom-color: #667eea; }

.tp-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.75rem 1rem 2rem;
  box-sizing: border-box;
  width: 100%;
}

.tp-panel { max-width: 700px; margin: 0 auto; }

.skeleton-list { display: flex; flex-direction: column; gap: 0.6rem; padding: 0.5rem 0; }
.skeleton-row  { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: rgba(255,255,255,0.04); border-radius: 14px; }
.sk { background: rgba(255,255,255,0.08); border-radius: 6px; animation: skshimmer 1.4s ease-in-out infinite; }
.sk-circle { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
.sk-bar    { flex: 1; height: 14px; }
.sk-num    { width: 48px; height: 22px; }
@keyframes skshimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

.lock-box { text-align: center; padding: 3rem 1rem; }
.lock-icon { font-size: 3rem; margin-bottom: 0.75rem; }
.lock-box h3 { color: #fff; font-size: 1.1rem; margin-bottom: 0.35rem; }
.lock-box p  { color: rgba(255,255,255,0.4); font-size: 0.9rem; }

.fp-card {
  border-radius: 20px; padding: 1.1rem 1.25rem;
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.85rem;
}
.fp-left { display: flex; align-items: center; gap: 0.75rem; }
.fp-medal { font-size: 2rem; }
.fp-name  { font-size: 1.1rem; font-weight: 900; }
.fp-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.6; margin-top: 0.1rem; }
.fp-score { font-size: 2rem; font-weight: 900; }
.fp-score small { font-size: 0.9rem; opacity: 0.6; }

.rossi-fp     { background: rgba(220,53,69,0.15); border: 1px solid rgba(220,53,69,0.3); }
.verdi-fp     { background: rgba(40,167,69,0.15); border: 1px solid rgba(40,167,69,0.3); }
.arancioni-fp { background: rgba(253,126,20,0.15); border: 1px solid rgba(253,126,20,0.3); }
.blu-fp       { background: rgba(0,123,255,0.15); border: 1px solid rgba(0,123,255,0.3); }
.fucsia-fp    { background: rgba(232,62,140,0.15); border: 1px solid rgba(232,62,140,0.3); }
.gialli-fp    { background: rgba(200,150,12,0.15); border: 1px solid rgba(200,150,12,0.3); }

.rank-list { display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 0.85rem; }
.rank-row {
  display: flex; align-items: center; gap: 0.75rem;
  background: rgba(255,255,255,0.04); border-radius: 14px;
  padding: 0.7rem 1rem; transition: background 0.15s;
}
.rank-row--podium { background: rgba(255,255,255,0.06); }
.rank-pos { width: 32px; text-align: center; font-size: 1.1rem; flex-shrink: 0; }
.rank-num { font-size: 0.82rem; font-weight: 800; color: rgba(255,255,255,0.35); }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 0.9rem; font-weight: 800; margin-bottom: 0.3rem; }
.rank-bar-track { height: 4px; background: rgba(255,255,255,0.1); border-radius: 99px; overflow: hidden; }
.rank-bar  { height: 100%; border-radius: 99px; transition: width 0.6s cubic-bezier(.16,1,.3,1); }
.rank-score { font-size: 1rem; font-weight: 900; color: #e8e8f0; white-space: nowrap; }
.rank-score-unit { font-size: 0.7rem; opacity: 0.5; font-weight: 700; }

.rossi-text     { color: #ff6b6b; }
.verdi-text     { color: #51cf66; }
.arancioni-text { color: #ffa94d; }
.blu-text       { color: #74c0fc; }
.fucsia-text    { color: #f78cc6; }
.gialli-text    { color: #ffd43b; }

.rossi-bar     { background: #DC3545; }
.verdi-bar     { background: #28A745; }
.arancioni-bar { background: #FD7E14; }
.blu-bar       { background: #007BFF; }
.fucsia-bar    { background: #E83E8C; }
.gialli-bar    { background: #c8960c; }

.stats-row { display: flex; gap: 0.6rem; margin-top: 0.6rem; }
.stat-card {
  flex: 1; background: rgba(255,255,255,0.05); border-radius: 14px;
  padding: 0.85rem 0.5rem; text-align: center;
}
.stat-val   { font-size: 1.4rem; font-weight: 900; color: #667eea; }
.stat-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); margin-top: 0.2rem; }

.form-card {
  background: rgba(255,255,255,0.04);
  border-radius: 20px;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.fc-group { display: flex; flex-direction: column; gap: 0.55rem; }
.fc-label {
  font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.08em; color: rgba(255,255,255,0.4);
  display: flex; align-items: center; gap: 0.45rem;
}
.fc-step {
  width: 20px; height: 20px; border-radius: 50%;
  background: #667eea; color: #fff;
  font-size: 0.7rem; font-weight: 900;
  display: inline-flex; align-items: center; justify-content: center;
}

.team-pills { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.team-pill {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 0.9rem; border-radius: 99px;
  border: 1.5px solid transparent; font-size: 0.88rem; font-weight: 800;
  cursor: pointer; font-family: 'Nunito', sans-serif;
  transition: all 0.15s; -webkit-tap-highlight-color: transparent;
}
.tp-pill-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

.rossi-pill     { background: rgba(220,53,69,0.12); color: #ff6b6b; border-color: rgba(220,53,69,0.2); }
.verdi-pill     { background: rgba(40,167,69,0.12); color: #51cf66; border-color: rgba(40,167,69,0.2); }
.arancioni-pill { background: rgba(253,126,20,0.12); color: #ffa94d; border-color: rgba(253,126,20,0.2); }
.blu-pill       { background: rgba(0,123,255,0.12); color: #74c0fc; border-color: rgba(0,123,255,0.2); }
.fucsia-pill    { background: rgba(232,62,140,0.12); color: #f78cc6; border-color: rgba(232,62,140,0.2); }
.gialli-pill    { background: rgba(200,150,12,0.12); color: #ffd43b; border-color: rgba(200,150,12,0.2); }

.rossi-pill.team-pill--active     { background: rgba(220,53,69,0.3); border-color: #ff6b6b; }
.verdi-pill.team-pill--active     { background: rgba(40,167,69,0.3); border-color: #51cf66; }
.arancioni-pill.team-pill--active { background: rgba(253,126,20,0.3); border-color: #ffa94d; }
.blu-pill.team-pill--active       { background: rgba(0,123,255,0.3); border-color: #74c0fc; }
.fucsia-pill.team-pill--active    { background: rgba(232,62,140,0.3); border-color: #f78cc6; }
.gialli-pill.team-pill--active    { background: rgba(200,150,12,0.3); border-color: #ffd43b; }

.game-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.game-pill {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1rem; border-radius: 99px;
  border: 1.5px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7);
  font-size: 0.88rem; font-weight: 700; cursor: pointer;
  font-family: 'Nunito', sans-serif;
  transition: all 0.15s; -webkit-tap-highlight-color: transparent;
}
.game-pill--active { background: #667eea; color: #fff; border-color: #667eea; box-shadow: 0 3px 12px rgba(102,126,234,0.35); }
.game-pill--penalty { color: #ff8b8b; border-color: rgba(220,53,69,0.25); background: rgba(220,53,69,0.1); }
.game-pill--penalty.game-pill--active { background: #DC3545; border-color: #DC3545; box-shadow: 0 3px 12px rgba(220,53,69,0.35); color: #fff; }

.pts-quick { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; }
.pts-q {
  flex: 1; padding: 0.6rem 0; border-radius: 12px;
  border: 1.5px solid rgba(102,126,234,0.2);
  background: rgba(102,126,234,0.1); color: #848ae8;
  font-size: 0.95rem; font-weight: 900; cursor: pointer;
  font-family: 'Nunito', sans-serif; transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.pts-q--active { background: #667eea; color: #fff; border-color: #667eea; box-shadow: 0 3px 12px rgba(102,126,234,0.35); }

.pts-wrap {
  display: flex; align-items: center; gap: 0.5rem;
  width: 100%; box-sizing: border-box;
}
.pts-btn {
  flex-shrink: 0; width: 44px; height: 44px; min-width: 44px; min-height: 44px;
  border-radius: 12px; background: rgba(102,126,234,0.15); color: #667eea;
  font-size: 1.4rem; font-weight: 900; border: 1.5px solid rgba(102,126,234,0.25);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, transform 0.1s;
  -webkit-tap-highlight-color: transparent; font-family: 'Nunito', sans-serif; line-height: 1;
}
.pts-btn:active { transform: scale(0.93); background: rgba(102,126,234,0.3); }
.pts-input {
  flex: 1; min-width: 0; text-align: center;
  font-size: 1.3rem; font-weight: 900; font-family: 'Nunito', sans-serif;
  border: 1.5px solid rgba(102,126,234,0.2); border-radius: 12px;
  padding: 0.5rem 0.25rem; background: rgba(255,255,255,0.06); color: #e8e8f0;
  outline: none; -webkit-appearance: none; appearance: none; box-sizing: border-box;
}
.pts-input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.2); }

.pts-preview {
  text-align: center; font-size: 0.9rem; font-weight: 700;
  padding: 0.6rem 1rem; background: rgba(255,255,255,0.05);
  border-radius: 12px; color: rgba(255,255,255,0.7);
}
.pos-pts { color: #51cf66; font-weight: 900; }
.neg-pts { color: #ff6b6b; font-weight: 900; }
.preview-enter-active, .preview-leave-active { transition: opacity 0.2s, transform 0.2s; }
.preview-enter-from, .preview-leave-to { opacity: 0; transform: translateY(-4px); }

.tp-submit {
  width: 100%; min-height: 52px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none; border-radius: 14px; color: #fff;
  font-size: 1rem; font-weight: 900; font-family: 'Nunito', sans-serif;
  cursor: pointer; box-shadow: 0 4px 18px rgba(102,126,234,0.38);
  transition: transform 0.12s, opacity 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.tp-submit:active:not(:disabled) { transform: scale(0.97); }
.tp-submit:disabled { opacity: 0.4; cursor: not-allowed; }

.notif-bar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.9rem 1.25rem; font-size: 0.9rem; font-weight: 700;
  font-family: 'Nunito', sans-serif;
}
.notif-success { background: #28A745; color: #fff; }
.notif-error   { background: #DC3545; color: #fff; }
.notif-close { margin-left: auto; background: none; border: none; color: inherit; font-size: 1.3rem; cursor: pointer; line-height: 1; }
.notif-enter-active, .notif-leave-active { transition: transform 0.3s, opacity 0.3s; }
.notif-enter-from, .notif-leave-to { transform: translateY(-100%); opacity: 0; }

.h-filters { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
.h-filter-btn {
  padding: 0.35rem 0.85rem; border-radius: 99px;
  border: 1.5px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5);
  font-size: 0.8rem; font-weight: 700; cursor: pointer;
  font-family: 'Nunito', sans-serif; transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.h-filter-btn--active { background: #667eea; color: #fff; border-color: #667eea; }
.rossi-filter.h-filter-btn--active     { background: #DC3545; border-color: #DC3545; }
.verdi-filter.h-filter-btn--active     { background: #28A745; border-color: #28A745; }
.arancioni-filter.h-filter-btn--active { background: #FD7E14; border-color: #FD7E14; }
.blu-filter.h-filter-btn--active       { background: #007BFF; border-color: #007BFF; }
.fucsia-filter.h-filter-btn--active    { background: #E83E8C; border-color: #E83E8C; }
.gialli-filter.h-filter-btn--active    { background: #c8960c; border-color: #c8960c; }

.h-count { font-size: 0.75rem; color: rgba(255,255,255,0.3); font-weight: 700; margin-bottom: 0.5rem; }
.h-list  { display: flex; flex-direction: column; gap: 0.4rem; }
.h-entry {
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.7rem 0.9rem; background: rgba(255,255,255,0.04);
  border-radius: 12px; transition: background 0.15s;
}
.h-entry--recent { background: rgba(102,126,234,0.08); }
.h-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.rossi-dot     { background: #DC3545; }
.verdi-dot     { background: #28A745; }
.arancioni-dot { background: #FD7E14; }
.blu-dot       { background: #007BFF; }
.fucsia-dot    { background: #E83E8C; }
.gialli-dot    { background: #c8960c; }

.h-main { flex: 1; min-width: 0; }
.h-top  { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
.h-team { font-size: 0.88rem; font-weight: 800; }
.h-game { font-size: 0.8rem; color: rgba(255,255,255,0.5); font-weight: 700; }
.h-sep  { color: rgba(255,255,255,0.2); font-size: 0.75rem; }
.h-bottom { display: flex; align-items: center; gap: 0.35rem; margin-top: 0.15rem; }
.h-user { font-size: 0.72rem; color: rgba(255,255,255,0.35); font-weight: 700; }
.h-date { font-size: 0.72rem; color: rgba(255,255,255,0.25); }
.h-pts  { font-size: 0.95rem; font-weight: 900; flex-shrink: 0; }
.h-pts--pos { color: #51cf66; }
.h-pts--neg { color: #ff6b6b; }
.h-del {
  background: rgba(220,53,69,0.1); border: 1px solid rgba(220,53,69,0.2);
  color: #ff6b6b; border-radius: 8px; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 0.75rem; flex-shrink: 0;
  -webkit-tap-highlight-color: transparent; transition: background 0.15s;
}
.h-del:active { background: rgba(220,53,69,0.3); }
.h-loadmore {
  width: 100%; margin-top: 0.75rem; padding: 0.7rem;
  background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 12px; color: rgba(255,255,255,0.5); font-size: 0.85rem; font-weight: 700;
  cursor: pointer; font-family: 'Nunito', sans-serif; transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.h-loadmore:active { background: rgba(255,255,255,0.1); }
.h-item-enter-active, .h-item-leave-active { transition: opacity 0.2s, transform 0.2s; }
.h-item-enter-from, .h-item-leave-to { opacity: 0; transform: translateX(-8px); }

.modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 9998; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  padding: 1rem;
}
.modal-box {
  background: #1e1e35; border-radius: 20px; width: 100%; max-width: 380px;
  overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}
.modal-head {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 1rem 1.25rem; background: rgba(220,53,69,0.12);
  color: #ff8b8b; font-size: 0.9rem; font-weight: 800;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.modal-x { margin-left: auto; background: none; border: none; color: inherit; font-size: 1.3rem; cursor: pointer; }
.modal-body { padding: 1.1rem 1.25rem; }
.modal-details { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.85rem; }
.md-row {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 0.88rem; padding: 0.45rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.md-row span { color: rgba(255,255,255,0.4); font-weight: 700; }
.md-row strong { font-weight: 800; color: #e8e8f0; }
.modal-warn { font-size: 0.82rem; color: #ffcc5c; font-weight: 700; background: rgba(255,204,92,0.1); padding: 0.6rem 0.85rem; border-radius: 10px; }
.modal-foot { display: flex; gap: 0.6rem; padding: 0.85rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.07); }
.modal-del {
  flex: 1; padding: 0.7rem; border-radius: 12px;
  background: #DC3545; color: #fff; border: none;
  font-size: 0.9rem; font-weight: 800; cursor: pointer;
  font-family: 'Nunito', sans-serif; transition: opacity 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.modal-del:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-cancel {
  flex: 1; padding: 0.7rem; border-radius: 12px;
  background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6);
  border: none; font-size: 0.9rem; font-weight: 800; cursor: pointer;
  font-family: 'Nunito', sans-serif;
  -webkit-tap-highlight-color: transparent;
}
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .modal-box, .modal-leave-active .modal-box { transition: transform 0.25s cubic-bezier(.16,1,.3,1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.92) translateY(12px); }

.inter-overlay {
  position: fixed; inset: 0; z-index: 99999;
  background: #0a0a1a;
  display: flex; align-items: center; justify-content: center;
}
.inter-inner { text-align: center; }
.inter-logo  { font-size: 3rem; margin-bottom: 0.5rem; }
.inter-text  { font-size: 3.5rem; font-weight: 900; color: #74c0fc; letter-spacing: 0.1em; font-family: 'Nunito', sans-serif; }
.inter-sub   { font-size: 1.1rem; font-weight: 800; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.15em; }
.inter-msg   { font-size: 0.9rem; color: rgba(255,255,255,0.35); margin-top: 0.5rem; }
.inter-fade-enter-active, .inter-fade-leave-active { transition: opacity 0.5s; }
.inter-fade-enter-from, .inter-fade-leave-to { opacity: 0; }

/* ═════════════════════════════════════════════
   LIGHT MODE — TotalPoint
═════════════════════════════════════════════ */
@media (prefers-color-scheme: light) {
  .tp-root    { background: #f0f3ff; color: #1a1a3e; }

  /* Header: gradient medio-scuro, testo bianco (leggibile) */
  .tp-header  { background: linear-gradient(135deg, #3b4db8 0%, #2355a0 100%); box-shadow: 0 2px 16px rgba(60,80,180,0.18); }
  .tp-title   { color: #fff; }
  .tp-sub     { color: rgba(255,255,255,0.7); }
  .tp-username { color: rgba(255,255,255,0.85); }
  .tp-avatar  { background: rgba(255,255,255,0.22); color: #fff; }

  /* Tab bar */
  .tp-tabs    { background: #fff; border-bottom: 1px solid rgba(102,126,234,0.15); }
  .tp-tab     { color: #6b7280; }
  .tp-tab--active { color: #4a5fd4; border-bottom-color: #4a5fd4; }

  /* Skeleton */
  .skeleton-row { background: rgba(102,126,234,0.06); }
  .sk           { background: linear-gradient(90deg,#dde3ff 25%,#eef0ff 50%,#dde3ff 75%); background-size: 200% 100%; }

  /* Lock box */
  .lock-box h3 { color: #1a1a3e; }
  .lock-box p  { color: #6b7280; }

  /* First place card (mantieni i colori squadra, solo sfondo più chiaro) */
  .rossi-fp     { background: rgba(220,53,69,0.08);  border-color: rgba(220,53,69,0.25); }
  .verdi-fp     { background: rgba(40,167,69,0.08);  border-color: rgba(40,167,69,0.25); }
  .arancioni-fp { background: rgba(253,126,20,0.08); border-color: rgba(253,126,20,0.25); }
  .blu-fp       { background: rgba(0,123,255,0.08);  border-color: rgba(0,123,255,0.25); }
  .fucsia-fp    { background: rgba(232,62,140,0.08); border-color: rgba(232,62,140,0.25); }
  .gialli-fp    { background: rgba(200,150,12,0.08); border-color: rgba(200,150,12,0.25); }

  /* Rank rows */
  .rank-row         { background: #fff; }
  .rank-row--podium { background: #f5f7ff; }
  .rank-bar-track   { background: rgba(102,126,234,0.12); }
  .rank-score       { color: #1a1a3e; }
  .rank-num         { color: #9ca3af; }

  /* Stats */
  .stat-card  { background: #fff; }
  .stat-val   { color: #4a5fd4; }
  .stat-label { color: #9ca3af; }

  /* Form card */
  .form-card  { background: #fff; border: 1px solid rgba(102,126,234,0.1); }
  .fc-label   { color: #5a5f9a; }

  /* Team pills */
  .team-pill          { background: #f0f3ff; }
  .rossi-pill         { border-color: rgba(220,53,69,0.3); }
  .verdi-pill         { border-color: rgba(40,167,69,0.3); }
  .arancioni-pill     { border-color: rgba(253,126,20,0.3); }
  .blu-pill           { border-color: rgba(0,123,255,0.3); }
  .fucsia-pill        { border-color: rgba(232,62,140,0.3); }
  .gialli-pill        { border-color: rgba(200,150,12,0.3); }

  /* Game pills */
  .game-pill          { background: #f0f3ff; border-color: rgba(102,126,234,0.2); color: #3a3f7a; }
  .game-pill--penalty { background: rgba(220,53,69,0.06); color: #c0392b; }

  /* Quick pts */
  .pts-q    { background: #e8ecff; color: #4a5fd4; border-color: rgba(102,126,234,0.3); }
  .pts-btn  { background: #e8ecff; color: #4a5fd4; border-color: rgba(102,126,234,0.3); }
  .pts-input { background: #fff; color: #1a1a3e; border-color: rgba(102,126,234,0.3); }

  /* Preview */
  .pts-preview { background: rgba(102,126,234,0.07); color: #3a3f7a; }

  /* History */
  .h-filter-btn { background: #e8ecff; border-color: rgba(102,126,234,0.2); color: #4a5fd4; }
  .h-count      { color: #9ca3af; }
  .h-entry      { background: #fff; }
  .h-entry--recent { background: rgba(102,126,234,0.07); }
  .h-game  { color: #6b7280; }
  .h-sep   { color: #d1d5db; }
  .h-user  { color: #9ca3af; }
  .h-date  { color: #b0b5c3; }
  .h-loadmore { background: #e8ecff; border-color: rgba(102,126,234,0.2); color: #4a5fd4; }

  /* Modal */
  .modal-box   { background: #fff; }
  .modal-head  { background: rgba(220,53,69,0.06); color: #c0392b; border-bottom-color: rgba(0,0,0,0.06); }
  .md-row      { border-bottom-color: rgba(0,0,0,0.05); }
  .md-row span { color: #6b7280; }
  .md-row strong { color: #1a1a3e; }
  .modal-warn  { background: rgba(255,204,92,0.12); color: #7a5c00; }
  .modal-foot  { border-top-color: rgba(0,0,0,0.06); }
  .modal-cancel { background: #f0f3ff; color: #4a5fd4; }
}

/* ══════════════════════════════════════
   LIGHT MODE — TotalPoint
══════════════════════════════════════ */
@media (prefers-color-scheme: light) {
  .tp-header {
    background: linear-gradient(135deg, #3b4db8 0%, #2355a0 100%);
    box-shadow: 0 2px 16px rgba(60,80,180,0.18);
  }
  .tp-title    { color: #fff; }
  .tp-sub      { color: rgba(255,255,255,0.7); }
  .tp-username { color: rgba(255,255,255,0.85); }
  .tp-avatar   { background: rgba(255,255,255,0.2); color: #fff; }
  .tp-tabs { background: #fff; border-bottom: 1px solid rgba(102,126,234,0.15); }
  .tp-tab  { color: #6b7280; }
  .tp-tab--active { color: #4a5fd4; border-bottom-color: #4a5fd4; }
  .tp-content { background: #f0f3ff; }
  .tp-root    { background: #f0f3ff; }
  .rank-row { background: #fff; }
  .rank-row--podium { background: #f5f7ff; }
  .rank-bar-track { background: rgba(102,126,234,0.12); }
  .rank-score { color: #4a5fd4; }
  .rank-num { color: #9ca3af; }
  .fp-card { background: #eef1ff; border-color: rgba(102,126,234,0.3); }
  .fp-label { color: #6b7280; }
  .fp-score { color: #4a5fd4; }
  .stat-card { background: #fff; }
  .stat-val  { color: #4a5fd4; }
  .stat-label { color: #9ca3af; }
  .form-card { background: #fff; }
  .fc-label  { color: #5a5f9a; }
  .fc-step   { background: #dde3ff; color: #4a5fd4; }
  .team-pill { background: #f0f3ff; border-color: rgba(102,126,234,0.25); color: #3a3f7a; }
  .game-pill { background: #f0f3ff; border-color: rgba(102,126,234,0.2); color: #3a3f7a; }
  .pts-q   { background: #e8ecff; color: #4a5fd4; border-color: rgba(102,126,234,0.3); }
  .pts-btn  { background: #e8ecff; color: #4a5fd4; }
  .pts-input { background: #fff; color: #1a1a3e; border-color: rgba(102,126,234,0.3); }
  .hist-row  { background: #fff; border-color: rgba(102,126,234,0.1); }
  .hist-meta { color: #9ca3af; }
  .lock-box { background: #fff; }
  .lock-box h3 { color: #1a1a3e; }
  .lock-box p  { color: #6b7280; }
  .sk { background: linear-gradient(90deg,#e8ecff 25%,#f0f3ff 50%,#e8ecff 75%); background-size: 200% 100%; }
  .notif-bar { background: #fff; color: #1a1a3e; box-shadow: 0 2px 12px rgba(60,80,180,0.12); }
  .notif-success { border-left-color: #28a745; }
  .notif-error   { border-left-color: #dc3545; }
}
</style>
