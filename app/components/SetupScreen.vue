<template>
  <main class="setup">
    <div class="logo">Flip <span>7</span></div>
    <p class="tagline">Les scores, à la voix.</p>

    <form class="panel" @submit.prevent="go">
      <h2>Joueurs</h2>
      <div v-for="(n, i) in names" :key="i" class="row">
        <span class="dot" :style="{ background: hue(i) }" />
        <input v-model="names[i]" :placeholder="`Joueur ${i + 1}`" maxlength="20" autocomplete="off" />
        <button v-if="names.length > 2" type="button" class="icon" aria-label="Retirer" @click="names.splice(i, 1)">✕</button>
      </div>
      <button v-if="names.length < 18" type="button" class="ghost" @click="names.push('')">+ Ajouter un joueur</button>

      <h2>Score à atteindre</h2>
      <div class="seg">
        <button v-for="t in [150, 200, 250]" :key="t" type="button" :class="{ on: target === t }" @click="target = t">{{ t }}</button>
      </div>

      <p v-if="dupes" class="warn">Chaque joueur doit avoir un prénom différent (la voix en dépend).</p>
      <button class="primary big" :disabled="!valid">Commencer la partie</button>
    </form>

    <p class="hint">🎤 Dites par exemple : « Alice 23, Bob quinze, Claire a raté, Léa flip 7 », puis « manche suivante ».</p>
  </main>
</template>

<script setup lang="ts">
const { start } = useGame()
const names = ref(['', '', ''])
const target = ref(200)
const clean = computed(() => names.value.map(n => n.trim()).filter(Boolean))
const dupes = computed(() => new Set(clean.value.map(n => normalize(n))).size !== clean.value.length)
const valid = computed(() => clean.value.length >= 2 && !dupes.value)
const hue = (i: number) => `hsl(${(i * 47) % 360} 80% 60%)`
function go() {
  if (valid.value) start(clean.value, target.value)
}
</script>
