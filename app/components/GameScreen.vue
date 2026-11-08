<template>
  <div class="game">
    <header class="top">
      <div class="logo sm">Flip <span>7</span></div>
      <div class="meta">Manche {{ state.rounds.length + 1 }} · objectif {{ state.target }}</div>
      <button class="icon" aria-label="Menu" @click="menu = !menu">⋯</button>
      <div v-if="menu" class="menu" @click="menu = false">
        <button :disabled="!state.rounds.length" @click="game.undoRound()">↩ Rouvrir la dernière manche</button>
        <button @click="confirmRematch">🔁 Rejouer (mêmes joueurs)</button>
        <button class="danger" @click="confirmReset">🗑 Nouvelle configuration</button>
      </div>
    </header>
    <p v-if="game.tieAtTop.value" class="banner">Égalité en tête : jouez une manche de plus !</p>

    <ScoreTable />
    <div class="spacer" />
    <VoicePanel />
    <PlayerSheet />
    <WinnerModal />
  </div>
</template>

<script setup lang="ts">
const game = useGame()
const { state } = game
const menu = ref(false)
function confirmRematch() {
  if (confirm('Remettre tous les scores à zéro ?')) game.rematch()
}
function confirmReset() {
  if (confirm('Quitter cette partie et recommencer la configuration ?')) game.reset()
}
</script>
