<template>
  <!-- Notifications -->
  <transition name="notif">
    <div v-if="successMessage || error" class="notif-bar" :class="error ? 'notif-error' : 'notif-success'">
      <i :class="error ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
      <span>{{ error || successMessage }}</span>
      <button class="notif-close" @click="error = ''; successMessage = ''">&times;</button>
    </div>
  </transition>

  <!-- Inter Easter Egg -->
  <div v-if="showInterAnimation" class="inter-overlay">
    <div class="inter-inner">
      <div class="inter-text">INTER</div>
      <div class="inter-sub">FORZA INTER! 🖤💙</div>
      <div class="inter-msg">Bentornato campione nerazzurro!</div>
    </div>
  </div>

  <!-- HEADER -->
  <header class="tp-header">
    <div class="tp-header-inner">
      <div class="tp-brand">
        <span class="tp-trophy">🏆</span>
        <div>
          <div class="tp-title">Cre Grest</div>
          <div class="tp-sub">Classifica Admin</div>
        </div>
      </div>
      <div class="tp-header-right">
        <div class="tp-user" v-if="currentUser">
          <span class="tp-avatar">{{ currentUser.username.charAt(0).toUpperCase() }}</span>
          <span class="tp-username is-hidden-mobile">{{ currentUser.username }}</span>
        </div>
        <button @click="handleLogout" class="tp-logout" aria-label="Logout">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>
  </header>

  <!-- TABS -->
  <div class="tp-tabs">
    <button class="tp-tab" :class="{ 'tp-tab--active': activeTab === 'classifica' }" @click="activeTab = 'classifica'">
      <i class="fas fa-trophy"></i> Classifica
    </button>
    <button class="tp-tab" :class="{ 'tp-tab--active': activeTab === 'punti' }" @click="activeTab = 'punti'">
      <i class="fas fa-plus-circle"></i> Punti
    </button>
    <button class="tp-tab" :class="{ 'tp-tab--active': activeTab === 'storico' }" @click="activeTab = 'storico'">
      <i class="fas fa-history"></i> Storico
    </button>
  </div>

  <!-- TAB: CLASSIFICA -->
  <div v-show="activeTab === 'classifica'" class="tp-panel">
    <!-- LOCK -->
    <div v-if="isRestrictedUser" class="lock-box">
      <div class="lock-icon">🔒</div>
      <h3>Classifica Riservata</h3>
      <p>Non hai i permessi per visualizzare i punteggi</p>
    </div>
    <template v-else>
      <!-- Primo posto -->
      <div v-if="sortedTeams.length" class="fp-card" :class="sortedTeams[0].id + '-fp'">
        <span class="fp-medal">🥇</span>
        <span class="fp-name" :class="sortedTeams[0].id + '-text'">{{ sortedTeams[0].name }}</span>
        <span class="fp-score">{{ sortedTeams[0].points }}<small> pt</small></span>
      </div>

      <!-- Rank list -->
      <div class="rank-list">
        <div
          v-for="(team, i) in sortedTeams"
          :key="team.id"
          class="rank-row"
        >
          <div class="rank-pos">
            <span v-if="i===0">🥇</span>
            <span v-else-if="i===1">🥈</span>
            <span v-else-if="i===2">🥉</span>
            <span v-else class="rank-num">#{{ i+1 }}</span>
          </div>
          <div class="rank-info">
            <div class="rank-name" :class="team.id + '-text'">{{ team.name }}</div>
            <div class="rank-bar-wrap">
              <div class="rank-bar" :class="team.id + '-bar'" :style="{ width: barWidth(team.points) + '%' }"></div>
            </div>
          </div>
          <div class="rank-score">{{ team.points }}</div>
        </div>
      </div>
    </template>
  </div>

  <!-- TAB: PUNTI -->
  <div v-show="activeTab === 'punti'" class="tp-panel">
    <div class="form-card">
      <!-- Squadra -->
      <div class="fc-group">
        <div class="fc-label">Squadra</div>
        <div class="team-pills">
          <button
            v-for="team in teams" :key="team.id"
            type="button"
            class="team-pill"
            :class="[team.id + '-pill', { 'team-pill--active': selectedTeam === team.id }]"
            @click="selectedTeam = team.id"
          >{{ team.name }}</button>
        </div>
      </div>

      <!-- Tipo -->
      <div class="fc-group">
        <div class="fc-label">Tipo</div>
        <div class="game-pills">
          <button
            v-for="game in games" :key="game.id"
            type="button"
            class="game-pill"
            :class="{ 'game-pill--active': selectedGame === game.id, 'game-pill--penalty': game.id === 'penitenza' }"
            @click="selectedGame = game.id"
          >
            <i :class="game.id === 'penitenza' ? 'fas fa-minus-circle' : 'fas fa-star'"></i>
            {{ game.name }}
          </button>
        </div>
      </div>

      <!-- Punti -->
      <div class="fc-group">
        <div class="fc-label">Punti</div>
        <div class="pts-wrap">
          <button type="button" class="pts-btn pts-minus" @click="pointsToAdd = Math.max(0, pointsToAdd - 1)">−</button>
          <input class="pts-input" type="number" v-model.number="pointsToAdd" min="0" inputmode="numeric" placeholder="0" />
          <button type="button" class="pts-btn pts-plus" @click="pointsToAdd++">+</button>
        </div>
        <!-- Quick values -->
        <div class="pts-quick">
          <button v-for="q in [10,20,50,100]" :key="q" type="button" class="pts-q" :class="{'pts-q--active': pointsToAdd===q}" @click="pointsToAdd=q">{{ q }}</button>
        </div>
      </div>

      <button class="tp-submit" :disabled="isLoading" @click="addPoints">
        <span v-if="!isLoading"><i class="fas fa-bolt"></i>&nbsp; Conferma</span>
        <span v-else><i class="fas fa-spinner fa-spin"></i>&nbsp; Salvataggio...</span>
      </button>
    </div>
  </div>

  <!-- TAB: STORICO -->
  <div v-show="activeTab === 'storico'" class="tp-panel">
    <div class="h-count">{{ sortedHistory.length }} voci totali</div>
    <div class="h-list">
      <div
        v-for="(entry, index) in sortedHistory.slice(0, 50)"
        :key="entry.timestamp + index"
        class="h-entry"
        :class="{ 'h-entry--recent': index < 3 }"
      >
        <div class="h-dot" :class="entry.team + '-dot'"></div>
        <div class="h-main">
          <div class="h-top">
            <span class="h-team" :class="entry.team + '-text'">{{ getTeamName(entry.team) }}</span>
            <span class="h-sep">·</span>
            <span class="h-game">{{ getGameName(entry.game) }}</span>
            <span class="h-sep">·</span>
            <span class="h-user">{{ entry.username }}</span>
          </div>
          <div class="h-date">{{ formatDate(entry.timestamp) }}</div>
        </div>
        <div class="h-pts" :class="entry.points > 0 ? 'h-pts--pos' : 'h-pts--neg'">
          {{ entry.points > 0 ? '+' : '' }}{{ entry.points }}
        </div>
        <button
          v-if="canDeleteEntries"
          @click="deleteHistoryEntry(entry, index)"
          class="h-del"
          aria-label="Elimina"
        ><i class="fas fa-trash"></i></button>
        <span v-else class="h-del h-del--lock"><i class="fas fa-lock"></i></span>
      </div>
    </div>
    <p v-if="sortedHistory.length > 50" class="h-more">Ultime 50 · Totale {{ sortedHistory.length }}</p>
  </div>

  <!-- MODAL ELIMINA -->
  <transition name="modal">
    <div v-if="showDeleteModal" class="modal-bg" @click.self="closeDeleteModal">
      <div class="modal-box">
        <div class="modal-head">
          <i class="fas fa-exclamation-triangle"></i> Elimina voce
          <button class="modal-x" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-q">Eliminare questa voce?</p>
          <div class="modal-details">
            <div class="md-row"><span>Team</span><strong :class="entryToDelete?.team + '-text'">{{ getTeamName(entryToDelete?.team) }}</strong></div>
            <div class="md-row"><span>Gioco</span><strong>{{ getGameName(entryToDelete?.game) }}</strong></div>
            <div class="md-row"><span>Punti</span><strong :class="entryToDelete?.points > 0 ? 'h-pts--pos' : 'h-pts--neg'">{{ entryToDelete?.points }}</strong></div>
            <div class="md-row"><span>Utente</span><strong>{{ entryToDelete?.username }}</strong></div>
          </div>
          <div class="modal-warn">⚠️ I punti verranno rimossi dal team. Azione irreversibile.</div>
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
        { id: 'penitenza',     name: 'Penitenza' },
      ],
      selectedTeam: '',
      selectedGame: '',
      pointsToAdd: 0,
      error: '',
      successMessage: '',
      pointsHistory: [],
      isLoading: false,
      deletingIndex: null,
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
        const tA = a.timestamp?.seconds ?? new Date(a.timestamp).getTime()/1000;
        const tB = b.timestamp?.seconds ?? new Date(b.timestamp).getTime()/1000;
        return tB - tA;
      });
    },
    currentUser() {
      return JSON.parse(localStorage.getItem('loggedInUser')) || JSON.parse(sessionStorage.getItem('loggedInUser'));
    },
    isRestrictedUser() { return this.currentUser && this.restrictedUsers.includes(this.currentUser.username); },
    canDeleteEntries() { return !this.isRestrictedUser; },
    isDonGio() { return this.currentUser?.username === 'DonGio'; },
    maxPoints() { return Math.max(...this.teams.map(t => t.points), 1); },
  },
  async created() {
    await this.fetchTeamPoints();
    await this.fetchPointsHistory();
    if (this.isDonGio) {
      this.showInterAnimation = true;
      setTimeout(() => { this.showInterAnimation = false; }, 4000);
    }
  },
  methods: {
    barWidth(pts) { return Math.max(4, Math.round((pts / this.maxPoints) * 100)); },
    async fetchTeamPoints() {
      try {
        const snap = await getDoc(doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ'));
        if (snap.exists()) this.teams.forEach(t => { t.points = snap.data()[t.id] || 0; });
      } catch { this.error = 'Errore caricamento punteggi.'; }
    },
    async addPoints() {
      if (!this.selectedTeam || !this.selectedGame) {
        this.error = 'Seleziona squadra e tipo.';
        setTimeout(() => { this.error = ''; }, 3000);
        return;
      }
      this.isLoading = true;
      try {
        const ref = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          let pts = parseInt(this.pointsToAdd);
          if (this.selectedGame === 'penitenza' && pts > 0) pts = -pts;
          await updateDoc(ref, { [this.selectedTeam]: (snap.data()[this.selectedTeam] || 0) + pts });
          await this.addHistory(pts);
          this.successMessage = `${pts > 0 ? '+' : ''}${pts} pt a ${this.selectedTeam}!`;
          this.selectedTeam = ''; this.selectedGame = ''; this.pointsToAdd = 0;
          await this.fetchTeamPoints();
          await this.fetchPointsHistory();
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
      } catch { /* silenzioso */ }
    },
    async fetchPointsHistory() {
      try {
        const snap = await getDoc(doc(db, 'points', 'history'));
        if (snap.exists()) this.pointsHistory = snap.data().history || [];
      } catch { /* silenzioso */ }
    },
    formatDate(ts) {
      if (!ts) return '';
      const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return d.toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
    },
    deleteHistoryEntry(entry, index) { this.entryToDelete = entry; this.deletingIndex = index; this.showDeleteModal = true; },
    closeDeleteModal() { this.showDeleteModal = false; this.entryToDelete = null; this.deletingIndex = null; this.deletingEntry = false; },
    getTeamName(id) { return this.teams.find(t => t.id === id)?.name ?? id; },
    getGameName(id) { return this.games.find(g => g.id === id)?.name ?? id; },
    async confirmDelete() {
      if (!this.entryToDelete) return;
      this.deletingEntry = true;
      try {
        const ref = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error();
        await updateDoc(ref, { [this.entryToDelete.team]: (snap.data()[this.entryToDelete.team] || 0) - this.entryToDelete.points });
        const hRef = doc(db, 'points', 'history');
        const hSnap = await getDoc(hRef);
        if (!hSnap.exists()) throw new Error();
        const e = this.entryToDelete;
        const updated = (hSnap.data().history || []).filter(x => {
          const tA = x.timestamp?.seconds ?? new Date(x.timestamp).getTime()/1000;
          const tB = e.timestamp?.seconds ?? new Date(e.timestamp).getTime()/1000;
          return !(Math.abs(tA-tB) < 1 && x.team === e.team && x.game === e.game && x.points === e.points && x.username === e.username);
        });
        await updateDoc(hRef, { history: updated });
        await this.fetchTeamPoints();
        await this.fetchPointsHistory();
        this.successMessage = '🗑️ Voce eliminata!';
        this.closeDeleteModal();
        setTimeout(() => { this.successMessage = ''; }, 4000);
      } catch { this.error = 'Errore eliminazione.'; this.deletingEntry = false; }
    },
  }
};
</script>

<style scoped>
* { box-sizing: border-box; }

/* ── NOTIFICATIONS ── */
.notif-bar {
  position: fixed; top: 1rem; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; align-items: center; gap: 0.65rem;
  padding: 0.8rem 1.25rem; border-radius: 12px; font-weight: 600;
  font-size: 0.9rem; box-shadow: 0 8px 30px rgba(0,0,0,0.18);
  min-width: 260px; max-width: 90vw;
}
.notif-success { background: #d4edda; color: #155724; border: 1.5px solid #c3e6cb; }
.notif-error   { background: #f8d7da; color: #721c24; border: 1.5px solid #f5c6cb; }
.notif-close { margin-left: auto; background: none; border: none; font-size: 1.3rem; cursor: pointer; opacity: 0.7; }
.notif-enter-active, .notif-leave-active { transition: opacity .3s, transform .3s; }
.notif-enter-from, .notif-leave-to { opacity: 0; transform: translateX(-50%) translateY(-12px); }

/* ── HEADER ── */
.tp-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
  position: sticky; top: 0; z-index: 50;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3);
}
.tp-header-inner {
  max-width: 700px; margin: 0 auto;
  padding: 0.85rem 1.25rem;
  display: flex; align-items: center; justify-content: space-between;
}
.tp-brand { display: flex; align-items: center; gap: 0.65rem; }
.tp-trophy { font-size: 1.6rem; filter: drop-shadow(0 0 8px rgba(255,200,0,0.5)); }
.tp-title  { font-size: 1.05rem; font-weight: 800; color: #fff; line-height: 1.2; }
.tp-sub    { font-size: 0.7rem; color: rgba(255,255,255,0.4); }
.tp-header-right { display: flex; align-items: center; gap: 0.65rem; }
.tp-user { display: flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.1); border-radius: 20px; padding: 0.3rem 0.7rem 0.3rem 0.3rem; }
.tp-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-weight:700; font-size:.8rem; display:flex; align-items:center; justify-content:center; }
.tp-username { color:#fff; font-size:.82rem; font-weight:600; }
.tp-logout { background: rgba(220,53,69,.15); border: 1.5px solid rgba