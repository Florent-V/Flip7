<template>
  <SetupScreen v-if="!state.started" logo="Sky<span>jo</span>" :targets="[50, 100, 150]" :default-target="100"
               hint="Dites par exemple : « Alice 12, Bob moins trois, Claire 25 a fini », puis « manche suivante »."
               @start="game.start" @back="app.home()" />
  <div v-else class="game skyjo">
    <header class="top">
      <div class="logo sm sj">Sky<span>jo</span></div>
      <div class="meta">Manche {{ state.rounds.length + 1 }} · fin à {{ state.target }}</div>
      <button class="icon" aria-label="Menu" @click="menu = !menu">⋯</button>
      <div v-if="menu" class="menu" @click="menu = false">
        <button @click="app.home()">🎲 Changer de jeu</button>
        <button :disabled="!state.rounds.length" @click="game.undoRound()">↩ Rouvrir la dernière manche</button>
        <button @click="confirmRematch">🔁 Rejouer (mêmes joueurs)</button>
        <button class="danger" @click="confirmReset">🗑 Nouvelle configuration</button>
      </div>
    </header>
    <p v-if="game.tieAtTop.value" class="banner">Égalité pour la victoire : jouez une manche de plus !</p>

    <SkyjoTable />
    <div class="spacer" />
    <VoicePanel :apply-voice="game.applyVoice" :next-round="game.nextRound" :filled="game.filledCount.value" :count="state.players.length" :help-items="help" />
    <SkyjoSheet />
    <SkyjoWinner />
  </div>
</template>

<script setup lang="ts">
const app = useApp()
const game = useSkyjo()
const { state } = game
const menu = ref(false)
const help = [
  '<b>« Alice 12 »</b> — total de la manche (chiffres ou en lettres)',
  '<b>« Bob moins trois »</b> / <b>« Bob -3 »</b> — score négatif',
  '<b>« Claire 25 a fini »</b> — Claire a fini la manche (pénalité ×2 si elle n’a pas le plus petit score)',
  '<b>« ajoute 5 à Alice »</b> — additionne au score',
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
