<template>
  <!-- Notifications -->
  <transition name="notif">
    <div v-if="successMessage || error" class="notif-bar" :class="error ? 'notif-error' : 'notif-success'">
      <i :class="error ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
      <span>{{ error || successMessage }}</span>
      <button class="notif-close" @click="error = ''; successMessage = ''">&times;</button>
    </div>
  </transition>

  <!-- Inter Animation for DonGio -->
  <div v-if="showInterAnimation" class="inter-animation-overlay">
    <div class="inter-animation-container">
      <div class="inter-logo">
        <div class="inter-text">INTER</div>
        <div class="inter-subtitle">FORZA INTER! 🖤💙</div>
        <div class="inter-stars">⭐⭐⭐</div>
      </div>
      <div class="inter-message">Bentornato campione nerazzurro!</div>
    </div>
  </div>

  <!-- APP HEADER -->
  <header class="app-header">
    <div class="header-inner">
      <div class="header-brand">
        <span class="header-icon">🏆</span>
        <div>
          <div class="header-title">Cre Grest</div>
          <div class="header-sub">Classifica Squadre</div>
        </div>
      </div>
      <div class="header-right">
        <div class="user-chip" v-if="currentUser">
          <span class="user-avatar">{{ currentUser.username.charAt(0).toUpperCase() }}</span>
          <span class="user-name is-hidden-mobile">{{ currentUser.username }}</span>
        </div>
        <button @click="handleLogout" class="logout-btn" title="Logout">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>
  </header>

  <!-- CLASSIFICA -->
  <section class="section section-rank">
    <div class="container">
      <!-- RESTRICTED OVERLAY -->
      <div v-if="isRestrictedUser" class="lock-overlay">
        <div class="lock-box">
          <div class="lock-icon">🔒</div>
          <h3>Classifica Riservata</h3>
          <p>La visualizzazione dei punteggi è limitata per il tuo ruolo</p>
        </div>
      </div>

      <div :class="{ 'blurred-section': isRestrictedUser }">
        <!-- PRIMO POSTO SPOTLIGHT -->
        <div v-if="sortedTeams.length" class="first-place-card" :class="sortedTeams[0].id + '-card'">
          <div class="fp-medal">🥇</div>
          <div class="fp-name" :class="sortedTeams[0].id + '-text'">{{ sortedTeams[0].name }}</div>
          <div class="fp-points">{{ sortedTeams[0].points }} <span class="fp-pts-label">pt</span></div>
        </div>

        <!-- BARRE PROGRESSO SQUADRE -->
        <div class="rank-list">
          <div
            v-for="(team, index) in sortedTeams"
            :key="team.id"
            class="rank-row"
            :class="'rank-row--' + team.id"
          >
            <div class="rank-pos">
              <span v-if="index === 0">🥇</span>
              <span v-else-if="index === 1">🥈</span>
              <span v-else-if="index === 2">🥉</span>
              <span v-else class="rank-num">#{{ index + 1 }}</span>
            </div>
            <div class="rank-info">
              <div class="rank-name" :class="team.id + '-text'">{{ team.name }}</div>
              <div class="rank-bar-wrap">
                <div
                  class="rank-bar"
                  :class="team.id + '-bar'"
                  :style="{ width: barWidth(team.points) + '%' }"
                ></div>
              </div>
            </div>
            <div class="rank-score">{{ team.points }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FORM AGGIUNGI PUNTI -->
  <section class="section section-form">
    <div class="container">
      <div class="form-card">
        <div class="form-card-header">
          <i class="fas fa-plus-circle"></i>
          <span>Aggiungi Punti</span>
        </div>
        <div class="form-card-body">
          <form @submit.prevent="addPoints">

            <!-- SELEZIONE TEAM - PILL BUTTONS -->
            <div class="field">
              <label class="form-label">Squadra</label>
              <div class="team-pills">
                <button
                  v-for="team in teams"
                  :key="team.id"
                  type="button"
                  class="team-pill"
                  :class="[team.id + '-pill', { 'team-pill--active': selectedTeam === team.id }]"
                  @click="selectedTeam = team.id"
                >
                  {{ team.name }}
                </button>
              </div>
            </div>

            <!-- SELEZIONE GIOCO -->
            <div class="field">
              <label class="form-label">Tipo</label>
              <div class="game-pills">
                <button
                  v-for="game in games"
                  :key="game.id"
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

            <!-- PUNTI INPUT -->
            <div class="field">
              <label class="form-label">Punti</label>
              <div class="points-input-wrap">
                <button type="button" class="pts-btn pts-minus" @click="pointsToAdd = Math.max(0, pointsToAdd - 1)">−</button>
                <input
                  class="pts-input"
                  type="number"
                  v-model.number="pointsToAdd"
                  min="0"
                  step="1"
                  inputmode="numeric"
                  placeholder="0"
                />
                <button type="button" class="pts-btn pts-plus" @click="pointsToAdd = pointsToAdd + 1">+</button>
              </div>
            </div>

            <button
              type="submit"
              class="submit-btn"
              :class="{ 'submit-btn--loading': isLoading }"
              :disabled="isLoading"
            >
              <span v-if="!isLoading"><i class="fas fa-bolt"></i> Conferma</span>
              <span v-else><i class="fas fa-spinner fa-spin"></i> Salvataggio...</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- STORICO -->
  <section class="section section-history">
    <div class="container">
      <div class="form-card">
        <div class="form-card-header">
          <i class="fas fa-history"></i>
          <span>Storico — {{ sortedHistory.length }} voci</span>
        </div>
        <div class="form-card-body">
          <div class="history-list">
            <div
              v-for="(entry, index) in sortedHistory.slice(0, 50)"
              :key="entry.timestamp"
              class="h-entry"
              :class="{ 'h-entry--recent': index < 3 }"
            >
              <div class="h-team-dot" :class="entry.team + '-dot'"></div>
              <div class="h-main">
                <div class="h-top">
                  <span class="h-team" :class="entry.team + '-text'">{{ getTeamName(entry.team) }}</span>
                  <span class="h-game">{{ getGameName(entry.game) }}</span>
                  <span class="h-user"><i class="fas fa-user"></i> {{ entry.username }}</span>
                </div>
                <div class="h-date">{{ formatDate(entry.timestamp) }}</div>
              </div>
              <div class="h-pts" :class="entry.points > 0 ? 'h-pts--pos' : 'h-pts--neg'">
                {{ entry.points > 0 ? '+' : '' }}{{ entry.points }}
              </div>
              <div class="h-action">
                <button
                  v-if="canDeleteEntries"
                  @click="deleteHistoryEntry(entry, index)"
                  class="h-del-btn"
                  :class="{ 'is-loading': deletingIndex === index }"
                  title="Elimina"
                >
                  <i class="fas fa-trash"></i>
                </button>
                <span v-else class="h-del-btn h-del-btn--locked" title="Non disponibile">
                  <i class="fas fa-lock"></i>
                </span>
              </div>
            </div>
          </div>
          <p v-if="sortedHistory.length > 50" class="history-overflow">
            Mostrate le ultime 50 voci · Totale: {{ sortedHistory.length }}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- MODAL CONFERMA ELIMINAZIONE -->
  <transition name="modal">
    <div v-if="showDeleteModal" class="modal-backdrop" @click.self="closeDeleteModal">
      <div class="modal-box">
        <div class="modal-box-header">
          <i class="fas fa-exclamation-triangle"></i>
          Conferma Eliminazione
          <button class="modal-close" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-box-body">
          <p class="modal-question">Vuoi davvero eliminare questa voce?</p>
          <div class="modal-entry-details">
            <div class="modal-detail">
              <span class="md-label">Team</span>
              <span class="md-val" :class="entryToDelete?.team + '-text'">{{ getTeamName(entryToDelete?.team) }}</span>
            </div>
            <div class="modal-detail">
              <span class="md-label">Gioco</span>
              <span class="md-val">{{ getGameName(entryToDelete?.game) }}</span>
            </div>
            <div class="modal-detail">
              <span class="md-label">Punti</span>
              <span class="md-val" :class="entryToDelete?.points > 0 ? 'pts-pos' : 'pts-neg'">
                {{ entryToDelete?.points > 0 ? '+' : '' }}{{ entryToDelete?.points }}
              </span>
            </div>
            <div class="modal-detail">
              <span class="md-label">Utente</span>
              <span class="md-val">{{ entryToDelete?.username }}</span>
            </div>
            <div class="modal-detail">
              <span class="md-label">Data</span>
              <span class="md-val">{{ entryToDelete ? formatDate(entryToDelete.timestamp) : '' }}</span>
            </div>
          </div>
          <div class="modal-warning">
            ⚠️ I punti verranno sottratti dal team <strong :class="entryToDelete?.team + '-text'">{{ getTeamName(entryToDelete?.team) }}</strong>. Azione irreversibile.
          </div>
        </div>
        <div class="modal-box-footer">
          <button class="btn-confirm-delete" @click="confirmDelete" :class="{ 'is-loading': deletingEntry }" :disabled="deletingEntry">
            <i class="fas fa-trash"></i> {{ deletingEntry ? 'Eliminazione...' : 'Elimina' }}
          </button>
          <button class="btn-cancel" @click="closeDeleteModal" :disabled="deletingEntry">
            Annulla
          </button>
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
    sortedTeams() {
      return this.teams.slice().sort((a, b) => b.points - a.points);
    },
    sortedHistory() {
      return this.pointsHistory.slice().sort((a, b) => {
        const tA = a.timestamp?.seconds ?? new Date(a.timestamp).getTime() / 1000;
        const tB = b.timestamp?.seconds ?? new Date(b.timestamp).getTime() / 1000;
        return tB - tA;
      });
    },
    currentUser() {
      return JSON.parse(localStorage.getItem('loggedInUser'))
          || JSON.parse(sessionStorage.getItem('loggedInUser'));
    },
    isRestrictedUser() {
      return this.currentUser && this.restrictedUsers.includes(this.currentUser.username);
    },
    canDeleteEntries() {
      return !this.isRestrictedUser;
    },
    isDonGio() {
      return this.currentUser?.username === 'DonGio';
    },
    maxPoints() {
      return Math.max(...this.teams.map(t => t.points), 1);
    },
  },
  async created() {
    await this.fetchTeamPoints();
    await this.fetchPointsHistory();
    if (this.isDonGio) {
      this.showInterAnimation = true;
      setTimeout(() => {
        document.querySelector('.inter-animation-overlay')?.classList.add('fade-out');
        setTimeout(() => { this.showInterAnimation = false; }, 800);
      }, 3500);
    }
  },
  methods: {
    barWidth(points) {
      if (this.maxPoints <= 0) return 0;
      return Math.max(4, Math.round((points / this.maxPoints) * 100));
    },
    async fetchTeamPoints() {
      try {
        const snap = await getDoc(doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ'));
        if (snap.exists()) {
          const data = snap.data();
          this.teams.forEach(t => { t.points = data[t.id] || 0; });
        }
      } catch (e) { this.error = 'Errore caricamento punteggi.'; }
    },
    async addPoints() {
      if (!this.selectedTeam || !this.selectedGame) {
        this.error = 'Seleziona una squadra e un tipo di punteggio.';
        return;
      }
      this.isLoading = true;
      try {
        const ref = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          let pts = parseInt(this.pointsToAdd);
          if (this.selectedGame === 'penitenza' && pts > 0) pts = -pts;
          const newPts = (snap.data()[this.selectedTeam] || 0) + pts;
          await updateDoc(ref, { [this.selectedTeam]: newPts });
          await this.addHistory(pts);
          const dir = pts > 0 ? 'aggiunti a' : 'sottratti da';
          this.successMessage = `✅ ${Math.abs(pts)} punti ${dir} ${this.selectedTeam}!`;
          this.selectedTeam = '';
          this.selectedGame = '';
          this.pointsToAdd = 0;
          this.error = '';
          await this.fetchTeamPoints();
          await this.fetchPointsHistory();
        }
      } catch (e) {
        this.error = 'Errore durante il salvataggio.';
      } finally {
        this.isLoading = false;
      }
    },
    async addHistory(pts) {
      try {
        const ref = doc(db, 'points', 'history');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const user = this.currentUser;
          await updateDoc(ref, {
            history: arrayUnion({
              username: user?.username ?? 'unknown',
              team: this.selectedTeam,
              game: this.selectedGame,
              points: pts,
              timestamp: new Date(),
            })
          });
        }
      } catch (e) { this.error = 'Errore storico.'; }
    },
    async fetchPointsHistory() {
      try {
        const snap = await getDoc(doc(db, 'points', 'history'));
        if (snap.exists()) this.pointsHistory = snap.data().history || [];
      } catch (e) { /* silenzioso */ }
    },
    formatDate(timestamp) {
      const d = new Date(timestamp.seconds * 1000);
      return d.toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
    },
    async deleteHistoryEntry(entry, index) {
      this.entryToDelete = entry;
      this.deletingIndex = index;
      this.showDeleteModal = true;
    },
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.entryToDelete = null;
      this.deletingIndex = null;
      this.deletingEntry = false;
    },
    getTeamName(id) { return this.teams.find(t => t.id === id)?.name ?? id; },
    getGameName(id) { return this.games.find(g => g.id === id)?.name ?? id; },
    async confirmDelete() {
      if (!this.entryToDelete) return;
      this.deletingEntry = true;
      try {
        await this.removePointsFromTeam(this.entryToDelete.team, this.entryToDelete.points);
        await this.removeFromHistory(this.entryToDelete);
        await this.fetchTeamPoints();
        await this.fetchPointsHistory();
        this.successMessage = `🗑️ Voce eliminata! Punti aggiornati.`;
        this.closeDeleteModal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => { this.successMessage = ''; }, 5000);
      } catch (e) {
        this.error = '❌ Errore eliminazione.';
        this.deletingEntry = false;
      }
    },
    async removePointsFromTeam(teamId, pts) {
      const ref = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Document not found');
      await updateDoc(ref, { [teamId]: (snap.data()[teamId] || 0) - pts });
    },
    async removeFromHistory(entry) {
      const ref = doc(db, 'points', 'history');
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('History not found');
      const updated = (snap.data().history || []).filter(e => {
        const tA = e.timestamp?.seconds ?? new Date(e.timestamp).getTime() / 1000;
        const tB = entry.timestamp?.seconds ?? new Date(entry.timestamp).getTime() / 1000;
        return !(Math.abs(tA - tB) < 1 && e.team === entry.team && e.game === entry.game && e.points === entry.points && e.username === entry.username);
      });
      await updateDoc(ref, { history: updated });
    },
  }
};
</script>

<style scoped>
/* ===================== RESET & FONTS ===================== */
* { box-sizing: border-box; }

/* ===================== NOTIFICATIONS ===================== */
.notif-bar {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 8px 30px rgba(0,0,0,0.18);
  min-width: 280px;
  max-width: 90vw;
}
.notif-success { background: #d4edda; color: #155724; border: 1.5px solid #c3e6cb; }
.notif-error   { background: #f8d7da; color: #721c24; border: 1.5px solid #f5c6cb; }
.notif-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  line-height: 1;
  opacity: 0.7;
}
.notif-close:hover { opacity: 1; }
.notif-enter-active, .notif-leave-active { transition: opacity 0.3s, transform 0.3s; }
.notif-enter-from, .notif-leave-to { opacity: 0; transform: translateX(-50%) translateY(-16px); }

/* ===================== HEADER ===================== */
.app-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 20px rgba(0,0,0,0.3);
}
.header-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.header-icon { font-size: 1.8rem; filter: drop-shadow(0 0 8px rgba(255,200,0,0.6)); }
.header-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.03em;
  line-height: 1.2;
}
.header-sub { font-size: 0.75rem; color: rgba(255,255,255,0.55); letter-spacing: 0.08em; text-transform: uppercase; }
.header-right { display: flex; align-items: center; gap: 0.75rem; }
.user-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 0.3rem 0.75rem 0.3rem 0.3rem;
  border: 1px solid rgba(255,255,255,0.15);
}
.user-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex; align-items: center; justify-content: center;
}
.user-name { color: #fff; font-size: 0.85rem; font-weight: 600; }
.logout-btn {
  background: rgba(220,53,69,0.15);
  border: 1px solid rgba(220,53,69,0.4);
  color: #ff6b6b;
  border-radius: 8px;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  font-size: 1rem;
}
.logout-btn:hover { background: rgba(220,53,69,0.35); transform: scale(1.08); }

/* ===================== SECTIONS ===================== */
.section { padding: 1.5rem 1rem; }
.section-rank { background: #f8f9ff; padding-top: 2rem; }
.section-form { background: #fff; }
.section-history { background: #f8f9ff; }
.container { max-width: 700px; margin: 0 auto; }

/* ===================== LOCK OVERLAY ===================== */
.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.96);
  z-index: 10;
  display: flex; align-items: center; justify-content: center;
  border-radius: 16px;
  min-height: 220px;
}
.lock-box {
  text-align: center;
  padding: 2rem;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  border: 2px solid #dc3545;
  animation: popIn 0.4s cubic-bezier(.16,1,.3,1);
}
.lock-icon { font-size: 3rem; margin-bottom: 0.75rem; animation: lockShake 2s infinite; }
.lock-box h3 { font-size: 1.4rem; font-weight: 700; color: #dc3545; margin-bottom: 0.5rem; }
.lock-box p  { color: #777; font-size: 0.95rem; }
.blurred-section { filter: blur(8px); opacity: 0.25; pointer-events: none; user-select: none; }
.section-rank { position: relative; }

/* ===================== FIRST PLACE CARD ===================== */
.first-place-card {
  background: linear-gradient(135deg, #fffbe6 0%, #fff3cd 100%);
  border-radius: 18px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 6px 24px rgba(255,200,0,0.18), 0 2px 8px rgba(0,0,0,0.06);
  border: 2px solid rgba(255,200,0,0.3);
  position: relative;
  overflow: hidden;
}
.first-place-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 70%, rgba(255,200,0,0.08));
  pointer-events: none;
}
.fp-medal { font-size: 2.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
.fp-name { font-size: 1.5rem; font-weight: 800; flex: 1; }
.fp-points {
  font-size: 2.2rem;
  font-weight: 900;
  color: #363636;
  letter-spacing: -0.02em;
}
.fp-pts-label { font-size: 0.95rem; font-weight: 500; color: #999; }

/* ===================== RANK BARS ===================== */
.rank-list { display: flex; flex-direction: column; gap: 0.6rem; }
.rank-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fff;
  border-radius: 12px;
  padding: 0.7rem 1rem;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  transition: transform 0.15s, box-shadow 0.15s;
}
.rank-row:hover { transform: translateX(3px); box-shadow: 0 3px 14px rgba(0,0,0,0.1); }
.rank-pos { font-size: 1.2rem; min-width: 2rem; text-align: center; }
.rank-num { font-size: 0.85rem; font-weight: 700; color: #aaa; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 1rem; font-weight: 700; margin-bottom: 0.35rem; }
.rank-bar-wrap {
  height: 7px;
  background: #f0f0f0;
  border-radius: 99px;
  overflow: hidden;
}
.rank-bar {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s cubic-bezier(.16,1,.3,1);
}
.rank-score {
  font-size: 1.25rem;
  font-weight: 800;
  color: #363636;
  min-width: 3rem;
  text-align: right;
}

/* Bar colors */
.rossi-bar     { background: linear-gradient(90deg, #DC3545, #ff6b6b); }
.verdi-bar     { background: linear-gradient(90deg, #28A745, #51cf66); }
.arancioni-bar { background: linear-gradient(90deg, #FD7E14, #ffb347); }
.blu-bar       { background: linear-gradient(90deg, #007BFF, #74c0fc); }
.fucsia-bar    { background: linear-gradient(90deg, #E83E8C, #f78cc6); }
.gialli-bar    { background: linear-gradient(90deg, #d4a017, #FFD43B); }

/* ===================== FORM CARD ===================== */
.form-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.07);
  overflow: hidden;
}
.form-card-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
  color: #fff;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  letter-spacing: 0.02em;
}
.form-card-body { padding: 1.5rem; }
.field { margin-bottom: 1.5rem; }
.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
  margin-bottom: 0.65rem;
}

/* ===================== TEAM PILLS ===================== */
.team-pills, .game-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.team-pill {
  padding: 0.5rem 1.1rem;
  border-radius: 99px;
  border: 2px solid transparent;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  background: #f0f0f0;
  color: #555;
  transition: all 0.18s;
}
.team-pill:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.12); }

/* Active pill - border gets team color, bg tinted */
.rossi-pill.team-pill--active     { background: #ffe5e8; border-color: #DC3545; color: #DC3545; }
.verdi-pill.team-pill--active     { background: #e6f9ec; border-color: #28A745; color: #28A745; }
.arancioni-pill.team-pill--active { background: #fff3e0; border-color: #FD7E14; color: #FD7E14; }
.blu-pill.team-pill--active       { background: #e0f0ff; border-color: #007BFF; color: #007BFF; }
.fucsia-pill.team-pill--active    { background: #fde8f3; border-color: #E83E8C; color: #E83E8C; }
.gialli-pill.team-pill--active    { background: #fff9c4; border-color: #c8960c; color: #a07800; }

/* Inactive pill - subtle tinted bg */
.rossi-pill     { background: #fff0f1; color: #DC3545; border-color: rgba(220,53,69,0.2); }
.verdi-pill     { background: #f0fbf3; color: #28A745; border-color: rgba(40,167,69,0.2); }
.arancioni-pill { background: #fff8f0; color: #FD7E14; border-color: rgba(253,126,20,0.2); }
.blu-pill       { background: #f0f8ff; color: #007BFF; border-color: rgba(0,123,255,0.2); }
.fucsia-pill    { background: #fff0f8; color: #E83E8C; border-color: rgba(232,62,140,0.2); }
.gialli-pill    { background: #fffde0; color: #a07800; border-color: rgba(200,150,12,0.2); }

/* ===================== GAME PILLS ===================== */
.game-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.2rem;
  border-radius: 99px;
  border: 2px solid rgba(102,126,234,0.25);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  background: #f4f5ff;
  color: #667eea;
  transition: all 0.18s;
}
.game-pill--active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102,126,234,0.35);
}
.game-pill--penalty {
  background: #fff5f5;
  color: #dc3545;
  border-color: rgba(220,53,69,0.25);
}
.game-pill--penalty.game-pill--active {
  background: #dc3545;
  color: #fff;
  border-color: #dc3545;
  box-shadow: 0 4px 12px rgba(220,53,69,0.35);
}

/* ===================== POINTS INPUT ===================== */
.points-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 220px;
}
.pts-btn {
  width: 42px; height: 42px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  background: #f8f8f8;
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  color: #555;
}
.pts-btn:hover { background: #667eea; border-color: #667eea; color: #fff; }
.pts-input {
  flex: 1;
  text-align: center;
  font-size: 1.3rem;
  font-weight: 800;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 0.4rem 0;
  outline: none;
  transition: border-color 0.2s;
  -moz-appearance: textfield;
}
.pts-input::-webkit-inner-spin-button,
.pts-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.pts-input:focus { border-color: #667eea; }

/* ===================== SUBMIT BUTTON ===================== */
.submit-btn {
  width: 100%;
  padding: 0.9rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(102,126,234,0.35);
  letter-spacing: 0.03em;
}
.submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102,126,234,0.45); }
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn--loading { opacity: 0.75; cursor: not-allowed; }

/* ===================== HISTORY ===================== */
.history-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 480px; overflow-y: auto; }
.h-entry {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  background: #f8f9ff;
  border: 1px solid #eceef8;
  transition: box-shadow 0.15s;
}
.h-entry:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
.h-entry--recent {
  background: linear-gradient(90deg, #e8f4fd 0%, #f0f8ff 100%);
  border-color: #90c8f0;
}
.h-team-dot {
  width: 9px; height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.rossi-dot     { background: #DC3545; }
.verdi-dot     { background: #28A745; }
.arancioni-dot { background: #FD7E14; }
.blu-dot       { background: #007BFF; }
.fucsia-dot    { background: #E83E8C; }
.gialli-dot    { background: #c8960c; }

.h-main { flex: 1; min-width: 0; }
.h-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.15rem;
  font-size: 0.85rem;
}
.h-team  { font-weight: 700; }
.h-game  { color: #666; font-style: italic; }
.h-user  { color: #999; font-size: 0.78rem; }
.h-date  { font-size: 0.72rem; color: #bbb; }

.h-pts {
  font-size: 1.05rem;
  font-weight: 800;
  min-width: 3rem;
  text-align: right;
}
.h-pts--pos { color: #28a745; }
.h-pts--neg { color: #dc3545; }

.h-action { display: flex; align-items: center; }
.h-del-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 6px;
  transition: background 0.15s, transform 0.1s;
  font-size: 0.85rem;
}
.h-del-btn:hover { background: #dc3545; color: #fff; transform: scale(1.1); }
.h-del-btn--locked { color: #ccc; cursor: default; }
.history-overflow { text-align: center; color: #aaa; font-size: 0.85rem; margin-top: 0.75rem; }

/* ===================== MODAL ===================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  padding: 1rem;
}
.modal-box {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-width: 440px;
  width: 100%;
  overflow: hidden;
  animation: popIn 0.3s cubic-bezier(.16,1,.3,1);
}
.modal-box-header {
  background: #fff3cd;
  color: #856404;
  padding: 1rem 1.5rem;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  position: relative;
}
.modal-close {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #856404;
  line-height: 1;
}
.modal-box-body { padding: 1.5rem; }
.modal-question { font-weight: 600; margin-bottom: 1rem; }
.modal-entry-details {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.9rem 1rem;
  margin-bottom: 1rem;
}
.modal-detail { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; }
.md-label { color: #888; font-size: 0.8rem; }
.md-val { font-weight: 700; }
.pts-pos { color: #28a745; }
.pts-neg { color: #dc3545; }
.modal-warning {
  background: #fff3cd;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #856404;
}
.modal-box-footer {
  padding: 1rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  border-top: 1px solid #f0f0f0;
}
.btn-confirm-delete {
  flex: 1;
  padding: 0.7rem;
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
.btn-confirm-delete:hover:not(:disabled) { background: #b02a37; }
.btn-cancel {
  flex: 1;
  padding: 0.7rem;
  background: #f0f0f0;
  color: #555;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-cancel:hover:not(:disabled) { background: #e0e0e0; }

/* ===================== MODAL TRANSITION ===================== */
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box { transform: scale(0.92); }

/* ===================== TEAM TEXT COLORS ===================== */
.rossi-text     { color: #DC3545 !important; }
.verdi-text     { color: #28A745 !important; }
.arancioni-text { color: #FD7E14 !important; }
.blu-text       { color: #007BFF !important; }
.fucsia-text    { color: #E83E8C !important; }
.gialli-text    { color: #a07800 !important; }

/* ===================== KEYFRAMES ===================== */
@keyframes popIn {
  0%   { opacity: 0; transform: scale(0.88); }
  60%  { transform: scale(1.03); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes lockShake {
  0%,50%,100% { transform: rotate(0); }
  10%,30%     { transform: rotate(-6deg); }
  20%,40%     { transform: rotate(6deg); }
}

/* ===================== INTER ANIMATION ===================== */
.inter-animation-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #0b0b2a 0%, #1a1a6e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: interFadeIn 0.5s ease;
}
.inter-animation-overlay.fade-out { animation: interFadeOut 0.8s ease forwards; }
.inter-animation-container { text-align: center; }
.inter-logo { margin-bottom: 1rem; }
.inter-text {
  font-size: 5rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.1em;
  text-shadow: 0 0 40px rgba(100,150,255,0.8);
  animation: interPulse 1s ease infinite alternate;
}
.inter-subtitle { font-size: 1.5rem; color: #74c0fc; font-weight: 700; margin-top: 0.5rem; }
.inter-stars { font-size: 2rem; margin-top: 0.5rem; }
.inter-message { color: rgba(255,255,255,0.8); font-size: 1.1rem; font-style: italic; }
@keyframes interFadeIn  { from { opacity:0 } to { opacity:1 } }
@keyframes interFadeOut { from { opacity:1 } to { opacity:0 } }
@keyframes interPulse   { from { text-shadow: 0 0 20px rgba(100,150,255,0.5) } to { text-shadow: 0 0 60px rgba(100,150,255,1) } }

/* ===================== DARK MODE ===================== */
@media (prefers-color-scheme: dark) {
  .section-rank, .section-history { background: #111318; }
  .section-form { background: #181a20; }

  .first-place-card {
    background: linear-gradient(135deg, #2a2400 0%, #3a3000 100%);
    border-color: rgba(255,200,0,0.2);
  }
  .fp-points { color: #eee; }

  .rank-row { background: #1e2028; box-shadow: 0 1px 6px rgba(0,0,0,0.25); }
  .rank-bar-wrap { background: #2a2c36; }
  .rank-score { color: #ddd; }

  .form-card { background: #1e2028; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
  .form-label { color: #888; }

  .team-pill {
    background: #2a2c36;
    color: #bbb;
    border-color: rgba(255,255,255,0.1);
  }
  .rossi-pill     { background: #2d1a1c; color: #ff6b6b; border-color: rgba(220,53,69,0.3); }
  .verdi-pill     { background: #192d1e; color: #51cf66; border-color: rgba(40,167,69,0.3); }
  .arancioni-pill { background: #2d2010; color: #ff922b; border-color: rgba(253,126,20,0.3); }
  .blu-pill       { background: #101e2d; color: #74c0fc; border-color: rgba(0,123,255,0.3); }
  .fucsia-pill    { background: #2d1020; color: #f78cc6; border-color: rgba(232,62,140,0.3); }
  .gialli-pill    { background: #2d2a00; color: #ffd43b; border-color: rgba(200,150,12,0.3); }

  .rossi-pill.team-pill--active     { background: #5c1520; border-color: #ff6b6b; color: #ff6b6b; }
  .verdi-pill.team-pill--active     { background: #1a4d25; border-color: #51cf66; color: #51cf66; }
  .arancioni-pill.team-pill--active { background: #5c3010; border-color: #ff922b; color: #ff922b; }
  .blu-pill.team-pill--active       { background: #0a2e5c; border-color: #74c0fc; color: #74c0fc; }
  .fucsia-pill.team-pill--active    { background: #5c0f2f; border-color: #f78cc6; color: #f78cc6; }
  .gialli-pill.team-pill--active    { background: #5c5000; border-color: #ffd43b; color: #ffd43b; }

  .game-pill { background: #232530; color: #848ae8; border-color: rgba(102,126,234,0.2); }
  .game-pill--penalty { background: #2d1518; color: #ff6b6b; border-color: rgba(220,53,69,0.2); }

  .pts-btn { background: #2a2c36; border-color: #3a3c46; color: #ccc; }
  .pts-input { background: #2a2c36; border-color: #3a3c46; color: #fff; }

  .h-entry { background: #1e2028; border-color: #2a2c36; }
  .h-entry--recent { background: linear-gradient(90deg, #0d2440 0%, #0f2a4a 100%); border-color: #1a5080; }
  .h-game, .h-user { color: #888; }
  .h-date { color: #666; }

  .rossi-text     { color: #ff6b6b !important; }
  .verdi-text     { color: #51cf66 !important; }
  .arancioni-text { color: #ff922b !important; }
  .blu-text       { color: #74c0fc !important; }
  .fucsia-text    { color: #f78cc6 !important; }
  .gialli-text    { color: #ffd43b !important; }

  .modal-box { background: #1e2028; }
  .modal-question { color: #ddd; }
  .modal-entry-details { background: #2a2c36; }
  .md-label { color: #666; }
  .md-val { color: #ddd; }
  .modal-warning { background: #2d2800; color: #ffc107; }
  .modal-box-footer { border-top-color: #2a2c36; }
  .btn-cancel { background: #2a2c36; color: #bbb; }
  .btn-cancel:hover:not(:disabled) { background: #363840; }

  .lock-box { background: #1e2028; }
  .lock-box h3 { color: #ff6b6b; }
  .lock-box p { color: #888; }
  .lock-overlay { background: rgba(0,0,0,0.92); }
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 600px) {
  .first-place-card { padding: 1rem 1.25rem; }
  .fp-medal  { font-size: 2rem; }
  .fp-name   { font-size: 1.2rem; }
  .fp-points { font-size: 1.7rem; }
  .team-pills, .game-pills { gap: 0.4rem; }
  .team-pill, .game-pill { font-size: 0.82rem; padding: 0.4rem 0.85rem; }
  .submit-btn { font-size: 0.95rem; }
  .h-top { gap: 0.3rem; }
}
</style>
