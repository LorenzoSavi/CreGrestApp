<template>
  <section class="section">
    <div class="container">
      <div class="columns is-centered">
        <div class="column is-half">
          <div class="box">
            <h1 class="title has-text-centered">Login</h1>
            <form @submit.prevent="login">
              <div class="field">
                <label class="label" for="username">Username</label>
                <div class="control">
                  <input class="input" type="text" v-model="username" id="username" required>
                </div>
              </div>
              <div class="field">
                <label class="label" for="password">Password</label>
                <div class="control">
                  <input class="input" type="password" v-model="password" id="password" required>
                </div>
              </div>
              <div class="field">
                <div class="control">
                  <button class="button is-primary is-fullwidth" type="submit">Login</button>
                </div>
              </div>
            </form>
            <p v-if="error" class="has-text-danger">{{ error }}</p>
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
          localStorage.setItem('loggedInUser', JSON.stringify(user));
          const specialUsers = ['FraVita', 'root', 'savi'];
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
    }
  },
  created() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser) {
      const specialUsers = ['FraVita', 'root', 'savi'];
      if (specialUsers.includes(loggedInUser.username)) {
        this.$router.push('/total-point');
      } else {
        this.$router.push('/add-point');
      }
    }
  }
}
</script>

<style scoped>
.section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -19vh; 
}
.box {
  padding: 2rem;
}
.buttons {
  margin-top: 1rem;
}
</style>
