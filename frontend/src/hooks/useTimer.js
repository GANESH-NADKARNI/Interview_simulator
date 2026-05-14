import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(durationMinutes) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60)
  const [isRunning, setIsRunning]     = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => setSecondsLeft(s => s - 1), 1000)
    } else if (secondsLeft === 0) {
      setIsRunning(false)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, secondsLeft])

  const start  = useCallback(() => setIsRunning(true), [])
  const pause  = useCallback(() => setIsRunning(false), [])
  const reset  = useCallback(() => { setSecondsLeft(durationMinutes * 60); setIsRunning(false) }, [durationMinutes])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const display    = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`
  const percent    = ((durationMinutes * 60 - secondsLeft) / (durationMinutes * 60)) * 100
  const isWarning  = secondsLeft <= 300 && secondsLeft > 60
  const isCritical = secondsLeft <= 60
  const isExpired  = secondsLeft === 0

  return { secondsLeft, display, percent, isRunning, isWarning, isCritical, isExpired, start, pause, reset }
}
