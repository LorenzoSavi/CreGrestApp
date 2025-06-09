<template>
  <!-- Success/Error notifications at the top -->
  <div v-if="successMessage || error" class="notification-container">
    <div v-if="successMessage" class="notification is-success is-light">
      <button class="delete" @click="successMessage = ''"></button>
      <div class="success-content">
        <i class="fas fa-check-circle mr-2"></i>
        {{ successMessage }}
      </div>
    </div>
    <div v-if="error" class="notification is-danger is-light">
      <button class="delete" @click="error = ''"></button>
      <div class="error-content">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        {{ error }}
      </div>
    </div>
  </div>

  <!-- Header con titolo e bottone logout -->
  <div class="level mb-3 px-3 pt-2">
    <div class="level-left">
      <h1 class="title is-2 page-title">
        <i class="fas fa-trophy mr-3"></i>Team Points
      </h1>
    </div>
    <div class="level-right">
      <button @click="handleLogout" class="button is-danger is-small">
        <span class="icon is-small">
          <i class="fas fa-sign-out-alt"></i>
        </span>
        <span class="is-hidden-mobile"></span>
      </button>
    </div>
  </div>

  <!-- Special Inter Animation for DonGio -->
  <div v-if="showInterAnimation" class="inter-animation-overlay">
    <div class="inter-animation-container">
      <div class="inter-logo">
        <div class="inter-text">INTER</div>
        <div class="inter-subtitle">FORZA INTER! 🖤💙</div>
        <div class="inter-stars">⭐⭐⭐</div>
      </div>
      <div class="inter-message">
        Bentornato campione nerazzurro! 
      </div>
    </div>
  </div>

  <section class="section">
    <div class="container">
      <!-- Mobile: Card layout per squadre -->
      <div class="is-hidden-tablet mobile-teams-grid" :class="{ 'restricted-content': isRestrictedUser }">
        <div v-if="isRestrictedUser" class="restriction-overlay">
          <div class="restriction-message">
            <i class="fas fa-lock restriction-icon"></i>
            <h3 class="restriction-title">Classifica Riservata</h3>
            <p class="restriction-text">La visualizzazione dei punteggi è limitata per il tuo ruolo</p>
          </div>
        </div>
        
        <div v-for="(team, index) in sortedTeams" :key="team.id" class="team-card" :class="[team.id + '-card', { 'blurred-card': isRestrictedUser }]">
          <div class="team-card-header">
            <span class="team-position">
              <span v-if="index === 0" class="medal gold">🥇</span>
              <span v-else-if="index === 1" class="medal silver">🥈</span>
              <span v-else-if="index === 2" class="medal bronze">🥉</span>
              <span v-else class="position">#{{ index + 1 }}</span>
            </span>
            <span class="team-name" :class="team.id + '-text'">{{ team.name }}</span>
          </div>
          <div class="team-points">{{ team.points }}</div>
        </div>
      </div>

      <!-- Desktop: Tabella tradizionale -->
      <div class="table-wrapper is-hidden-mobile" :class="{ 'restricted-content': isRestrictedUser }">
        <div v-if="isRestrictedUser" class="restriction-overlay">
          <div class="restriction-message">
            <i class="fas fa-lock restriction-icon"></i>
            <h3 class="restriction-title">Classifica Riservata</h3>
            <p class="restriction-text">La visualizzazione dei punteggi è limitata per il tuo ruolo</p>
          </div>
        </div>
        
        <table class="table is-fullwidth is-bordered is-striped is-hoverable" :class="{ 'blurred-table': isRestrictedUser }">
          <thead>
            <tr>
              <th>Posizione</th>
              <th>Team</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody :key="teams">
            <tr v-for="(team, index) in sortedTeams" :key="team.id" :class="team.id + '-row'">
              <td class="has-text-centered">
                <span v-if="index === 0" class="medal gold">🥇</span>
                <span v-else-if="index === 1" class="medal silver">🥈</span>
                <span v-else-if="index === 2" class="medal bronze">🥉</span>
                <span v-else class="position">#{{ index + 1 }}</span>
              </td>
              <td :class="['has-text-weight-bold', team.id + '-text']">
                <strong>{{ team.name }}</strong>
              </td>
              <td class="has-text-weight-bold">{{ team.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="card">
        <header class="card-header">
          <p class="card-header-title">
            <i class="fas fa-plus-circle mr-2"></i>
            Aggiungi Punti
          </p>
        </header>
        <div class="card-content">
          <form @submit.prevent="addPoints">
            <!-- Mobile: Layout verticale -->
            <div class="mobile-form is-hidden-tablet">
              <div class="field" :class="{ 'dropdown-open': showTeamDropdown }">
                <label class="label">Select Team:</label>
                <div class="control">
                  <div class="custom-dropdown" :class="{ 'is-active': showTeamDropdown }">
                    <div class="dropdown-trigger" @click="toggleTeamDropdown">
                      <div class="dropdown-display is-large">
                        <span v-if="selectedTeam" :class="[selectedTeam + '-text', 'selected-team']">
                          {{ teams.find(t => t.id === selectedTeam)?.name }}
                        </span>
                        <span v-else class="placeholder">Scegli un team...</span>
                        <span class="dropdown-icon">
                          <i class="fas fa-chevron-down"></i>
                        </span>
                      </div>
                    </div>
                    <div class="dropdown-menu" v-if="showTeamDropdown">
                      <div class="dropdown-content">
                        <div 
                          v-for="team in teams" 
                          :key="team.id" 
                          class="dropdown-item" 
                          :class="[team.id + '-text', { 'is-active': selectedTeam === team.id }]"
                          @click="selectTeam(team.id)"
                        >
                          {{ team.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="field" :class="{ 'dropdown-open': showGameDropdown }">
                <label class="label">Select Game:</label>
                <div class="control">
                  <div class="custom-dropdown" :class="{ 'is-active': showGameDropdown }">
                    <div class="dropdown-trigger" @click="toggleGameDropdown">
                      <div class="dropdown-display is-large">
                        <span v-if="selectedGame" class="selected-option">
                          {{ games.find(g => g.id === selectedGame)?.name }}
                        </span>
                        <span v-else class="placeholder">Scegli un gioco...</span>
                        <span class="dropdown-icon">
                          <i class="fas fa-chevron-down"></i>
                        </span>
                      </div>
                    </div>
                    <div class="dropdown-menu" v-if="showGameDropdown">
                      <div class="dropdown-content">
                        <div 
                          v-for="game in games" 
                          :key="game.id" 
                          class="dropdown-item" 
                          :class="{ 'is-active': selectedGame === game.id }"
                          @click="selectGame(game.id)"
                        >
                          {{ game.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label">Points:</label>
                <div class="control">
                  <input class="input is-large" type="number" v-model.number="pointsToAdd" min="0" step="1" pattern="[0-9]*" inputmode="numeric" placeholder="0">
                </div>
              </div>
            </div>

            <!-- Desktop: Layout orizzontale -->
            <div class="columns is-hidden-mobile">
              <div class="column">
                <div class="field" :class="{ 'dropdown-open': showTeamDropdown }">
                  <label class="label">Select Team:</label>
                  <div class="control">
                    <div class="custom-dropdown" :class="{ 'is-active': showTeamDropdown }">
                      <div class="dropdown-trigger" @click="toggleTeamDropdown">
                        <div class="dropdown-display">
                          <span v-if="selectedTeam" :class="[selectedTeam + '-text', 'selected-team']">
                            {{ teams.find(t => t.id === selectedTeam)?.name }}
                          </span>
                          <span v-else class="placeholder">Scegli un team...</span>
                          <span class="dropdown-icon">
                            <i class="fas fa-chevron-down"></i>
                          </span>
                        </div>
                      </div>
                      <div class="dropdown-menu" v-if="showTeamDropdown">
                        <div class="dropdown-content">
                          <div 
                            v-for="team in teams" 
                            :key="team.id" 
                            class="dropdown-item" 
                            :class="[team.id + '-text', { 'is-active': selectedTeam === team.id }]"
                            @click="selectTeam(team.id)"
                          >
                            {{ team.name }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="column">
                <div class="field" :class="{ 'dropdown-open': showGameDropdown }">
                  <label class="label">Select Game:</label>
                  <div class="control">
                    <div class="custom-dropdown" :class="{ 'is-active': showGameDropdown }">
                      <div class="dropdown-trigger" @click="toggleGameDropdown">
                        <div class="dropdown-display">
                          <span v-if="selectedGame" class="selected-option">
                            {{ games.find(g => g.id === selectedGame)?.name }}
                          </span>
                          <span v-else class="placeholder">Scegli un gioco...</span>
                          <span class="dropdown-icon">
                            <i class="fas fa-chevron-down"></i>
                          </span>
                        </div>
                      </div>
                      <div class="dropdown-menu" v-if="showGameDropdown">
                        <div class="dropdown-content">
                          <div 
                            v-for="game in games" 
                            :key="game.id" 
                            class="dropdown-item" 
                            :class="{ 'is-active': selectedGame === game.id }"
                            @click="selectGame(game.id)"
                          >
                            {{ game.name }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="column is-narrow">
                <div class="field">
                  <label class="label">Points:</label>
                  <div class="control">
                    <input class="input" type="number" v-model.number="pointsToAdd" min="0" step="1" pattern="[0-9]*" inputmode="numeric" placeholder="0">
                  </div>
                </div>
              </div>
            </div>

            <div class="field">
              <div class="control">
                <button type="submit" class="button is-primary is-fullwidth is-large" :class="{ 'is-loading': isLoading }">
                  <span class="icon">
                    <i class="fas fa-plus"></i>
                  </span>
                  <span>Aggiungi Punti</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="card">
        <header class="card-header">
          <p class="card-header-title">
            <i class="fas fa-history mr-2"></i>
            Storico Punti ({{ sortedHistory.length }} entries)
          </p>
        </header>
        <div class="card-content">
          <!-- Mobile: Lista compatta -->
          <div class="mobile-history is-hidden-tablet">
            <div v-for="(entry, index) in sortedHistory.slice(0, 50)" :key="entry.timestamp" class="history-item" :class="{ 'recent-entry': index < 3 }">
              <div class="history-header">
                <span class="history-date">{{ formatDate(entry.timestamp) }}</span>
                <div class="history-actions">
                  <span class="history-points" :class="{ 'is-positive': entry.points > 0, 'is-negative': entry.points < 0 }">
                    {{ entry.points > 0 ? '+' : '' }}{{ entry.points }}
                  </span>
                  <button 
                    v-if="canDeleteEntries"
                    @click="deleteHistoryEntry(entry, index)" 
                    class="delete-btn"
                    :class="{ 'is-loading': deletingIndex === index }"
                    title="Cancella entry e rimuovi punti"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                  <span v-else class="delete-btn-disabled" title="Funzione non disponibile per il tuo ruolo">
                    <i class="fas fa-lock"></i>
                  </span>
                </div>
              </div>
              <div class="history-details">
                <span class="history-team" :class="entry.team + '-text'">{{ entry.team }}</span>
                <span class="history-separator">•</span>
                <span class="history-game">{{ entry.game }}</span>
                <span class="history-separator">•</span>
                <span class="history-user">{{ entry.username }}</span>
              </div>
            </div>
          </div>

          <!-- Desktop: Tabella completa -->
          <div class="table-container is-hidden-mobile">
            <table class="table is-fullwidth is-bordered is-striped is-hoverable is-narrow">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Utente</th>
                  <th>Gioco</th>
                  <th>Team</th>
                  <th>Punti</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, index) in sortedHistory.slice(0, 50)" :key="entry.timestamp" :class="{ 'recent-entry': index < 3 }">
                  <td>{{ formatDate(entry.timestamp) }}</td>
                  <td>{{ entry.username }}</td>
                  <td>{{ entry.game }}</td>
                  <td :class="entry.team + '-text'">{{ entry.team }}</td>
                  <td class="has-text-weight-bold">{{ entry.points > 0 ? '+' : '' }}{{ entry.points }}</td>
                  <td>
                    <button 
                      v-if="canDeleteEntries"
                      @click="deleteHistoryEntry(entry, index)" 
                      class="button is-danger is-small delete-btn-table"
                      :class="{ 'is-loading': deletingIndex === index }"
                      title="Cancella entry e rimuovi punti"
                    >
                      <span class="icon is-small">
                        <i class="fas fa-trash"></i>
                      </span>
                    </button>
                    <span v-else class="button is-light is-small delete-btn-disabled-table" title="Funzione non disponibile per il tuo ruolo">
                      <span class="icon is-small">
                        <i class="fas fa-lock"></i>
                      </span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="sortedHistory.length > 50" class="has-text-grey has-text-centered mt-3">
            Mostrate le ultime 50 entries. Totale: {{ sortedHistory.length }}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Modal di conferma cancellazione -->
  <div v-if="showDeleteModal" class="modal is-active">
    <div class="modal-background" @click="closeDeleteModal"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Conferma Cancellazione
        </p>
        <button class="delete" @click="closeDeleteModal" aria-label="close"></button>
      </header>
      <section class="modal-card-body">
        <div class="content">
          <p class="has-text-weight-semibold mb-4">
            Sei sicuro di voler cancellare questa entry?
          </p>
          
          <div class="entry-details-card">
            <div class="field is-horizontal">
              <div class="field-label is-normal">
                <label class="label">
                  <i class="fas fa-users mr-1"></i>
                  Team:
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <span class="tag is-medium" :class="entryToDelete?.team + '-tag'">
                    <strong :class="entryToDelete?.team + '-text'">
                      {{ getTeamName(entryToDelete?.team) }}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label is-normal">
                <label class="label">
                  <i class="fas fa-gamepad mr-1"></i>
                  Gioco:
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <span class="tag is-medium is-info is-light">
                    <i class="fas fa-trophy mr-1"></i>
                    {{ getGameName(entryToDelete?.game) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label is-normal">
                <label class="label">
                  <i class="fas fa-star mr-1"></i>
                  Punti:
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <span class="tag is-medium points-tag" :class="entryToDelete?.points > 0 ? 'is-success' : 'is-danger'">
                    <i :class="entryToDelete?.points > 0 ? 'fas fa-plus' : 'fas fa-minus'" class="mr-1"></i>
                    <strong>{{ Math.abs(entryToDelete?.points || 0) }}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label is-normal">
                <label class="label">
                  <i class="fas fa-user mr-1"></i>
                  Utente:
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <span class="tag is-medium is-primary is-light">
                    <i class="fas fa-user-circle mr-1"></i>
                    {{ entryToDelete?.username }}
                  </span>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label is-normal">
                <label class="label">
                  <i class="fas fa-calendar mr-1"></i>
                  Data:
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <span class="tag is-medium is-light">
                    <i class="fas fa-clock mr-1"></i>
                    {{ entryToDelete ? formatDate(entryToDelete.timestamp) : '' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="notification is-warning is-light mt-3 warning-box">
            <div class="warning-content">
              <div class="warning-icon">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div class="warning-text">
                <p class="has-text-weight-semibold mb-1">⚠️ Attenzione: Azione irreversibile</p>
                <p class="is-size-7">
                  I punti verranno sottratti dal team 
                  <span :class="entryToDelete?.team + '-text'">{{ getTeamName(entryToDelete?.team) }}</span>.
                  Questa operazione non può essere annullata.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button 
          class="button is-danger" 
          @click="confirmDelete"
          :class="{ 'is-loading': deletingEntry }"
          :disabled="deletingEntry"
        >
          <span class="icon is-small">
            <i class="fas fa-trash"></i>
          </span>
          <span>{{ deletingEntry ? 'Cancellazione...' : 'Conferma' }}</span>
        </button>
        <button 
          class="button is-light" 
          @click="closeDeleteModal" 
          :disabled="deletingEntry"
        >
          <span class="icon is-small">
            <i class="fas fa-times"></i>
          </span>
          <span>Annulla</span>
        </button>
      </footer>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { doc, getDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import { useLogout } from '@/composables/useLogout'

export default {
  name: 'TeamPoints',
  setup() {
    const { logout } = useLogout()

    const handleLogout = () => {
      logout()
    }

    return {
      handleLogout
    }
  },
  data() {
    return {
      teams: [
        { id: 'rossi', name: 'Rossi', points: 0, color: '#FF0000' },
        { id: 'verdi', name: 'Verdi', points: 0, color: '#008000' },
        { id: 'arancioni', name: 'Arancioni', points: 0, color: '#FFA500' },
        { id: 'blu', name: 'Blu', points: 0, color: '#40E0D0' },
        { id: 'fucsia', name: 'Fucsia', points: 0, color: '#FF00FF' },
        { id: 'gialli', name: 'Gialli', points: 0, color: '#FFFF00' }
      ],
      games: [
        { id: 'puntiSpeciali', name: 'Punti Speciali' },
        { id: 'penitenza', name: 'Penitenza' },
      ],
      selectedTeam: '',
      selectedGame: '',
      pointsToAdd: 0,
      error: '',
      successMessage: '', 
      pointsHistory: [],
      historyError: '',
      isLoading: false,
      showTeamDropdown: false,
      showGameDropdown: false,
      deletingIndex: null,
      showDeleteModal: false,
      entryToDelete: null,
      deletingEntry: false,
      // Lista utenti con accesso limitato
      restrictedUsers: ['FalcoCinese', 'AleVitali', 'BreVismara', 'FraTerrone'],
      // Inter animation for DonGio
      showInterAnimation: false
    };
  },
  computed: {
    sortedTeams() {
      return this.teams.slice().sort((a, b) => b.points - a.points);
    },
    sortedHistory() {
      return this.pointsHistory.slice().sort((a, b) => {
        const timeA = a.timestamp.seconds || new Date(a.timestamp).getTime() / 1000;
        const timeB = b.timestamp.seconds || new Date(b.timestamp).getTime() / 1000;
        return timeB - timeA; // Dal più recente al più vecchio
      });
    },
    currentUser() {
      let user = JSON.parse(localStorage.getItem('loggedInUser'));
      if (!user) {
        user = JSON.parse(sessionStorage.getItem('loggedInUser'));
      }
      return user;
    },
    isRestrictedUser() {
      return this.currentUser && this.restrictedUsers.includes(this.currentUser.username);
    },
    canDeleteEntries() {
      return !this.isRestrictedUser;
    },
    isDonGio() {
      return this.currentUser && this.currentUser.username === 'DonGio';
    }
  },
  async created() {
    await this.fetchTeamPoints();
    await this.fetchPointsHistory();
    
    // Show Inter animation for DonGio with fade in/out
    if (this.isDonGio) {
      this.showInterAnimation = true;
      
      // Hide animation after 3.5 seconds with fade out
      setTimeout(() => {
        // Add fade out class
        const overlay = document.querySelector('.inter-animation-overlay');
        if (overlay) {
          overlay.classList.add('fade-out');
        }
        
        // Remove from DOM after fade out completes
        setTimeout(() => {
          this.showInterAnimation = false;
        }, 800); // Wait for fade out animation to complete
      }, 3500);
    }
  },
  mounted() {
    // Debug: stampa lo stato dei dropdown
    console.log('Mounted - Dropdown states:', {
      team: this.showTeamDropdown,
      game: this.showGameDropdown
    });
    
    // Forza chiusura di tutti i dropdown
    this.$nextTick(() => {
      this.showTeamDropdown = false;
      this.showGameDropdown = false;
      
      console.log('After forced close:', {
        team: this.showTeamDropdown,
        game: this.showGameDropdown
      });
    });
    
    // Chiudi dropdown quando si clicca fuori
    document.addEventListener('click', this.closeDropdowns);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeDropdowns);
  },
  methods: {
    async fetchTeamPoints() {
      try {
        const docRef = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          this.teams.forEach(team => {
            team.points = data[team.id] || 0;
          });
        } else {
          console.error('Points document does not exist.');
          this.error = 'Points document does not exist.';
        }
      } catch (error) {
        console.error('Error fetching team points:', error);
        this.error = 'Error fetching team points.';
      }
    },
    async addPoints() {
      this.isLoading = true;
      try {
        if (!this.selectedTeam || !this.selectedGame) {
          this.error = 'Please select a team and a game.';
          this.successMessage = '';
          return;
        }

        const docRef = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const currentPoints = docSnap.data()[this.selectedTeam] || 0;
          
          // Se è una penitenza, rendi i punti negativi automaticamente
          let pointsToApply = parseInt(this.pointsToAdd);
          if (this.selectedGame === 'penitenza' && pointsToApply > 0) {
            pointsToApply = -pointsToApply;
          }
          
          const newPoints = currentPoints + pointsToApply;

          await updateDoc(docRef, {
            [this.selectedTeam]: newPoints
          });

          await this.addHistory(pointsToApply);
          const operazione = pointsToApply > 0 ? 'aggiunti' : 'sottratti';
          this.successMessage = `✅ ${Math.abs(pointsToApply)} punti ${operazione} al team ${this.selectedTeam}!`;
          this.selectedTeam = '';
          this.selectedGame = '';
          this.pointsToAdd = 0;
          this.error = ''; // Clear any previous errors
          await this.fetchTeamPoints(); // Refresh team points after update
          await this.fetchPointsHistory(); // Refresh points history after update
        } else {
          this.error = 'Points document does not exist.';
          this.successMessage = ''; // Clear success message
        }
      } catch (error) {
        console.error('Error adding points:', error);
        this.error = 'An error occurred while adding points.';
        this.successMessage = ''; // Clear success message
      } finally {
        this.isLoading = false;
      }
    },
    async addHistory(pointsToApply = null) {
      try {
        const docRef = doc(db, 'points', 'history');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Aggiornato per supportare il nuovo sistema di sessioni
          const getCurrentUser = () => {
            let user = JSON.parse(localStorage.getItem('loggedInUser'));
            if (!user) {
              user = JSON.parse(sessionStorage.getItem('loggedInUser'));
            }
            return user;
          };

          const pointsForHistory = pointsToApply !== null ? pointsToApply : parseInt(this.pointsToAdd);

          await updateDoc(docRef, {
            history: arrayUnion({
              username: getCurrentUser() ? getCurrentUser().username : 'unknown',
              team: this.selectedTeam,
              game: this.selectedGame,
              points: pointsForHistory,
              timestamp: new Date()
            })
          });
        } else {
          this.error = 'History document does not exist.';
        }
      } catch (error) {
        console.error('Error adding history:', error);
        this.error = 'An error occurred while adding history.';
      }
    },
    async fetchPointsHistory() {
      try {
        const docRef = doc(db, 'points', 'history');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          this.pointsHistory = data.history || [];
        } else {
          this.historyError = 'History document does not exist.';
        }
      } catch (error) {
        console.error('Error fetching points history:', error);
        this.historyError = 'Error fetching points history.';
      }
    },
    shouldTextBeBlack(team) {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (team.id === 'bianchi') {
      return !prefersDarkScheme;
    }
    return false;
  },
  formatDate(timestamp) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // Metodi per gestire i dropdown personalizzati
    toggleTeamDropdown(event) {
      event?.stopPropagation();
      console.log('Toggle team dropdown - before:', this.showTeamDropdown);
      this.showTeamDropdown = !this.showTeamDropdown;
      console.log('Toggle team dropdown - after:', this.showTeamDropdown);
      this.closeOtherDropdowns('team');
    },
    
    toggleGameDropdown(event) {
      event?.stopPropagation();
      console.log('Toggle game dropdown - before:', this.showGameDropdown);
      this.showGameDropdown = !this.showGameDropdown;
      console.log('Toggle game dropdown - after:', this.showGameDropdown);
      this.closeOtherDropdowns('game');
    },
    
    selectTeam(teamId, event) {
      event?.stopPropagation();
      this.selectedTeam = teamId;
      this.showTeamDropdown = false;
    },
    
    selectGame(gameId, event) {
      event?.stopPropagation();
      this.selectedGame = gameId;
      this.showGameDropdown = false;
    },
    
    closeOtherDropdowns(except) {
      if (except !== 'team') this.showTeamDropdown = false;
      if (except !== 'game') this.showGameDropdown = false;
    },
    
    closeDropdowns(event) {
      // Chiudi tutti i dropdown se si clicca fuori
      if (!event.target.closest('.custom-dropdown')) {
        this.showTeamDropdown = false;
        this.showGameDropdown = false;
      }
    },
    async deleteHistoryEntry(entry, index) {
      // Mostra il modal invece del confirm
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
    
    getTeamName(teamId) {
      const team = this.teams.find(t => t.id === teamId);
      return team ? team.name : teamId;
    },
    
    getGameName(gameId) {
      const game = this.games.find(g => g.id === gameId);
      return game ? game.name : gameId;
    },
    
    async confirmDelete() {
      if (!this.entryToDelete) return;
      
      this.deletingEntry = true;
      
      try {
        // Prima rimuovi i punti dal team
        await this.removePointsFromTeam(this.entryToDelete.team, this.entryToDelete.points);
        
        // Poi rimuovi l'entry dalla cronologia
        await this.removeFromHistory(this.entryToDelete);
        
        // Aggiorna i dati
        await this.fetchTeamPoints();
        await this.fetchPointsHistory();
        
        // Messaggio di successo più dettagliato
        const teamName = this.getTeamName(this.entryToDelete.team);
        const pointsText = Math.abs(this.entryToDelete.points);
        const operazione = this.entryToDelete.points > 0 ? 'rimossi' : 'aggiunti';
        
        this.successMessage = `🗑️ Entry cancellata con successo! ${pointsText} punti ${operazione} dal team ${teamName}`;
        this.error = '';
        
        // Chiudi il modal
        this.closeDeleteModal();
        
        // Scroll verso l'alto per mostrare il messaggio
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Nasconde il messaggio dopo 5 secondi
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
        
      } catch (error) {
        console.error('Error deleting history entry:', error);
        this.error = '❌ Errore durante la cancellazione dell\'entry. Riprova.';
        this.successMessage = '';
        this.deletingEntry = false;
      }
    },
    async removePointsFromTeam(teamId, pointsToRemove) {
      const docRef = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentPoints = docSnap.data()[teamId] || 0;
        const newPoints = currentPoints - pointsToRemove; // Sottrae i punti

        await updateDoc(docRef, {
          [teamId]: newPoints
        });
      } else {
        throw new Error('Points document does not exist.');
      }
    },
    
    async removeFromHistory(entryToRemove) {
      const docRef = doc(db, 'points', 'history');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentHistory = docSnap.data().history || [];
        
        // Filtra l'array rimuovendo l'entry specifica
        // Confronta per timestamp e dati identici per sicurezza
        const updatedHistory = currentHistory.filter(entry => {
          const entryTime = entry.timestamp.seconds || new Date(entry.timestamp).getTime() / 1000;
          const removeTime = entryToRemove.timestamp.seconds || new Date(entryToRemove.timestamp).getTime() / 1000;
          
          return !(
            Math.abs(entryTime - removeTime) < 1 && // Stesso timestamp (con tolleranza di 1 secondo)
            entry.team === entryToRemove.team &&
            entry.game === entryToRemove.game &&
            entry.points === entryToRemove.points &&
            entry.username === entryToRemove.username
          );
        });

        await updateDoc(docRef, {
          history: updatedHistory
        });
      } else {
        throw new Error('History document does not exist.');
      }
    },
  }
};
</script>

<style scoped>
.page-title {
  font-size: 2.5rem !important;
  font-weight: bold !important;
  color: #363636 !important;
  margin: 0 !important;
}

.section {
  padding: 1.5rem;
}

.level {
  margin-bottom: 1rem;
}

.title {
  color: #363636;
  margin-bottom: 0;
}

.button.is-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  height: 3rem;
}

.button.is-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.button.is-danger {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.select {
  width: 100%;
}

.select select {
  border-radius: 8px;
  border: 2px solid #e3e3e3;
  transition: all 0.3s ease;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  width: 100%;
  height: auto;
  min-height: 2.25rem;
}

.select select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.125em rgba(102, 126, 234, 0.25);
}

.input {
  border-radius: 8px;
  border: 2px solid #e3e3e3;
  transition: all 0.3s ease;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
}

.input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.125em rgba(102, 126, 234, 0.25);
}

.label {
  font-weight: 600;
  color: #4a4a4a;
}

.field {
  margin-bottom: 1.5rem;
}

.table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: white;
}

.table th {
  background-color: #f8f9fa;
  color: #363636;
  font-weight: 600;
  border: 1px solid #dbdbdb;
  padding: 1rem 0.75rem;
}

.table td {
  background-color: white;
  color: #363636;
  border: 1px solid #dbdbdb;
  padding: 0.75rem;
}

.table.is-striped tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.table.is-striped tbody tr:nth-child(even) td {
  background-color: #fafafa;
}

.table.is-hoverable tbody tr:hover {
  background-color: #f5f5f5;
}

.table.is-hoverable tbody tr:hover td {
  background-color: #f5f5f5;
}

/* Colori squadre corretti - estesi per dropdown e select */
.rossi-text, .rossi-text strong, .table .rossi-text, .table .rossi-text strong,
.dropdown-item.rossi-text, .custom-dropdown .rossi-text,
.select option.rossi-text, option.rossi-text {
  color: #DC3545 !important;
  font-weight: bold !important;
}
.verdi-text, .verdi-text strong, .table .verdi-text, .table .verdi-text strong,
.dropdown-item.verdi-text, .custom-dropdown .verdi-text,
.select option.verdi-text, option.verdi-text {
  color: #28A745 !important;
  font-weight: bold !important;
}
.arancioni-text, .arancioni-text strong, .table .arancioni-text, .table .arancioni-text strong,
.dropdown-item.arancioni-text, .custom-dropdown .arancioni-text,
.select option.arancioni-text, option.arancioni-text {
  color: #FD7E14 !important;
  font-weight: bold !important;
}
.blu-text, .blu-text strong, .table .blu-text, .table .blu-text strong,
.dropdown-item.blu-text, .custom-dropdown .blu-text,
.select option.blu-text, option.blu-text {
  color: #007BFF !important;
  font-weight: bold !important;
}
.fucsia-text, .fucsia-text strong, .table .fucsia-text, .table .fucsia-text strong,
.dropdown-item.fucsia-text, .custom-dropdown .fucsia-text,
.select option.fucsia-text, option.fucsia-text {
  color: #E83E8C !important;
  font-weight: bold !important;
}
.gialli-text, .gialli-text strong, .table .gialli-text, .table .gialli-text strong,
.dropdown-item.gialli-text, .custom-dropdown .gialli-text,
.select option.gialli-text, option.gialli-text {
  color: #FFC107 !important;
  font-weight: bold !important;
}

/* Colori nelle opzioni selected dei dropdown */
.custom-dropdown .selected-team.rossi-text { color: #DC3545 !important; }
.custom-dropdown .selected-team.verdi-text { color: #28A745 !important; }
.custom-dropdown .selected-team.arancioni-text { color: #FD7E14 !important; }
.custom-dropdown .selected-team.blu-text { color: #007BFF !important; }
.custom-dropdown .selected-team.fucsia-text { color: #E83E8C !important; }
.custom-dropdown .selected-team.gialli-text { color: #FFC107 !important; }

/* Restriction overlay styles - ADDED ONLY THESE */
.table-wrapper {
  position: relative;
}

.mobile-teams-grid {
  position: relative;
}

.restricted-content {
  position: relative;
}

.restriction-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: flex !important;
  align-items: center;
  justify-content: center;
  z-index: 1000 !important;
  border-radius: 12px;
  pointer-events: all;
  min-height: 300px;
}

.restriction-message {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  border: 3px solid #dc3545;
  max-width: 400px;
  animation: restrictionPulse 0.6s ease-out;
  z-index: 1001;
  position: relative;
}

@keyframes restrictionPulse {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.restriction-icon {
  font-size: 4rem;
  color: #dc3545;
  margin-bottom: 1rem;
  animation: lockShake 2s infinite;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes lockShake {
  0%, 50%, 100% {
    transform: rotate(0deg);
  }
  10%, 30% {
    transform: rotate(-5deg);
  }
  20%, 40% {
    transform: rotate(5deg);
  }
}

.restriction-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #dc3545;
  margin-bottom: 0.8rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.restriction-text {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;
  line-height: 1.5;
  font-weight: 500;
}

/* Blurred content styles - ADDED ONLY THESE */
.blurred-card {
  filter: blur(8px) !important;
  opacity: 0.3 !important;
  pointer-events: none !important;
  user-select: none !important;
}

.blurred-table {
  filter: blur(8px) !important;
  opacity: 0.3 !important;
  pointer-events: none !important;
  user-select: none !important;
}

/* Mobile teams grid specific styling - ADDED ONLY THESE */
.mobile-teams-grid.restricted-content {
  min-height: 400px;
}

.mobile-teams-grid .restriction-overlay {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  min-height: 400px;
}

/* Desktop table specific styling - ADDED ONLY THESE */
.table-wrapper.restricted-content {
  min-height: 300px;
}

.table-wrapper .restriction-overlay {
  min-height: 300px;
}

/* Mobile team cards */
.mobile-teams-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.team-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 5px solid;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.team-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.team-position {
  font-size: 1.2rem;
  min-width: 2rem;
}

.team-name {
  font-size: 1.3rem;
  font-weight: bold;
}

.team-points {
  font-size: 2rem;
  font-weight: 900;
  color: #363636;
}

/* Border colors per le card */
.rossi-card { border-left-color: #DC3545; }
.verdi-card { border-left-color: #28A745; }
.arancioni-card { border-left-color: #FD7E14; }
.blu-card { border-left-color: #007BFF; }
.fucsia-card { border-left-color: #E83E8C; }
.gialli-card { border-left-color: #FFC107; }

/* Mobile form improvements */
.mobile-form .field {
  margin-bottom: 1.5rem;
}

.mobile-form .select.is-large select {
  font-size: 1.1rem;
  padding: 1rem;
  height: auto;
  min-height: 3.5rem;
}

.mobile-form .input.is-large {
  font-size: 1.1rem;
  padding: 1rem;
  height: auto;
  min-height: 3.5rem;
}

/* Mobile history */
.mobile-history {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.history-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-item.recent-entry {
  background-color: #e3f2fd;
  border-color: #2196f3;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.history-date {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.history-points {
  font-size: 1.1rem;
  font-weight: bold;
}

.history-points.is-positive {
  color: #28a745;
}

.history-points.is-negative {
  color: #dc3545;
}

.history-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.history-team {
  font-weight: bold;
}

.history-separator {
  color: #999;
}

.history-game {
  font-style: italic;
  color: #666;
}

.history-user {
  color: #666;
}

/* Delete button styles */
.delete-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  margin-left: 0.5rem;
  min-width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background-color: #dc3545;
  color: white;
  transform: scale(1.1);
}

.delete-btn.is-loading {
  opacity: 0.6;
  pointer-events: none;
}

.delete-btn.is-loading::after {
  content: '';
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid #dc3545;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.delete-btn-table {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  height: auto;
  min-height: 1.5rem;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark mode per delete button */
@media (prefers-color-scheme: dark) {
  .delete-btn {
    color: #ff6b6b;
  }
  
  .delete-btn:hover {
    background-color: #ff6b6b;
    color: #1a1a1a;
  }
  
  .delete-btn.is-loading::after {
    border-top-color: #ff6b6b;
  }
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .delete-btn {
    font-size: 0.8rem;
    min-width: 1.75rem;
    height: 1.75rem;
  }
  
  .history-actions {
    gap: 0.25rem;
  }
  
  /* Restriction mobile adjustments - ADDED ONLY THESE */
  .restriction-overlay {
    min-height: 350px;
  }
  
  .mobile-teams-grid.restricted-content {
    min-height: 350px;
  }
  
  .mobile-teams-grid .restriction-overlay {
    min-height: 350px;
  }
  
  .restriction-message {
    padding: 1.5rem;
    margin: 1rem;
    max-width: calc(100vw - 2rem);
    border-width: 2px;
  }
  
  .restriction-icon {
    font-size: 3rem;
  }
  
  .restriction-title {
    font-size: 1.4rem;
  }
  
  .restriction-text {
    font-size: 1rem;
  }
}

/* Mobile responsive improvements */
@media (max-width: 768px) {
  .level {
    flex-direction: row !important;
    align-items: center;
    margin-bottom: 0.75rem;
    padding: 0 1rem;
  }
  
  .page-title {
    font-size: 1.8rem !important;
  }
  
  .section {
    padding: 1rem;
  }
  
  .button.is-danger.is-small span:not(.icon) {
    display: none;
  }
  
  .card {
    margin-bottom: 1.5rem;
  }
  
  .card-content {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.5rem !important;
  }
  
  .section {
    padding: 0.75rem;
  }
  
  .team-card {
    padding: 1rem;
  }
  
  .team-name {
    font-size: 1.1rem;
  }
  
  .team-points {
    font-size: 1.5rem;
  }
  
  .card-content {
    padding: 1rem;
  }
  
  .history-item {
    padding: 0.75rem;
  }
  
  .delete-btn {
    font-size: 0.8rem;
    min-width: 1.75rem;
    height: 1.75rem;
  }
  
  .history-actions {
    gap: 0.25rem;
  }
  
  /* Restriction smallest mobile adjustments - ADDED ONLY THESE */
  .restriction-overlay {
    min-height: 300px;
  }
  
  .mobile-teams-grid.restricted-content {
    min-height: 300px;
  }
  
  .mobile-teams-grid .restriction-overlay {
    min-height: 300px;
  }
  
  .restriction-message {
    padding: 1rem;
    margin: 0.5rem;
  }
  
  .restriction-icon {
    font-size: 2.5rem;
  }
  
  .restriction-title {
    font-size: 1.2rem;
  }
  
  .restriction-text {
    font-size: 0.9rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .section {
    background-color: #1a1a1a;
    color: #ffffff;
  }
  
  .title, .page-title {
    color: #ffffff !important;
  }
  
  .label {
    color: #ffffff;
  }
  
  .select select, .input {
    background-color: #3a3a3a;
    border-color: #555555;
    color: #ffffff;
  }
  
  .select select:focus, .input:focus {
    background-color: #404040;
    border-color: #667eea;
  }
  
  .table {
    background-color: #2d2d2d;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .table th {
    background-color: #404040;
    color: #ffffff;
    border-color: #555555;
  }
  
  .table td {
    background-color: #2d2d2d;
    color: #ffffff;
    border-color: #555555;
  }
  
  .table.is-striped tbody tr:nth-child(even) td {
    background-color: #353535;
  }
  
  .table.is-hoverable tbody tr:hover td {
    background-color: #404040;
  }
  
  .card {
    background-color: #2d2d2d;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  
  .card-header {
    background: linear-gradient(135deg, #404040 0%, #353535 100%);
  }
  
  .card-header-title {
    color: #ffffff;
  }
  
  .team-card {
    background-color: #2d2d2d;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .team-points {
    color: #ffffff;
  }
  
  .history-item {
    background-color: #2d2d2d;
    border-color: #555555;
    color: #ffffff;
  }
  
  .history-item.recent-entry {
    background-color: #1e3a5f;
    border-color: #2196f3;
  }
  
  .history-date, .history-game, .history-user {
    color: #cccccc;
  }
  
  .history-separator {
    color: #999;
  }
  
  /* Colori squadre per dark mode - più visibili - estesi per dropdown */
  .rossi-text, .rossi-text strong, .table .rossi-text, .table .rossi-text strong,
  .dropdown-item.rossi-text, .custom-dropdown .rossi-text,
  .select option.rossi-text, option.rossi-text {
    color: #FF6B6B !important;
  }
  .verdi-text, .verdi-text strong, .table .verdi-text, .table .verdi-text strong,
  .dropdown-item.verdi-text, .custom-dropdown .verdi-text,
  .select option.verdi-text, option.verdi-text {
    color: #51CF66 !important;
  }
  .arancioni-text, .arancioni-text strong, .table .arancioni-text, .table .arancioni-text strong,
  .dropdown-item.arancioni-text, .custom-dropdown .arancioni-text,
  .select option.arancioni-text, option.arancioni-text {
    color: #FF922B !important;
  }
  .blu-text, .blu-text strong, .table .blu-text, .table .blu-text strong,
  .dropdown-item.blu-text, .custom-dropdown .blu-text,
  .select option.blu-text, option.blu-text {
    color: #74C0FC !important;
  }
  .fucsia-text, .fucsia-text strong, .table .fucsia-text, .table .fucsia-text strong,
  .dropdown-item.fucsia-text, .custom-dropdown .fucsia-text,
  .select option.fucsia-text, option.fucsia-text {
    color: #F06292 !important;
  }
  .gialli-text, .gialli-text strong, .table .gialli-text, .table .gialli-text strong,
  .dropdown-item.gialli-text, .custom-dropdown .gialli-text,
  .select option.gialli-text, option.gialli-text {
    color: #FFD43B !important;
  }

  /* Colori nelle opzioni selected dei dropdown per dark mode */
  .custom-dropdown .selected-team.rossi-text { color: #FF6B6B !important; }
  .custom-dropdown .selected-team.verdi-text { color: #51CF66 !important; }
  .custom-dropdown .selected-team.arancioni-text { color: #FF922B !important; }
  .custom-dropdown .selected-team.blu-text { color: #74C0FC !important; }
  .custom-dropdown .selected-team.fucsia-text { color: #F06292 !important; }
  .custom-dropdown .selected-team.gialli-text { color: #FFD43B !important; }
  
  .delete-btn {
    color: #ff6b6b;
  }
  
  .delete-btn:hover {
    background-color: #ff6b6b;
    color: #1a1a1a;
  }
  
  .delete-btn.is-loading::after {
    border-top-color: #ff6b6b;
  }
  
  /* Dark mode for restrictions - ADDED ONLY THESE */
  .restriction-overlay {
    background: rgba(42, 42, 42, 0.98);
  }
  
  .mobile-teams-grid .restriction-overlay {
    background: rgba(42, 42, 42, 0.98);
  }
  
  .restriction-message {
    background: #2d2d2d;
    border-color: #ff6b6b;
    color: #ffffff;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }
  
  .restriction-icon {
    color: #ff6b6b;
  }
  
  .restriction-title {
    color: #ff6b6b;
  }
  
  .restriction-text {
    color: #e9ecef;
  }
  
  .delete-btn-disabled {
    color: #888888;
  }
  
  .delete-btn-disabled-table .icon {
    color: #888888 !important;
  }
}

/* Notification container at the top */
.notification-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000000;
  padding: 1rem;
  pointer-events: none;
}

.notification-container .notification {
  pointer-events: auto;
  margin: 0 auto 0.5rem auto;
  max-width: 600px;
  border-radius: 8px;
  position: relative;
  animation: slideDown 0.4s ease-out;
  border-left: 4px solid;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.notification-container .notification.is-success {
  border-left-color: #28a745;
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  box-shadow: 0 4px 20px rgba(40, 167, 69, 0.3);
}

.notification-container .notification.is-danger {
  border-left-color: #dc3545;
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  box-shadow: 0 4px 20px rgba(220, 53, 69, 0.3);
}

.success-content, .error-content {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1rem;
}

.success-content i {
  color: #28a745;
  font-size: 1.1rem;
}

.error-content i {
  color: #dc3545;
  font-size: 1.1rem;
}

@keyframes slideDown {
  0% {
    opacity: 0;
    transform: translateY(-30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark mode for notifications */
@media (prefers-color-scheme: dark) {
  .notification-container .notification.is-success {
    background: linear-gradient(135deg, #1e5128 0%, #2d5a3d 100%);
    color: #d4edda;
  }
  
  .notification-container .notification.is-danger {
    background: linear-gradient(135deg, #721c24 0%, #842029 100%);
    color: #f8d7da;
  }
  
  .success-content i {
    color: #51cf66;
  }
  
  .error-content i {
    color: #ff6b6b;
  }
}

/* Mobile notification adjustments */
@media (max-width: 768px) {
  .notification-container {
    padding: 0.5rem;
  }
  
  .notification-container .notification {
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
    max-width: 100%;
  }
  
  .success-content, .error-content {
    font-size: 0.9rem;
  }
  
  .success-content i, .error-content i {
    font-size: 1rem;
  }
}

/* Custom Dropdown Styles - copied from AddPoint.vue */
.custom-dropdown {
  position: relative;
  width: 100%;
  z-index: 50;
}

.custom-dropdown.is-active {
  z-index: 100;
}

.dropdown-trigger {
  cursor: pointer;
  width: 100%;
  user-select: none;
  position: relative;
  z-index: 1;
}

.dropdown-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border: 2px solid #e3e3e3;
  border-radius: 8px;
  background: white;
  transition: all 0.3s ease;
  min-height: 3rem;
  position: relative;
  color: #333;
}

.dropdown-display.is-large {
  padding: 1rem;
  min-height: 3.5rem;
  font-size: 1.1rem;
}

.custom-dropdown.is-active .dropdown-display {
  border-color: #667eea;
  box-shadow: 0 0 0 0.125em rgba(102, 126, 234, 0.25);
}

.dropdown-display:hover {
  border-color: #667eea;
}

.placeholder {
  color: #999;
  font-style: italic;
}

.selected-option {
  color: #333;
  font-weight: 500;
}

.selected-team {
  font-weight: bold;
}

.dropdown-icon {
  color: #999;
  transition: transform 0.3s ease;
  font-size: 0.8rem;
}

.custom-dropdown.is-active .dropdown-icon {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 99999 !important;
  margin-top: 4px !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.dropdown-content {
  background: white !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e3e3e3 !important;
  max-height: 300px !important;
  overflow-y: auto !important;
  animation: dropdownSlide 0.2s ease-out !important;
  position: relative !important;
  width: 100% !important;
  z-index: 99999 !important;
}

@keyframes dropdownSlide {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  padding: 0.75rem 1rem !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  border-bottom: 1px solid #f5f5f5 !important;
  user-select: none !important;
  position: relative !important;
  display: block !important;
  width: 100% !important;
  background: white !important;
  color: #333 !important;
  z-index: 99999 !important;
}

.dropdown-item:last-child {
  border-bottom: none !important;
}

.dropdown-item:hover {
  background-color: #f8f9fa !important;
}

.dropdown-item.is-active {
  background-color: #667eea !important;
  color: white !important;
}

.dropdown-item.is-active.rossi-text,
.dropdown-item.is-active.verdi-text,
.dropdown-item.is-active.arancioni-text,
.dropdown-item.is-active.blu-text,
.dropdown-item.is-active.fucsia-text,
.dropdown-item.is-active.gialli-text {
  color: white !important;
}

.field.dropdown-open {
  z-index: 100000;
}

/* Force hide when not active */
.custom-dropdown:not(.is-active) .dropdown-menu {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

/* Dark mode adjustments for custom dropdowns */
@media (prefers-color-scheme: dark) {
  .dropdown-display {
    background-color: #3a3a3a !important;
    border-color: #555555 !important;
    color: #ffffff !important;
  }
  
  .dropdown-content {
    background-color: #3a3a3a !important;
    border-color: #555555 !important;
  }
  
  .dropdown-item {
    color: #ffffff !important;
    border-bottom-color: #555555 !important;
    background-color: #3a3a3a !important;
  }
  
  .dropdown-item:hover {
    background-color: #4a4a4a !important;
  }
  
  .placeholder {
    color: #aaa;
  }
  
  .selected-option {
    color: #ffffff;
  }
}

/* Modal styles - Enhanced */
.modal {
  z-index: 999999;
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.modal-background {
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.modal-card {
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  max-width: 500px;
  margin: 0 auto;
  animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  max-height: 90vh;
}

@keyframes modalSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-card-head {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border-radius: 12px 12px 0 0;
  color: white;
  padding: 1.25rem 1.5rem;
  border: none;
}

.modal-card-title {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.modal-card-head .delete {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transition: all 0.3s ease;
  width: 24px;
  height: 24px;
}

.modal-card-head .delete:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-card-body {
  padding: 1.5rem;
  background: white;
  overflow-y: auto;
  flex: 1;
}

.entry-details-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.entry-details-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  border-radius: 8px 8px 0 0;
}

.field.is-horizontal {
  margin-bottom: 1rem;
  align-items: center;
}

.field.is-horizontal:last-child {
  margin-bottom: 0;
}

.field-label {
  flex-grow: 0;
  flex-shrink: 0;
  margin-right: 1rem;
  text-align: right;
  min-width: 5rem;
}

.field-label .label {
  font-weight: 600;
  color: #4a4a4a;
  font-size: 0.85rem;
}

.tag.is-medium {
  font-size: 0.9rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.tag.is-medium:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.points-tag {
  font-size: 1rem !important;
  height: 2.5rem !important;
  font-weight: 700 !important;
}

.warning-box {
  border-radius: 8px;
  border: 1px solid #ffc107;
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
  padding: 1rem !important;
}

.warning-content {
   display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.warning-icon {
  font-size: 1.25rem;
  color: #e67e22;
  margin-top: 0.125rem;
}

.warning-text {
  flex: 1;
}

.modal-card-foot {
  padding: 1.25rem 1.5rem;
  border-radius: 0 0 12px 12px;
  gap: 0.75rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
}

.modal-card-foot .button {
  border-radius: 6px;
  font-weight: 600;
  height: 2.5rem;
  padding: 0 1rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.modal-card-foot .button.is-danger {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  border: none;
  color: white;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.modal-card-foot .button.is-danger:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

.modal-card-foot .button.is-light {
  background: #ffffff;
  border: 1px solid #e9ecef;
  color: #6c757d;
}

.modal-card-foot .button.is-light:hover:not(:disabled) {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* Dark mode for modal - Enhanced */
@media (prefers-color-scheme: dark) {
  .modal-card {
    background-color: #2d2d2d;
    color: #ffffff;
  }
  
  .modal-card-body {
    background-color: #2d2d2d;
  }
  
  .entry-details-card {
    background: linear-gradient(135deg, #3a3a3a 0%, #2d2d2d 100%);
    border-color: #555555;
    color: #ffffff;
  }
  
  .field-label .label {
    color: #e9ecef;
  }
  
  .tag.is-light {
    background-color: #4a4a4a;
    color: #ffffff;
    border: 1px solid #6c757d;
  }
  
  .tag.is-info.is-light {
    background-color: #17a2b8;
    color: white;
  }
  
  .tag.is-primary.is-light {
    background-color: #007bff;
    color: white;
  }
  
  .warning-box {
    background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
    border-color: #ffc107;
  }
  
  .warning-text {
    color: #e9ecef;
  }
  
  .modal-card-foot {
    background-color: #3a3a3a;
    border-top-color: #555555;
  }
  
  .modal-card-foot .button.is-light {
    background-color: #4a4a4a;
    border-color: #6c757d;
    color: #e9ecef;
  }
  
  .modal-card-foot .button.is-light:hover:not(:disabled) {
    background-color: #555555;
  }
}

/* Responsive modal - Enhanced */
@media (max-width: 768px) {
  .modal-card {
    margin: 0.75rem;
    max-height: calc(100vh - 1.5rem);
    max-width: calc(100vw - 1.5rem);
  }
  
  .modal-card-head {
    padding: 1rem 1.25rem;
  }
  
  .modal-card-title {
    font-size: 1rem;
  }
  
  .modal-card-body {
    padding: 1.25rem;
  }
  
  .field.is-horizontal {
    display: block;
    margin-bottom: 0.75rem;
  }
  
  .field-label {
    margin-right: 0;
    margin-bottom: 0.5rem;
    text-align: left;
    min-width: auto;
  }
  
  .entry-details-card {
    padding: 1rem;
  }
  
  .modal-card-foot {
    padding: 1rem 1.25rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .modal-card-foot .button {
    width: 100%;
  }
  
  .tag.is-medium {
    font-size: 0.85rem;
    height: 2rem;
    padding: 0 0.5rem;
  }
  
  .warning-content {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .warning-icon {
    align-self: center;
    margin-top: 0;
  }
}

@media (max-width: 480px) {
  .modal-card {
    margin: 0.5rem;
    border-radius: 8px;
    max-height: calc(100vh - 1rem);
  }
  
  .modal-card-head {
    border-radius: 8px 8px 0 0;
    padding: 0.75rem 1rem;
  }
  
  .modal-card-title {
    font-size: 0.95rem;
  }
  
  .modal-card-body {
    padding: 1rem;
  }
  
  .modal-card-foot {
    border-radius: 0 0 8px 8px;
    padding: 0.75rem 1rem;
  }
  
  .entry-details-card {
    padding: 0.75rem;
  }
  
  .warning-box {
    padding: 0.75rem !important;
  }
  
  .field-label .label {
    font-size: 0.8rem;
  }
  
  .tag.is-medium {
    font-size: 0.8rem;
    height: 1.75rem;
  }
}

/* Inter Animation Styles for DonGio */
.inter-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #000000 0%, #0066cc 50%, #000000 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  animation: interFadeIn 0.8s ease-out;
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

/* Fade in animation */
@keyframes interFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Fade out class */
.inter-animation-overlay.fade-out {
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.8s ease-in, transform 0.8s ease-in;
}

.inter-animation-container {
  text-align: center;
  color: white;
  animation: interBounce 2s ease-in-out infinite alternate;
  transition: transform 0.8s ease-out;
}

/* Enhanced bounce animation */
@keyframes interBounce {
  0% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(-15px) scale(1.03);
  }
}

.inter-logo {
  margin-bottom: 2rem;
  animation: interGlow 2s ease-in-out infinite alternate;
  transition: all 0.8s ease-out;
}

@keyframes interGlow {
  0% {
    text-shadow: 0 0 20px #0066cc, 0 0 30px #0066cc, 0 0 40px #0066cc;
    filter: brightness(1);
  }
  100% {
    text-shadow: 0 0 30px #00aaff, 0 0 50px #00aaff, 0 0 70px #00aaff;
    filter: brightness(1.2);
  }
}

.inter-text {
  font-size: 6rem;
  font-weight: 900;
  letter-spacing: 0.5rem;
  background: linear-gradient(45deg, #0066cc, #00aaff, #ffffff, #00aaff, #0066cc);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: interGradient 3s ease-in-out infinite, interTextPulse 4s ease-in-out infinite;
  margin-bottom: 1rem;
  text-shadow: 0 0 50px rgba(0, 170, 255, 0.8);
  transition: all 0.8s ease-out;
}

@keyframes interGradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* New text pulse animation */
@keyframes interTextPulse {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.05);
  }
  75% {
    transform: scale(0.98);
  }
}

.inter-subtitle {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #00aaff;
  animation: interPulse 1.5s ease-in-out infinite, interSubtitleSlide 1s ease-out 0.3s both;
  transition: all 0.8s ease-out;
}

@keyframes interPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.08);
  }
}

/* Subtitle slide in animation */
@keyframes interSubtitleSlide {
  0% {
    opacity: 0;
    transform: translateX(-50px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.inter-stars {
  font-size: 3rem;
  margin-bottom: 2rem;
  animation: interRotate 4s linear infinite, interStarsZoom 1.2s ease-out 0.6s both;
  transition: all 0.8s ease-out;
}

@keyframes interRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Stars zoom in animation */
@keyframes interStarsZoom {
  0% {
    opacity: 0;
    transform: scale(0) rotate(180deg);
  }
  50% {
    transform: scale(1.3) rotate(270deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(360deg);
  }
}

.inter-message {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  background: rgba(0, 102, 204, 0.3);
  padding: 1rem 2rem;
  border-radius: 25px;
  border: 2px solid #0066cc;
  box-shadow: 0 0 30px rgba(0, 102, 204, 0.5);
  animation: interMessageSlide 1s ease-out 1s both, interMessageGlow 3s ease-in-out infinite;
  transition: all 0.8s ease-out;
}

@keyframes interMessageSlide {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Message glow animation */
@keyframes interMessageGlow {
  0%, 100% {
    box-shadow: 0 0 30px rgba(0, 102, 204, 0.5);
    border-color: #0066cc;
  }
  50% {
    box-shadow: 0 0 50px rgba(0, 170, 255, 0.8);
    border-color: #00aaff;
  }
}

/* Enhanced fade out effects for all elements */
.inter-animation-overlay.fade-out .inter-animation-container {
  transform: translateY(30px) scale(0.9);
  opacity: 0.8;
}

.inter-animation-overlay.fade-out .inter-text {
  transform: scale(0.8);
  opacity: 0.6;
}

.inter-animation-overlay.fade-out .inter-subtitle {
  transform: translateX(-30px);
  opacity: 0.4;
}

.inter-animation-overlay.fade-out .inter-stars {
  transform: rotate(180deg) scale(0.5);
  opacity: 0.3;
}

.inter-animation-overlay.fade-out .inter-message {
  transform: translateY(20px) scale(0.9);
  opacity: 0.5;
}

/* Mobile adjustments for Inter animation */
@media (max-width: 768px) {
  .inter-text {
    font-size: 4rem;
    letter-spacing: 0.3rem;
  }
  
  .inter-subtitle {
    font-size: 1.5rem;
  }
  
  .inter-stars {
    font-size: 2rem;
  }
  
  .inter-message {
    font-size: 1.2rem;
    padding: 0.75rem 1.5rem;
    margin: 0 1rem;
  }
  
  /* Mobile fade out adjustments */
  .inter-animation-overlay.fade-out .inter-animation-container {
    transform: translateY(20px) scale(0.95);
  }
  
  .inter-animation-overlay.fade-out .inter-subtitle {
    transform: translateX(-20px);
  }
  
  .inter-animation-overlay.fade-out .inter-message {
    transform: translateY(15px) scale(0.95);
  }
}

@media (max-width: 480px) {
  .inter-text {
    font-size: 3rem;
    letter-spacing: 0.2rem;
  }
  
  .inter-subtitle {
    font-size: 1.2rem;
  }
  
  .inter-stars {
    font-size: 1.5rem;
  }
  
  .inter-message {
    font-size: 1rem;
    padding: 0.5rem 1rem;
    margin: 0 0.5rem;
  }
  
  /* Small mobile fade out adjustments */
  .inter-animation-overlay.fade-out .inter-animation-container {
    transform: translateY(15px) scale(0.95);
  }
  
  .inter-animation-overlay.fade-out .inter-subtitle {
    transform: translateX(-15px);
  }
  
  .inter-animation-overlay.fade-out .inter-message {
    transform: translateY(10px) scale(0.95);
  }
}

/* Dark mode for Inter animation */
@media (prefers-color-scheme: dark) {
  .inter-animation-overlay {
    background: linear-gradient(45deg, #000000 0%, #001a33 50%, #000000 100%);
  }
  
  .inter-message {
    background: rgba(0, 102, 204, 0.4);
    border-color: #00aaff;
    box-shadow: 0 0 30px rgba(0, 170, 255, 0.6);
  }
  
  @keyframes interMessageGlow {
    0%, 100% {
      box-shadow: 0 0 30px rgba(0, 170, 255, 0.6);
      border-color: #00aaff;
    }
    50% {
      box-shadow: 0 0 50px rgba(0, 170, 255, 0.9);
      border-color: #66d9ff;
    }
  }
}
</style>