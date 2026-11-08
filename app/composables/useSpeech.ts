/** Reconnaissance vocale (Web Speech API), relancée automatiquement après chaque phrase. */
export function useSpeech(onFinal: (text: string) => void) {
  const supported = ref(false)
  const listening = ref(false)
  const interim = ref('')
  const error = ref('')
  let rec: any = null
  let want = false

  const SR: any = import.meta.client ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null
  supported.value = !!SR

  function create() {
    rec = new SR()
    rec.lang = 'fr-FR'
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      let tmp = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) { const t = r[0].transcript.trim(); if (t) onFinal(t) } else tmp += r[0].transcript
      }
      interim.value = tmp
    }
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        error.value = 'Micro refusé : autorisez-le dans votre navigateur.'
        want = false
      } else if (e.error === 'audio-capture') {
        error.value = 'Aucun micro détecté.'
        want = false
      } else if (e.error === 'network') {
        error.value = 'Reconnaissance indisponible (réseau).'
      }
    }
    rec.onend = () => {
      interim.value = ''
      if (want) setTimeout(() => { if (want) try { rec.start() } catch { /* déjà démarré */ } }, 200)
      else listening.value = false
    }
  }

  function start() {
    if (!SR) return
    error.value = ''
    want = true
    if (!rec) create()
    try { rec.start() } catch { /* déjà démarré */ }
    listening.value = true
  }
  function stop() {
    want = false
    listening.value = false
    try { rec?.stop() } catch { /* ignore */ }
  }
  const toggle = () => (listening.value ? stop() : start())

  onBeforeUnmount(stop)
  return { supported, listening, interim, error, start, stop, toggle }
}
