import { useState } from 'react'
import PasswordGate from './components/PasswordGate'
import TeacherPage from './components/TeacherPage'
import { findTeacherByPassword } from './data/teachers'

export default function App() {
  const [teacher, setTeacher] = useState(null)

  const handleUnlock = (input) => {
    const match = findTeacherByPassword(input)
    if (match) {
      setTeacher(match)
      return true
    }
    return false
  }

  if (!teacher) {
    return <PasswordGate onUnlock={handleUnlock} />
  }

  return <TeacherPage teacher={teacher} onExit={() => setTeacher(null)} />
}
