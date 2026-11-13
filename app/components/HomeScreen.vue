<template>
  <main class="home">
    <div class="logo">Scores</div>
    <p class="tagline">Choisissez un jeu</p>
    <button class="tile flip" @click="mode = 'flip7'">
      <span class="logo sm">Flip <span>7</span></span>
      <small>Cartes, raté et Flip 7 détectés automatiquement · premier à 200</small>
      <em v-if="flip.state.value.started">▶ Partie en cours · manche {{ flip.state.value.rounds.length + 1 }}</em>
    </button>
    <button class="tile sky" @click="mode = 'skyjo'">
      <span class="logo sm sj">Sky<span>jo</span></span>
      <small>Cartes de -2 à 12, doublement du finisseur · le moins de points gagne</small>
      <em v-if="sky.state.value.started">▶ Partie en cours · manche {{ sky.state.value.rounds.length + 1 }}</em>
    </button>
  </main>
</template>

<script setup lang="ts">
const { mode } = useApp()
const flip = useGame()
const sky = useSkyjo()
</script>
