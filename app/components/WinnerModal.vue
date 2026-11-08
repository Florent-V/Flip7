<template>
  <div v-if="winner && !state.dismissedWin" class="modal" role="dialog" aria-modal="true">
    <div class="sheet">
      <div class="trophy">🏆</div>
      <h2>{{ winner.name }} gagne !</h2>
      <p>{{ totals[winner.id] }} points en {{ state.rounds.length }} manches</p>
      <ol class="podium">
        <li v-for="p in sorted" :key="p.id"><span>{{ p.name }}</span><b>{{ totals[p.id] }}</b></li>
      </ol>
      <div class="actions">
        <button class="primary" @click="rematch">Rejouer</button>
        <button class="ghost" @click="state.dismissedWin = true">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { state, totals, winner, rematch } = useGame()
const sorted = computed(() => [...state.value.players].sort((a, b) => totals.value[b.id]! - totals.value[a.id]!))
</script>
