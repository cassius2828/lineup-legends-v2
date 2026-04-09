"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import PasswordInput from "~/app/_components/ui/PasswordInput";

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
    <div className="border-foreground/10 rounded-xl border p-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between"
      >
        <div className="text-left">
          <h3 className="text-foreground font-medium">Email Address</h3>
          <p className="text-foreground/50 text-sm">{currentEmail}</p>
        </div>
        <svg
          className={`text-foreground/40 h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {!hasPassword && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              You need to set a password before you can change your email.
            </div>
          )}

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

          <button
            type="submit"
            disabled={
              !hasPassword ||
              !newEmail.trim() ||
              !password ||
              updateEmail.isPending
            }
            className="bg-gold hover:bg-gold-light rounded-lg px-6 py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-50"
          >
            {updateEmail.isPending ? "Sending..." : "Update Email"}
          </button>

          <p className="text-foreground/40 text-xs">
            A confirmation link will be sent to your new email address.
          </p>
        </form>
      )}
    </div>
  );
}
