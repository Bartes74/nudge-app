interface OnboardingProgressProps {
  current: number
  total: number
}

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  const pct = Math.round((current / total) * 100)

  return (
    <div className="space-y-1" aria-label={`Krok ${current} z ${total}`}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Krok {current} z {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
        />
      </div>
    </div>
  )
}
