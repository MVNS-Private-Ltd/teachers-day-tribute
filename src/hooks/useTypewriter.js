import { useEffect, useState } from 'react'

// Types out a sequence of lines, one character at a time.
// Returns { lines: string[], done: boolean } where `lines[i]` is the
// progressively-revealed text for line i, and `done` is true once
// every line has finished typing.
export function useTypewriter(fullLines, { speed = 45, lineDelay = 400, startDelay = 300 } = {}) {
  const [lines, setLines] = useState(() => fullLines.map(() => ''))
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeouts = []

    const typeLine = (lineIndex, charIndex) => {
      if (cancelled) return
      const text = fullLines[lineIndex]
      if (charIndex <= text.length) {
        setLines((prev) => {
          const next = [...prev]
          next[lineIndex] = text.slice(0, charIndex)
          return next
        })
        timeouts.push(setTimeout(() => typeLine(lineIndex, charIndex + 1), speed))
      } else if (lineIndex < fullLines.length - 1) {
        timeouts.push(setTimeout(() => typeLine(lineIndex + 1, 0), lineDelay))
      } else {
        setDone(true)
      }
    }

    timeouts.push(setTimeout(() => typeLine(0, 0), startDelay))

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { lines, done }
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 17) return 'Good Afternoon'
  if (hour >= 17 && hour < 21) return 'Good Evening'
  return 'Good Night'
}
