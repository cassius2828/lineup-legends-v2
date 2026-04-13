"use client";

import { useState } from "react";
import PasswordInput from "~/app/_components/common/ui/PasswordInput";
import { Button } from "~/app/_components/common/ui/Button";

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
        <Button
          onClick={() => onConfirm(password)}
          disabled={!password}
          color="red"
          variant="subtle"
          loading={isPending}
          loadingText="Disabling..."
          className="px-4 py-2"
        >
          Confirm Disable
        </Button>
        <Button
          onClick={onCancel}
          color="white"
          variant="subtle"
          className="px-4 py-2"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
