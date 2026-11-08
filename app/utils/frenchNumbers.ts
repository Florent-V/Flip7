/** Normalise un texte: minuscules, sans accents, ponctuation → espaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\+/g, ' plus ')
    .replace(/quatre[\s-]+vingts?/g, 'quatrevingt')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\bcents\b/g, 'cent')
    .replace(/\s+/g, ' ')
    .trim()
}

const WORDS: Record<string, number> = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7,
  huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14,
  quinze: 15, seize: 16, vingt: 20, trente: 30, quarante: 40, cinquante: 50,
  soixante: 60, septante: 70, quatrevingt: 80, octante: 80, nonante: 90, cent: 100
}

export const isNumberToken = (t: string | undefined): boolean =>
  t !== undefined && (/^\d+$/.test(t) || t in WORDS)

type Parsed = { value: number; next: number }

function parseUnder100(tokens: string[], i: number): Parsed | null {
  const t = tokens[i]
  if (t === undefined) return null
  const v = WORDS[t]
  if (v === undefined || v >= 100) return null
  let val = v
  let j = i + 1
  if (v >= 20) {
    if (tokens[j] === 'et' && ['un', 'une', 'onze'].includes(tokens[j + 1] ?? '')) j++
    const n = WORDS[tokens[j] ?? '']
    if (n !== undefined && n > 0 && (n < 10 || ((v === 60 || v === 80) && n <= 16))) {
      val += n
      j++
      if (n === 10) {
        const u = WORDS[tokens[j] ?? '']
        if (u !== undefined && u >= 7 && u <= 9) { val += u; j++ }
      }
    }
  } else if (v === 10) {
    const u = WORDS[tokens[j] ?? '']
    if (u !== undefined && u >= 7 && u <= 9) { val += u; j++ }
  }
  return { value: val, next: j }
}

/** Lit un nombre (chiffres ou mots français) à partir de l'index i. */
export function parseNumberAt(tokens: string[], i: number): Parsed | null {
  const t = tokens[i]
  if (t === undefined) return null
  if (/^\d+$/.test(t)) return { value: parseInt(t, 10), next: i + 1 }
  if (WORDS[t] === undefined) return null
  let total = 0
  let j = i
  if (WORDS[t] === 100) {
    total = 100
    j++
  } else {
    const a = parseUnder100(tokens, i)!
    if (tokens[a.next] === 'cent' && a.value >= 2 && a.value < 10) {
      total = a.value * 100
      j = a.next + 1
    } else {
      return a
    }
  }
  const rest = parseUnder100(tokens, j)
  if (rest) return { value: total + rest.value, next: rest.next }
  return { value: total, next: j }
}

export interface FoundNumber { value: number; start: number; end: number }

export function extractNumbers(tokens: string[]): FoundNumber[] {
  const out: FoundNumber[] = []
  let i = 0
  while (i < tokens.length) {
    const p = parseNumberAt(tokens, i)
    if (p) {
      out.push({ value: p.value, start: i, end: p.next })
      i = p.next
    } else i++
  }
  return out
}
