import { useState } from 'react'
import ParticleNet from './ParticleNet'

export default function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const ok = onUnlock(value)
    if (!ok) {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0714] flex items-center justify-center">
      <ParticleNet colorA="#7c3aed" colorB="#c084fc" bgColor="#0b0714" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0714]/40 via-transparent to-[#0b0714]/90" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-[min(90vw,380px)] flex-col items-center gap-6 px-6 text-center"
      >
        <p className="text-[13px] uppercase tracking-[0.25em] text-purple-200/60">
          Teacher&rsquo;s Day
        </p>
        <h1 className="font-serif text-3xl text-white/90" style={{ fontFamily: "'Instrument Serif', serif" }}>
          A little something, just for you
        </h1>

        <div className="w-full">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(false)
            }}
            placeholder="Enter your password"
            style={{ fontSize: '16px' }}
            className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-center text-white placeholder-white/30 outline-none backdrop-blur-sm transition focus:border-purple-300/50 focus:bg-white/10"
          />
          {error && (
            <p className="mt-3 text-sm text-rose-300/80">
              That password doesn&rsquo;t match anyone here — try again.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="rounded-full bg-white/10 px-8 py-3 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
        >
          Enter
        </button>
      </form>
    </div>
  )
}
