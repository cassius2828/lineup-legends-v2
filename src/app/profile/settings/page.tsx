"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import DisplaySection from "./_components/DisplaySection";
import ChangePasswordSection from "./_components/ChangePasswordSection";
import UpdateEmailSection from "./_components/UpdateEmailSection";
import PhoneNumberSection from "./_components/PhoneNumberSection";
import MfaSection from "./_components/MfaSection";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { data: profile } = api.profile.getMe.useQuery();
  const { data: mfaStatus } = api.account.getMfaStatus.useQuery();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("email-updated") === "true") {
      toast.success("Email address updated successfully");
    }
    if (searchParams.get("error") === "invalid-token") {
      toast.error("Invalid or expired confirmation link");
    }
    if (searchParams.get("error") === "confirmation-failed") {
      toast.error("Email confirmation failed. Please try again.");
    }
  }, [searchParams]);

  if (!mounted) {
    return (
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="border-foreground/20 border-t-gold mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4" />
            <p className="text-foreground/60">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {profile && (
            <Link
              href={`/profile/${profile.id}`}
              className="text-foreground/60 hover:text-foreground/80 mb-2 inline-flex items-center gap-1 text-sm"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Profile
            </Link>
          )}
          <h1 className="text-foreground text-3xl font-bold">Settings</h1>
          <p className="text-foreground/60 mt-1">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Display Section */}
          <DisplaySection />

          {/* Account Security Section */}
          <section className="border-foreground/10 bg-surface-800 rounded-2xl border p-6">
            <h2 className="text-foreground mb-1 text-lg font-semibold">
              Account Security
            </h2>
            <p className="text-foreground/50 mb-6 text-sm">
              Manage your password, email, and phone number
            </p>

            <div className="space-y-4">
              <ChangePasswordSection
                hasPassword={mfaStatus?.hasPassword ?? false}
              />

              <UpdateEmailSection
                currentEmail={mfaStatus?.email ?? profile?.email ?? ""}
                hasPassword={mfaStatus?.hasPassword ?? false}
              />

              <PhoneNumberSection
                currentPhone={mfaStatus?.phone ?? null}
                phoneVerified={mfaStatus?.phoneVerified ?? false}
              />
            </div>
          </section>

          {/* MFA Section */}
          <MfaSection />
        </div>
      </div>
    </main>
  );
}
