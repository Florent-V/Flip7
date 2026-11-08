<template>
  <div class="app">
    <SetupScreen v-if="!state.started" />
    <GameScreen v-else />
  </div>
</template>

<script setup lang="ts">
const { state } = useGame()
</script>
