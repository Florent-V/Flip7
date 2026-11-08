import { describe, expect, it } from 'vitest'
import { extractNumbers, normalize } from '../app/utils/frenchNumbers'
import { parseVoice } from '../app/utils/voiceParser'

const players = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
  { id: 'c', name: 'Clémence' }
]
const num = (s: string) => extractNumbers(normalize(s).split(' ')).map(n => n.value)

describe('nombres français', () => {
  it.each([
    ['vingt-trois', 23], ['quatre-vingt-douze', 92], ['soixante et onze', 71],
    ['soixante-dix-sept', 77], ['quatre vingts', 80], ['cent vingt', 120],
    ['deux cents', 200], ['vingt et un', 21], ['dix-sept', 17], ['0', 0], ['42', 42], ['quinze', 15]
  ])('%s → %i', (s, v) => expect(num(s)).toEqual([v]))
})

describe('commandes vocales', () => {
  it('scores multiples', () => {
    expect(parseVoice('Alice 23 Bob quinze', players)).toEqual([
      { type: 'set', playerId: 'a', points: 23 },
      { type: 'set', playerId: 'b', points: 15 }
    ])
  })
  it('bust', () => {
    expect(parseVoice('Bob a raté', players)).toEqual([{ type: 'bust', playerId: 'b' }])
  })
  it('flip 7 avec score', () => {
    expect(parseVoice('Alice 28 flip 7', players)).toEqual([
      { type: 'set', playerId: 'a', points: 28 },
      { type: 'flip7', playerId: 'a' }
    ])
  })
  it('flip 7 seul', () => {
    expect(parseVoice('Clemence flip sept', players)).toEqual([{ type: 'flip7', playerId: 'c' }])
  })
  it('ajout et nombre avant le nom', () => {
    expect(parseVoice('ajoute 10 à Alice', players)).toEqual([{ type: 'add', playerId: 'a', points: 10 }])
    expect(parseVoice('vingt-trois pour Bob', players)).toEqual([{ type: 'set', playerId: 'b', points: 23 }])
  })
  it('joueurs groupés et fuzzy', () => {
    expect(parseVoice('Alice et Bob ont raté', players)).toEqual([
      { type: 'bust', playerId: 'a' }, { type: 'bust', playerId: 'b' }
    ])
    expect(parseVoice('Alise 12', players)).toEqual([{ type: 'set', playerId: 'a', points: 12 }])
  })
  it('commandes globales', () => {
    expect(parseVoice('Alice 5 manche suivante', players)).toEqual([
      { type: 'set', playerId: 'a', points: 5 }, { type: 'nextRound' }
    ])
    expect(parseVoice('annule', players)).toEqual([{ type: 'undo' }])
    expect(parseVoice('annule la dernière manche', players)).toEqual([{ type: 'undoRound' }])
  })
})

describe('cartes et ×2', () => {
  it('cartes piochées', () => {
    expect(parseVoice('Alice cartes 3 5 douze', players)).toEqual([{ type: 'cards', playerId: 'a', cards: [3, 5, 12] }])
  })
  it('×2', () => {
    expect(parseVoice('Bob fois deux', players)).toEqual([{ type: 'x2', playerId: 'b' }])
    expect(parseVoice('Bob carte 4 x2', players)).toEqual([
      { type: 'cards', playerId: 'b', cards: [4] }, { type: 'x2', playerId: 'b' }
    ])
  })
})
