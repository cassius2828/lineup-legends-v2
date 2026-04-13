"use client";

import { Trash2 } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import FormInput from "~/app/_components/common/ui/FormInput";
import { Button } from "~/app/_components/common/ui/Button";
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
              <Trash2 className="h-4 w-4" />
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
      <Button
        onClick={onAdd}
        color="gold"
        variant="solid"
        loading={isBusy}
        loadingText="Adding..."
        className="px-4 py-2.5 font-semibold whitespace-nowrap"
      >
        Add Passkey
      </Button>
    </div>
  );
}
