<template>
  <!-- Header con titolo e bottone logout -->
  <div class="level mb-3 px-3 pt-2">
    <div class="level-left">
      <h1 class="title is-2 page-title">Add Point</h1>
    </div>
    <div class="level-right">
      <button @click="handleLogout" class="button is-danger is-small">
        <span class="icon is-small">
          <i class="fas fa-sign-out-alt"></i>
        </span>
        <span class="is-hidden-mobile">Logout</span>
      </button>
    </div>
  </div>

  <section class="section py-3">
    <div class="container">
      <form @submit.prevent="addPoints">
        <div class="field">
          <label class="label">Select Team:</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="selectedTeam">
                <option value="">Scegli un team...</option>
                <option v-for="team in teams" :key="team.id" :value="team.id" :class="[team.id + '-text', 'team-option']">{{ team.name }}</option>              
              </select>
            </div>
          </div>
        </div>
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
        <div class="field">
          <label class="label">Points to Add:</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model.number="pointsToAdd">
                <option value="0">Scegli punti...</option>
                <option v-for="point in pointsOptions.filter(p => p > 0)" :key="point" :value="point">{{ point }}</option>
              </select>
            </div>
          </div>
        </div>
        
        <p v-if="error" class="has-text-danger has-text-centered mt-3 mb-4">{{ error }}</p>
        

      </form>
      
      <!-- Bottone Add Points spostato in fondo alla pagina -->
      <div class="add-button-section">
        <button @click="addPoints" class="button is-primary is-fullwidth is-large">
          <span class="icon">
            <i class="fas fa-plus"></i>
          </span>
          <span>Add Points</span>
        </button>
      </div>
    </div>
  </section>

  <!-- Modal overlay per messaggio di successo -->
  <div v-if="showSuccessModal" class="modal-overlay" :class="{ closing: modalClosing }" :style="{ backgroundColor: overlayColor }">
    <div class="success-modal">
      <div class="success-icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <h3 class="success-title">Punti Aggiunti!</h3>
      <p class="success-message">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { useLogout } from '@/composables/useLogout'

export default {
  name: 'AddPoint',
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
      selectedTeam: '',
      selectedGame: '',
      pointsToAdd: 0,
      successMessage: '',
      showSuccessModal: false,
      modalClosing: false,
      overlayColor: '',
      teams: [
        { id: 'rossi', name: 'Rossi', points: 0, color: '#FF0000' },
        { id: 'verdi', name: 'Verdi', points: 0, color: '#008000' },
        { id: 'arancioni', name: 'Arancioni', points: 0, color: '#FFA500' },
        { id: 'blu', name: 'Blu', points: 0, color: '#40E0D0' },
        { id: 'fucsia', name: 'Fucsia', points: 0, color: '#FF00FF' },
        { id: 'gialli', name: 'Gialli', points: 0, color: '#FFFF00' }
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
          
          // Messaggio di successo con modal
          const teamName = this.teams.find(t => t.id === this.selectedTeam)?.name;
          const teamColor = this.teams.find(t => t.id === this.selectedTeam)?.color;
          const gameName = this.games.find(g => g.id === this.selectedGame)?.name;
          this.successMessage = `${this.pointsToAdd} punti aggiunti al team ${teamName} per ${gameName}`;
          this.error = '';
          
          // Imposta colore overlay basato sulla squadra
          this.overlayColor = teamColor ? `${teamColor}CC` : 'rgba(0, 0, 0, 0.8)';
          
          // Mostra modal
          this.showSuccessModal = true;
          this.modalClosing = false;
          
          // Reset form
          this.selectedTeam = '';
          this.selectedGame = '';
          this.pointsToAdd = 0;
          
          // Nasconde il modal dopo 3 secondi con animazione
          setTimeout(() => {
            this.modalClosing = true;
            setTimeout(() => {
              this.showSuccessModal = false;
              this.modalClosing = false;
            }, 300);
          }, 3000);
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
        // Aggiornato per supportare il nuovo sistema di sessioni
        const getCurrentUser = () => {
          let user = JSON.parse(localStorage.getItem('loggedInUser'));
          if (!user) {
            user = JSON.parse(sessionStorage.getItem('loggedInUser'));
          }
          return user;
        };

        await updateDoc(docRef, {
          history: arrayUnion({
            username: getCurrentUser() ? getCurrentUser().username : 'unknown',
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
}
</script>

<style scoped>
.page-title {
  font-size: 2.5rem !important;
  font-weight: bold !important;
  color: #363636 !important;
  margin: 0 !important;
}

.add-button-section {
  position: fixed;
  bottom: 10px;
  left: 20px;
  right: 20px;
  z-index: 100;
  background: inherit;
  padding: 0;
}

.section {
  padding: 1rem;
  padding-bottom: 100px;
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

.select select {
  border-radius: 8px;
  border: 2px solid #e3e3e3;
  transition: all 0.3s ease;
  height: auto;
  padding: 0.75rem;
  font-size: 1rem;
}

.select.is-fullwidth {
  width: 100%;
}

.select.is-fullwidth select {
  width: 100%;
}

.select select:focus {
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

/* Colori squadre */
.rossi-text {
  color: #FF0000 !important;
  font-weight: bold;
}
.verdi-text {
  color: #228B22 !important;
  font-weight: bold;
}
.arancioni-text {
  color: #FFA500 !important;
  font-weight: bold;
}
.blu-text {
  color: #40E0D0 !important;
  font-weight: bold;
}
.fucsia-text {
  color: #FF00FF !important;
  font-weight: bold;
}
.gialli-text {
  color: #DAA520 !important;
  font-weight: bold;
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
  
  .select::after {
    border-color: #ffffff;
  }
  
  .page-title {
    color: #ffffff !important;
  }
  
  .bianchi-text.team-option {
    color: #CCCCCC !important;
    background-color: #2a2a2a;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .level {
    flex-direction: row !important;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .page-title {
    font-size: 1.8rem !important;
  }
  
  .section {
    padding: 0.5rem;
    padding-bottom: 80px;
  }
  
  .field {
    margin-bottom: 1rem;
  }
  
  .label {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .select select {
    padding: 0.75rem;
    font-size: 1rem;
    line-height: 1.4;
  }
  
  .button.is-medium {
    font-size: 1.1rem;
    padding: 1rem 2rem;
  }
  
  .button.is-danger.is-small {
    padding: 0.5rem 0.75rem;
  }
  
  .button.is-danger.is-small span:not(.icon) {
    display: none;
  }
  
  .add-button-section {
    bottom: 5px;
    left: 10px;
    right: 10px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.5rem !important;
  }
  
  .section {
    padding: 0.25rem;
    padding-bottom: 70px;
  }
  
  .level {
    margin-bottom: 0.25rem;
  }
  
  .field {
    margin-bottom: 0.75rem;
  }
}

/* Modal overlay per messaggio di successo */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
  backdrop-filter: blur(5px);
}

.modal-overlay.closing {
  animation: fadeOut 0.3s ease-in-out;
}

.success-modal {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  max-width: 400px;
  margin: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-in-out;
}

.modal-overlay.closing .success-modal {
  animation: slideDown 0.3s ease-in-out;
}

.success-icon {
  font-size: 4rem;
  color: #28a745;
  margin-bottom: 1rem;
  animation: bounceIn 0.6s ease-in-out;
}

.success-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #28a745;
  margin-bottom: 1rem;
}

.success-message {
  font-size: 1.1rem;
  color: #333;
  line-height: 1.5;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(50px);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Dark mode per modal */
@media (prefers-color-scheme: dark) {
  .success-modal {
    background: #2d2d2d;
    color: #ffffff;
  }
  
  .success-message {
    color: #ffffff;
  }
}

/* Mobile responsive per modal */
@media (max-width: 768px) {
  .success-modal {
    padding: 1.5rem;
    margin: 0.5rem;
  }
  
  .success-icon {
    font-size: 3rem;
  }
  
  .success-title {
    font-size: 1.3rem;
  }
  
  .success-message {
    font-size: 1rem;
  }
}
</style>
