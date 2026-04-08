import type { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { IoIosLogOut } from "react-icons/io";
import { signOut } from "~/server/auth";
const DesktopNav = ({ session }: { session: Session | null }) => {
  return (
    <div className="hidden items-center gap-6 md:flex">
      <Link
        href="/players"
        className="hover:text-gold text-foreground/90 hidden capitalize transition-colors sm:block"
      >
        Players
      </Link>
      <Link
        href="/lineups/new"
        className="hover:text-gold text-foreground/90 hidden capitalize transition-colors sm:block"
      >
        create a lineup
      </Link>
      <Link
        href="/lineups/explore"
        className="hover:text-gold text-foreground/90 hidden capitalize transition-colors sm:block"
      >
        Explore
      </Link>
      <Link
        href="/contact"
        className="hover:text-gold text-foreground/90 hidden capitalize transition-colors sm:block"
      >
        Contact
      </Link>

      {session ? (
        <>
          <Link
            href="/lineups"
            className="hover:text-gold text-foreground/90 hidden capitalize transition-colors sm:block"
          >
            My Lineups
          </Link>
          <Link
            href="/users/search"
            className="hover:text-gold text-foreground/90 hidden capitalize transition-colors sm:block"
          >
            Find Users
          </Link>
          {session.user.admin && (
            <Link
              href="/admin"
              className="text-gold/80 hover:text-gold hidden text-sm font-medium capitalize transition-colors sm:block"
            >
              Admin
            </Link>
          )}
          <Link
            href={`/profile/${session.user.id}`}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className="ring-gold/20 rounded-full ring-2"
                width={32}
                height={32}
              />
            )}
            <span className="text-foreground/60 hidden text-sm sm:block">
              {session.user.name}
            </span>
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="cursor-pointer">
              <IoIosLogOut className="hover:text-gold text-foreground text-2xl transition-colors duration-100" />
            </button>
          </form>
        </>
      ) : (
        <>
          <Link
            href="/sign-in?mode=signup"
            className="hover:text-gold text-foreground/90 capitalize transition-colors"
          >
            Sign up
          </Link>
          <Link
            href="/sign-in"
            className="border-gold bg-gold/10 hover:bg-gold hover:glow-gold-sm text-foreground/90 rounded-none border-2 px-4 py-2 text-sm font-medium capitalize transition-all hover:text-black"
          >
            Sign in
          </Link>
        </>
      )}
    </div>
  );
};
export default DesktopNav;
