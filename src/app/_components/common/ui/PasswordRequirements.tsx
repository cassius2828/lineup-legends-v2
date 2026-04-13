"use client";

import { Check, Circle } from "lucide-react";
import { validatePassword } from "~/lib/password-validation";

interface PasswordRequirementsProps {
  password: string;
}

const requirements = [
  { key: "minLength" as const, label: "At least 8 characters" },
  { key: "hasNumber" as const, label: "At least one number" },
  { key: "hasSpecialChar" as const, label: "At least one special character" },
];

export default function PasswordRequirements({
  password,
}: PasswordRequirementsProps) {
  if (!password) return null;

  const validation = validatePassword(password);

  return (
    <ul className="mt-2 space-y-1">
      {requirements.map(({ key, label }) => {
        const met = validation[key];
        return (
          <li
            key={key}
            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
              met ? "text-green-400" : "text-foreground/30"
            }`}
          >
            {met ? (
              <Check className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0" fill="currentColor" />
            )}
            {label}
          </li>
        );
      })}
    </ul>
  );
}
