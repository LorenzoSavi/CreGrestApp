<template>
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

  <section class="section">
    <div class="container">
      <!-- Mobile: Card layout per squadre -->
      <div class="is-hidden-tablet mobile-teams-grid">
        <div v-for="(team, index) in sortedTeams" :key="team.id" class="team-card" :class="team.id + '-card'">
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
      <table class="table is-fullwidth is-bordered is-striped is-hoverable is-hidden-mobile">
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
              <div class="field">
                <label class="label">Select Team:</label>
                <div class="control">
                  <div class="select is-fullwidth is-large">
                    <select v-model="selectedTeam">
                      <option value="">Scegli un team...</option>
                      <option v-for="team in teams" :key="team.id" :value="team.id" :class="['has-text-weight-bold', team.id + '-text']">{{ team.name }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="field">
                <label class="label">Select Game:</label>
                <div class="control">
                  <div class="select is-fullwidth is-large">
                    <select v-model="selectedGame">
                      <option value="">Scegli un gioco...</option>
                      <option v-for="game in games" :key="game.id" :value="game.id">{{ game.name }}</option>
                    </select>
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
                <div class="field">
                  <label class="label">Select Team:</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="selectedTeam">
                        <option value="">Scegli un team...</option>
                        <option v-for="team in teams" :key="team.id" :value="team.id" :class="['has-text-weight-bold', team.id + '-text']">{{ team.name }}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div class="column">
                <div class="field">
                  <label class="label">Select Game:</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="selectedGame">
                        <option value="">Scegli un gioco...</option>
                        <option v-for="game in games" :key="game.id" :value="game.id">{{ game.name }}</option>
                      </select>
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
            <div v-if="successMessage" class="notification is-success is-light">
              <button class="delete" @click="successMessage = ''"></button>
              {{ successMessage }}
            </div>
            <div v-if="error" class="notification is-danger is-light">
              <button class="delete" @click="error = ''"></button>
              {{ error }}
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
                <span class="history-points" :class="{ 'is-positive': entry.points > 0, 'is-negative': entry.points < 0 }">
                  {{ entry.points > 0 ? '+' : '' }}{{ entry.points }}
                </span>
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
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, index) in sortedHistory.slice(0, 50)" :key="entry.timestamp" :class="{ 'recent-entry': index < 3 }">
                  <td>{{ formatDate(entry.timestamp) }}</td>
                  <td>{{ entry.username }}</td>
                  <td>{{ entry.game }}</td>
                  <td :class="entry.team + '-text'">{{ entry.team }}</td>
                  <td class="has-text-weight-bold">{{ entry.points > 0 ? '+' : '' }}{{ entry.points }}</td>
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
      isLoading: false
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
    }
  },
  async created() {
    await this.fetchTeamPoints();
    await this.fetchPointsHistory();
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

/* Colori squadre corretti */
.rossi-text, .rossi-text strong, .table .rossi-text, .table .rossi-text strong {
  color: #DC3545 !important;
  font-weight: bold !important;
}
.verdi-text, .verdi-text strong, .table .verdi-text, .table .verdi-text strong {
  color: #28A745 !important;
  font-weight: bold !important;
}
.arancioni-text, .arancioni-text strong, .table .arancioni-text, .table .arancioni-text strong {
  color: #FD7E14 !important;
  font-weight: bold !important;
}
.blu-text, .blu-text strong, .table .blu-text, .table .blu-text strong {
  color: #007BFF !important;
  font-weight: bold !important;
}
.fucsia-text, .fucsia-text strong, .table .fucsia-text, .table .fucsia-text strong {
  color: #E83E8C !important;
  font-weight: bold !important;
}
.gialli-text, .gialli-text strong, .table .gialli-text, .table .gialli-text strong {
  color: #FFC107 !important;
  font-weight: bold !important;
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
  
  /* Colori squadre per dark mode - più visibili */
  .rossi-text, .rossi-text strong, .table .rossi-text, .table .rossi-text strong {
    color: #FF6B6B !important;
  }
  .verdi-text, .verdi-text strong, .table .verdi-text, .table .verdi-text strong {
    color: #51CF66 !important;
  }
  .arancioni-text, .arancioni-text strong, .table .arancioni-text, .table .arancioni-text strong {
    color: #FF922B !important;
  }
  .blu-text, .blu-text strong, .table .blu-text, .table .blu-text strong {
    color: #74C0FC !important;
  }
  .fucsia-text, .fucsia-text strong, .table .fucsia-text, .table .fucsia-text strong {
    color: #F06292 !important;
  }
  .gialli-text, .gialli-text strong, .table .gialli-text, .table .gialli-text strong {
    color: #FFD43B !important;
  }
}
</style>