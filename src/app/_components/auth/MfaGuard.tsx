"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const MFA_VERIFY_PATH = "/sign-in/mfa-verify";

const ALLOWED_PREFIXES = ["/sign-in", "/forgot-password", "/reset-password"];

/**
 * Client-side guard that redirects MFA-pending users to the verification page.
 * Acts as defense-in-depth alongside the Edge middleware check — catches mobile
 * Safari / iOS cookie-timing edge cases where the middleware's getToken() returns
 * null on the first navigation after an OAuth redirect.
 */
export function MfaGuard() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.mfaPending !== true) return;
    if (
      pathname === MFA_VERIFY_PATH ||
      ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))
    ) {
      return;
    }

    router.replace(MFA_VERIFY_PATH);
  }, [session, status, pathname, router]);

  return null;
}
