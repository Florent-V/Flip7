import { describe, expect, it } from 'vitest'
import { computeSkyjoRound } from '../app/utils/skyjoScoring'
import { parseSkyjoVoice } from '../app/utils/skyjoParser'

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }, { id: 'c', name: 'Clémence' }]
const d = (manual: number | null, ender = false) => ({ cards: [], manual, ender })

describe('score Skyjo', () => {
  it('sans pénalité si le finisseur a le plus bas score', () => {
    const r = computeSkyjoRound({ a: d(8, true), b: d(15), c: d(20) }, ['a', 'b', 'c'])
    expect(r.a!.score).toBe(8)
  })
  it('doublé si un autre joueur fait mieux ou égal', () => {
    expect(computeSkyjoRound({ a: d(12, true), b: d(9) }, ['a', 'b']).a).toMatchObject({ score: 24, doubled: true })
    expect(computeSkyjoRound({ a: d(12, true), b: d(12) }, ['a', 'b']).a!.doubled).toBe(true)
  })
  it('pas de doublement d\'un score négatif ou nul', () => {
    expect(computeSkyjoRound({ a: d(-3, true), b: d(-5) }, ['a', 'b']).a!.score).toBe(-3)
  })
  it('somme des cartes, négatifs inclus', () => {
    const r = computeSkyjoRound({ a: { cards: [12, -2, 0, 5], manual: null, ender: false } }, ['a'])
    expect(r.a!.raw).toBe(15)
  })
})

describe('voix Skyjo', () => {
  it('scores, négatifs et fin de manche', () => {
    expect(parseSkyjoVoice('Alice 12 Bob moins trois Clemence 25 a fini', players)).toEqual([
      { type: 'set', playerId: 'a', points: 12 },
      { type: 'set', playerId: 'b', points: -3 },
      { type: 'set', playerId: 'c', points: 25 },
      { type: 'ender', playerId: 'c' }
    ])
  })
  it('signe moins et commandes globales', () => {
    expect(parseSkyjoVoice('Bob -4 manche suivante', players)).toEqual([
      { type: 'set', playerId: 'b', points: -4 }, { type: 'nextRound' }
    ])
  })
  it('ajout et fin seule', () => {
    expect(parseSkyjoVoice('Alice a terminé', players)).toEqual([{ type: 'ender', playerId: 'a' }])
    expect(parseSkyjoVoice('ajoute 5 à Bob', players)).toEqual([{ type: 'add', playerId: 'b', points: 5 }])
  })
})
