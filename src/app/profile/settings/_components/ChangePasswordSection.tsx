"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { validatePassword } from "~/lib/password-validation";
import PasswordInput from "~/app/_components/ui/PasswordInput";
import PasswordRequirements from "~/app/_components/ui/PasswordRequirements";

export default function ChangePasswordSection({
  hasPassword,
}: {
  hasPassword: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const validation = validatePassword(newPassword);
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword !== "";
  const canSubmit = hasPassword
    ? !!currentPassword && validation.isValid && passwordsMatch
    : validation.isValid && passwordsMatch;

  const changePassword = api.account.changePassword.useMutation({
    onSuccess: () => {
      toast.success(
        hasPassword ? "Password updated" : "Password set successfully",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    changePassword.mutate({
      currentPassword: hasPassword ? currentPassword : undefined,
      newPassword,
    });
  };

  return (
    <div className="border-foreground/10 rounded-xl border p-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between"
      >
        <div className="text-left">
          <h3 className="text-foreground font-medium">
            {hasPassword ? "Change Password" : "Set Password"}
          </h3>
          <p className="text-foreground/50 text-sm">
            {hasPassword
              ? "Update your account password"
              : "Set a password for email/username login"}
          </p>
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
          {hasPassword && (
            <div>
              <label className="text-foreground/70 mb-1.5 block text-sm font-medium">
                Current Password
              </label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-foreground/70 mb-1.5 block text-sm font-medium">
              New Password
            </label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none"
            />
            <PasswordRequirements password={newPassword} />
          </div>

          <div>
            <label className="text-foreground/70 mb-1.5 block text-sm font-medium">
              Confirm New Password
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1.5 text-xs text-red-400">
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || changePassword.isPending}
            className="bg-gold hover:bg-gold-light rounded-lg px-6 py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-50"
          >
            {changePassword.isPending
              ? "Saving..."
              : hasPassword
                ? "Update Password"
                : "Set Password"}
          </button>
        </form>
      )}
    </div>
  );
}
