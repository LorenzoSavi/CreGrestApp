<template>
  <section class="section">
    <div class="container">
      <h1 class="title has-text-centered">Team Points</h1>
      <table class="table is-fullwidth is-bordered is-striped is-hoverable">
        <thead>
          <tr>
            <th>Team</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody :key="teams">
          <tr v-for="team in teams" :key="team.id" :class="team.id + '-row'">
            <td :class="['has-text-weight-bold', team.id + '-text']">{{ team.name }}</td>
            <td>{{ team.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <h1 class="title">Add Point</h1>
      <form @submit.prevent="addPoints">
        <div class="field">
          <label class="label">Select Team:</label>
          <div class="control">
            <div class="select">
              <select v-model="selectedTeam">
                <option v-for="team in teams" :key="team.id" :value="team.id" :class="['has-text-weight-bold', team.id + '-text']">{{ team.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="label">Select Game:</label>
          <div class="control">
            <div class="select">
              <select v-model="selectedGame">
                <option v-for="game in games" :key="game.id" :value="game.id">{{ game.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="label">Points to Add:</label>
          <div class="control">
            <input class="input" type="number" v-model.number="pointsToAdd">
          </div>
        </div>
        <div class="field">
          <div class="control">
            <button type="submit" class="button is-primary">Add Points</button>
          </div>
        </div>
        <p v-if="successMessage" class="has-text-success">{{ successMessage }}</p>
        <p v-if="error" class="has-text-danger">{{ error }}</p>
      </form>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <h1 class="title">Points History</h1>
      <div class="table-container">
        <table class="table is-fullwidth is-bordered is-striped is-hoverable is-narrow">
          <thead>
            <tr>
              <th>Date</th>
              <th>Username</th>
              <th>Game</th>
              <th>Team</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody :key="pointsHistory">
            <tr v-for="entry in pointsHistory" :key="entry.timestamp">
              <td>{{ new Date(entry.timestamp.seconds * 1000).toLocaleString() }}</td>
              <td>{{ entry.username }}</td>
              <td>{{ entry.game }}</td>
              <td>{{ entry.team }}</td>
              <td>{{ entry.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script>
import { db } from '../firebase';
import { doc, getDoc, arrayUnion, updateDoc } from 'firebase/firestore';

export default {
  name: 'TeamPoints',
  data() {
    return {
      teams: [
        { id: 'arancioni', name: 'Arancioni', points: 0, color: '#FFA500' },
        { id: 'bianchi', name: 'Bianchi', points: 0, color: '#FFFFFF' },
        { id: 'rossi', name: 'Rossi', points: 0, color: '#FF0000' },
        { id: 'gialli', name: 'Gialli', points: 0, color: '#FFFF00' },
        { id: 'verdi', name: 'Verdi', points: 0, color: '#008000' },
        { id: 'blu', name: 'Blu', points: 0, color: '#0000FF' }
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
      historyError: ''
    };
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
      try {
        if (!this.selectedTeam || !this.selectedGame) {
          this.error = 'Please select a team and a game.';
          this.successMessage = ''; // Clear success message
          return;
        }

        const docRef = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const currentPoints = docSnap.data()[this.selectedTeam] || 0;
          const newPoints = currentPoints + parseInt(this.pointsToAdd);

          await updateDoc(docRef, {
            [this.selectedTeam]: newPoints
          });

          await this.addHistory();
          this.successMessage = 'Points updated successfully!';
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
      }
    },
    async addHistory() {
      try {
        const docRef = doc(db, 'points', 'history');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          await updateDoc(docRef, {
            history: arrayUnion({
              username: localStorage.getItem('loggedInUser') ? JSON.parse(localStorage.getItem('loggedInUser')).username : 'unknown',
              team: this.selectedTeam,
              game: this.selectedGame,
              points: parseInt(this.pointsToAdd),
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
    }
  }
};
</script>

<style scoped>
.section {
  padding: 1.5rem;
}
.table {
  margin-top: 2rem;
}
.table-container {
  overflow-x: auto;
}
.arancioni-row, .arancioni-text {
  color: #FFA500; /* Arancione */
}
.bianchi-row, .bianchi-text {
  color: #FFFFFF; /* Bianco */
}
.rossi-row, .rossi-text {
  color: #FF0000; /* Rosso */
}
.gialli-row, .gialli-text {
  color: #FFFF00; /* Giallo */
}
.verdi-row, .verdi-text {
  color: #008000; /* Verde */
}
.blu-row, .blu-text {
  color: #0000FF; /* Blu */
}
@media screen and (max-width: 768px) {
  .table-container {
    width: 100%;
    overflow-x: auto;
  }
  .table th, .table td {
    white-space: nowrap;
  }
}
</style>