"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import PasswordInput from "~/app/_components/common/ui/PasswordInput";
import { Button } from "~/app/_components/common/ui/Button";
import CollapsibleSettingsCard from "./CollapsibleSettingsCard";

export default function UpdateEmailSection({
  currentEmail,
  hasPassword,
}: {
  currentEmail: string;
  hasPassword: boolean;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const updateEmail = api.account.updateEmail.useMutation({
    onSuccess: () => {
      toast.success("Confirmation email sent to your new address");
      setNewEmail("");
      setPassword("");
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !password) return;
    updateEmail.mutate({ newEmail: newEmail.trim(), password });
  };

  return (
    <CollapsibleSettingsCard
      title="Email Address"
      description={currentEmail}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!hasPassword ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            You need to set a password before you can change your email.
          </div>
        ) : null}

        <div>
          <label className="text-foreground/70 mb-1.5 block text-sm font-medium">
            New Email Address
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@example.com"
            disabled={!hasPassword}
            className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-foreground/70 mb-1.5 block text-sm font-medium">
            Confirm Password
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={!hasPassword}
            autoComplete="current-password"
            className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none disabled:opacity-50"
          />
        </div>

        <Button
          type="submit"
          color="gold"
          variant="solid"
          disabled={!hasPassword || !newEmail.trim() || !password}
          loading={updateEmail.isPending}
          loadingText="Sending..."
          className="px-6 py-2.5 font-semibold"
        >
          Update Email
        </Button>

        <p className="text-foreground/40 text-xs">
          A confirmation link will be sent to your new email address.
        </p>
      </form>
    </CollapsibleSettingsCard>
  );
}
