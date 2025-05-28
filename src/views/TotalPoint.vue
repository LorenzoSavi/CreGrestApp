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
      <table class="table is-fullwidth is-bordered is-striped is-hoverable">
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
            <div class="columns">
              <div class="column">
                <div class="field">
                  <label class="label">Select Team:</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="selectedTeam">
                        <option value="">Scegli un team...</option>
                        <option v-for="team in teams" :key="team.id" :value="team.id" :class="['has-text-weight-bold', team.id + '-text',{ 'bianchi-text-light': shouldTextBeBlack(team) }]">{{ team.name }}</option>
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
                <button type="submit" class="button is-primary is-fullwidth" :class="{ 'is-loading': isLoading }">
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
          <div class="table-container">
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

/* Colori squadre - FORZA I COLORI NELLA TABELLA */
.table .rossi-text, .table .rossi-text strong {
  color: #FF0000 !important;
  font-weight: 900 !important;
}
.table .verdi-text, .table .verdi-text strong {
  color: #228B22 !important;
  font-weight: 900 !important;
}
.table .arancioni-text, .table .arancioni-text strong {
  color: #FFA500 !important;
  font-weight: 900 !important;
}
.table .blu-text, .table .blu-text strong {
  color: #40E0D0 !important;
  font-weight: 900 !important;
}
.table .fucsia-text, .table .fucsia-text strong {
  color: #FF00FF !important;
  font-weight: 900 !important;
}
.table .gialli-text, .table .gialli-text strong {
  color: #DAA520 !important;
  font-weight: 900 !important;
}

.rossi-row, .rossi-text {
  color: #FF0000 !important;
  font-weight: bold !important;
}
.verdi-row, .verdi-text {
  color: #228B22 !important;
  font-weight: bold !important;
}
.arancioni-row, .arancioni-text {
  color: #FFA500 !important;
  font-weight: bold !important;
}
.blu-row, .blu-text {
  color: #40E0D0 !important;
  font-weight: bold !important;
}
.fucsia-row, .fucsia-text {
  color: #FF00FF !important;
  font-weight: bold !important;
}
.gialli-row, .gialli-text {
  color: #DAA520 !important;
  font-weight: bold !important;
}

/* Forza grassetto per i nomi team nella tabella */
.table td strong {
  font-weight: 900 !important;
}

.table td.has-text-weight-bold {
  font-weight: 900 !important;
}

.card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: none;
  margin-bottom: 2rem;
}

.card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px 12px 0 0;
}

.card-header-title {
  color: #495057;
  font-weight: 600;
}

.medal {
  font-size: 1.5rem;
  display: inline-block;
}

.position {
  font-weight: bold;
  color: #6c757d;
}

.recent-entry {
  background-color: #e3f2fd !important;
  animation: highlight 2s ease-in-out;
}

.notification {
  border-radius: 8px;
  border: none;
}

.columns {
  margin-bottom: 0;
}

@keyframes highlight {
  0% { background-color: #bbdefb; }
  100% { background-color: #e3f2fd; }
}

.button.is-info {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.button.is-info:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .section {
    background-color: #1a1a1a;
    color: #ffffff;
  }
  
  .title {
    color: #ffffff;
  }
  
  .page-title {
    color: #ffffff !important;
  }
  
  .label {
    color: #ffffff;
  }
  
  .select select {
    background-color: #3a3a3a;
    border-color: #555555;
    color: #ffffff;
  }
  
  .select select:focus {
    background-color: #404040;
    border-color: #667eea;
  }
  
  .input {
    background-color: #3a3a3a;
    border-color: #555555;
    color: #ffffff;
  }
  
  .input:focus {
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
  
  .table.is-striped tbody tr:nth-child(even) {
    background-color: #353535;
  }
  
  .table.is-striped tbody tr:nth-child(even) td {
    background-color: #353535;
  }
  
  .table.is-hoverable tbody tr:hover {
    background-color: #404040;
  }
  
  .table.is-hoverable tbody tr:hover td {
    background-color: #404040;
  }
  
  .bianchi-text {
    color: #CCCCCC !important;
    font-weight: 900 !important;
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
  
  .recent-entry {
    background-color: #1e3a5f !important;
  }
  
  .notification {
    border: 1px solid #555555;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .level {
    flex-direction: row !important;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .page-title {
    font-size: 1.8rem !important;
  }
  
  .section {
    padding: 0.75rem;
  }
  
  .field {
    margin-bottom: 1.25rem;
  }
  
  .label {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .select select {
    padding: 0.625rem 0.75rem;
    font-size: 1rem;
    line-height: 1.3;
    width: 100%;
    min-height: 2.5rem;
  }
  
  .input {
    padding: 0.625rem 0.75rem;
    font-size: 1rem;
  }
  
  .button.is-danger.is-small, .button.is-info.is-small {
    padding: 0.5rem 0.75rem;
  }
  
  .button.is-danger.is-small span:not(.icon), .button.is-info.is-small span:not(.icon) {
    display: none;
  }
  
  .table-container {
    width: 100%;
    overflow-x: auto;
  }
  
  .table th, .table td {
    white-space: nowrap;
    font-size: 0.9rem;
    padding: 0.75rem 0.5rem;
  }
  
  .columns {
    display: block;
  }
  
  .column {
    width: 100% !important;
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.5rem !important;
  }
  
  .table th, .table td {
    font-size: 0.85rem;
    padding: 0.5rem 0.25rem;
  }
  
  .select select {
    padding: 0.75rem;
    font-size: 1rem;
    min-height: 2.75rem;
  }
}

@media (prefers-color-scheme: light) {
  .table .bianchi-text-light, .table .bianchi-text-light strong {
    color: #000000 !important;
    font-weight: 900 !important;
  }

  .bianchi-text-light {
    color: #000000 !important;
    font-weight: bold !important;
  }
  .table .bianchi-text, .table .bianchi-text strong {
  color: #585858 !important;
  font-weight: 900 !important;
}
}
</style>