import { FLIP7_BONUS, FLIP7_CARDS } from './types'
import type { DraftEntry } from './types'

export const blankEntry = (): DraftEntry => ({ cards: [], mods: [], x2: false, manual: null, bust: false, flip7: false })

const sum = (a: number[]) => a.reduce((s, n) => s + n, 0)

export const uniqueCount = (e: DraftEntry) => new Set(e.cards).size
export const hasDuplicate = (e: DraftEntry) => uniqueCount(e) !== e.cards.length
export const isBust = (e: DraftEntry) => e.bust || hasDuplicate(e)
export const isFlip7 = (e: DraftEntry) => !isBust(e) && (e.flip7 || uniqueCount(e) >= FLIP7_CARDS)

/** Points avant bonus : total manuel, sinon cartes (×2 sur les cartes) + modificateurs. */
export const baseScore = (e: DraftEntry) => e.manual ?? sum(e.cards) * (e.x2 ? 2 : 1) + sum(e.mods)

export const entryScore = (e: DraftEntry) => (isBust(e) ? 0 : baseScore(e) + (isFlip7(e) ? FLIP7_BONUS : 0))

export const entryFilled = (e: DraftEntry) =>
  e.cards.length > 0 || e.mods.length > 0 || e.x2 || e.manual !== null || e.bust || e.flip7
