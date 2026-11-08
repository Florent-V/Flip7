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
          <tr v-for="(p, i) in state.players" :key="p.id" :class="{ lead: rank[p.id] === 1 && totals[p.id]! > 0, flash: touched.includes(p.id) }"
              :style="{ '--hue': (i * 47) % 360 }" @click="sheet = p.id">
            <td class="stick-l name"><i class="dot" /><span>{{ p.name }}</span></td>
            <td v-for="(r, k) in state.rounds" :key="k" class="rd" :class="{ b: r[p.id]?.bust, f: r[p.id]?.flip7 }">
              {{ r[p.id]?.bust ? '💥' : r[p.id]?.score ?? 0 }}
            </td>
            <td class="cur" :class="{ b: isBust(game.entry(p.id)), f: isFlip7(game.entry(p.id)) }">
              <template v-if="entryFilled(game.entry(p.id))">
                <b>{{ isBust(game.entry(p.id)) ? '💥' : entryScore(game.entry(p.id)) }}</b>
                <small>{{ sub(game.entry(p.id)) }}</small>
              </template>
              <span v-else class="plus">＋</span>
            </td>
            <td class="stick-r tot">
              <b>{{ totals[p.id] }}</b>
              <em class="pbar"><i :style="{ width: Math.min(100, ((totals[p.id] ?? 0) / state.target) * 100) + '%' }" /></em>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="tip">Touchez un joueur pour saisir ses cartes</p>
  </section>
</template>

<script setup lang="ts">
import type { DraftEntry } from '~/utils/types'
const game = useGame()
const { state, totals, ranking: rank, touched, sheet } = game
const scroller = ref<HTMLElement>()

function sub(e: DraftEntry) {
  if (isFlip7(e)) return '🎉 Flip 7'
  if (isBust(e)) return ''
  return e.cards.length ? `${e.cards.length} carte${e.cards.length > 1 ? 's' : ''}` : 'manuel'
}
// garde la dernière manche visible quand le tableau s'allonge
watch(() => state.value.rounds.length, () => nextTick(() => scroller.value?.scrollTo({ left: 9999, behavior: 'smooth' })), { immediate: true })
</script>
