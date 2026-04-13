"use client";

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
              <svg
                className="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <circle cx="10" cy="10" r="3" />
              </svg>
            )}
            {label}
          </li>
        );
      })}
    </ul>
  );
}
