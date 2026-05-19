<template>
  <transition name="notif">
    <div v-if="successMessage || error" class="notif-bar" :class="error ? 'notif-error' : 'notif-success'">
      <i :class="error ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
      <span>{{ error || successMessage }}</span>
      <button class="notif-close" @click="error = ''; successMessage = ''" aria-label="Chiudi">&times;</button>
    </div>
  </transition>

  <transition name="inter-fade">
    <div v-if="showInterAnimation" class="inter-overlay">
      <div class="inter-inner">
        <div class="inter-logo">🖤💙</div>
        <div class="inter-text">INTER</div>
        <div class="inter-sub">FORZA INTER!</div>
        <div class="inter-msg">Bentornato campione nerazzurro!</div>
      </div>
    </div>
  </transition>

  <div class="tp-root">
    <header class="tp-header">
      <div class="tp-header-inner">
        <div class="tp-brand">
          <span class="tp-trophy">🏆</span>
          <div>
            <div class="tp-title">Cre Grest</div>
            <div class="tp-sub">Pannello Admin</div>
          </div>
        </div>
        <div class="tp-header-right">
          <div class="tp-user" v-if="currentUser">
            <span class="tp-avatar">{{ currentUser.username.charAt(0).toUpperCase() }}</span>
            <span class="tp-username">{{ currentUser.username }}</span>
          </div>
          <button @click="handleLogout" class="tp-logout" aria-label="Logout">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </header>

    <nav class="tp-tabs" role="tablist">
      <button class="tp-tab" role="tab" :class="{ 'tp-tab--active': activeTab === 'classifica' }" @click="activeTab = 'classifica'" :aria-selected="activeTab === 'classifica'">
        <i class="fas fa-trophy"></i><span>Classifica</span>
      </button>
      <button class="tp-tab" role="tab" :class="{ 'tp-tab--active': activeTab === 'punti' }" @click="activeTab = 'punti'" :aria-selected="activeTab === 'punti'">
        <i class="fas fa-bolt"></i><span>Punti</span>
      </button>
      <button class="tp-tab" role="tab" :class="{ 'tp-tab--active': activeTab === 'storico' }" @click="activeTab = 'storico'" :aria-selected="activeTab === 'storico'">
        <i class="fas fa-history"></i><span>Storico</span>
      </button>
    </nav>

    <div class="tp-content">

      <div v-show="activeTab === 'classifica'" class="tp-panel" role="tabpanel">
        <div v-if="isLoadingPoints" class="skeleton-list">
          <div v-for="n in 6" :key="n" class="skeleton-row">
            <div class="sk sk-circle"></div>
            <div class="sk sk-bar"></div>
            <div class="sk sk-num"></div>
          </div>
        </div>
        <div v-else-if="isRestrictedUser" class="lock-box">
          <div class="lock-icon">🔒</div>
          <h3>Classifica Riservata</h3>
          <p>Non hai i permessi per visualizzare i punteggi.</p>
        </div>
        <template v-else>
          <div v-if="sortedTeams.length" class="fp-card" :class="sortedTeams[0].id + '-fp'">
            <div class="fp-left">
              <span class="fp-medal">🥇</span>
              <div>
                <div class="fp-name" :class="sortedTeams[0].id + '-text'">{{ sortedTeams[0].name }}</div>
                <div class="fp-label">In testa!</div>
              </div>
            </div>
            <div class="fp-score">{{ sortedTeams[0].points }}<small> pt</small></div>
          </div>
          <div class="rank-list">
            <div v-for="(team, i) in sortedTeams" :key="team.id" class="rank-row" :class="{ 'rank-row--podium': i < 3 }">
              <div class="rank-pos">
                <span v-if="i===0">🥇</span>
                <span v-else-if="i===1">🥈</span>
                <span v-else-if="i===2">🥉</span>
                <span v-else class="rank-num">#{{ i+1 }}</span>
              </div>
              <div class="rank-info">
                <div class="rank-name" :class="team.id + '-text'">{{ team.name }}</div>
                <div class="rank-bar-track">
                  <div class="rank-bar" :class="team.id + '-bar'" :style="{ width: barWidth(team.points) + '%' }"></div>
                </div>
              </div>
              <div class="rank-score">{{ team.points }}<span class="rank-score-unit"> pt</span></div>
            </div>
          </div>
          <div class="stats-row">
            <div class="stat-card"><div class="stat-val">{{ totalPoints }}</div><div class="stat-label">Totali</div></div>
            <div class="stat-card"><div class="stat-val">{{ sortedHistory.length }}</div><div class="stat-label">Assegnazioni</div></div>
            <div class="stat-card"><div class="stat-val">{{ leadGap }}</div><div class="stat-label">Vantaggio</div></div>
          </div>
        </template>
      </div>

      <div v-show="activeTab === 'punti'" class="tp-panel" role="tabpanel">
        <div class="form-card">
          <div class="fc-group">
            <div class="fc-label"><span class="fc-step">1</span> Squadra</div>
            <div class="team-pills">
              <button v-for="team in teams" :key="team.id" type="button" class="team-pill" :class="[team.id + '-pill', { 'team-pill--active': selectedTeam === team.id }]" @click="selectedTeam = team.id" :aria-pressed="selectedTeam === team.id">
                <span class="tp-pill-dot"></span>{{ team.name }}
              </button>
            </div>
          </div>
          <div class="fc-group">
            <div class="fc-label"><span class="fc-step">2</span> Tipo operazione</div>
            <div class="game-pills">
              <button v-for="game in games" :key="game.id" type="button" class="game-pill" :class="{ 'game-pill--active': selectedGame === game.id, 'game-pill--penalty': game.id === 'penitenza' }" @click="selectedGame = game.id" :aria-pressed="selectedGame === game.id">
                <i :class="game.id === 'penitenza' ? 'fas fa-minus-circle' : 'fas fa-star'"></i>
                {{ game.name }}
              </button>
            </div>
          </div>
          <div class="fc-group">
            <div class="fc-label"><span class="fc-step">3</span> Punti</div>
            <div class="pts-quick">
              <button v-for="q in [10, 25, 50, 100]" :key="q" type="button" class="pts-q" :class="{ 'pts-q--active': pointsToAdd === q }" @click="pointsToAdd = q">{{ q }}</button>
            </div>
            <div class="pts-wrap">
              <button type="button" class="pts-btn" @click="pointsToAdd = Math.max(0, pointsToAdd - 1)" aria-label="Diminuisci">−</button>
              <input class="pts-input" type="number" v-model.number="pointsToAdd