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
        Valider la manche <small>{{ filled }}/{{ count }}</small>
      </button>
      <button class="icon" aria-label="Aide" @click="help = !help">?</button>
    </div>

    <form v-if="help || !supported" class="typed" @submit.prevent="submitText">
      <input v-model="text" :placeholder="supported ? 'ou tapez une commande' : 'Micro non supporté ici (essayez Chrome/Edge/Safari) — tapez une commande'" />
      <button class="ghost" :disabled="!text.trim()">OK</button>
    </form>

    <div v-if="help" class="help">
      <h4>Commandes vocales</h4>
      <ul>
        <li v-for="(h, i) in helpItems" :key="i" v-html="h" />
      </ul>
    </div>
  </footer>
</template>

<script setup lang="ts">
import type { Feedback } from '~/composables/useGame'
const props = defineProps<{
  applyVoice: (t: string) => Feedback[]
  nextRound: () => Feedback
  filled: number
  count: number
  helpItems: string[]
}>()
const log = ref<{ id: number; ok: boolean; text: string }[]>([])
const text = ref('')
const help = ref(false)
let n = 0

function push(items: Feedback[]) {
  log.value = items.map(i => ({ ...i, id: n++ })).slice(-5)
  const mine = n
  setTimeout(() => { if (mine === n) log.value = [] }, 6000)
}
function handle(t: string) {
  push([{ ok: true, text: `« ${t} »` }, ...props.applyVoice(t)])
}
const { supported, listening, interim, error, toggle } = useSpeech(handle)

function submitText() {
  if (!text.value.trim()) return
  handle(text.value.trim())
  text.value = ''
}
const next = () => push([props.nextRound()])
</script>
