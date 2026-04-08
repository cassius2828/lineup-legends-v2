import Link from "next/link";
import { auth, signOut } from "~/server/auth";

const UnauthorizedPage = async () => {
  const session = await auth();
  return (
    <main className="bg-surface-950 flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="font-stencil text-foreground text-4xl uppercase">
            Access Denied
          </h1>
          <p className="text-foreground/80 text-lg">
            You are not authorized to visit this page.
          </p>
          <p className="text-foreground/60 text-sm">
            This area is restricted to administrators only.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="border-gold bg-gold/10 hover:bg-gold hover:glow-gold-sm text-foreground/90 rounded-none border-2 px-6 py-3 text-sm font-medium capitalize transition-all hover:text-black"
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
                className="hover:border-gold/50 hover:bg-gold/10 border-foreground/20 text-foreground/90 hover:text-foreground w-full cursor-pointer rounded-none border bg-transparent px-6 py-3 text-sm font-medium capitalize transition-all sm:w-auto"
              >
                Sign Out
              </button>
            </form>
          ) : (
            <Link
              href="/sign-in"
              className="hover:border-gold/50 hover:bg-gold/10 border-foreground/20 text-foreground/90 hover:text-foreground w-full cursor-pointer rounded-none border bg-transparent px-6 py-3 text-sm font-medium capitalize transition-all sm:w-auto"
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
