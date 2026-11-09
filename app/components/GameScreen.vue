<template>
  <div class="game">
    <header class="top">
      <div class="logo sm">Flip <span>7</span></div>
      <div class="meta">Manche {{ state.rounds.length + 1 }} · objectif {{ state.target }}</div>
      <button class="icon" aria-label="Menu" @click="menu = !menu">⋯</button>
      <div v-if="menu" class="menu" @click="menu = false">
        <button @click="useApp().home()">🎲 Changer de jeu</button>
        <button :disabled="!state.rounds.length" @click="game.undoRound()">↩ Rouvrir la dernière manche</button>
        <button @click="confirmRematch">🔁 Rejouer (mêmes joueurs)</button>
        <button class="danger" @click="confirmReset">🗑 Nouvelle configuration</button>
      </div>
    </header>
    <p v-if="game.tieAtTop.value" class="banner">Égalité en tête : jouez une manche de plus !</p>

    <ScoreTable />
    <div class="spacer" />
    <VoicePanel :apply-voice="game.applyVoice" :next-round="game.nextRound" :filled="game.filledCount.value" :count="state.players.length" :help-items="help" />
    <PlayerSheet />
    <WinnerModal />
  </div>
</template>

<script setup lang="ts">
const game = useGame()
const { state } = game
const menu = ref(false)
const help = [
  '<b>« Alice cartes 3, 5, 12 »</b> — cartes piochées (doublon = raté, 7 différentes = Flip 7 automatiques)',
  '<b>« Alice 23 »</b> — total de la manche (chiffres ou « vingt-trois »)',
  '<b>« Alice fois deux »</b> — carte ×2',
  '<b>« Bob a raté »</b> / <b>« Alice et Bob ont raté »</b> — 0 point',
  '<b>« Léa flip 7 »</b> — bonus +15 (normalement détecté tout seul)',
  '<b>« ajoute 10 à Alice »</b> — additionne aux cartes',
  '<b>« efface Alice »</b> — vide la saisie du joueur',
  '<b>« manche suivante »</b> / <b>« valider »</b> — enregistre la manche',
  '<b>« annule »</b> — annule la dernière saisie · <b>« annule la dernière manche »</b>'
]
function confirmRematch() {
  if (confirm('Remettre tous les scores à zéro ?')) game.rematch()
}
function confirmReset() {
  if (confirm('Quitter cette partie et recommencer la configuration ?')) game.reset()
}
</script>
