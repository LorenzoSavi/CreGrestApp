<template>
  <div class="login-root">
    <div class="login-bg">
      <div class="cloud cloud--1">☁️</div>
      <div class="cloud cloud--2">⛅</div>
    </div>

    <div class="login-wrap">
      <div class="login-brand">
        <div class="login-logo">🏆</div>
        <h1 class="login-title">Cre Grest</h1>
        <p class="login-subtitle">Bentornato! Accedi per continuare</p>
      </div>

      <div class="login-card">
        <form @submit.prevent="login" autocomplete="on" novalidate>

          <div class="lf-group" :class="{ 'lf-group--error': fieldErrors.username }">
            <label class="lf-label" for="login-user">Username</label>
            <div class="lf-input-wrap">
              <span class="lf-icon"><i class="fas fa-user"></i></span>
              <input
                id="login-user"
                class="lf-input"
                type="text"
                v-model.trim="username"
                placeholder="Il tuo username"
                autocomplete="username"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                @blur="validateUsername"
              />
            </div>
            <span v-if="fieldErrors.username" class="lf-field-err">{{ fieldErrors.username }}</span>
          </div>

          <div class="lf-group" :class="{ 'lf-group--error': fieldErrors.password }">
            <label class="lf-label" for="login-pass">Password</label>
            <div class="lf-input-wrap">
              <span class="lf-icon"><i class="fas fa-lock"></i></span>
              <input
                id="login-pass"
                class="lf-input"
                :type="showPass ? 'text' : 'password'"
                v-model="password"
                placeholder="La tua password"
                autocomplete="current-password"
                @blur="validatePassword"
              />
              <button type="button" class="lf-eye" @click="showPass = !showPass" :aria-label="showPass ? 'Nascondi password' : 'Mostra password'">
                <i :class="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <span v-if="fieldErrors.password" class="lf-field-err">{{ fieldErrors.password }}</span>
          </div>

          <label class="lf-remember">
            <input type="checkbox" v-model="rememberMe" />
            <span class="lf-check"></span>
            <span>Ricordami su questo dispositivo</span>
          </label>

          <button class="lf-submit" type="submit" :disabled="isLoading">
            <span v-if="!isLoading">Accedi <i class="fas fa-arrow-right"></i></span>
            <span v-else><i class="fas fa-spinner fa-spin"></i>&nbsp; Accesso in corso...</span>
          </button>
        </form>

        <transition name="err">
          <div v-if="error" class="lf-error" role="alert">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ error }}</span>
            <button @click="error = ''" class="lf-error-close" aria-label="Chiudi errore">&times;</button>
          </div>
        </transition>
      </div>

      <p class="login-footer">Cre Grest {{ currentYear }} &nbsp;·&nbsp; Fatto da Savi🦞</p>

      <img class="login-cre-logo" src="/img/zanica-logo.png" alt="Logo Oratorio San Giovanni Bosco Zanica" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserLogin',
  data() {
    return {
      username: '',
      password: '',
      rememberMe: false,
      showPass: false,
      error: '',
      isLoading: false,
      fieldErrors: { username: '', password: '' },
      currentYear: new Date().getFullYear()
    };
  },
  methods: {
    validateUsername() {
      this.fieldErrors.username = this.username.length === 0 ? 'Inserisci il tuo username' : '';
    },
    validatePassword() {
      this.fieldErrors.password = this.password.length === 0 ? 'Inserisci la tua password' : '';
    },
    async login() {
      this.validateUsername();
      this.validatePassword();
      if (this.fieldErrors.username || this.fieldErrors.password) return;
      this.error = '';
      this.isLoading = true;
      try {
        const res = await fetch('/.netlify/functions/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: this.username, password: this.password })
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) { this.error = result.message || result.error || 'Credenziali non valide'; return; }
        if (result.success) {
          const session = { username: result.user.username, isAdmin: result.user.isAdmin, rememberMe: this.rememberMe, loginTime: Date.now() };
          if (this.rememberMe) {
            localStorage.setItem('loggedInUser', JSON.stringify(session));
            sessionStorage.removeItem('loggedInUser');
          } else {
            sessionStorage.setItem('loggedInUser', JSON.stringify(session));
            localStorage.removeItem('loggedInUser');
          }
          this.$router.push(result.user.isAdmin ? '/total-point' : '/add-point');
        } else {
          this.error = result.message || 'Credenziali non valide';
        }
      } catch {
        this.error = 'Errore di connessione. Controlla la rete e riprova.';
      } finally {
        this.isLoading = false;
      }
    },
    checkExistingSession() {
      try {
        const u = JSON.parse(localStorage.getItem('loggedInUser')) || JSON.parse(sessionStorage.getItem('loggedInUser'));
        if (u) this.$router.push(u.isAdmin ? '/total-point' : '/add-point');
      // eslint-disable-next-line no-empty
      } catch {}
    }
  },
  created() { this.checkExistingSession(); }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
* { box-sizing: border-box; }

/* ROOT */
.login-root {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  background: transparent;
  position: relative;
  padding: 0.75rem 1.25rem 1rem;
  font-family: 'Nunito', sans-serif;
}

/* BACKGROUND: solo nuvole */
.login-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.cloud { position: absolute; font-size: 2rem; opacity: 0.15; animation: cloudFloat 8s ease-in-out infinite; }
.cloud--1 { top: 18%; left: 8%; animation-delay: 0s; }
.cloud--2 { top: 10%; right: 15%; animation-delay: -3s; font-size: 1.4rem; }
@keyframes cloudFloat { 0%,100%{transform:translateX(0)} 50%{transform:translateX(12px)} }

/* WRAP */
.login-wrap {
  position: relative; z-index: 1;
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column;
  align-items: center;
  gap: 0.7rem;
}

/* BRAND */
.login-brand { text-align: center; }

.login-logo {
  font-size: 2.5rem; line-height: 1; margin-bottom: 0.2rem;
  filter: drop-shadow(0 0 8px rgba(255,200,0,0.65));
  animation: logoFloat 3s ease-in-out infinite;
  display: block;
}
@keyframes logoFloat {
  0%,100% { transform: translateY(0) rotate(-3deg); }
  50%      { transform: translateY(-6px) rotate(3deg); }
}
.login-title {
  font-size: 1.8rem; font-weight: 900;
  color: #fff; letter-spacing: 0.03em; margin: 0;
  text-shadow: 0 2px 20px rgba(102,126,234,0.6);
}
.login-subtitle { color: rgba(255,255,255,0.5); font-size: 0.82rem; margin-top: 0.1rem; font-weight: 600; }

/* CARD */
.login-card {
  width: 100%;
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 22px;
  padding: 1.1rem 1.4rem;
  box-shadow: 0 20px 56px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1);
}

/* FORM GROUP */
.lf-group { margin-bottom: 0.7rem; }
.lf-label {
  display: block; font-size: 0.72rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.09em;
  color: rgba(255,255,255,0.5); margin-bottom: 0.3rem;
}
.lf-input-wrap { position: relative; display: flex; align-items: center; }
.lf-icon { position: absolute; left: 0.9rem; color: rgba(255,255,255,0.3); font-size: 0.85rem; pointer-events: none; }
.lf-input {
  width: 100%;
  background: rgba(255,255,255,0.07);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 13px;
  padding: 0.7rem 1rem 0.7rem 2.6rem;
  font-size: 0.98rem; font-weight: 600;
  color: #fff; outline: none;
  font-family: 'Nunito', sans-serif;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  -webkit-appearance: none;
}
.lf-input::placeholder { color: rgba(255,255,255,0.22); font-weight: 400; }
.lf-input:focus {
  border-color: rgba(102,126,234,0.8);
  background: rgba(102,126,234,0.1);
  box-shadow: 0 0 0 3px rgba(102,126,234,0.2);
}
.lf-group--error .lf-input { border-color: rgba(255,107,107,0.7); }
.lf-group--error .lf-input:focus { box-shadow: 0 0 0 3px rgba(255,107,107,0.2); }
.lf-field-err { font-size: 0.72rem; color: #ff8b8b; font-weight: 600; margin-top: 0.2rem; display: block; padding-left: 0.2rem; }
.lf-eye {
  position: absolute; right: 0.5rem;
  background: none; border: none; color: rgba(255,255,255,0.3);
  cursor: pointer; padding: 0.45rem;
  min-width: 44px; min-height: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; transition: color 0.15s, background 0.15s;
}
.lf-eye:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06); }

/* REMEMBER */
.lf-remember {
  display: flex; align-items: center; gap: 0.6rem;
  cursor: pointer; color: rgba(255,255,255,0.55);
  font-size: 0.82rem; font-weight: 600;
  margin-bottom: 0.85rem; user-select: none; padding: 0.1rem 0;
}
.lf-remember input { display: none; }
.lf-check {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 6px; flex-shrink: 0;
  position: relative; transition: all 0.2s;
  background: rgba(255,255,255,0.05);
}
.lf-remember input:checked ~ .lf-check { background: linear-gradient(135deg, #667eea, #764ba2); border-color: #667eea; }
.lf-remember input:checked ~ .lf-check::after {
  content: '';
  position: absolute; left: 4px; top: 1px;
  width: 6px; height: 10px;
  border: 2.5px solid #fff; border-top: none; border-left: none;
  transform: rotate(45deg);
}

/* SUBMIT */
.lf-submit {
  width: 100%; min-height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none; border-radius: 14px;
  color: #fff; font-size: 1rem; font-weight: 800;
  cursor: pointer; letter-spacing: 0.03em;
  font-family: 'Nunito', sans-serif;
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
  box-shadow: 0 6px 24px rgba(102,126,234,0.45);
  -webkit-tap-highlight-color: transparent;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
}
.lf-submit i { transition: transform 0.2s; }
.lf-submit:hover:not(:disabled) i.fa-arrow-right { transform: translateX(4px); }
.lf-submit:hover:not(:disabled) { box-shadow: 0 10px 32px rgba(102,126,234,0.6); transform: translateY(-1px); }
.lf-submit:active:not(:disabled) { transform: scale(0.97); }
.lf-submit:disabled { opacity: 0.6; cursor: not-allowed; }

/* ERROR */
.lf-error {
  display: flex; align-items: center; gap: 0.6rem;
  background: rgba(220,53,69,0.15);
  border: 1px solid rgba(220,53,69,0.3);
  border-radius: 11px;
  padding: 0.75rem 1rem;
  color: #ff8b96; font-size: 0.88rem; font-weight: 600;
  margin-top: 0.75rem;
}
.lf-error-close {
  margin-left: auto; background: none; border: none;
  color: #ff8b96; font-size: 1.2rem; cursor: pointer;
  padding: 0.2rem 0.4rem; border-radius: 6px;
  min-width: 32px; min-height: 32px; display: flex; align-items: center; justify-content: center;
}
.err-enter-active, .err-leave-active { transition: opacity 0.25s, transform 0.25s; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-8px); }

/* FOOTER */
.login-footer { color: rgba(255,255,255,0.25); font-size: 0.75rem; font-weight: 600; text-align: center; }

/* LOGO ORATORIO IN FONDO */
.login-cre-logo {
  display: block;
  margin: 0.2rem auto 0;
  height: 44px;
  width: auto;
  object-fit: contain;
  opacity: 0.6;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
}

/* SCHERMI PICCOLI */
@media (max-height: 600px) {
  .login-logo { font-size: 1.8rem; }
  .login-title { font-size: 1.4rem; }
  .login-wrap { gap: 0.45rem; }
  .login-card { padding: 0.85rem 1.1rem; }
  .lf-group { margin-bottom: 0.5rem; }
  .lf-remember { margin-bottom: 0.6rem; }
  .lf-submit { min-height: 44px; }
  .login-cre-logo { height: 32px; }
}
</style>
