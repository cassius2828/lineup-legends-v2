"use client";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import FormInput from "~/app/_components/ui/FormInput";
import PasswordConfirmDialog from "./PasswordConfirmDialog";

type PasskeySummary =
  inferRouterOutputs<AppRouter>["account"]["getMfaStatus"]["passkeys"][number];

export function PasskeyList({
  passkeys,
  removingPasskeyId,
  onRemoveClick,
  onCancelRemove,
  onConfirmRemove,
  isRemovePending,
}: {
  passkeys: PasskeySummary[];
  removingPasskeyId: string | null;
  onRemoveClick: (passkeyId: string) => void;
  onCancelRemove: () => void;
  onConfirmRemove: (passkeyId: string, password: string) => void;
  isRemovePending: boolean;
}) {
  if (passkeys.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 space-y-2">
      {passkeys.map((passkey) => (
        <div
          key={passkey.id}
          className="border-foreground/10 bg-foreground/5 flex items-center justify-between rounded-lg border px-4 py-3"
        >
          <div>
            <p className="text-foreground text-sm font-medium">
              {passkey.name}
            </p>
            <p className="text-foreground/40 text-xs">
              Added{" "}
              {new Date(passkey.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          {removingPasskeyId === passkey.id ? (
            <PasswordConfirmDialog
              title="Enter your password to remove this passkey"
              onConfirm={(pw) => onConfirmRemove(passkey.id, pw)}
              onCancel={onCancelRemove}
              isPending={isRemovePending}
            />
          ) : (
            <button
              type="button"
              onClick={() => onRemoveClick(passkey.id)}
              className="text-foreground/40 transition-colors hover:text-red-400"
              aria-label={`Remove passkey ${passkey.name}`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function PasskeyAddForm({
  name,
  onNameChange,
  onAdd,
  isBusy,
}: {
  name: string;
  onNameChange: (value: string) => void;
  onAdd: () => void;
  isBusy: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <FormInput
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Passkey name (e.g., iPhone)"
          className="py-2.5 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={isBusy}
        className="bg-gold hover:bg-gold-light rounded-lg px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-black transition-colors disabled:opacity-50"
      >
        {isBusy ? "Adding..." : "Add Passkey"}
      </button>
    </div>
  );
}
