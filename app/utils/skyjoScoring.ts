import type { SkyjoDraft } from './types'

export const blankSkyjo = (): SkyjoDraft => ({ cards: [], manual: null, ender: false })
export const skyjoRaw = (e: SkyjoDraft) => e.manual ?? e.cards.reduce((s, n) => s + n, 0)
export const skyjoFilled = (e: SkyjoDraft) => e.cards.length > 0 || e.manual !== null

export interface SkyjoScore { raw: number; score: number; doubled: boolean; filled: boolean }

/**
 * Règle Skyjo : celui qui termine la manche doit avoir le score STRICTEMENT le plus bas,
 * sinon son score (s'il est positif) est doublé.
 */
export function computeSkyjoRound(drafts: Record<string, SkyjoDraft>, ids: string[]): Record<string, SkyjoScore> {
  const out: Record<string, SkyjoScore> = {}
  for (const id of ids) {
    const d = drafts[id] ?? blankSkyjo()
    const raw = skyjoRaw(d)
    out[id] = { raw, score: raw, doubled: false, filled: skyjoFilled(d) }
  }
  const enderId = ids.find(id => drafts[id]?.ender && out[id]!.filled)
  if (enderId) {
    const e = out[enderId]!
    const notLowest = ids.some(id => id !== enderId && out[id]!.filled && out[id]!.raw <= e.raw)
    if (notLowest && e.raw > 0) { e.score = e.raw * 2; e.doubled = true }
  }
  return out
}
