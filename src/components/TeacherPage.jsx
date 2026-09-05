import { useEffect, useMemo, useState } from 'react'
import ParticleNet from './ParticleNet'
import ScrollBook from './ScrollBook'
import Finale from './Finale'
import { useTypewriter, getGreeting } from '../hooks/useTypewriter'

export default function TeacherPage({ teacher, onExit }) {
  const [slideIndex, setSlideIndex] = useState(0)
  const [showMessage, setShowMessage] = useState(false)
  const greeting = useMemo(() => getGreeting(), [])

  const introLines = useMemo(
    () => [`${greeting}, ${teacher.name}`, "Won't take long, just hold up."],
    [greeting, teacher.name]
  )

  const { lines, done } = useTypewriter(introLines, { speed: 42, lineDelay: 550, startDelay: 400 })

  // Lock page scroll when on the book animation slide so the wheel events
  // are consumed by ScrollBook's own handler rather than scrolling the page
  useEffect(() => {
    if (slideIndex === 1) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [slideIndex])

  // once the intro has finished typing, give it a beat, then reveal the message
  useMemo(() => {
    if (done && !showMessage) {
      const t = setTimeout(() => setShowMessage(true), 900)
      return () => clearTimeout(t)
    }
  }, [done, showMessage])

  const { bg, particle, particleAlt, accent, accentSoft } = teacher.theme
  const bgStyle =
    teacher.theme.kind === 'gradient'
      ? { background: `linear-gradient(160deg, ${bg[0]}, ${bg[1]})` }
      : { backgroundColor: bg[0] }

  return (
    <div className="relative w-full text-white" style={bgStyle}>
      <button
        onClick={onExit}
        className="fixed left-6 top-6 z-[100] text-xs uppercase tracking-[0.2em] text-white/40 transition hover:text-white/70"
      >
        ← back
      </button>

      {slideIndex === 0 && (
        <div className="relative h-screen w-full overflow-hidden">
          <ParticleNet colorA={particle} colorB={particleAlt} bgColor={bg[0]} />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${bg[0]}66 0%, transparent 35%, ${bg[1]}cc 100%)`,
            }}
          />

          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-5 text-center overflow-y-auto py-20">
            {!showMessage && (
              <div className="max-w-2xl">
                <h1
                  className="text-[clamp(1.8rem,5vw,3.2rem)] leading-tight text-white"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {lines[0]}
                  {lines[0].length < introLines[0].length && <Cursor />}
                </h1>
                {lines[1] !== '' || lines[0].length === introLines[0].length ? (
                  <p className="mt-4 text-[clamp(1rem,2.2vw,1.3rem)] text-white/70">
                    {lines[1]}
                    {lines[1].length > 0 && lines[1].length < introLines[1].length && <Cursor />}
                  </p>
                ) : null}
              </div>
            )}

            {showMessage && (
              <div className="max-w-xl w-full animate-[fadeUp_1.1s_ease_forwards] px-1">
                <p
                  className="text-[11px] uppercase tracking-[0.3em]"
                  style={{ color: accent }}
                >
                  {teacher.subject}
                </p>
                <p
                  className="mt-5 text-[clamp(0.95rem,2.3vw,1.4rem)] leading-relaxed text-white/85"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {teacher.message}
                </p>
                <p className="mt-6 text-sm text-white/50">— With gratitude, your students</p>
                <div
                  className="mx-auto mt-8 h-px w-16"
                  style={{ backgroundColor: accentSoft }}
                />

                <div className="mt-10 pb-4 animate-[fadeUp_1.1s_ease_forwards]" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
                  <button
                    onClick={() => setSlideIndex(1)}
                    className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm tracking-wider text-white backdrop-blur transition hover:bg-white/10 hover:border-white/40 active:scale-95"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {slideIndex === 1 && (
        <div className="relative w-full">
          <ScrollBook teacher={teacher} />
          <div className="fixed bottom-8 right-8 z-[100] animate-[fadeUp_1s_ease_forwards]" style={{ animationDelay: '2s', animationFillMode: 'both' }}>
            <button
              onClick={() => setSlideIndex(2)}
              className="rounded-full border border-white/20 bg-black/30 px-8 py-3 text-sm tracking-wider text-white backdrop-blur transition hover:bg-white/10 hover:border-white/40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {slideIndex === 2 && (
        <div className="relative w-full">
          <Finale teacher={teacher} />
        </div>
      )}
    </div>
  )
}

function Cursor() {
  return <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-white/70 align-middle" style={{ height: '0.9em' }} />
}
