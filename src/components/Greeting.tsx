import { useEffect } from 'react'

/** Fullscreen greeting after unlocking with Face ID: fades in, holds, fades out (~1 s), then calls `onDone`. */
export function Greeting({ text, onDone }: { text: string; onDone: () => void }) {
  // the CSS animation normally ends it; the timer is only a safety net (e.g. animations switched off)
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2000)
    return () => window.clearTimeout(timer)
  }, [onDone])
  return (
    <div className="greeting" role="status" onAnimationEnd={(e) => e.target === e.currentTarget && onDone()}>
      <h1>{text}</h1>
    </div>
  )
}
