<template>
  <div id="app">
    <img id="img" src="@/assets/image.png" alt="Cre logo" />

    <router-view></router-view>
  </div>
</template>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding: 0;
  margin: 0;
  min-height: 100vh;
  background-color: #ffffff;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}

#img {
  width: 100%;
  height: 250px;
  object-fit: contain;
  margin: 0;
  display: block;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  #app {
    background-color: #2c3e50;
    color: #ffffff;
  }
  
  nav a {
    color: #ffffff;
  }
  
  nav a.router-link-exact-active {
    color: #667eea;
  }
  
  #img {
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.6));
  }
}

/* Media query per dispositivi mobili */
@media (max-width: 768px) {
  #img {
    height: 180px;
  }
  
  #app {
    padding: 0;
  }
}

@media (max-width: 480px) {
  #img {
    height: 150px;
  }
}
</style>
