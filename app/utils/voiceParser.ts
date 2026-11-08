import { extractNumbers, isNumberToken, normalize } from './frenchNumbers'
import type { Player, VoiceAction } from './types'

const BUST_WORDS = new Set(['bust', 'buste', 'bouste', 'bus', 'rate', 'rates', 'rater', 'perdu', 'perd', 'saute', 'explose', 'elimine'])
const ADD_WORDS = new Set(['plus', 'ajoute', 'ajouter', 'rajoute', 'rajouter', 'ajout'])
const CLEAR_WORDS = new Set(['efface', 'effacer', 'reinitialise', 'vide'])
const FILLER = new Set(['et', 'a', 'au', 'pour', 'de', 'd', 'le', 'la', 'les', 'ont', 'fait', 'fais', 'avec', 'points', 'point', 'pts', 'score', 'un', 'il', 'elle'])

const GLOBALS: { re: RegExp; action: VoiceAction }[] = [
  { re: /\b(annule(r)? la derniere manche|supprime(r)? la derniere manche|retour en arriere manche)\b/, action: { type: 'undoRound' } },
  { re: /\b(manche suivante|valide(r)?( la)?( manche)?|validation|fin de (la )?manche|termine(r)?( la)?( manche)?|suivante)\b/, action: { type: 'nextRound' } },
  { re: /\b(annule(r)?|annulation)\b/, action: { type: 'undo' } }
]

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length]![b.length]!
}

function matchPlayer(token: string, keys: { id: string; key: string }[]): string | null {
  const exact = keys.filter(k => k.key === token)
  if (exact.length === 1) return exact[0]!.id
  if (exact.length > 1) return null
  const reserved = isNumberToken(token) || BUST_WORDS.has(token) || ADD_WORDS.has(token) || FILLER.has(token) || token.startsWith('flip')
  if (reserved || token.length < 4) return null
  let best: string | null = null
  let bestDist = Infinity
  let tie = false
  for (const k of keys) {
    if (k.key.length < 4) continue
    const d = levenshtein(token, k.key)
    const max = k.key.length >= 7 ? 2 : 1
    if (d <= max) {
      if (d < bestDist) { best = k.id; bestDist = d; tie = false } else if (d === bestDist && best !== k.id) tie = true
    }
  }
  return tie ? null : best
}

interface Analysis { bust: boolean; flip7: boolean; clear: boolean; add: boolean; x2: boolean; cards: boolean; numbers: number[] }

function analyse(tokens: string[]): Analysis {
  const rest: string[] = []
  let flip7 = false
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!
    if (t.startsWith('flip') || t === 'bonus') {
      flip7 = true
      // consomme le "7" / "sept" qui suit
      const n = tokens[i + 1]
      if (n === '7' || n === 'sept' || n === 'seven' || n === 'set') i++
    } else rest.push(t)
  }
  const bust = rest.some(t => BUST_WORDS.has(t))
  const clear = rest.some(t => CLEAR_WORDS.has(t))
  const add = rest.some(t => ADD_WORDS.has(t))
  const cards = rest.some(t => t === 'carte' || t === 'cartes')
  let x2 = rest.includes('x2') || rest.includes('xdeux')
  const forNumbers: string[] = []
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i]!
    if (t === 'x2' || t === 'xdeux') continue
    if (t === 'fois' && (rest[i + 1] === 'deux' || rest[i + 1] === '2')) { x2 = true; i++; continue }
    forNumbers.push(t)
  }
  const nums = extractNumbers(forNumbers)
  return { bust, flip7, clear, add, x2, cards, numbers: nums.map(n => n.value) }
}

const isEmpty = (a: Analysis) => !a.bust && !a.flip7 && !a.clear && !a.x2 && a.numbers.length === 0

/**
 * Transforme une phrase dictée en actions.
 * Exemples: "Alice 23 Bob 15", "Claire a raté", "Bob flip 7", "ajoute 10 à Alice",
 * "vingt-trois pour Alice", "manche suivante", "annule".
 */
export function parseVoice(text: string, players: Player[]): VoiceAction[] {
  let norm = normalize(text)
  const globals: VoiceAction[] = []
  for (const g of GLOBALS) {
    if (g.re.test(norm)) {
      globals.push(g.action)
      norm = norm.replace(g.re, ' ').replace(/\s+/g, ' ').trim()
    }
  }
  globals.sort((a, b) => (a.type === 'nextRound' ? 1 : 0) - (b.type === 'nextRound' ? 1 : 0))

  const tokens = norm ? norm.split(' ') : []
  const keys = players.map(p => ({ id: p.id, key: normalize(p.name).split(' ')[0] ?? '' }))
  const mentions: { idx: number; id: string }[] = []
  tokens.forEach((t, idx) => {
    const id = matchPlayer(t, keys)
    if (id) mentions.push({ idx, id })
  })

  const actions: VoiceAction[] = []
  let pending: string[] = []
  mentions.forEach((m, k) => {
    pending.push(m.id)
    const end = k + 1 < mentions.length ? mentions[k + 1]!.idx : tokens.length
    let a = analyse(tokens.slice(m.idx + 1, end).filter(t => !FILLER.has(t) || isNumberToken(t)))
    if (isEmpty(a) && k === 0) a = analyse(tokens.slice(0, m.idx))
    if (isEmpty(a)) return // "Alice et Bob 12": on garde Alice en attente
    for (const id of [...new Set(pending)]) {
      if (a.clear) actions.push({ type: 'clear', playerId: id })
      else if (a.bust) actions.push({ type: 'bust', playerId: id })
      else if (a.cards) actions.push({ type: 'cards', playerId: id, cards: a.numbers.filter(n => n >= 0 && n <= 12) })
      else if (a.numbers.length) actions.push({ type: a.add ? 'add' : 'set', playerId: id, points: a.numbers[0]! })
      if (a.x2 && !a.clear && !a.bust) actions.push({ type: 'x2', playerId: id })
      if (a.flip7 && !a.clear) actions.push({ type: 'flip7', playerId: id })
    }
    pending = []
  })
  return [...actions, ...globals]
}
