"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { startRegistration } from "@simplewebauthn/browser";
import { api } from "~/trpc/react";
import PasswordInput from "~/app/_components/ui/PasswordInput";

function PasswordConfirmDialog({
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

function TotpSetup() {
  const utils = api.useUtils();
  const [setupData, setSetupData] = useState<{
    qrCodeDataUrl: string;
    manualEntryKey: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [showManualKey, setShowManualKey] = useState(false);

  const setupTotp = api.account.setupTotp.useMutation({
    onSuccess: (data) => {
      setSetupData(data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyTotp = api.account.verifyAndEnableTotp.useMutation({
    onSuccess: () => {
      toast.success("Authenticator app enabled");
      setSetupData(null);
      setCode("");
      void utils.account.getMfaStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!setupData) {
    return (
      <button
        onClick={() => setupTotp.mutate()}
        disabled={setupTotp.isPending}
        className="bg-gold hover:bg-gold-light rounded-lg px-4 py-2 text-sm font-semibold text-black transition-colors disabled:opacity-50"
      >
        {setupTotp.isPending ? "Setting up..." : "Set Up"}
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-xl bg-white p-2">
          <Image
            src={setupData.qrCodeDataUrl}
            alt="TOTP QR Code"
            width={180}
            height={180}
          />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-foreground/60 text-sm">
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, 1Password, etc.)
          </p>
          <button
            onClick={() => setShowManualKey(!showManualKey)}
            className="text-gold hover:text-gold-light text-xs transition-colors"
          >
            {showManualKey ? "Hide manual key" : "Can't scan? Enter manually"}
          </button>
          {showManualKey && (
            <div className="border-foreground/10 bg-foreground/5 rounded-lg border p-3">
              <p className="text-foreground/40 mb-1 text-xs">
                Manual entry key:
              </p>
              <code className="text-foreground font-mono text-sm break-all">
                {setupData.manualEntryKey}
              </code>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-foreground/70 mb-1.5 block text-sm font-medium">
          Enter the 6-digit code from your app
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="000000"
          className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2.5 text-center text-lg tracking-[0.3em] focus:ring-1 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => verifyTotp.mutate({ code })}
          disabled={code.length !== 6 || verifyTotp.isPending}
          className="bg-gold hover:bg-gold-light rounded-lg px-6 py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-50"
        >
          {verifyTotp.isPending ? "Verifying..." : "Verify & Enable"}
        </button>
        <button
          onClick={() => {
            setSetupData(null);
            setCode("");
          }}
          className="text-foreground/50 hover:text-foreground/70 px-4 py-2.5 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MfaMethodCard({
  title,
  description,
  enabled,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-foreground/10 rounded-xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground font-medium">{title}</h3>
            {enabled && (
              <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                Active
              </span>
            )}
          </div>
          <p className="text-foreground/50 mt-0.5 text-sm">{description}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function MfaSection() {
  const { data: mfaStatus, isLoading } = api.account.getMfaStatus.useQuery();
  const utils = api.useUtils();

  const [disablingMethod, setDisablingMethod] = useState<string | null>(null);

  const enableEmailMfa = api.account.enableEmailMfa.useMutation({
    onSuccess: () => {
      toast.success("Email MFA enabled");
      void utils.account.getMfaStatus.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const disableEmailMfa = api.account.disableEmailMfa.useMutation({
    onSuccess: () => {
      toast.success("Email MFA disabled");
      setDisablingMethod(null);
      void utils.account.getMfaStatus.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const disableTotp = api.account.disableTotp.useMutation({
    onSuccess: () => {
      toast.success("Authenticator app disabled");
      setDisablingMethod(null);
      void utils.account.getMfaStatus.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const generatePasskeyOptions =
    api.account.generatePasskeyRegistrationOptions.useMutation();

  const verifyPasskeyReg = api.account.verifyPasskeyRegistration.useMutation({
    onSuccess: () => {
      toast.success("Passkey registered");
      void utils.account.getMfaStatus.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const removePasskey = api.account.removePasskey.useMutation({
    onSuccess: () => {
      toast.success("Passkey removed");
      void utils.account.getMfaStatus.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const disableAllMfa = api.account.disableAllMfa.useMutation({
    onSuccess: () => {
      toast.success("All MFA methods disabled");
      setDisablingMethod(null);
      void utils.account.getMfaStatus.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [passkeyName, setPasskeyName] = useState("");
  const [removingPasskeyId, setRemovingPasskeyId] = useState<string | null>(
    null,
  );

  const handleRegisterPasskey = useCallback(async () => {
    try {
      const options = await generatePasskeyOptions.mutateAsync();
      const credential = await startRegistration(options);
      await verifyPasskeyReg.mutateAsync({
        credential,
        name: passkeyName || "My Passkey",
      });
      setPasskeyName("");
    } catch (error) {
      if (error instanceof Error && error.name !== "NotAllowedError") {
        toast.error(error.message);
      }
    }
  }, [generatePasskeyOptions, verifyPasskeyReg, passkeyName]);

  if (isLoading || !mfaStatus) {
    return (
      <section className="border-foreground/10 bg-surface-800 rounded-2xl border p-6">
        <div className="flex items-center gap-2">
          <div className="border-foreground/20 border-t-gold h-5 w-5 animate-spin rounded-full border-2" />
          <span className="text-foreground/50 text-sm">
            Loading MFA settings...
          </span>
        </div>
      </section>
    );
  }

  const isTotpEnabled = mfaStatus.methods.includes("totp");
  const isEmailEnabled = mfaStatus.methods.includes("email");
  const isPasskeyEnabled = mfaStatus.methods.includes("passkey");

  return (
    <section className="border-foreground/10 bg-surface-800 rounded-2xl border p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            Multi-Factor Authentication
          </h2>
          <p className="text-foreground/50 text-sm">
            Add extra security to your account
          </p>
        </div>
        {mfaStatus.mfaEnabled && (
          <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400">
            Enabled
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Authenticator App */}
        <MfaMethodCard
          title="Authenticator App"
          description="Use an app like Google Authenticator or Authy to generate verification codes"
          enabled={isTotpEnabled}
        >
          {isTotpEnabled ? (
            <>
              {disablingMethod === "totp" ? (
                <PasswordConfirmDialog
                  title="Enter your password to disable the authenticator app"
                  onConfirm={(pw) => disableTotp.mutate({ password: pw })}
                  onCancel={() => setDisablingMethod(null)}
                  isPending={disableTotp.isPending}
                />
              ) : (
                <button
                  onClick={() => setDisablingMethod("totp")}
                  className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Disable
                </button>
              )}
            </>
          ) : (
            <TotpSetup />
          )}
        </MfaMethodCard>

        {/* Email */}
        <MfaMethodCard
          title="Email Verification"
          description="Receive a verification code via email"
          enabled={isEmailEnabled}
        >
          {isEmailEnabled ? (
            <>
              {disablingMethod === "email" ? (
                <PasswordConfirmDialog
                  title="Enter your password to disable email MFA"
                  onConfirm={(pw) => disableEmailMfa.mutate({ password: pw })}
                  onCancel={() => setDisablingMethod(null)}
                  isPending={disableEmailMfa.isPending}
                />
              ) : (
                <button
                  onClick={() => setDisablingMethod("email")}
                  className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Disable
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => enableEmailMfa.mutate()}
              disabled={enableEmailMfa.isPending}
              className="bg-gold hover:bg-gold-light rounded-lg px-4 py-2 text-sm font-semibold text-black transition-colors disabled:opacity-50"
            >
              {enableEmailMfa.isPending ? "Enabling..." : "Enable"}
            </button>
          )}
        </MfaMethodCard>

        {/* Passkey */}
        <MfaMethodCard
          title="Passkey"
          description="Use your device's biometrics or security key for passwordless verification"
          enabled={isPasskeyEnabled}
        >
          {/* Existing passkeys */}
          {mfaStatus.passkeys.length > 0 && (
            <div className="mb-3 space-y-2">
              {mfaStatus.passkeys.map((passkey) => (
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
                      {new Date(passkey.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  {removingPasskeyId === passkey.id ? (
                    <PasswordConfirmDialog
                      title="Enter your password to remove this passkey"
                      onConfirm={(pw) =>
                        removePasskey.mutate({
                          passkeyId: passkey.id,
                          password: pw,
                        })
                      }
                      onCancel={() => setRemovingPasskeyId(null)}
                      isPending={removePasskey.isPending}
                    />
                  ) : (
                    <button
                      onClick={() => setRemovingPasskeyId(passkey.id)}
                      className="text-foreground/40 transition-colors hover:text-red-400"
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
          )}

          {/* Add passkey */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                placeholder="Passkey name (e.g., iPhone)"
                className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
            <button
              onClick={handleRegisterPasskey}
              disabled={
                generatePasskeyOptions.isPending || verifyPasskeyReg.isPending
              }
              className="bg-gold hover:bg-gold-light rounded-lg px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-black transition-colors disabled:opacity-50"
            >
              {generatePasskeyOptions.isPending || verifyPasskeyReg.isPending
                ? "Adding..."
                : "Add Passkey"}
            </button>
          </div>
        </MfaMethodCard>

        {/* Disable All MFA */}
        {mfaStatus.mfaEnabled && (
          <div className="border-foreground/10 rounded-xl border border-red-500/20 p-5">
            <h3 className="text-foreground font-medium">Disable All MFA</h3>
            <p className="text-foreground/50 mt-0.5 text-sm">
              Remove all multi-factor authentication methods from your account
            </p>
            {disablingMethod === "all" ? (
              <PasswordConfirmDialog
                title="Enter your password to disable all MFA methods"
                onConfirm={(pw) => disableAllMfa.mutate({ password: pw })}
                onCancel={() => setDisablingMethod(null)}
                isPending={disableAllMfa.isPending}
              />
            ) : (
              <button
                onClick={() => setDisablingMethod("all")}
                className="mt-3 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                Disable All
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
