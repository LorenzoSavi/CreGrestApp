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

  <!-- WRAPPER -->
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

    <!-- CONTENT -->
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
            <!-- Barra +/- con input: non usa flex shrink, garantisce che il + non esca -->
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
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error();
        await updateDoc(ref, { [this.entryToDelete.team]: (snap.data()[this.entryToDelete.team] || 0) - this.entryToDelete.points });
        const hRef  = doc(db, 'points', 'history');
        const hSnap 