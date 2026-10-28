import { memo, useMemo } from 'react'
import type { AppData } from '../domain/types'
import { balanceHistory, hasHistory } from '../domain/history'
import { monthShort } from '../domain/dates'
import { formatWholeEuros } from '../domain/money'

// SVG space (stretched over the box, preserveAspectRatio none): the highest point sits at TOP, the lowest at BOTTOM
const W = 1000
const H = 100
const TOP = 10.5
const BOTTOM = 84.3
const BOX_PX = 104 // CSS height of .chart, for the pixel positions of dots and labels

/** Monotone cubic (Fritsch–Carlson) through the points as SVG path segments: no overshoot between the months. */
function monotonePath(xs: number[], ys: number[]): string {
  const n = xs.length
  const d: number[] = []
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]))
  const m: number[] = [d[0]]
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2)
  m.push(d[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i]
    const b = m[i + 1] / d[i]
    const s = a * a + b * b
    if (s > 9) {
      const t = 3 / Math.sqrt(s)
      m[i] = t * a * d[i]
      m[i + 1] = t * b * d[i]
    }
  }
  const f = (v: number) => v.toFixed(1)
  let path = `M${f(xs[0])} ${f(ys[0])}`
  for (let i = 0; i < n - 1; i++) {
    const dx = (xs[i + 1] - xs[i]) / 3
    path += ` C${f(xs[i] + dx)} ${f(ys[i] + m[i] * dx)} ${f(xs[i + 1] - dx)} ${f(ys[i + 1] - m[i + 1] * dx)} ${f(xs[i + 1])} ${f(ys[i + 1])}`
  }
  return path
}

/** Kontostand at each month end as an area chart (static, no animation); labels only for the first and the last value. */
export const BalanceChart = memo(function BalanceChart({ data, today }: { data: AppData; today: string }) {
  const g = useMemo(() => {
    if (!hasHistory(data, today)) return null // no line without a past
    const points = balanceHistory(data, today)
    const n = points.length
    const xs = points.map((_, i) => ((i + 0.5) / n) * W)
    const values = points.map((p) => p.cents)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const ys = values.map((v) => (max === min ? (TOP + BOTTOM) / 2 : BOTTOM - ((v - min) / (max - min)) * (BOTTOM - TOP)))
    const line = monotonePath(xs, ys)
    const area = `${line} L${xs[n - 1].toFixed(1)} ${H + 20} L${xs[0].toFixed(1)} ${H + 20} Z`
    const px = (y: number) => (y * BOX_PX) / H
    const mid = (TOP + BOTTOM) / 2
    // a label sits above a low dot and below a high one, so it stays inside the box
    const labelTop = (y: number) => (y > mid ? px(y) - 24 : px(y) + 18)
    const label = points.map((p) => `${monthShort(`${p.month}-01`)} ${formatWholeEuros(p.cents)}`).join(', ')
    return { points, n, xs, ys, line, area, px, labelTop, label }
  }, [data, today])
  if (!g) return <div className="hero-bottom" />
  const { points } = g
  const first = points[0]
  const last = points[points.length - 1]
  return (
    <>
      <div className="chart-head">
        <span>Kontostand-Verlauf</span>
        <span className="chip small">Monatsende</span>
      </div>
      <div className="chart" role="img" aria-label={`Kontostand am Monatsende: ${g.label}`} data-testid="balance-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: 'var(--fill-a)' }} />
              <stop offset="1" style={{ stopColor: 'var(--fill-b)' }} />
            </linearGradient>
          </defs>
          <path d={g.area} fill="url(#chart-fill)" />
          <path d={g.line} fill="none" stroke="var(--line)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="chart-pt" data-testid="chart-first" style={{ left: `${(g.xs[0] / W) * 100}%`, top: g.labelTop(g.ys[0]) }}>
          {formatWholeEuros(first.cents)}
        </span>
        <span className="chart-pt last" data-testid="chart-last" style={{ left: `calc(${(g.xs[g.n - 1] / W) * 100}% + 4px)`, top: g.labelTop(g.ys[g.n - 1]) }}>
          {formatWholeEuros(last.cents)}
        </span>
        <span className="chart-dot first" style={{ left: `${(g.xs[0] / W) * 100}%`, top: g.px(g.ys[0]) }} />
        <span className="chart-dot" style={{ left: `${(g.xs[g.n - 1] / W) * 100}%`, top: g.px(g.ys[g.n - 1]) }} />
      </div>
      <div className="chart-months" style={{ gridTemplateColumns: `repeat(${g.n}, 1fr)` }} aria-hidden="true">
        {points.map((p, i) => (
          <span key={p.month} className={i === g.n - 1 ? 'now' : undefined}>
            {monthShort(`${p.month}-01`)}
          </span>
        ))}
      </div>
    </>
  )
})
