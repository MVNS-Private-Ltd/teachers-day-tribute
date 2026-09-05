// Teacher's Day tribute configuration.
// `password` is matched case-insensitively, trimmed.
// Colors are used to theme the particle net, gradients and accents.
// Messages are placeholders — meant to be personalised later.

export const teachers = [
  {
    id: 'deepshikha',
    password: 'chemistry',
    name: 'Deepshikha Mam',
    subject: 'Chemistry',
    theme: {
      kind: 'solid',
      bg: ['#1a0b2e', '#120620'],
      particle: '#a78bfa',
      particleAlt: '#c4b5fd',
      accent: '#c084fc',
      accentSoft: 'rgba(192,132,252,0.16)',
    },
    message: `Some subjects feel impossible until someone explains them like they actually matter — that's what you did with Chemistry. You turned a subject full of equations and reactions into something we looked forward to, because you never just taught the syllabus, you taught it with patience for whoever needed it repeated one more time. Thank you for every extra minute you gave us, Deepshikha Mam. This day is a small thank you for a debt that's much bigger.`,
    bookLine: 'the best tellurium actinium hydrogen erbium that teaches weird chemistry stuff without making it weird..',
    bookHighlights: ['tellurium', 'actinium', 'hydrogen', 'erbium'],
  },
  {
    id: 'palak',
    password: 'physics',
    name: 'Palak Mam',
    subject: 'Physics',
    theme: {
      kind: 'gradient',
      bg: ['#2e0b2e', '#3a0b4a'],
      particle: '#c084fc',
      particleAlt: '#f472b6',
      accent: '#e879f9',
      accentSoft: 'rgba(232,121,249,0.16)',
    },
    message: `Physics has a way of feeling like it's speaking another language, until you break it down and it suddenly makes sense — that's exactly what you did for us, every single class. You made the hardest concepts feel approachable, and you never made anyone feel small for not getting it the first time. Thank you for the effort you put into every explanation, Palak Mam. We noticed, and we're grateful.`,
    bookLine: "people say there's no better teacher than failure. guess they never met you...",
  },
  {
    id: 'sandeep',
    password: 'maths',
    name: 'Sandeep Sir',
    subject: 'Maths',
    theme: {
      kind: 'solid',
      bg: ['#0b1626', '#081221'],
      particle: '#60a5fa',
      particleAlt: '#93c5fd',
      accent: '#38bdf8',
      accentSoft: 'rgba(56,189,248,0.16)',
    },
    message: `Maths is the subject everyone claims to be scared of, until a teacher shows up who makes it click — you were that teacher for us. You had a way of breaking down a problem until it stopped feeling impossible, and you always pushed us to try one more time instead of giving up. Thank you for every bit of patience you gave a classroom full of us, Sandeep Sir. It made all the difference.`,
    bookLine: 'sir jiiiii tusi great ho!!',
  },
  {
    id: 'rachna',
    password: 'science',
    name: 'Rachna Mam',
    subject: 'Science',
    theme: {
      kind: 'gradient',
      bg: ['#2e0b14', '#4a0b1a'],
      particle: '#fb7185',
      particleAlt: '#f9a8d4',
      accent: '#fb7185',
      accentSoft: 'rgba(251,113,133,0.16)',
    },
    message: `You had a way of making Science feel like curiosity instead of homework — always ready with one more example, one more explanation, one more reason to actually care about what we were learning. That kind of teaching doesn't happen by accident, it happens because you cared enough to keep going. Thank you for that, Rachna Mam. We see it, even if we don't say it enough.`,
    bookLine: "people say good teachers are hard to find, but i think they don't know the location of SRI institutions...",
  },
]

export const findTeacherByPassword = (input) => {
  const clean = input.trim().toLowerCase()
  return teachers.find((t) => t.password === clean) || null
}
