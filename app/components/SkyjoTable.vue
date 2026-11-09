<template>
  <section class="tablewrap">
    <div ref="scroller" class="scroller">
      <table class="grid">
        <thead>
          <tr>
            <th class="stick-l">Joueur</th>
            <th v-for="(_, i) in state.rounds" :key="i" class="rd">M{{ i + 1 }}</th>
            <th class="cur">En cours</th>
            <th class="stick-r">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in state.players" :key="p.id" :class="{ lead: rank[p.id] === 1 && state.rounds.length > 0, flash: touched.includes(p.id) }"
              :style="{ '--hue': (i * 47) % 360 }" @click="sheet = p.id">
            <td class="stick-l name"><i class="dot" /><span>{{ p.name }}</span></td>
            <td v-for="(r, k) in state.rounds" :key="k" class="rd" :class="{ b: r[p.id]?.doubled, f: r[p.id]?.ender && !r[p.id]?.doubled }">
              {{ r[p.id]?.score ?? 0 }}<sup v-if="r[p.id]?.doubled">×2</sup><sup v-else-if="r[p.id]?.ender">🏁</sup>
            </td>
            <td class="cur" :class="{ b: live[p.id]?.doubled }">
              <template v-if="live[p.id]?.filled">
                <b>{{ live[p.id]!.score }}</b>
                <small>{{ game.entry(p.id).ender ? (live[p.id]!.doubled ? '🏁 doublé ×2' : '🏁 a fini') : `${game.entry(p.id).cards.length || ''}${game.entry(p.id).cards.length ? ' cartes' : 'manuel'}` }}</small>
              </template>
              <span v-else class="plus">＋</span>
            </td>
            <td class="stick-r tot">
              <b>{{ totals[p.id] }}</b>
              <em class="pbar"><i :style="{ width: Math.min(100, Math.max(0, ((totals[p.id] ?? 0) / state.target) * 100)) + '%' }" /></em>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="tip">Touchez un joueur pour compter ses cartes · le moins de points gagne</p>
  </section>
</template>

<script setup lang="ts">
const game = useSkyjo()
const { state, totals, ranking: rank, touched, sheet, live } = game
const scroller = ref<HTMLElement>()
watch(() => state.value.rounds.length, () => nextTick(() => scroller.value?.scrollTo({ left: 9999, behavior: 'smooth' })), { immediate: true })
</script>
