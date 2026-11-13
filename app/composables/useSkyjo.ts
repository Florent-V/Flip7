import type { Feedback } from './useGame'
import type { SkyjoAction, SkyjoDraft, SkyjoRound, SkyjoState } from '~/utils/types'
import { SKYJO_CARDS_PER_HAND } from '~/utils/types'
import { blankSkyjo, computeSkyjoRound, skyjoFilled } from '~/utils/skyjoScoring'
import { parseSkyjoVoice } from '~/utils/skyjoParser'

const KEY = 'skyjo-state-v1'
let persisting = false
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))
const blank = (): SkyjoState => ({ players: [], target: 100, rounds: [], draft: {}, started: false, dismissedWin: false })
function load(): SkyjoState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...blank(), ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return blank()
}

export function useSkyjo() {
  const state = useState<SkyjoState>('skyjo', load)
  const snapshot = useState<Record<string, SkyjoDraft> | null>('skyjo-snap', () => null)
  const touched = useState<string[]>('skyjo-touched', () => [])
  const sheet = useState<string | null>('skyjo-sheet', () => null)

  if (import.meta.client && !persisting) {
    persisting = true
    watch(state, (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ } }, { deep: true })
  }

  const ids = computed(() => state.value.players.map(p => p.id))
  const entry = (id: string): SkyjoDraft => (state.value.draft[id] ??= blankSkyjo())
  const live = computed(() => computeSkyjoRound(state.value.draft, ids.value))
  const filledCount = computed(() => ids.value.filter(id => skyjoFilled(entry(id))).length)

  const totals = computed(() => {
    const t: Record<string, number> = {}
    for (const p of state.value.players) t[p.id] = state.value.rounds.reduce((s, r) => s + (r[p.id]?.score ?? 0), 0)
    return t
  })
  /** Au Skyjo, le MEILLEUR score est le plus bas. */
  const ranking = computed(() => {
    const sorted = [...state.value.players].sort((a, b) => totals.value[a.id]! - totals.value[b.id]!)
    const rank: Record<string, number> = {}
    sorted.forEach((p, i) => {
      rank[p.id] = i > 0 && totals.value[p.id] === totals.value[sorted[i - 1]!.id] ? rank[sorted[i - 1]!.id]! : i + 1
    })
    return rank
  })
  const ended = computed(() => state.value.players.some(p => totals.value[p.id]! >= state.value.target))
  const winner = computed(() => {
    if (!ended.value) return null
    const min = Math.min(...state.value.players.map(p => totals.value[p.id]!))
    const top = state.value.players.filter(p => totals.value[p.id] === min)
    return top.length === 1 ? top[0]! : null
  })
  const tieAtTop = computed(() => ended.value && !winner.value)

  const resetDraft = () => { state.value.draft = Object.fromEntries(ids.value.map(id => [id, blankSkyjo()])) }
  function start(names: string[], target: number) {
    state.value = { ...blank(), players: names.map(n => ({ id: uid(), name: n.trim() })), target, started: true }
    resetDraft()
  }

  function addCard(id: string, n: number) {
    const e = entry(id)
    if (e.manual !== null) { e.manual = null }
    if (e.cards.length < SKYJO_CARDS_PER_HAND) e.cards.push(n)
  }
  const removeCard = (id: string, i: number) => { entry(id).cards.splice(i, 1) }
  const removeLastCard = (id: string) => { entry(id).cards.pop() }
  function setManual(id: string, v: number | null) {
    const e = entry(id)
    e.manual = v === null || Number.isNaN(v) ? null : Math.round(v)
    if (e.manual !== null) e.cards = []
  }
  function toggleEnder(id: string) {
    const was = entry(id).ender
    for (const i of ids.value) entry(i).ender = false
    entry(id).ender = !was
  }
  const clearEntry = (id: string) => { state.value.draft[id] = blankSkyjo() }

  function nextRound(): Feedback {
    if (!filledCount.value) return { ok: false, text: 'Aucun score saisi pour cette manche.' }
    const calc = live.value
    const round: SkyjoRound = {}
    for (const id of ids.value) {
      const c = calc[id]!
      round[id] = { raw: c.raw, score: c.score, doubled: c.doubled, ender: !!entry(id).ender, draft: clone(entry(id)) }
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
    state.value.draft = Object.fromEntries(ids.value.map(id => [id, r[id] ? clone(r[id]!.draft) : blankSkyjo()]))
    state.value.dismissedWin = false
    return { ok: true, text: 'Dernière manche rouverte pour modification.' }
  }

  const nameOf = (id: string) => state.value.players.find(p => p.id === id)?.name ?? '?'
  const mark = (id: string) => { touched.value.push(id) }
  function apply(a: SkyjoAction): Feedback {
    switch (a.type) {
      case 'set': setManual(a.playerId, a.points); mark(a.playerId); return { ok: true, text: `${nameOf(a.playerId)} : ${a.points} points` }
      case 'add': {
        const e = entry(a.playerId)
        setManual(a.playerId, skyjoRawOf(e) + a.points)
        mark(a.playerId)
        return { ok: true, text: `${nameOf(a.playerId)} : ${a.points >= 0 ? '+' : ''}${a.points} (→ ${entry(a.playerId).manual})` }
      }
      case 'ender': {
        if (!entry(a.playerId).ender) toggleEnder(a.playerId)
        mark(a.playerId)
        return { ok: true, text: `${nameOf(a.playerId)} a fini la manche 🏁` }
      }
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
  const skyjoRawOf = (e: SkyjoDraft) => e.manual ?? e.cards.reduce((s, n) => s + n, 0)

  function applyVoice(text: string): Feedback[] {
    const actions = parseSkyjoVoice(text, state.value.players)
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
    state, totals, ranking, winner, tieAtTop, filledCount, touched, sheet, live, entry,
    start, addCard, removeCard, removeLastCard, setManual, toggleEnder, clearEntry,
    nextRound, undoRound, applyVoice, rematch, reset
  }
}
