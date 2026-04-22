import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

interface BrandLockupProps {
  className?: string;
  textClassName?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl",
        "bg-gradient-to-br from-primary via-primary/90 to-chart-4 shadow-[0_8px_24px_-12px_hsl(var(--primary))]",
        className
      )}
    >
      <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary-foreground/20" />
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-primary-foreground"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 6.5C7 5.67 7.67 5 8.5 5H12V19H8.5C7.67 19 7 18.33 7 17.5V6.5Z"
          fill="currentColor"
          opacity="0.2"
        />
        <path
          d="M17 6.5C17 5.67 16.33 5 15.5 5H12V19H15.5C16.33 19 17 18.33 17 17.5V6.5Z"
          fill="currentColor"
          opacity="0.2"
        />
        <path
          d="M8.25 9.25C9.2 8.2 10.6 8.2 11.55 9.25L12 9.75L12.45 9.25C13.4 8.2 14.8 8.2 15.75 9.25"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M8.4 13.2C9.25 14.15 10.55 14.15 11.4 13.2L12 12.55L12.6 13.2C13.45 14.15 14.75 14.15 15.6 13.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function BrandLockup({ className, textClassName }: BrandLockupProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <span className={cn("font-semibold text-xl tracking-tight", textClassName)}>
        Study Sturdy
      </span>
    </div>
  );
}