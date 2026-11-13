export type AppMode = 'home' | 'flip7' | 'skyjo'
const KEY = 'flip7-app-mode'
let persisting = false

export function useApp() {
  const mode = useState<AppMode>('app-mode', () => {
    try {
      const m = localStorage.getItem(KEY)
      if (m === 'flip7' || m === 'skyjo') return m
    } catch { /* ignore */ }
    return 'home'
  })
  if (import.meta.client && !persisting) {
    persisting = true
    watch(mode, (m) => { try { localStorage.setItem(KEY, m) } catch { /* ignore */ } })
  }
  return { mode, home: () => { mode.value = 'home' } }
}
