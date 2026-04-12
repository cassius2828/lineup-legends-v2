import { cn } from "~/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-12 w-12 border-4",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "border-foreground/20 border-t-gold animate-spin rounded-full",
        sizeClasses[size],
        className,
      )}
    />
  );
}
