<template>
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
            <div class="select">
              <select v-model.number="pointsToAdd">
                <option v-for="point in pointsOptions" :key="point" :value="point">{{ point }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="field">
          <div class="control">
            <button class="button is-primary">Add Points</button>
          </div>
        </div>
      </form>
      <p v-if="error">{{ error }}</p>
    </div>
  </section>
</template>

<script>
import { db } from '../firebase';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';

export default {
  name: 'AddPoint',
  data() {
    return {
      selectedTeam: '',
      selectedGame: '',
      pointsToAdd: 0,
      teams: [
        { id: 'arancioni', name: 'Arancioni', color: '#FFA500' },
        { id: 'bianchi', name: 'Bianchi', color: '#FFFFFF' },
        { id: 'rossi', name: 'Rossi', color: '#FF0000' },
        { id: 'gialli', name: 'Gialli', color: '#FFFF00' },
        { id: 'verdi', name: 'Verdi', color: '#008000' },
        { id: 'blu', name: 'Blu', color: '#0000FF' }
      ],
      games: [
        { id: 'bandierina', name: 'Bandierina' },
        { id: 'lupo-ghiaccio', name: 'Lupo ghiaccio' },
        { id: 'uovo-in-bilico', name: 'Uovo in bilico' },
        { id: 'cerchi-nelle-aste', name: 'Cerchi nelle aste' },
        { id: 'lupo-coda', name: 'Lupo coda' },
        { id: 'terra-acqua', name: 'Terra/acqua' },
        { id: 'rispetta-le-tappe', name: 'Rispetta le tappe' },
        { id: 'calcio', name: 'Calcio' },
        { id: 'tiro-alla-fune', name: 'Tiro alla fune' },
        { id: 'bandierina-mix', name: 'Bandierina mix' },
        { id: 'castelli', name: 'Castelli' },
        { id: 'pallamano', name: 'Pallamano' },
        { id: 'un-difficile-viaggio', name: 'Un difficile viaggio' },
        { id: 'palla-prigioniera', name: 'Palla prigioniera' },
        { id: 'tchoukball', name: 'Tchoukball' },
        { id: 'passa-la-linea', name: 'Passa la linea' },
        { id: '10-tappe', name: '10 tappe' },
        { id: 'basket', name: 'Basket' }

      ],
      pointsOptions: [0, 20, 40, 80],
      error: ''
    };
  },
  methods: {
    async addPoints() {
      try {
        if (!this.selectedTeam || !this.selectedGame || this.pointsToAdd <= 0) {
          this.error = 'Please fill in all fields and add at least one point.';
          return;
        }

        const docRef = doc(db, 'points', 'yEXQ6MF69F5wQ5S2HpAQ');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const currentPoints = docSnap.data()[this.selectedTeam] || 0;
          const newPoints = currentPoints + this.pointsToAdd;

          await updateDoc(docRef, {
            [this.selectedTeam]: newPoints
          });

          await this.addHistory();
          alert('Points added successfully!');
        } else {
          this.error = 'Points document does not exist.';
        }
      } catch (error) {
        console.error('Error adding points:', error);
        this.error = 'An error occurred while adding points.';
      }
    },

    async addHistory() {
      const docRef = doc(db, 'points', 'history');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          history: arrayUnion({
            username: localStorage.getItem('loggedInUser') ? JSON.parse(localStorage.getItem('loggedInUser')).username : 'unknown',
            team: this.selectedTeam,
            game: this.selectedGame,
            points: this.pointsToAdd,
            timestamp: new Date()
          })
        });
      } else {
        this.error = 'Points document does not exist.';
      }
    }
  }
};
</script>

<style scoped>
.section {
  padding: 1.5rem;
}
.box {
  border-radius: 5px;
  padding: 2rem;
}
.button.is-primary {
  background-color: #00d1b2;
  border-color: transparent;
}
.button.is-primary:hover {
  background-color: #00c4a7;
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
</style>
