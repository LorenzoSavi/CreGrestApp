<template>
  <!-- Header con titolo e bottone logout -->
  <div class="level mb-3 px-3 pt-2">
    <div class="level-left">
      <h1 class="title is-2 page-title">Aggiungi Punti</h1>
    </div>
    <div class="level-right">
      <button @click="handleLogout" class="button is-danger is-small">
        <span class="icon is-small">
          <i class="fas fa-sign-out-alt"></i>
        </span>
        <span class="is-hidden-mobile">Esci</span>
      </button>
    </div>
  </div>

  <section class="section py-3">
    <div class="container">
      <form @submit.prevent="addPoints">
        <div class="field" :class="{ 'dropdown-open': showTeamDropdown }">
          <label class="label">Seleziona Squadra:</label>
          <div class="control">
            <div class="custom-dropdown" :class="{ 'is-active': showTeamDropdown }">
              <div class="dropdown-trigger" @click="toggleTeamDropdown">
                <div class="dropdown-display">
                  <span v-if="selectedTeam" :class="[selectedTeam + '-text', 'selected-team']">
                    {{ teams.find(t => t.id === selectedTeam)?.name }}
                  </span>
                  <span v-else class="placeholder">Scegli una squadra...</span>
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

        <div class="field" :class="{ 'dropdown-open': showCycleDropdown }">
          <label class="label">Seleziona Ciclo:</label>
          <div class="control">
            <div class="custom-dropdown" :class="{ 'is-active': showCycleDropdown }">
              <div class="dropdown-trigger" @click="toggleCycleDropdown">
                <div class="dropdown-display">
                  <span v-if="selectedCycle" class="selected-option">
                    {{ getCycleName(selectedCycle) }}
                  </span>
                  <span v-else class="placeholder">Scegli un ciclo...</span>
                  <span class="dropdown-icon">
                    <i class="fas fa-chevron-down"></i>
                  </span>
                </div>
              </div>
              <div class="dropdown-menu" v-if="showCycleDropdown">
                <div class="dropdown-content">
                  <div 
                    class="dropdown-item" 
                    :class="{ 'is-active': selectedCycle === 'primo' }"
                    @click="selectCycle('primo')"
                  >
                    Primo Ciclo
                  </div>
                  <div 
                    class="dropdown-item" 
                    :class="{ 'is-active': selectedCycle === 'secondo' }"
                    @click="selectCycle('secondo')"
                  >
                    Secondo Ciclo
                  </div>
                  <div 
                    class="dropdown-item" 
                    :class="{ 'is-active': selectedCycle === 'terzo' }"
                    @click="selectCycle('terzo')"
                  >
                    Terzo Ciclo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="field" :class="{ 'dropdown-open': showGameDropdown, 'is-disabled': !selectedCycle }">
          <label class="label">Seleziona Gioco:</label>
          <div class="control">
            <div class="custom-dropdown" :class="{ 'is-active': showGameDropdown, 'is-disabled': !selectedCycle }">
              <div class="dropdown-trigger" @click="toggleGameDropdown">
                <div class="dropdown-display">
                  <span v-if="selectedGame" class="selected-option">
                    {{ availableGames.find(g => g.id === selectedGame)?.name }}
                  </span>
                  <span v-else class="placeholder">
                    {{ selectedCycle ? 'Scegli un gioco...' : 'Prima seleziona un ciclo' }}
                  </span>
                  <span class="dropdown-icon">
                    <i class="fas fa-chevron-down"></i>
                  </span>
                </div>
              </div>
              <div class="dropdown-menu" v-if="showGameDropdown && selectedCycle">
                <div class="dropdown-content">
                  <div 
                    v-for="game in availableGames" 
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

        <div class="field" :class="{ 'dropdown-open': showPointsDropdown }">
          <label class="label">Punti da Aggiungere:</label>
          <div class="control">
            <div class="custom-dropdown" :class="{ 'is-active': showPointsDropdown }">
              <div class="dropdown-trigger" @click="togglePointsDropdown">
                <div class="dropdown-display">
                  <span v-if="pointsToAdd > 0" class="selected-option points-display">
                    {{ pointsToAdd }} punti
                  </span>
                  <span v-else class="placeholder">Scegli i punti...</span>
                  <span class="dropdown-icon">
                    <i class="fas fa-chevron-down"></i>
                  </span>
                </div>
              </div>
              <div class="dropdown-menu" v-if="showPointsDropdown">
                <div class="dropdown-content">
                  <div 
                    v-for="point in pointsOptions.filter(p => p > 0)" 
                    :key="point" 
                    class="dropdown-item points-item" 
                    :class="{ 'is-active': pointsToAdd === point }"
                    @click="selectPoints(point)"
                  >
                    {{ point }} punti
                  </div>
                </div>
              </div>
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
          <span>Aggiungi Punti</span>
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
      selectedCycle: '',
      selectedGame: '',
      pointsToAdd: 0,
      successMessage: '',
      showSuccessModal: false,
      modalClosing: false,
      overlayColor: '',
      showTeamDropdown: false,
      showCycleDropdown: false,
      showGameDropdown: false,
      showPointsDropdown: false,
      teams: [
        { id: 'rossi', name: 'Rossi', points: 0, color: '#FF0000' },
        { id: 'verdi', name: 'Verdi', points: 0, color: '#008000' },
        { id: 'arancioni', name: 'Arancioni', points: 0, color: '#FFA500' },
        { id: 'blu', name: 'Blu', points: 0, color: '#40E0D0' },
        { id: 'fucsia', name: 'Fucsia', points: 0, color: '#FF00FF' },
        { id: 'gialli', name: 'Gialli', points: 0, color: '#FFFF00' }
      ],
      gamesByCycle: {
        primo: [
          { id: "bandierina", name: "Bandierina" },
          { id: "lupo-ghiaccio", name: "Lupo ghiaccio" },
          { id: "aste-in-movimento", name: "Aste in movimento" },
          { id: "lupo-coda", name: "Lupo coda" },
          { id: "staffetta-a-ostacoli-i-ciclo", name: "Staffetta a ostacoli (I Ciclo)" },
          { id: "sfonda-la-porta", name: "Sfonda la porta" },
          { id: "nella-palude-tronco-o-liana", name: "Nella Palude (Tronco o Liana)" },
          { id: "domina-i-cerchi", name: "Domina I cerchi" }
        ],
        secondo: [
          { id: "tiro-alla-fune", name: "Tiro alla fune" },
          { id: "bandierina-mix", name: "Bandierina mix" },
          { id: "castelli", name: "Castelli" },
          { id: "pallamano", name: "Pallamano" },
          { id: "staffetta-a-ostacoli-ii-ciclo", name: "Staffetta a ostacoli (II Ciclo)" },
          { id: "lupo-ghiaccio", name: "Lupo ghiaccio" },
          { id: "aste-in-movimento", name: "Aste in movimento" },
          { id: "lupo-coda", name: "Lupo coda" },
          { id: "palla-prigioniera", name: "Palla prigioniera" },
          { id: "tchoukball", name: "Tchoukball" },
          { id: "nella-palude-tronco-o-liana", name: "Nella Palude (Tronco o Liana)" },
          { id: "10-tappe", name: "10 tappe" }
        ],
        terzo: [
          { id: "dai-fai-canestro", name: "Dai… Fai canestro" },
          { id: "pallamano", name: "Pallamano" },
          { id: "castelli", name: "Castelli" },
          { id: "tchoukball", name: "Tchoukball" },
          { id: "tiro-alla-fune", name: "Tiro alla fune" },
          { id: "10-tappe", name: "10 tappe" },
          { id: "palla-prigioniera", name: "Palla prigioniera" },
          { id: "bandierina-mix", name: "Bandierina mix" },
          { id: "calcetto", name: "Calcetto" }
        ]
      },
      pointsOptions: [0, 20, 50, 100],
      error: ''
    };
  },
  computed: {
    availableGames() {
      return this.selectedCycle ? this.gamesByCycle[this.selectedCycle] : [];
    }
  },
  watch: {
    selectedCycle() {
      // Reset game selection when cycle changes
      this.selectedGame = '';
    }
  },
  mounted() {
    // Debug: stampa lo stato dei dropdown
    console.log('Mounted - Dropdown states:', {
      team: this.showTeamDropdown,
      cycle: this.showCycleDropdown,
      game: this.showGameDropdown,
      points: this.showPointsDropdown
    });
    
    // Forza chiusura di tutti i dropdown
    this.$nextTick(() => {
      this.showTeamDropdown = false;
      this.showCycleDropdown = false;
      this.showGameDropdown = false;
      this.showPointsDropdown = false;
      
      console.log('After forced close:', {
        team: this.showTeamDropdown,
        cycle: this.showCycleDropdown,
        game: this.showGameDropdown,
        points: this.showPointsDropdown
      });
    });
    
    // Chiudi dropdown quando si clicca fuori
    document.addEventListener('click', this.closeDropdowns);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeDropdowns);
  },
  methods: {
    async addPoints() {
      try {
        if (!this.selectedTeam || !this.selectedCycle || !this.selectedGame || this.pointsToAdd <= 0) {
          this.error = 'Compila tutti i campi e aggiungi almeno un punto.';
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
          const gameName = this.availableGames.find(g => g.id === this.selectedGame)?.name;
          this.successMessage = `${this.pointsToAdd} punti aggiunti al team ${teamName} per ${gameName}`;
          this.error = '';
          
          // Imposta colore overlay basato sulla squadra
          this.overlayColor = teamColor ? `${teamColor}CC` : 'rgba(0, 0, 0, 0.8)';
          
          // Mostra modal
          this.showSuccessModal = true;
          this.modalClosing = false;
          
          // Reset form
          this.selectedTeam = '';
          this.selectedCycle = '';
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
            username: getCurrentUser() ? getCurrentUser().username : 'sconosciuto',
            team: this.selectedTeam,
            game: this.selectedGame,
            cycle: this.selectedCycle,
            points: this.pointsToAdd,
            timestamp: new Date()
          })
        });
      } else {
        this.error = 'Points document does not exist.';
      }
    },
    
    // Metodi per gestire i dropdown personalizzati
    toggleTeamDropdown(event) {
      event?.stopPropagation();
      console.log('Toggle team dropdown - before:', this.showTeamDropdown);
      this.showTeamDropdown = !this.showTeamDropdown;
      console.log('Toggle team dropdown - after:', this.showTeamDropdown);
      this.closeOtherDropdowns('team');
    },
    
    toggleCycleDropdown(event) {
      event?.stopPropagation();
      console.log('Toggle cycle dropdown - before:', this.showCycleDropdown);
      this.showCycleDropdown = !this.showCycleDropdown;
      console.log('Toggle cycle dropdown - after:', this.showCycleDropdown);
      this.closeOtherDropdowns('cycle');
    },
    
    toggleGameDropdown(event) {
      event?.stopPropagation();
      if (!this.selectedCycle) return;
      console.log('Toggle game dropdown - before:', this.showGameDropdown);
      this.showGameDropdown = !this.showGameDropdown;
      console.log('Toggle game dropdown - after:', this.showGameDropdown);
      this.closeOtherDropdowns('game');
    },
    
    togglePointsDropdown(event) {
      event?.stopPropagation();
      console.log('Toggle points dropdown - before:', this.showPointsDropdown);
      this.showPointsDropdown = !this.showPointsDropdown;
      console.log('Toggle points dropdown - after:', this.showPointsDropdown);
      this.closeOtherDropdowns('points');
    },
    
    selectTeam(teamId, event) {
      event?.stopPropagation();
      this.selectedTeam = teamId;
      this.showTeamDropdown = false;
    },
    
    selectCycle(cycleId, event) {
      event?.stopPropagation();
      this.selectedCycle = cycleId;
      this.selectedGame = ''; // Reset game when cycle changes
      this.showCycleDropdown = false;
    },
    
    selectGame(gameId, event) {
      event?.stopPropagation();
      this.selectedGame = gameId;
      this.showGameDropdown = false;
    },
    
    selectPoints(points, event) {
      event?.stopPropagation();
      this.pointsToAdd = points;
      this.showPointsDropdown = false;
    },
    
    getCycleName(cycle) {
      const names = {
        primo: 'Primo Ciclo',
        secondo: 'Secondo Ciclo',
        terzo: 'Terzo Ciclo'
      };
      return names[cycle] || '';
    },
    
    closeOtherDropdowns(except) {
      if (except !== 'team') this.showTeamDropdown = false;
      if (except !== 'cycle') this.showCycleDropdown = false;
      if (except !== 'game') this.showGameDropdown = false;
      if (except !== 'points') this.showPointsDropdown = false;
    },
    
    closeDropdowns(event) {
      // Chiudi tutti i dropdown se si clicca fuori
      if (!event.target.closest('.custom-dropdown')) {
        this.showTeamDropdown = false;
        this.showCycleDropdown = false;
        this.showGameDropdown = false;
        this.showPointsDropdown = false;
      }
    }
  }
}
</script>

<style scoped>
.page-title {
  font-size: 2.5rem !important;
  font-weight: bold !important;
  margin: 0 !important;
}

/* Custom Dropdown Styles */
.custom-dropdown {
  position: relative;
  width: 100%;
  z-index: 50;
}

.custom-dropdown.is-active {
  z-index: 100;
}

.custom-dropdown.is-disabled {
  opacity: 0.6;
  pointer-events: none;
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

.points-display {
  color: #667eea;
  font-weight: 600;
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

/* Force hide when not active */
.custom-dropdown:not(.is-active) .dropdown-menu {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
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

.points-item.is-active {
  background-color: #667eea !important;
  color: white !important;
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
  position: relative;
  z-index: 1;
}

.level {
  margin-bottom: 1rem;
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

.label {
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.field {
  margin-bottom: 1.5rem;
  position: relative;
  z-index: auto;
}

.field.dropdown-open {
  z-index: 100000;
}

/* Colori squadre */
.rossi-text {
  color: #DC3545 !important;
  font-weight: bold;
}
.verdi-text {
  color: #28A745 !important;
  font-weight: bold;
}
.arancioni-text {
  color: #FD7E14 !important;
  font-weight: bold;
}
.blu-text {
  color: #007BFF !important;
  font-weight: bold;
}
.fucsia-text {
  color: #E83E8C !important;
  font-weight: bold;
}
.gialli-text {
  color: #FFC107 !important;
  font-weight: bold;
}

/* Dark mode support - inherit from App.vue */
@media (prefers-color-scheme: dark) {
  .page-title {
    color: #ffffff !important;
  }
  
  .label {
    color: #ffffff;
  }
  
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
  
  /* Team colors for dark mode - più visibili */
  .rossi-text {
    color: #FF6B6B !important;
  }
  .verdi-text {
    color: #51CF66 !important;
  }
  .arancioni-text {
    color: #FF922B !important;
  }
  .blu-text {
    color: #74C0FC !important;
  }
  .fucsia-text {
    color: #F06292 !important;
  }
  .gialli-text {
    color: #FFD43B !important;
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
  
  .dropdown-display {
    padding: 0.75rem;
    font-size: 1rem;
    line-height: 1.4;
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
  
  .dropdown-content {
    max-height: 200px !important;
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
