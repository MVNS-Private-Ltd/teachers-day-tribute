import { useCallback, useRef } from 'react'

// All sound effects here are synthesised in the browser via the Web Audio
// API (noise bursts + oscillators) — no external audio files required.
export function useSoundFx() {
  const ctxRef = useRef(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return null
      ctxRef.current = new AudioCtx()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {})
    }
    return ctxRef.current
  }, [])

  // a soft paper "whoosh" — filtered noise burst, sounds like a page turning
  const playPageFlip = useCallback(
    (variance = 0) => {
      const ctx = getCtx()
      if (!ctx) return
      const now = ctx.currentTime
      const duration = 0.42 + variance * 0.08

      const bufferSize = Math.floor(ctx.sampleRate * duration)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(2600 + variance * 400, now)
      filter.frequency.exponentialRampToValueAtTime(700, now + duration)
      filter.Q.value = 0.6

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(0.32, now + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start(now)
      noise.stop(now + duration)
    },
    [getCtx]
  )

  // a light, magical sparkle chime — used when the message on the page reveals
  const playChime = useCallback(() => {
    const ctx = getCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [659.25, 830.61, 987.77, 1318.51]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const gain = ctx.createGain()
      const start = now + i * 0.09
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.linearRampToValueAtTime(0.13, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 1.2)
    })
  }, [getCtx])

  // gentle low thud — used when the book settles into its opening pose
  const playThud = useCallback(() => {
    const ctx = getCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.22)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  }, [getCtx])

  // a celebratory firework — low boom + a burst of crackling high noise
  const playFirework = useCallback(() => {
    const ctx = getCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(130, now)
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.35)
    const oGain = ctx.createGain()
    oGain.gain.setValueAtTime(0.28, now)
    oGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
    osc.connect(oGain)
    oGain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.42)

    const bufferSize = Math.floor(ctx.sampleRate * 0.6)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1800
    const nGain = ctx.createGain()
    nGain.gain.setValueAtTime(0.0001, now + 0.05)
    nGain.gain.linearRampToValueAtTime(0.16, now + 0.09)
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)
    noise.connect(filter)
    filter.connect(nGain)
    nGain.connect(ctx.destination)
    noise.start(now + 0.05)
    noise.stop(now + 0.65)
  }, [getCtx])

  return { playPageFlip, playChime, playThud, playFirework, getCtx }
}
