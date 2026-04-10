"use client";

import { useState } from "react";
import PasswordInput from "~/app/_components/ui/PasswordInput";

export default function PasswordConfirmDialog({
  title,
  onConfirm,
  onCancel,
  isPending,
}: {
  title: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [password, setPassword] = useState("");

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
      <p className="text-foreground/70 text-sm">{title}</p>
      <PasswordInput
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        autoComplete="current-password"
        className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(password)}
          disabled={!password || isPending}
          className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-50"
        >
          {isPending ? "Disabling..." : "Confirm Disable"}
        </button>
        <button
          onClick={onCancel}
          className="text-foreground/50 hover:text-foreground/70 px-4 py-2 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
