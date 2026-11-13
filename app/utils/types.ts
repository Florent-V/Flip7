export interface Player {
  id: string
  name: string
}

/** Main d'un joueur pendant la manche. */
export interface DraftEntry {
  cards: number[] // cartes numérotées 0..12 (un doublon = raté)
  mods: number[] // modificateurs additifs (+2, +4, +6, +8, +10…)
  x2: boolean // carte ×2
  manual: number | null // total saisi à la main / à la voix (remplace les cartes)
  bust: boolean // raté forcé (en plus du doublon détecté)
  flip7: boolean // Flip 7 forcé (en plus de la détection des 7 cartes différentes)
}

export interface RoundEntry {
  score: number
  base: number
  bust: boolean
  flip7: boolean
  draft: DraftEntry
}

export type Round = Record<string, RoundEntry>

export interface GameState {
  players: Player[]
  target: number
  rounds: Round[]
  draft: Record<string, DraftEntry>
  started: boolean
  dismissedWin: boolean
}

export type VoiceAction =
  | { type: 'set'; playerId: string; points: number }
  | { type: 'add'; playerId: string; points: number }
  | { type: 'cards'; playerId: string; cards: number[] }
  | { type: 'x2'; playerId: string }
  | { type: 'bust'; playerId: string }
  | { type: 'flip7'; playerId: string }
  | { type: 'clear'; playerId: string }
  | { type: 'nextRound' }
  | { type: 'undo' }
  | { type: 'undoRound' }

export const FLIP7_BONUS = 15
export const FLIP7_CARDS = 7

// ---------------- Skyjo ----------------
export interface SkyjoDraft {
  cards: number[] // cartes comptées, -2..12
  manual: number | null // total saisi à la main / à la voix
  ender: boolean // a retourné sa dernière carte et fini la manche
}
export interface SkyjoRoundEntry { raw: number; score: number; doubled: boolean; ender: boolean; draft: SkyjoDraft }
export type SkyjoRound = Record<string, SkyjoRoundEntry>
export interface SkyjoState {
  players: Player[]
  target: number
  rounds: SkyjoRound[]
  draft: Record<string, SkyjoDraft>
  started: boolean
  dismissedWin: boolean
}
export type SkyjoAction =
  | { type: 'set'; playerId: string; points: number }
  | { type: 'add'; playerId: string; points: number }
  | { type: 'ender'; playerId: string }
  | { type: 'clear'; playerId: string }
  | { type: 'nextRound' }
  | { type: 'undo' }
  | { type: 'undoRound' }
export const SKYJO_CARDS_PER_HAND = 12
