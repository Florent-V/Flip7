import { describe, expect, it } from 'vitest'
import { blankEntry, entryScore, isBust, isFlip7 } from '../app/utils/scoring'

const hand = (p: Partial<ReturnType<typeof blankEntry>>) => ({ ...blankEntry(), ...p })

describe('scoring', () => {
  it('somme des cartes + modificateurs', () => {
    expect(entryScore(hand({ cards: [3, 5, 12], mods: [4] }))).toBe(24)
  })
  it('×2 ne double que les cartes', () => {
    expect(entryScore(hand({ cards: [3, 5], mods: [10], x2: true }))).toBe(26)
  })
  it('doublon = raté automatique', () => {
    const e = hand({ cards: [3, 5, 3] })
    expect(isBust(e)).toBe(true)
    expect(entryScore(e)).toBe(0)
  })
  it('7 cartes différentes = Flip 7 automatique (+15)', () => {
    const e = hand({ cards: [0, 1, 2, 3, 4, 5, 6] })
    expect(isFlip7(e)).toBe(true)
    expect(entryScore(e)).toBe(21 + 15)
  })
  it('total manuel remplace les cartes', () => {
    expect(entryScore(hand({ manual: 40, cards: [1] }))).toBe(40)
  })
})
