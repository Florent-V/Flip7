<template>
  <div class="app">
    <HomeScreen v-if="mode === 'home'" />
    <template v-else-if="mode === 'flip7'">
      <SetupScreen v-if="!flip.state.value.started" logo="Flip <span>7</span>" :targets="[150, 200, 250]" :default-target="200"
                   hint="Dites par exemple : « Alice cartes 3 5 12, Bob 15, Claire a raté », puis « manche suivante »."
                   @start="flip.start" @back="home()" />
      <GameScreen v-else />
    </template>
    <SkyjoScreen v-else />
  </div>
</template>

<script setup lang="ts">
const { mode, home } = useApp()
const flip = useGame()
</script>
