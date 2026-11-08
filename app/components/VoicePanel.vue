<template>
  <footer class="dock">
    <div v-if="log.length || interim" class="feed" aria-live="polite">
      <p v-if="interim" class="interim">🎤 {{ interim }}…</p>
      <p v-for="l in log" :key="l.id" :class="l.ok ? 'ok' : 'ko'">{{ l.ok ? '✓' : '✗' }} {{ l.text }}</p>
    </div>
    <p v-if="error" class="err">{{ error }}</p>

    <div class="bar2">
      <button class="mic" :class="{ on: listening }" :disabled="!supported" :aria-pressed="listening" @click="toggle">
        <span class="pulse" /> {{ listening ? 'À l’écoute…' : '🎤 Parler' }}
      </button>
      <button class="primary next" @click="next">
        Valider la manche <small>{{ game.filledCount.value }}/{{ state.players.length }}</small>
      </button>
      <button class="icon" aria-label="Aide" @click="help = !help">?</button>
    </div>

    <form v-if="help || !supported" class="typed" @submit.prevent="submitText">
      <input v-model="text" :placeholder="supported ? 'ou tapez une commande : « Alice 23 Bob raté »' : 'Micro non supporté ici (essayez Chrome/Edge/Safari) — tapez : « Alice 23 Bob raté »'" />
      <button class="ghost" :disabled="!text.trim()">OK</button>
    </form>

    <div v-if="help" class="help">
      <h4>Commandes vocales</h4>
      <ul>
        <li><b>« Alice cartes 3, 5, 12 »</b> — cartes piochées (doublon = raté, 7 différentes = Flip 7 automatiques)</li>
        <li><b>« Alice 23 »</b> — total de la manche (chiffres ou « vingt-trois »)</li>
        <li><b>« Alice fois deux »</b> — carte ×2</li>
        <li><b>« Alice 23, Bob 15, Claire 8 »</b> — plusieurs joueurs d’un coup</li>
        <li><b>« Bob a raté »</b> / <b>« Bob bust »</b> — 0 point</li>
        <li><b>« Léa flip 7 »</b> — bonus +15 (normalement détecté tout seul)</li>
        <li><b>« ajoute 10 à Alice »</b> — additionne aux cartes</li>
        <li><b>« efface Alice »</b> — vide la saisie du joueur</li>
        <li><b>« manche suivante »</b> / <b>« valider »</b> — enregistre la manche</li>
        <li><b>« annule »</b> — annule la dernière saisie · <b>« annule la dernière manche »</b></li>
      </ul>
    </div>
  </footer>
</template>

<script setup lang="ts">
const game = useGame()
const { state } = game
const log = ref<{ id: number; ok: boolean; text: string }[]>([])
const text = ref('')
const help = ref(false)
let n = 0

function push(items: { ok: boolean; text: string }[]) {
  log.value = items.map(i => ({ ...i, id: n++ })).slice(-5)
  const mine = n
  setTimeout(() => { if (mine === n) log.value = [] }, 6000)
}
function handle(t: string) {
  push([{ ok: true, text: `« ${t} »` }, ...game.applyVoice(t)])
}
const { supported, listening, interim, error, toggle } = useSpeech(handle)

function submitText() {
  if (!text.value.trim()) return
  handle(text.value.trim())
  text.value = ''
}
function next() {
  push([game.nextRound()])
}
</script>
