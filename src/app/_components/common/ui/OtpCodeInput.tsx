import type { InputHTMLAttributes } from "react";

type OtpCodeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "maxLength"
> & {
  value: string;
  onChange: (digits: string) => void;
  onComplete?: (digits: string) => void;
  variant?: "default" | "large";
};

export default function OtpCodeInput({
  value,
  onChange,
  onComplete,
  variant = "default",
  className = "",
  ...rest
}: OtpCodeInputProps) {
  const sizeClass =
    variant === "large"
      ? "py-3 text-center text-2xl tracking-[0.5em]"
      : "py-2.5 text-center text-lg tracking-[0.3em]";

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
        onChange(digits);
        if (digits.length === 6) {
          onComplete?.(digits);
        }
      }}
      className={`border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 ${sizeClass} transition-colors focus:ring-1 focus:outline-none ${className}`}
      {...rest}
    />
  );
}
