import { FLIP7_BONUS } from '~/utils/types'
import type { DraftEntry, GameState, Round, VoiceAction } from '~/utils/types'
import { baseScore, blankEntry, entryFilled, entryScore, hasDuplicate, isBust, isFlip7 } from '~/utils/scoring'
import { parseVoice } from '~/utils/voiceParser'

const KEY = 'flip7-state-v2'
let persisting = false
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

function blank(): GameState {
  return { players: [], target: 200, rounds: [], draft: {}, started: false, dismissedWin: false }
}
function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...blank(), ...JSON.parse(raw) }
  } catch { /* stockage indisponible */ }
  return blank()
}

export interface Feedback { ok: boolean; text: string }

export function useGame() {
  const state = useState<GameState>('flip7', load)
  const snapshot = useState<Record<string, DraftEntry> | null>('flip7-snap', () => null)
  const touched = useState<string[]>('flip7-touched', () => [])
  const sheet = useState<string | null>('flip7-sheet', () => null) // joueur dont la saisie est ouverte

  if (import.meta.client && !persisting) {
    persisting = true
    watch(state, (s) => {
      try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
    }, { deep: true })
  }

  const totals = computed(() => {
    const t: Record<string, number> = {}
    for (const p of state.value.players) t[p.id] = state.value.rounds.reduce((s, r) => s + (r[p.id]?.score ?? 0), 0)
    return t
  })
  const ranking = computed(() => {
    const sorted = [...state.value.players].sort((a, b) => totals.value[b.id]! - totals.value[a.id]!)
    const rank: Record<string, number> = {}
    sorted.forEach((p, i) => {
      rank[p.id] = i > 0 && totals.value[p.id] === totals.value[sorted[i - 1]!.id] ? rank[sorted[i - 1]!.id]! : i + 1
    })
    return rank
  })
  const winner = computed(() => {
    const vals = state.value.players.map(p => ({ p, t: totals.value[p.id]! }))
    const max = Math.max(...vals.map(v => v.t), 0)
    if (max < state.value.target) return null
    const top = vals.filter(v => v.t === max)
    return top.length === 1 ? top[0]!.p : null
  })
  const tieAtTop = computed(() => {
    const max = Math.max(...state.value.players.map(p => totals.value[p.id]!), 0)
    return max >= state.value.target && !winner.value
  })
  const entry = (id: string): DraftEntry => (state.value.draft[id] ??= blankEntry())
  const filledCount = computed(() => state.value.players.filter(p => entryFilled(entry(p.id))).length)

  function resetDraft() {
    state.value.draft = Object.fromEntries(state.value.players.map(p => [p.id, blankEntry()]))
  }
  function start(names: string[], target: number) {
    state.value = { ...blank(), players: names.map(n => ({ id: uid(), name: n.trim() })), target, started: true }
    resetDraft()
  }

  // --- saisie par cartes -------------------------------------------------
  const addCard = (id: string, n: number) => { const e = entry(id); e.cards.push(n); e.manual = null }
  const removeCard = (id: string, i: number) => { entry(id).cards.splice(i, 1) }
  const removeLastCard = (id: string) => { entry(id).cards.pop() }
  const addMod = (id: string, n: number) => { const e = entry(id); e.mods.push(n); e.manual = null }
  const removeMod = (id: string, i: number) => { entry(id).mods.splice(i, 1) }
  const toggleX2 = (id: string) => { const e = entry(id); e.x2 = !e.x2; e.manual = null }
  function toggleBust(id: string) {
    const e = entry(id)
    e.bust = !e.bust
    if (e.bust) e.flip7 = false
  }
  function setManual(id: string, v: number | null) {
    const e = entry(id)
    e.manual = v === null || Number.isNaN(v) ? null : Math.max(0, Math.round(v))
    if (e.manual !== null) { e.cards = []; e.mods = []; e.x2 = false; e.bust = false }
  }
  const clearEntry = (id: string) => { state.value.draft[id] = blankEntry() }

  // --- manches -----------------------------------------------------------
  function nextRound(): Feedback {
    if (!filledCount.value) return { ok: false, text: 'Aucun score saisi pour cette manche.' }
    const round: Round = {}
    for (const p of state.value.players) {
      const e = entry(p.id)
      round[p.id] = { score: entryScore(e), base: baseScore(e), bust: isBust(e), flip7: isFlip7(e), draft: clone(e) }
    }
    state.value.rounds.push(round)
    state.value.dismissedWin = false
    resetDraft()
    snapshot.value = null
    sheet.value = null
    return { ok: true, text: `Manche ${state.value.rounds.length} validée.` }
  }
  function undoRound(): Feedback {
    if (!state.value.rounds.length) return { ok: false, text: 'Aucune manche à annuler.' }
    const r = state.value.rounds.pop()!
    state.value.draft = Object.fromEntries(state.value.players.map(p => [p.id, r[p.id] ? clone(r[p.id]!.draft) : blankEntry()]))
    state.value.dismissedWin = false
    return { ok: true, text: 'Dernière manche rouverte pour modification.' }
  }

  // --- voix --------------------------------------------------------------
  const nameOf = (id: string) => state.value.players.find(p => p.id === id)?.name ?? '?'
  const mark = (id: string) => { touched.value.push(id) }

  function apply(a: VoiceAction): Feedback {
    switch (a.type) {
      case 'set': setManual(a.playerId, a.points); mark(a.playerId); return { ok: true, text: `${nameOf(a.playerId)} : ${a.points} points` }
      case 'add': {
        const e = entry(a.playerId)
        if (e.manual !== null) e.manual += a.points
        else e.mods.push(a.points)
        mark(a.playerId)
        return { ok: true, text: `${nameOf(a.playerId)} : +${a.points} (→ ${entryScore(e)})` }
      }
      case 'cards': {
        if (!a.cards.length) return { ok: false, text: 'Aucune carte comprise (0 à 12).' }
        a.cards.forEach(c => addCard(a.playerId, c))
        const e = entry(a.playerId)
        mark(a.playerId)
        const extra = hasDuplicate(e) ? ' — doublon : raté !' : isFlip7(e) ? ' — Flip 7 ! 🎉' : ''
        return { ok: true, text: `${nameOf(a.playerId)} : carte ${a.cards.join(', ')}${extra}` }
      }
      case 'x2': toggleX2(a.playerId); mark(a.playerId); return { ok: true, text: `${nameOf(a.playerId)} : ×2` }
      case 'bust': { const e = entry(a.playerId); e.bust = true; e.flip7 = false; mark(a.playerId); return { ok: true, text: `${nameOf(a.playerId)} a raté (0 point)` } }
      case 'flip7': { const e = entry(a.playerId); e.flip7 = true; e.bust = false; mark(a.playerId); return { ok: true, text: `${nameOf(a.playerId)} : Flip 7 ! +${FLIP7_BONUS}` } }
      case 'clear': clearEntry(a.playerId); mark(a.playerId); return { ok: true, text: `${nameOf(a.playerId)} : saisie effacée` }
      case 'nextRound': return nextRound()
      case 'undoRound': return undoRound()
      case 'undo':
        if (!snapshot.value) return { ok: false, text: 'Rien à annuler.' }
        state.value.draft = snapshot.value
        snapshot.value = null
        return { ok: true, text: 'Dernière saisie vocale annulée.' }
    }
  }

  function applyVoice(text: string): Feedback[] {
    const actions = parseVoice(text, state.value.players)
    if (!actions.length) return [{ ok: false, text: `Non compris : « ${text} »` }]
    if (actions.some(a => !['undo', 'nextRound', 'undoRound'].includes(a.type))) snapshot.value = clone(state.value.draft)
    touched.value = []
    const out = actions.map(apply)
    setTimeout(() => { touched.value = [] }, 1400)
    return out
  }

  const rematch = () => { state.value.rounds = []; state.value.dismissedWin = false; resetDraft() }
  const reset = () => { state.value = blank(); sheet.value = null }

  return {
    state, totals, ranking, winner, tieAtTop, filledCount, touched, sheet, entry,
    start, addCard, removeCard, removeLastCard, addMod, removeMod, toggleX2, toggleBust, setManual, clearEntry,
    nextRound, undoRound, applyVoice, rematch, reset
  }
}
