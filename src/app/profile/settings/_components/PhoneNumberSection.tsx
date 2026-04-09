"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

export default function PhoneNumberSection({
  currentPhone,
  phoneVerified,
}: {
  currentPhone: string | null;
  phoneVerified: boolean;
}) {
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const utils = api.useUtils();

  const updatePhone = api.account.updatePhone.useMutation({
    onSuccess: () => {
      toast.success("Verification code sent via SMS");
      setAwaitingVerification(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyPhone = api.account.verifyPhone.useMutation({
    onSuccess: () => {
      toast.success("Phone number verified");
      setAwaitingVerification(false);
      setIsEditing(false);
      setVerificationCode("");
      void utils.account.getMfaStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removePhone = api.account.removePhone.useMutation({
    onSuccess: () => {
      toast.success("Phone number removed");
      setPhone("");
      setIsEditing(false);
      void utils.account.getMfaStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    updatePhone.mutate({ phone: phone.trim() });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) return;
    verifyPhone.mutate({ code: verificationCode });
  };

  return (
    <div className="border-foreground/10 rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-foreground font-medium">Phone Number</h3>
          <p className="text-foreground/50 text-sm">
            {currentPhone ? (
              <>
                {currentPhone}
                {phoneVerified ? (
                  <span className="ml-2 inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                    Verified
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                    Unverified
                  </span>
                )}
              </>
            ) : (
              "No phone number added"
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-gold hover:text-gold-light text-sm font-medium transition-colors"
        >
          {isEditing ? "Cancel" : currentPhone ? "Edit" : "Add"}
        </button>
      </div>

      {isEditing && !awaitingVerification && (
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="text-foreground/70 mb-1.5 block text-sm font-medium">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none"
            />
            <p className="text-foreground/40 mt-1 text-xs">
              Include country code (e.g., +1 for US)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!phone.trim() || updatePhone.isPending}
              className="bg-gold hover:bg-gold-light rounded-lg px-6 py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-50"
            >
              {updatePhone.isPending ? "Saving..." : "Save & Verify"}
            </button>

            {currentPhone && (
              <button
                type="button"
                onClick={() => removePhone.mutate()}
                disabled={removePhone.isPending}
                className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                {removePhone.isPending ? "Removing..." : "Remove"}
              </button>
            )}
          </div>
        </form>
      )}

      {isEditing && awaitingVerification && (
        <form onSubmit={handleVerify} className="mt-4 space-y-4">
          <p className="text-foreground/60 text-sm">
            A verification code has been sent to {phone}
          </p>
          <div>
            <label className="text-foreground/70 mb-1.5 block text-sm font-medium">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(
                  e.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
              placeholder="000000"
              className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2.5 text-center text-lg tracking-[0.3em] focus:ring-1 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={verificationCode.length !== 6 || verifyPhone.isPending}
            className="bg-gold hover:bg-gold-light rounded-lg px-6 py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-50"
          >
            {verifyPhone.isPending ? "Verifying..." : "Verify"}
          </button>
        </form>
      )}
    </div>
  );
}
