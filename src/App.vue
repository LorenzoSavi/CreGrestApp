<template>
  <div id="app">
    <img id="img" src="@/assets/image.png" alt="CRE Grest 2026 - Bella Fra!" title="CRE Grest 2026 - Oratorio San Giovanni Bosco Zanica" />
    <router-view></router-view>
  </div>
</template>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  /* NO overflow:hidden qui — lasciamo che ogni view gestisca il proprio scroll */
  background: #12122a;
}

#app {
  font-family: 'Nunito', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #1a1a1a;
  padding: 0;
  margin: 0;
  height: 100dvh;
  max-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;   /* il contenitore radice rimane locked */
  background: #12122a;
}

#img {
  width: 100%;
  height: 130px;
  object-fit: contain;
  margin: 0;
  display: block;
  flex-shrink: 0;
  background: #12122a;
}

/* router-view occupa tutto lo spazio restante e fa scorrere il suo contenuto */
#app > .router-view,
#app > div:not(#img) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  #img { height: 110px; }
}

@media (max-width: 480px) {
  #img { height: 95px; }
}

@media (max-height: 650px) {
  #img { height: 75px; }
}
</style>
