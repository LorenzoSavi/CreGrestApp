<template>
  <section class="hero is-fullheight">
    <div class="hero-body">
      <div class="container">
        <div class="login-box">
          <div class="has-text-centered mb-5">
            <h1 class="title is-3 has-text-weight-bold">Benvenuto</h1>
            <p class="subtitle is-6 has-text-grey">Accedi al tuo account</p>
          </div>
          
          <form @submit.prevent="login">
            <div class="field">
              <label class="label">Username</label>
              <div class="control has-icons-left">
                <input 
                  class="input is-medium" 
                  type="text" 
                  v-model="username" 
                  placeholder="Inserisci il tuo username"
                  required
                >
                <span class="icon is-small is-left">
                  <i class="fas fa-user"></i>
                </span>
              </div>
            </div>

            <div class="field">
              <label class="label">Password</label>
              <div class="control has-icons-left">
                <input 
                  class="input is-medium" 
                  type="password" 
                  v-model="password" 
                  placeholder="Inserisci la tua password"
                  required
                >
                <span class="icon is-small is-left">
                  <i class="fas fa-lock"></i>
                </span>
              </div>
            </div>

            <div class="field">
              <div class="control">
                <label class="custom-checkbox">
                  <input type="checkbox" v-model="rememberMe">
                  <span class="checkmark"></span>
                  <span class="checkbox-text">Ricordami</span>
                </label>
              </div>
            </div>

            <div class="field">
              <div class="control">
                <button class="button is-primary is-fullwidth is-medium login-btn" type="submit">
                  <span class="icon">
                    <i class="fas fa-sign-in-alt"></i>
                  </span>
                  <span>Accedi</span>
                </button>
              </div>
            </div>
          </form>
          
          <div v-if="error" class="notification is-danger is-light mt-4">
            <button class="delete" @click="error = ''"></button>
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'UserLogin',
  data() {
    return {
      username: '',
      password: '',
      rememberMe: false,
      error: ''
    };
  },
  methods: {
    async login() {
      try {
        const response = await fetch('/credentials.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const credentials = await response.json();
        
        const user = credentials.find(
          user => user.username === this.username && user.password === this.password
        );
        
        if (user) {
          // Salva l'utente con informazioni sulla sessione
          const userSession = {
            ...user,
            rememberMe: this.rememberMe,
            loginTime: new Date().getTime()
          };
          
          if (this.rememberMe) {
            // Salva in localStorage per sessioni persistenti
            localStorage.setItem('loggedInUser', JSON.stringify(userSession));
          } else {
            // Salva in sessionStorage per sessioni temporanee
            sessionStorage.setItem('loggedInUser', JSON.stringify(userSession));
            // Rimuovi da localStorage se esistente
            localStorage.removeItem('loggedInUser');
          }
          
          const specialUsers = ['FraVita', 'savi', 'NicolaL.1004', 'FalcoCinese', 'fedeg', 'corti_sugo', 'meris', 'Lucaespo', 'DavideAnge'];
          if (specialUsers.includes(user.username)) {
            this.$router.push('/total-point');
          } else {
            this.$router.push('/add-point');
          }
        } else {
          this.error = 'Invalid credentials';
        }
      } catch (error) {
        this.error = `An error occurred: ${error.message}`;
      }
    },
    
    checkExistingSession() {
      // Controlla prima localStorage, poi sessionStorage
      let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      if (!loggedInUser) {
        loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
      }
      
      if (loggedInUser) {
        const specialUsers = ['FraVita', 'savi', 'NicolaL.1004', 'FalcoCinese', 'fedeg', 'corti_sugo', 'meris', 'Lucaespo', 'DavideAnge'];
        if (specialUsers.includes(loggedInUser.username)) {
          this.$router.push('/total-point');
        } else {
          this.$router.push('/add-point');
        }
      }
    }
  },
  created() {
    this.checkExistingSession();
  }
}
</script>

<style scoped>
/* Reset di tutti gli stili precedenti */
.hero {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-body {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.login-box {
  background: white;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  box-shadow: 
    0 8px 32px rgba(102, 126, 234, 0.15),
    0 4px 16px rgba(118, 75, 162, 0.12),
    0 2px 8px rgba(102, 126, 234, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  width: 90%;
  max-width: 400px;
  margin: 0 auto;
}

.title {
  color: #363636;
}

.subtitle {
  margin-bottom: 2rem !important;
}

.input {
  border-radius: 8px;
  border: 2px solid #e3e3e3;
  transition: all 0.3s ease;
}

.input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.125em rgba(102, 126, 234, 0.25);
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  height: 3rem;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.custom-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
  color: #4a4a4a;
  padding: 0.5rem 0;
}

.custom-checkbox input[type="checkbox"] {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
}

.checkmark {
  position: relative;
  width: 20px;
  height: 20px;
  background-color: #fff;
  border: 2px solid #e3e3e3;
  border-radius: 4px;
  margin-right: 12px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.custom-checkbox:hover .checkmark {
  border-color: #667eea;
  background-color: #f8f9ff;
}

.custom-checkbox input[type="checkbox"]:checked ~ .checkmark {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.custom-checkbox input[type="checkbox"]:checked ~ .checkmark:after {
  display: block;
}

.custom-checkbox input[type="checkbox"]:focus ~ .checkmark {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.checkbox-text {
  font-weight: 500;
  transition: color 0.3s ease;
}

.custom-checkbox:hover .checkbox-text {
  color: #667eea;
}

.field {
  margin-bottom: 1.5rem;
}

.label {
  font-weight: 600;
  color: #4a4a4a;
  margin-bottom: 0.5rem;
}

.notification {
  border-radius: 8px;
}

.section {
  padding: 1rem;
  min-height: calc(100vh - 2rem);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .hero {
    background-color: #1a1a1a;
  }
  
  .login-box {
    background: #2d2d2d;
    box-shadow: 
      0 8px 32px rgba(102, 126, 234, 0.25),
      0 4px 16px rgba(118, 75, 162, 0.20),
      0 2px 8px rgba(102, 126, 234, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .title {
    color: #ffffff;
  }
  
  .subtitle {
    color: #cccccc !important;
  }
  
  .label {
    color: #ffffff;
  }
  
  .input {
    background-color: #3a3a3a;
    border-color: #555555;
    color: #ffffff;
  }
  
  .input::placeholder {
    color: #999999;
  }
  
  .input:focus {
    background-color: #404040;
    border-color: #667eea;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .section {
    padding: 0.5rem;
    min-height: calc(100vh - 1rem);
  }
  
  .field {
    margin-bottom: 1rem;
  }
  
  .login-box {
    width: 90%;
    padding: 1.5rem 1rem;
  }
  
  .title.is-3 {
    font-size: 1.5rem !important;
  }
}

@media (max-width: 480px) {
  .section {
    padding: 0.25rem;
    min-height: calc(100vh - 0.5rem);
  }
  
  .field {
    margin-bottom: 0.75rem;
  }
}
</style>
