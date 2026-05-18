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

  <!-- WRAPPER: altezza schermo, no scroll globale -->
  <div class="tp-root">

    <!-- HEADER -->
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

    <!-- TABS -->
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

    <!-- CONTENT: scroll solo qui dentro -->
    <div class="tp-content">

      <!-- ══ TAB: CLASSIFICA ══ -->
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

      <!-- ══ TAB: PUNTI ══ -->
      <div v-show="activeTab === 'punti'" class="tp-panel" role="tabpanel">
        <div class="form-card">

          <!-- SQUADRA -->
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

          <!-- TIPO -->
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

          <!-- PUNTI -->
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

          <!-- PREVIEW -->
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

      <!-- ══ TAB: STORICO ══ -->
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

    </div><!-- /tp-content -->
  </div><!-- /tp-root -->

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
      } catch {}
    },
    async fetchPointsHistory() {
      try {
        const snap = await getDoc(doc(db, 'points', 'history'));
        if (snap.exists()) this.pointsHistory = snap.data().history || [];
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
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error();
        await updateDoc(ref, { [this.entryToDelete.team]: (snap.data()[this.entryToDelete.team] || 0) - this.entryToDelete.points });
        const hRef  = doc(db, 'points', 'history');
        const hSnap = await getDoc(hRef);
        if (!hSnap.exists()) throw new Error();
        const e = this.entryToDelete;
        const updated = (hSnap.data().history || []).filter(x => {
          const tA = x.timestamp?.seconds ?? new Date(x.timestamp).getTime() / 1000;
          const tB = e.timestamp?.seconds   ?? new Date(e.timestamp).getTime() / 1000;
          return !(Math.abs(tA - tB) < 1 && x.team === e.team && x.game === e.game && x.points === e.points && x.username === e.username);
        });
        await updateDoc(hRef, { history: updated });
        await this.fetchTeamPoints(); await this.fetchPointsHistory();
        this.successMessage = '🗑️ Voce eliminata!';
        this.closeDeleteModal();
        setTimeout(() => { this.successMessage = ''; }, 4000);
      } catch { this.error = 'Errore eliminazione.'; this.deletingEntry = false; }
    },
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
* { box-sizing: border-box; }

/* ── ROOT: schermo intero, no scroll globale ── */
.tp-root {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  font-family: 'Nunito', sans-serif;
}

/* ── CONTENT: unica area scrollabile ── */
.tp-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* ── NOTIFICATIONS ── */
.notif-bar {
  position: fixed; top: 1rem; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; align-items: center; gap: 0.65rem;
  padding: 0.8rem 1.25rem; border-radius: 12px; font-weight: 700;
  font-size: 0.88rem; box-shadow: 0 8px 30px rgba(0,0,0,0.18);
  min-width: 260px; max-width: 90vw; font-family: 'Nunito', sans-serif;
}
.notif-success { background: #d4edda; color: #155724; border: 1.5px solid #c3e6cb; }
.notif-error   { background: #f8d7da; color: #721c24; border: 1.5px solid #f5c6cb; }
.notif-close { margin-left: auto; background: none; border: none; font-size: 1.3rem; cursor: pointer; opacity: 0.7; }
.notif-enter-active, .notif-leave-active { transition: opacity .3s, transform .3s; }
.notif-enter-from, .notif-leave-to { opacity: 0; transform: translateX(-50%) translateY(-12px); }

/* ── INTER EASTER EGG ── */
.inter-overlay {
  position: fixed; inset: 0; z-index: 9998;
  background: linear-gradient(135deg, #0b0b1a 0%, #003580 50%, #0b0b1a 100%);
  display: flex; align-items: center; justify-content: center;
}
.inter-inner { text-align: center; color: #fff; }
.inter-logo { font-size: 4rem; margin-bottom: 0.5rem; animation: pulse 0.8s ease-in-out infinite alternate; }
.inter-text  { font-size: 4rem; font-weight: 900; letter-spacing: 0.15em; color: #74c0fc; text-shadow: 0 0 40px rgba(116,192,252,0.8); font-family: 'Nunito', sans-serif; }
.inter-sub   { font-size: 1.3rem; font-weight: 800; color: #e9ecef; margin-top: 0.4rem; }
.inter-msg   { font-size: 0.95rem; color: rgba(255,255,255,0.55); margin-top: 0.5rem; }
.inter-fade-enter-active, .inter-fade-leave-active { transition: opacity 0.5s; }
.inter-fade-enter-from, .inter-fade-leave-to { opacity: 0; }
@keyframes pulse { from{transform:scale(1)} to{transform:scale(1.1)} }

/* ── HEADER ── */
.tp-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
  flex-shrink: 0;
  box-shadow: 0 2px 20px rgba(0,0,0,0.3);
  font-family: 'Nunito', sans-serif;
}
.tp-header-inner {
  max-width: 700px; margin: 0 auto;
  padding: 0.75rem 1.25rem;
  display: flex; align-items: center; justify-content: space-between;
}
.tp-brand { display: flex; align-items: center; gap: 0.6rem; }
.tp-trophy { font-size: 1.4rem; filter: drop-shadow(0 0 8px rgba(255,200,0,0.5)); }
.tp-title  { font-size: 0.95rem; font-weight: 900; color: #fff; line-height: 1.2; }
.tp-sub    { font-size: 0.65rem; color: rgba(255,255,255,0.4); }
.tp-header-right { display: flex; align-items: center; gap: 0.55rem; }
.tp-user { display: flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.1); border-radius: 20px; padding: 0.25rem 0.6rem 0.25rem 0.25rem; }
.tp-avatar { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-weight: 800; font-size: .75rem; display: flex; align-items: center; justify-content: center; }
.tp-username { color: #fff; font-size: .78rem; font-weight: 700; }
.tp-logout { background: rgba(220,53,69,.15); border: 1.5px solid rgba(220,53,69,.4); color: #ff6b6b; border-radius: 10px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; transition: background .2s; }
.tp-logout:active { background: rgba(220,53,69,.4); }

/* ── TABS ── */
.tp-tabs {
  display: flex; flex-shrink: 0;
  background: #f4f5ff; border-bottom: 2px solid #e8e9ff;
  font-family: 'Nunito', sans-serif;
}
.tp-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.35rem;
  padding: 0.7rem 0.5rem; font-size: 0.82rem; font-weight: 800;
  color: #999; border: none; background: none;
  cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -2px;
  transition: color .2s, border-color .2s; -webkit-tap-highlight-color: transparent;
}
.tp-tab i { font-size: 0.82rem; }
.tp-tab--active { color: #667eea; border-bottom-color: #667eea; }

/* ── PANEL ── */
.tp-panel {
  max-width: 700px; margin: 0 auto;
  padding: 0.9rem 1.15rem 1.5rem;
  font-family: 'Nunito', sans-serif;
}

/* ── SKELETON ── */
.skeleton-list { display: flex; flex-direction: column; gap: 0.65rem; }
.skeleton-row  { display: flex; align-items: center; gap: 0.65rem; }
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
.sk { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: 8px; }
.sk-circle { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
.sk-bar    { flex: 1; height: 22px; }
.sk-num    { width: 44px; height: 22px; flex-shrink: 0; }

/* ── LOCK ── */
.lock-box { text-align: center; padding: 3rem 2rem; color: #aaa; }
.lock-icon { font-size: 2.5rem; margin-bottom: 0.65rem; }
.lock-box h3 { font-size: 1rem; font-weight: 800; color: #555; margin-bottom: 0.35rem; }

/* ── FIRST PLACE ── */
.fp-card { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.1rem; border-radius: 16px; margin-bottom: 0.85rem; border: 2px solid transparent; }
.fp-left { display: flex; align-items: center; gap: 0.65rem; }
.fp-medal { font-size: 2.2rem; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.15)); }
.fp-name  { font-size: 1.2rem; font-weight: 900; line-height: 1.1; }
.fp-label { font-size: 0.68rem; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; }
.fp-score { font-size: 1.8rem; font-weight: 900; }
.fp-score small { font-size: 0.7rem; font-weight: 700; opacity: 0.6; }
.rossi-fp     { background: linear-gradient(135deg,#fff0f1,#ffe0e3); border-color: rgba(220,53,69,.25); }
.verdi-fp     { background: linear-gradient(135deg,#f0fbf3,#d8f5e1); border-color: rgba(40,167,69,.25); }
.arancioni-fp { background: linear-gradient(135deg,#fff8f0,#ffe8d0); border-color: rgba(253,126,20,.25); }
.blu-fp       { background: linear-gradient(135deg,#f0f8ff,#d5ecff); border-color: rgba(0,123,255,.25); }
.fucsia-fp    { background: linear-gradient(135deg,#fff0f8,#ffd5ec); border-color: rgba(232,62,140,.25); }
.gialli-fp    { background: linear-gradient(135deg,#fffde0,#fff5b0); border-color: rgba(200,150,12,.25); }

/* ── RANK LIST ── */
.rank-list { display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 1rem; }
.rank-row { display: flex; align-items: center; gap: 0.65rem; padding: 0.65rem 0.9rem; border-radius: 12px; background: #f9f9ff; border: 1.5px solid rgba(0,0,0,.05); }
.rank-row--podium { background: #f4f5ff; }
.rank-pos { width: 28px; text-align: center; font-size: 1.05rem; flex-shrink: 0; }
.rank-num { font-size: 0.75rem; font-weight: 800; color: #bbb; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 0.88rem; font-weight: 800; margin-bottom: 0.25rem; }
.rank-bar-track { height: 6px; background: #eee; border-radius: 99px; overflow: hidden; }
.rank-bar { height: 100%; border-radius: 99px; transition: width 0.8s cubic-bezier(.16,1,.3,1); min-width: 4%; }
.rank-score { font-size: 0.95rem; font-weight: 900; flex-shrink: 0; text-align: right; min-width: 46px; }
.rank-score-unit { font-size: 0.6rem; font-weight: 700; opacity: 0.5; }

/* team colors */
.rossi-text{color:#DC3545} .verdi-text{color:#28A745} .arancioni-text{color:#FD7E14}
.blu-text{color:#007BFF}   .fucsia-text{color:#E83E8C} .gialli-text{color:#a07800}
.rossi-bar{background:linear-gradient(90deg,#DC3545,#ff6b6b)}
.verdi-bar{background:linear-gradient(90deg,#28A745,#51cf66)}
.arancioni-bar{background:linear-gradient(90deg,#FD7E14,#ffa94d)}
.blu-bar{background:linear-gradient(90deg,#007BFF,#74c0fc)}
.fucsia-bar{background:linear-gradient(90deg,#E83E8C,#f78cc6)}
.gialli-bar{background:linear-gradient(90deg,#c8960c,#ffd43b)}
.rossi-dot{background:#DC3545} .verdi-dot{background:#28A745} .arancioni-dot{background:#FD7E14}
.blu-dot{background:#007BFF}   .fucsia-dot{background:#E83E8C} .gialli-dot{background:#c8960c}

/* ── STATS ── */
.stats-row { display: flex; gap: 0.5rem; margin-top: 0.9rem; }
.stat-card { flex: 1; text-align: center; padding: 0.75rem 0.4rem; background: #f4f5ff; border-radius: 12px; border: 1.5px solid rgba(102,126,234,.15); }
.stat-val   { font-size: 1.25rem; font-weight: 900; color: #667eea; line-height: 1; }
.stat-label { font-size: 0.62rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 0.15rem; }

/* ── FORM CARD ── */
.form-card {
  background: #fff; border-radius: 18px;
  border: 1.5px solid rgba(0,0,0,.07);
  padding: 1rem 1rem;
  display: flex; flex-direction: column; gap: 0.9rem;
  box-shadow: 0 4px 20px rgba(0,0,0,.05);
}
.fc-group { display: flex; flex-direction: column; gap: 0.5rem; }
.fc-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #888; }
.fc-step { width: 20px; height: 20px; border-radius: 50%; background: #667eea; color: #fff; font-size: 0.68rem; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* team pills — compresse */
.team-pills { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.team-pill {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.4rem 0.75rem; border-radius: 20px;
  border: 2px solid transparent; font-size: 0.82rem; font-weight: 800;
  cursor: pointer; font-family: 'Nunito', sans-serif;
  transition: all .15s; -webkit-tap-highlight-color: transparent; min-height: 36px;
}
.tp-pill-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; opacity: 0.6; flex-shrink: 0; }
.rossi-pill{background:#fff0f1;color:#DC3545;border-color:rgba(220,53,69,.2)}
.verdi-pill{background:#f0fbf3;color:#28A745;border-color:rgba(40,167,69,.2)}
.arancioni-pill{background:#fff8f0;color:#FD7E14;border-color:rgba(253,126,20,.2)}
.blu-pill{background:#f0f8ff;color:#007BFF;border-color:rgba(0,123,255,.2)}
.fucsia-pill{background:#fff0f8;color:#E83E8C;border-color:rgba(232,62,140,.2)}
.gialli-pill{background:#fffde0;color:#a07800;border-color:rgba(200,150,12,.2)}
.rossi-pill.team-pill--active{background:#ffe0e3;border-color:#DC3545;box-shadow:0 3px 10px rgba(220,53,69,.22)}
.verdi-pill.team-pill--active{background:#d8f5e1;border-color:#28A745;box-shadow:0 3px 10px rgba(40,167,69,.22)}
.arancioni-pill.team-pill--active{background:#ffe8d0;border-color:#FD7E14;box-shadow:0 3px 10px rgba(253,126,20,.22)}
.blu-pill.team-pill--active{background:#d5ecff;border-color:#007BFF;box-shadow:0 3px 10px rgba(0,123,255,.22)}
.fucsia-pill.team-pill--active{background:#ffd5ec;border-color:#E83E8C;box-shadow:0 3px 10px rgba(232,62,140,.22)}
.gialli-pill.team-pill--active{background:#fff5b0;border-color:#c8960c;box-shadow:0 3px 10px rgba(200,150,12,.22)}

.game-pills { display: flex; gap: 0.45rem; }
.game-pill { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.55rem; border-radius: 12px; border: 2px solid rgba(102,126,234,.18); background: #f4f5ff; color: #667eea; font-size: 0.82rem; font-weight: 800; cursor: pointer; font-family: 'Nunito', sans-serif; transition: all .15s; -webkit-tap-highlight-color: transparent; min-height: 44px; }
.game-pill--active { background: #667eea; color: #fff; border-color: #667eea; box-shadow: 0 4px 12px rgba(102,126,234,.32); }
.game-pill--penalty { border-color: rgba(220,53,69,.2); background: #fff0f1; color: #DC3545; }
.game-pill--penalty.game-pill--active { background: #DC3545; color: #fff; border-color: #DC3545; box-shadow: 0 4px 12px rgba(220,53,69,.32); }

/* pts quick + stepper — compatti */
.pts-quick { display: flex; gap: 0.35rem; }
.pts-q { flex: 1; padding: 0.45rem 0; border-radius: 10px; border: 2px solid rgba(102,126,234,.18); background: #f4f5ff; color: #667eea; font-size: 0.88rem; font-weight: 900; cursor: pointer; font-family: 'Nunito', sans-serif; transition: all .15s; min-height: 40px; }
.pts-q--active { background: #667eea; color: #fff; border-color: #667eea; }
.pts-wrap { display: flex; align-items: center; gap: 0.4rem; }
.pts-btn { width: 48px; height: 48px; border-radius: 12px; border: 2px solid #e0e0e0; background: #f8f8f8; font-size: 1.4rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #555; transition: all .15s; flex-shrink: 0; font-family: 'Nunito', sans-serif; -webkit-tap-highlight-color: transparent; }
.pts-btn:active { background: #667eea; border-color: #667eea; color: #fff; transform: scale(0.93); }
.pts-input { flex: 1; text-align: center; font-size: 1.4rem; font-weight: 900; border: 2px solid #e0e0e0; border-radius: 12px; padding: 0.5rem; outline: none; min-height: 48px; transition: border-color .2s; font-family: 'Nunito', sans-serif; -moz-appearance: textfield; background: transparent; }
.pts-input::-webkit-inner-spin-button, .pts-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.pts-input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,.15); }

.pts-preview { background: #f4f5ff; border-radius: 10px; padding: 0.55rem 0.85rem; font-size: 0.85rem; color: #555; font-weight: 600; text-align: center; }
.pos-pts { color: #28A745; font-weight: 900; } .neg-pts { color: #DC3545; font-weight: 900; }
.preview-enter-active, .preview-leave-active { transition: opacity .25s, transform .25s; }
.preview-enter-from, .preview-leave-to { opacity: 0; transform: translateY(-4px); }

.tp-submit { width: 100%; min-height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 14px; color: #fff; font-size: 0.98rem; font-weight: 900; cursor: pointer; letter-spacing: 0.02em; box-shadow: 0 5px 18px rgba(102,126,234,.4); transition: transform .12s, opacity .2s; font-family: 'Nunito', sans-serif; -webkit-tap-highlight-color: transparent; }
.tp-submit:active:not(:disabled) { transform: scale(0.97); }
.tp-submit:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── STORICO ── */
.h-filters { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.65rem; }
.h-filter-btn { padding: 0.3rem 0.75rem; border-radius: 18px; border: 1.5px solid rgba(0,0,0,.1); background: #f8f8f8; font-size: 0.75rem; font-weight: 800; cursor: pointer; font-family: 'Nunito', sans-serif; color: #666; transition: all .15s; min-height: 34px; }
.h-filter-btn--active { background: #1a1a2e; color: #fff; border-color: #1a1a2e; }
.rossi-filter.h-filter-btn--active{background:#DC3545;border-color:#DC3545}
.verdi-filter.h-filter-btn--active{background:#28A745;border-color:#28A745}
.arancioni-filter.h-filter-btn--active{background:#FD7E14;border-color:#FD7E14}
.blu-filter.h-filter-btn--active{background:#007BFF;border-color:#007BFF}
.fucsia-filter.h-filter-btn--active{background:#E83E8C;border-color:#E83E8C}
.gialli-filter.h-filter-btn--active{background:#c8960c;border-color:#c8960c}
.h-count { font-size: 0.72rem; font-weight: 700; color: #bbb; margin-bottom: 0.45rem; text-transform: uppercase; letter-spacing: 0.06em; }
.h-list  { display: flex; flex-direction: column; gap: 0.4rem; }
.h-entry { display: flex; align-items: center; gap: 0.55rem; padding: 0.65rem 0.85rem; border-radius: 12px; background: #f9f9ff; border: 1.5px solid rgba(0,0,0,.05); }
.h-entry--recent { background: #f4f5ff; border-color: rgba(102,126,234,.15); }
.h-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.h-main { flex: 1; min-width: 0; }
.h-top  { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
.h-bottom { display: flex; align-items: center; gap: 0.3rem; margin-top: 0.12rem; }
.h-team { font-size: 0.82rem; font-weight: 800; } .h-game { font-size: 0.78rem; font-weight: 700; color: #555; }
.h-user { font-size: 0.68rem; color: #aaa; font-weight: 600; } .h-user i { margin-right: 0.15rem; }
.h-date { font-size: 0.68rem; color: #aaa; font-weight: 600; } .h-sep { font-size: 0.65rem; color: #ccc; }
.h-pts { font-size: 0.95rem; font-weight: 900; flex-shrink: 0; min-width: 42px; text-align: right; }
.h-pts--pos { color: #28A745; } .h-pts--neg { color: #DC3545; }
.h-del { background: rgba(220,53,69,.08); border: 1px solid rgba(220,53,69,.2); color: #ff6b6b; border-radius: 7px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.7rem; flex-shrink: 0; transition: background .15s; }
.h-del:active { background: rgba(220,53,69,.25); }
.h-item-enter-active, .h-item-leave-active { transition: opacity .2s, transform .2s; }
.h-item-enter-from, .h-item-leave-to { opacity: 0; transform: translateY(-4px); }
.h-loadmore { width: 100%; margin-top: 0.7rem; padding: 0.65rem; border: 1.5px dashed #e0e0e0; border-radius: 12px; background: none; color: #aaa; font-size: 0.82rem; font-weight: 700; cursor: pointer; font-family: 'Nunito', sans-serif; min-height: 44px; }

/* ── DELETE MODAL ── */
.modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(6px); padding: 1.25rem; }
.modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 340px; box-shadow: 0 20px 60px rgba(0,0,0,.3); animation: popIn .3s cubic-bezier(.16,1,.3,1); overflow: hidden; }
.modal-head { padding: 0.9rem 1.1rem; background: #fff8f8; border-bottom: 1px solid rgba(220,53,69,.15); font-size: 0.9rem; font-weight: 800; color: #c0392b; display: flex; align-items: center; gap: 0.45rem; }
.modal-x { margin-left: auto; background: none; border: none; font-size: 1.3rem; cursor: pointer; opacity: 0.7; color: #555; }
.modal-body { padding: 1rem 1.1rem; }
.modal-details { display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 0.9rem; }
.md-row { display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0.7rem; background: #f8f9fa; border-radius: 9px; font-size: 0.84rem; }
.md-row span { color: #888; font-weight: 600; } .md-row strong { font-weight: 800; }
.modal-warn { padding: 0.6rem 0.85rem; background: #fff3cd; border-radius: 9px; border: 1px solid #ffc107; font-size: 0.78rem; font-weight: 700; color: #856404; }
.modal-foot { padding: 0.9rem 1.1rem; border-top: 1px solid #f0f0f0; display: flex; gap: 0.55rem; }
.modal-del { flex: 1; padding: 0.7rem; background: linear-gradient(135deg,#dc3545,#c0392b); border: none; border-radius: 11px; color: #fff; font-size: 0.88rem; font-weight: 800; cursor: pointer; font-family: 'Nunito', sans-serif; box-shadow: 0 4px 12px rgba(220,53,69,.32); transition: transform .12s; }
.modal-del:active { transform: scale(0.97); } .modal-del:disabled { opacity: 0.55; cursor: not-allowed; }
.modal-cancel { padding: 0.7rem 1.1rem; background: #f0f0f0; border: none; border-radius: 11px; color: #555; font-size: 0.88rem; font-weight: 800; cursor: pointer; font-family: 'Nunito', sans-serif; transition: background .15s; }
.modal-cancel:active { background: #e0e0e0; }
.modal-enter-active, .modal-leave-active { transition: opacity .25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
@keyframes popIn { 0%{opacity:0;transform:scale(0.8)} 60%{transform:scale(1.02)} 100%{opacity:1;transform:scale(1)} }

/* ── DARK MODE ── */
@media (prefers-color-scheme: dark) {
  .tp-tabs    { background: #1a1c26; border-bottom-color: #2a2c38; }
  .tp-tab     { color: #666; }
  .tp-tab--active { color: #848ae8; border-bottom-color: #848ae8; }
  .fp-card    { background: #232530 !important; border-color: rgba(255,255,255,.08) !important; }
  .fp-label   { color: #666; }
  .rank-row   { background: #1e2028; border-color: rgba(255,255,255,.05); }
  .rank-row--podium { background: #232530; }
  .rank-bar-track { background: #2a2c36; }
  .rank-num   { color: #555; }
  .stat-card  { background: #232530; border-color: rgba(102,126,234,.15); }
  .stat-val   { color: #848ae8; } .stat-label { color: #555; }
  .form-card  { background: #1e2028; border-color: rgba(255,255,255,.06); }
  .team-pill:not(.team-pill--active) { filter: brightness(0.7); }
  .game-pill:not(.game-pill--active) { background: #232530; border-color: rgba(102,126,234,.2); }
  .pts-q:not(.pts-q--active) { background: #232530; color: #848ae8; border-color: rgba(102,126,234,.2); }
  .pts-btn    { background: #2a2c36; border-color: #3a3c46; color: #ccc; }
  .pts-input  { border-color: #3a3c46; color: #fff; background: #2a2c36; }
  .pts-preview { background: #232530; color: #ccc; }
  .h-filter-btn { background: #2a2c36; border-color: rgba(255,255,255,.08); color: #888; }
  .h-entry    { background: #1e2028; border-color: rgba(255,255,255,.04); }
  .h-entry--recent { background: #232530; border-color: rgba(102,126,234,.15); }
  .h-game     { color: #aaa; }
  .h-loadmore { border-color: #3a3c46; color: #666; }
  .modal-box  { background: #1e2028; }
  .modal-head { background: #2d1517; border-bottom-color: rgba(220,53,69,.2); }
  .md-row     { background: #2a2c36; }
  .md-row span { color: #666; } .md-row strong { color: #eee; }
  .modal-warn { background: #2d2810; border-color: rgba(255,193,7,.3); color: #ffd43b; }
  .modal-foot { border-top-color: #2a2c36; }
  .modal-cancel { background: #2a2c36; color: #aaa; }
  .sk { background: linear-gradient(90deg,#2a2c36 25%,#3a3c46 50%,#2a2c36 75%); background-size: 200% 100%; }
}
</style>
