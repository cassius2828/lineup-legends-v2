import Link from "next/link";
import { auth, signOut } from "~/server/auth";

const UnauthorizedPage = async () => {
  const session = await auth();
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="font-stencil text-4xl text-foreground uppercase">
            Access Denied
          </h1>
          <p className="text-lg text-foreground/80">
            You are not authorized to visit this page.
          </p>
          <p className="text-sm text-foreground/60">
            This area is restricted to administrators only.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="border-gold bg-gold/10 hover:bg-gold hover:text-black hover:glow-gold-sm rounded-none border-2 px-6 py-3 text-sm font-medium text-foreground/90 capitalize transition-all"
          >
            Return Home
          </Link>
          {session ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="hover:border-gold/50 hover:bg-gold/10 w-full cursor-pointer rounded-none border border-foreground/20 bg-transparent px-6 py-3 text-sm font-medium text-foreground/90 capitalize transition-all hover:text-foreground sm:w-auto"
              >
                Sign Out
              </button>
            </form>
          ) : (
            <Link
              href="/api/auth/signin"
              className="hover:border-gold/50 hover:bg-gold/10 w-full cursor-pointer rounded-none border border-foreground/20 bg-transparent px-6 py-3 text-sm font-medium text-foreground/90 capitalize transition-all hover:text-foreground sm:w-auto"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </main>
  );
};

export default UnauthorizedPage;
