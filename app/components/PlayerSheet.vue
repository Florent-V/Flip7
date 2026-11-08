<template>
  <div v-if="player" class="modal bottom" @click.self="close">
    <div class="psheet" role="dialog" aria-modal="true" :style="{ '--hue': (idx * 47) % 360 }">
      <header class="ph">
        <button class="icon" aria-label="Joueur précédent" @click="go(-1)">‹</button>
        <div class="who">
          <h3>{{ player.name }}</h3>
          <small>Total {{ game.totals.value[player.id] }} · objectif {{ game.state.value.target }}</small>
        </div>
        <button class="icon" aria-label="Joueur suivant" @click="go(1)">›</button>
        <button class="icon" aria-label="Fermer" @click="close">✕</button>
      </header>

      <div class="hand" :class="{ bust, flip }">
        <template v-if="e.cards.length || e.mods.length || e.x2">
          <button v-for="(c, i) in e.cards" :key="'c' + i" class="card" :class="{ dup: isDup(c, i) }" :title="'Retirer ' + c" @click="game.removeCard(player.id, i)">{{ c }}</button>
          <button v-for="(m, i) in e.mods" :key="'m' + i" class="card mod" @click="game.removeMod(player.id, i)">+{{ m }}</button>
          <button v-if="e.x2" class="card mod" @click="game.toggleX2(player.id)">×2</button>
        </template>
        <span v-else-if="e.manual !== null" class="empty">Total saisi à la main : {{ e.manual }}</span>
        <span v-else class="empty">Touchez les cartes obtenues ↓</span>
      </div>

      <div class="status">
        <span class="dots" :title="'Cartes différentes'"><i v-for="n in 7" :key="n" :class="{ on: n <= uniq }" />{{ uniq }}/7</span>
        <strong v-if="bust" class="tag bad">💥 Raté — {{ e.bust && !dup ? 'manuel' : 'doublon' }}</strong>
        <strong v-else-if="flip" class="tag good">🎉 Flip 7 ! +15</strong>
      </div>

      <div class="pad">
        <button v-for="n in 13" :key="n" class="num" :class="{ has: count(n - 1) }" @click="game.addCard(player.id, n - 1)">
          {{ n - 1 }}<sup v-if="count(n - 1)">{{ count(n - 1) }}</sup>
        </button>
        <button class="num undo" :disabled="!e.cards.length" aria-label="Retirer la dernière carte" @click="game.removeLastCard(player.id)">⌫</button>
      </div>

      <div class="mods">
        <button v-for="m in [2, 4, 6, 8, 10]" :key="m" class="chip" @click="game.addMod(player.id, m)">+{{ m }}</button>
        <button class="chip" :class="{ on: e.x2 }" @click="game.toggleX2(player.id)">×2</button>
        <button class="chip bustb" :class="{ on: e.bust }" @click="game.toggleBust(player.id)">💥</button>
      </div>

      <div class="sum">
        <span class="formula">{{ formula }}</span>
        <strong>= {{ score }}</strong>
      </div>

      <details class="manual">
        <summary>Saisir un total à la main</summary>
        <input type="number" inputmode="numeric" min="0" placeholder="Total de la manche" :value="e.manual ?? ''"
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
import { FLIP7_BONUS } from '~/utils/types'
const game = useGame()
const { state, sheet } = game
const idx = computed(() => state.value.players.findIndex(p => p.id === sheet.value))
const player = computed(() => state.value.players[idx.value])
const e = computed(() => game.entry(sheet.value ?? ''))
const bust = computed(() => isBust(e.value))
const flip = computed(() => isFlip7(e.value))
const dup = computed(() => hasDuplicate(e.value))
const uniq = computed(() => uniqueCount(e.value))
const score = computed(() => entryScore(e.value))
const count = (n: number) => e.value.cards.filter(c => c === n).length
const isDup = (c: number, i: number) => e.value.cards.indexOf(c) !== i

const formula = computed(() => {
  const v = e.value
  if (v.manual !== null) return 'Total manuel'
  if (!v.cards.length && !v.mods.length) return 'Aucune carte'
  const parts: string[] = []
  const cs = v.cards.reduce((s, n) => s + n, 0)
  if (v.cards.length) parts.push(v.x2 ? `(${v.cards.join('+')})×2` : v.cards.join('+'))
  v.mods.forEach(m => parts.push(`${m}`))
  if (flip.value) parts.push(`${FLIP7_BONUS} bonus`)
  return bust.value ? `${parts.join(' + ')} → raté` : `${parts.join(' + ')}${cs >= 0 ? '' : ''}`
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
