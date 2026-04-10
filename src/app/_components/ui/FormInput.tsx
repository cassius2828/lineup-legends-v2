import type { InputHTMLAttributes } from "react";

type FormInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
> & {
  className?: string;
};

/**
 * Standard text-style input for auth and settings forms (matches existing Tailwind patterns).
 */
export default function FormInput({ className = "", ...rest }: FormInputProps) {
  return (
    <input
      className={`border-foreground/20 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-3 transition-colors focus:ring-1 focus:outline-none disabled:opacity-50 ${className}`}
      {...rest}
    />
  );
}
