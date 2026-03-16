interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  unit?: string;
  color?: string;
  icon?: React.ReactNode;
}

export function ProgressRing({ value, max, size = 100, strokeWidth = 8, label, unit = '' }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-sm font-bold">{Math.round(percent * 100)}%</span>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{Math.round(value)}{unit}/{max}{unit}</span>
    </div>
  );
}
