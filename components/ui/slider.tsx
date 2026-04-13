import { cn } from "@/lib/utils";

/**
 * A lightweight slider using native `<input type="range">`.
 *
 * Avoids Base UI's Slider which injects `<script>` tags for CSS custom
 * property positioning, causing hydration warnings in Next.js SSR.
 */
function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  className?: string;
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;
  const percent = ((currentValue - min) / (max - min)) * 100;

  return (
    <div
      className={cn("relative flex w-full items-center", className)}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={currentValue}
      aria-disabled={disabled}
    >
      {/* Track background */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-input/90">
        {/* Track indicator (filled portion) */}
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-100"
          style={{ width: `${percent}%` }}
        />
      </div>
      {/* Range input (invisible but interactive) */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onValueChange?.([Number(e.target.value)])}
        className={cn(
          "absolute inset-0 h-full w-full cursor-pointer opacity-0",
          "accent-primary",
          disabled && "pointer-events-none",
        )}
      />
      {/* Thumb (visual only) */}
      <div
        className="pointer-events-none absolute h-4 w-6 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform duration-100 hover:ring-4 hover:ring-ring/30"
        style={{
          left: `calc(${percent}% - 12px)`,
        }}
      />
    </div>
  );
}

export { Slider };
