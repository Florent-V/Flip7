<template>
  <div v-if="player" class="modal bottom" @click.self="close">
    <div class="psheet" role="dialog" aria-modal="true" :style="{ '--hue': (idx * 47) % 360 }">
      <header class="ph">
        <button class="icon" aria-label="Joueur précédent" @click="go(-1)">‹</button>
        <div class="who">
          <h3>{{ player.name }}</h3>
          <small>Total {{ game.totals.value[player.id] }} · fin à {{ game.state.value.target }}</small>
        </div>
        <button class="icon" aria-label="Joueur suivant" @click="go(1)">›</button>
        <button class="icon" aria-label="Fermer" @click="close">✕</button>
      </header>

      <div class="hand" :class="{ bust: calc.doubled }">
        <template v-if="e.cards.length">
          <button v-for="(c, i) in e.cards" :key="i" class="card" :class="{ neg: c < 0 }" @click="game.removeCard(player.id, i)">{{ c }}</button>
        </template>
        <span v-else-if="e.manual !== null" class="empty">Total saisi à la main : {{ e.manual }}</span>
        <span v-else class="empty">Touchez les cartes restantes ↓ (colonnes retirées : ne pas compter)</span>
      </div>

      <div class="status">
        <span class="dots">{{ e.cards.length }}/12 cartes</span>
        <strong v-if="calc.doubled" class="tag bad">⚠ Pas le plus bas : ×2</strong>
        <strong v-else-if="e.ender && calc.filled" class="tag good">🏁 A fini la manche</strong>
      </div>

      <div class="pad p5">
        <button v-for="n in values" :key="n" class="num" :class="{ has: count(n), negc: n < 0 }" :disabled="e.cards.length >= 12" @click="game.addCard(player.id, n)">
          {{ n }}<sup v-if="count(n)">{{ count(n) }}</sup>
        </button>
      </div>

      <div class="mods">
        <button class="chip" :disabled="!e.cards.length" @click="game.removeLastCard(player.id)">⌫ Retirer</button>
        <button class="chip" :class="{ on: e.ender }" @click="game.toggleEnder(player.id)">🏁 A fini la manche</button>
      </div>

      <div class="sum">
        <span class="formula">{{ formula }}</span>
        <strong>= {{ calc.score }}</strong>
      </div>

      <details class="manual">
        <summary>Saisir un total à la main (négatif possible)</summary>
        <input type="number" inputmode="numeric" placeholder="Total de la manche" :value="e.manual ?? ''"
               @input="game.setManual(player.id, ($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value))" />
      </details>

      <footer class="pf">
        <button class="ghost" @click="game.clearEntry(player.id)">Effacer</button>
        <button class="primary" @click="done">Joueur suivant ›</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const game = useSkyjo()
const { state, sheet } = game
const values = Array.from({ length: 15 }, (_, i) => i - 2) // -2 … 12
const idx = computed(() => state.value.players.findIndex(p => p.id === sheet.value))
const player = computed(() => state.value.players[idx.value])
const e = computed(() => game.entry(sheet.value ?? ''))
const calc = computed(() => game.live.value[sheet.value ?? ''] ?? { raw: 0, score: 0, doubled: false, filled: false })
const count = (n: number) => e.value.cards.filter(c => c === n).length
const formula = computed(() => {
  if (e.value.manual !== null) return 'Total manuel'
  if (!e.value.cards.length) return 'Aucune carte'
  const f = e.value.cards.join(' + ').replace(/\+ -/g, '− ')
  return calc.value.doubled ? `(${f}) × 2` : f
})
function go(d: number) {
  const n = state.value.players.length
  sheet.value = state.value.players[(idx.value + d + n) % n]!.id
}
const close = () => { sheet.value = null }
function done() {
  if (idx.value === state.value.players.length - 1) close()
  else go(1)
}
</script>
