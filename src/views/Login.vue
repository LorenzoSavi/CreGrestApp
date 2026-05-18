<template>
  <div class="login-root">
    <!-- Background decoration -->
    <div class="login-bg">
      <div class="bg-blob bg-blob--1"></div>
      <div class="bg-blob bg-blob--2"></div>
    </div>

    <div class="login-wrap">
      <!-- Logo / Brand -->
      <div class="login-brand">
        <div class="login-trophy">🏆</div>
        <h1 class="login-title">Cre Grest</h1>
        <p class="login-subtitle">Accedi al tuo account</p>
      </div>

      <!-- Card -->
      <div class="login-card">
        <form @submit.prevent="login" autocomplete="on">

          <div class="lf-group">
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
                required
              />
            </div>
          </div>

          <div class="lf-group">
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
                required
              />
              <button type="button" class="lf-eye" @click="showPass = !showPass" :aria-label="showPass ? 'Nascondi' : 'Mostra'">
                <i :class="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <label class="lf-remember">
            <input type="checkbox" v-model="rememberMe" />
            <span class="lf-check"></span>
            <span>Ricordami</span>
          </label>

          <button class="lf-submit" type="submit" :disabled="isLoading">
            <span v-if="!isLoading"><i class="fas fa-sign-in-alt"></i>&nbsp; Accedi</span>
            <span v-else><i class="fas fa-spinner fa-spin"></i>&nbsp; Accesso...</span>
          </button>
        </form>

        <transition name="err">
          <div v-if="error" class="lf-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ error }}</span>
            <button @click="error = ''" class="lf-error-close">&times;</button>
          </div>
        </transition>
      </div>
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
      isLoading: false
    };
  },
  methods: {
    async login() {
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
        this.error = 'Errore di connessione. Riprova.';
      } finally {
        this.isLoading = false;
      }
    },
    checkExistingSession() {
      const u = JSON.parse(localStorage.getItem('loggedInUser')) || JSON.parse(sessionStorage.getItem('loggedInUser'));
      if (u) this.$router.push(u.isAdmin ? '/total-point' : '/add-point');
    }
  },
  created() { this.checkExistingSession(); }
}
</script>

<style scoped>
/* ── ROOT ── */
.login-root {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d1117;
  position: relative;
  overflow: hidden;
  padding: 1.5rem 1.25rem;
}

/* ── BG BLOBS ── */
.login-bg { position: absolute; inset: 0; pointer-events: none; }
.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
}
.bg-blob--1 {
  width: 340px; height: 340px;
  background: radial-gradient(circle, #667eea, #764ba2);
  top: -80px; right: -80px;
}
.bg-blob--2 {
  width: 280px; height: 280px;
  background: radial-gradient(circle, #11998e, #38ef7d);
  bottom: -60px; left: -60px;
}

/* ── WRAP ── */
.login-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
}

/* ── BRAND ── */
.login-brand { text-align: center; }
.login-trophy {
  font-size: 3.5rem;
  line-height: 1;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 0 16px rgba(255,200,0,0.6));
  animation: trophyFloat 3s ease-in-out infinite;
}
@keyframes trophyFloat {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
.login-title {
  font-size: 2rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.04em;
  margin: 0;
  text-shadow: 0 2px 20px rgba(102,126,234,0.5);
}
.login-subtitle { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-top: 0.3rem; }

/* ── CARD ── */
.login-card {
  width: 100%;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  padding: 2rem 1.75rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}

/* ── FORM GROUP ── */
.lf-group { margin-bottom: 1.25rem; }
.lf-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.55);
  margin-bottom: 0.5rem;
}
.lf-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.lf-icon {
  position: absolute;
  left: 1rem;
  color: rgba(255,255,255,0.35);
  font-size: 0.9rem;
  pointer-events: none;
}
.lf-input {
  width: 100%;
  background: rgba(255,255,255,0.08);
  border: 1.5px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 0.9rem 1rem 0.9rem 2.75rem;
  font-size: 1rem;
  color: #fff;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  -webkit-appearance: none;
  appearance: none;
}
.lf-input::placeholder { color: rgba(255,255,255,0.25); }
.lf-input:focus {
  border-color: #667eea;
  background: rgba(102,126,234,0.12);
}
.lf-eye {
  position: absolute;
  right: 0.85rem;
  background: none;
  border: none;
  color: rgba(255,255,255,0.35);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lf-eye:hover { color: rgba(255,255,255,0.7); }

/* ── REMEMBER ── */
.lf-remember {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  color: rgba(255,255,255,0.6);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  user-select: none;
  padding: 0.25rem 0;
}
.lf-remember input { display: none; }
.lf-check {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,0.25);
  border-radius: 6px;
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s;
  background: rgba(255,255,255,0.05);
}
.lf-remember input:checked ~ .lf-check {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: #667eea;
}
.lf-remember input:checked ~ .lf-check::after {
  content: '';
  position: absolute;
  left: 5px; top: 1px;
  width: 5px; height: 10px;
  border: 2px solid #fff;
  border-top: none; border-left: none;
  transform: rotate(45deg);
}

/* ── SUBMIT ── */
.lf-submit {
  width: 100%;
  min-height: 54px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 14px;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.03em;
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
  box-shadow: 0 6px 24px rgba(102,126,234,0.4);
  -webkit-tap-highlight-color: transparent;
}
.lf-submit:active:not(:disabled) { transform: scale(0.97); }
.lf-submit:hover:not(:disabled)  { box-shadow: 0 10px 32px rgba(102,126,234,0.55); }
.lf-submit:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── ERROR ── */
.lf-error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(220,53,69,0.15);
  border: 1px solid rgba(220,53,69,0.35);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  color: #ff8b96;
  font-size: 0.9rem;
  margin-top: 1rem;
}
.lf-error-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #ff8b96;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  min-width: 32px;
  min-height: 32px;
}
.err-enter-active, .err-leave-active { transition: opacity 0.25s, transform 0.25s; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── LIGHT MODE ── */
@media (prefers-color-scheme: light) {
  .login-root { background: #f0f2f8; }
  .bg-blob--1 { opacity: 0.25; }
  .bg-blob--2 { opacity: 0.2; }
  .login-title { color: #1a1a2e; text-shadow: none; }
  .login-subtitle { color: #666; }
  .login-card {
    background: #fff;
    border-color: rgba(0,0,0,0.06);
    box-shadow: 0 8px 40px rgba(0,0,0,0.1);
    backdrop-filter: none;
  }
  .lf-label { color: #555; }
  .lf-input {
    background: #f5f6fa;
    border-color: #dde1ef;
    color: #1a1a2e;
  }
  .lf-input::placeholder { color: #aaa; }
  .lf-icon { color: #aaa; }
  .lf-eye { color: #aaa; }
  .lf-remember { color: #555; }
  .lf-check { border-color: #ccc; background: #f5f5f5; }
}
</style>
