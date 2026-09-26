import { useState, useEffect } from 'react'

export default function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const hours = String(time.getHours()).padStart(2, '0')
  const minutes = String(time.getMinutes()).padStart(2, '0')
  const seconds = String(time.getSeconds()).padStart(2, '0')

  const dateStr = time.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col items-start">
      {/* Time */}
      <div
        className="font-rajdhani font-bold leading-none tracking-tight select-none"
        style={{ fontSize: 'clamp(4.5rem, 10vw, 9rem)', color: '#ffffff' }}
      >
        <span>{hours}</span>
        <span
          className="text-gb-red"
          style={{ animation: 'blink 1s step-end infinite' }}
        >
          :
        </span>
        <span>{minutes}</span>
        <span className="text-gb-charcoal-4 text-3xl ml-2 font-semibold">
          :{seconds}
        </span>
      </div>

      {/* Date */}
      <p
        className="text-gb-muted font-inter font-medium capitalize"
        style={{ fontSize: 'clamp(0.9rem, 1.6vw, 1.3rem)' }}
      >
        {dateStr}
      </p>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
