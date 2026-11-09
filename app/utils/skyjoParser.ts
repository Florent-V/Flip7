import { extractNumbers, isNumberToken, normalize } from './frenchNumbers'
import { ADD_WORDS, CLEAR_WORDS, FILLER, matchPlayer, playerKeys } from './voiceParser'
import type { Player, SkyjoAction } from './types'

const ENDERS = new Set(['fini', 'finit', 'finie', 'ferme', 'clos', 'skyjo', 'termine', 'terminer'])

const GLOBALS: { re: RegExp; action: SkyjoAction }[] = [
  { re: /\b(annule(r)? la derniere manche|supprime(r)? la derniere manche)\b/, action: { type: 'undoRound' } },
  { re: /\b(manche suivante|valide(r)?( la)?( manche)?|validation|fin de (la )?manche|suivante)\b/, action: { type: 'nextRound' } },
  { re: /\b(annule(r)?|annulation)\b/, action: { type: 'undo' } }
]

interface Analysis { ender: boolean; clear: boolean; add: boolean; value: number | null }

function analyse(tokens: string[]): Analysis {
  const ender = tokens.some(t => ENDERS.has(t))
  const clear = tokens.some(t => CLEAR_WORDS.has(t))
  const add = tokens.some(t => ADD_WORDS.has(t))
  const neg = tokens.some(t => t === 'moins' || t === 'negatif')
  const nums = extractNumbers(tokens.filter(t => t !== 'moins' && t !== 'negatif'))
  const v = nums.length ? nums[0]!.value : null
  return { ender, clear, add, value: v === null ? null : neg ? -v : v }
}
const isEmpty = (a: Analysis) => !a.ender && !a.clear && a.value === null

/** « Alice 12, Bob moins 3, Claire 25 a fini », « manche suivante », « annule »… */
export function parseSkyjoVoice(text: string, players: Player[]): SkyjoAction[] {
  let norm = normalize(text.replace(/(^|\s)-(\d)/g, '$1moins $2'))
  const globals: SkyjoAction[] = []
  for (const g of GLOBALS) {
    if (g.re.test(norm)) {
      globals.push(g.action)
      norm = norm.replace(g.re, ' ').replace(/\s+/g, ' ').trim()
    }
  }
  globals.sort((a, b) => (a.type === 'nextRound' ? 1 : 0) - (b.type === 'nextRound' ? 1 : 0))

  const tokens = norm ? norm.split(' ') : []
  const keys = playerKeys(players)
  const mentions: { idx: number; id: string }[] = []
  tokens.forEach((t, idx) => {
    const id = matchPlayer(t, keys)
    if (id) mentions.push({ idx, id })
  })

  const actions: SkyjoAction[] = []
  let pending: string[] = []
  mentions.forEach((m, k) => {
    pending.push(m.id)
    const end = k + 1 < mentions.length ? mentions[k + 1]!.idx : tokens.length
    let a = analyse(tokens.slice(m.idx + 1, end).filter(t => !FILLER.has(t) || isNumberToken(t)))
    if (isEmpty(a) && k === 0) a = analyse(tokens.slice(0, m.idx))
    if (isEmpty(a)) return
    for (const id of [...new Set(pending)]) {
      if (a.clear) actions.push({ type: 'clear', playerId: id })
      else if (a.value !== null) actions.push({ type: a.add ? 'add' : 'set', playerId: id, points: a.value })
      if (a.ender && !a.clear) actions.push({ type: 'ender', playerId: id })
    }
    pending = []
  })
  return [...actions, ...globals]
}
